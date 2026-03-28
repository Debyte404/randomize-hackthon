import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'

export const CRTShaderMaterial = shaderMaterial(
  {
    tDiffuse: null,
    uTime: 0,
    uCollapse: 1.0, // 1.0 = normal, 0.0 = collapsed to a flat line
    uGlitch: 0.0,
    uHoverNudge: new THREE.Vector2(0, 0),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uCollapse;
    uniform float uGlitch;
    uniform vec2 uHoverNudge;
    
    varying vec2 vUv;

    // Barrel Distortion mapping
    vec2 crtCurve(vec2 uv) {
      uv = uv * 2.0 - 1.0;
      vec2 offset = abs(uv.yx) / vec2(3.5, 3.5); // Curvature intensity
      uv = uv + uv * offset * offset;
      uv = uv * 0.5 + 0.5;
      return uv;
    }

    void main() {
      vec2 uv = crtCurve(vUv);
      
      // Apply hover nudge
      uv -= uHoverNudge;

      // TV Cut / Collapse Animation Logic
      // uCollapse goes from 1.0 (full screen) down to 0.0 (squished line)
      if (uCollapse < 1.0) {
        // Center the Y coordinate around 0.5 and squish it heavily
        float yDist = abs(uv.y - 0.5);
        // As collapse goes to 0, allowed Y range tends to 0.
        // We stretch the UVs vertically to make it look like the picture is squishing
        uv.y = 0.5 + (uv.y - 0.5) / uCollapse; 
        
        // Horizontal squish (happens near the very end of the cut)
        if (uCollapse < 0.2) {
           float xSquish = uCollapse * 5.0; // 1 to 0
           uv.x = 0.5 + (uv.x - 0.5) / xSquish;
        }
      }

      // Check out of bounds (black borders from curvature or collapse)
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        
        // Add a bright white/cyan flash when collapsing
        if (uCollapse > 0.0 && uCollapse < 1.0) {
           // Create the bright horizontal line effect
           float lineDist = abs(vUv.y - 0.5);
           if (lineDist < uCollapse * 0.02) {
              gl_FragColor = vec4(4.0, 4.0, 4.0, 1.0); // Super bright white flash
           }
        }
        return;
      }

      // Glitch effect (random horizontal shifts)
      float glitchOffset = 0.0;
      if (uGlitch > 0.0) {
        float noise = fract(sin(dot(uv.yy, vec2(12.9898, 78.233)) + uTime) * 43758.5453);
        if (noise > 0.98 - (uGlitch * 0.5)) {
          glitchOffset = (fract(uTime * 10.0) - 0.5) * 0.1 * uGlitch;
        }
      }

      // Sample colors with slight RGB shift for chromatic aberration
      float r = texture2D(tDiffuse, vec2(uv.x + 0.003 + glitchOffset, uv.y)).r;
      float g = texture2D(tDiffuse, vec2(uv.x + glitchOffset, uv.y)).g;
      float b = texture2D(tDiffuse, vec2(uv.x - 0.003 + glitchOffset, uv.y)).b;
      
      vec3 color = vec3(r, g, b);

      // Scanlines
      float scanline = sin(uv.y * 800.0 * 3.14159) * 0.04;
      color -= scanline;

      // Vignette
      float dist = distance(uv, vec2(0.5));
      color *= smoothstep(0.8, 0.3, dist * 1.2);

      // Add intense brightness if collapsing
      if (uCollapse < 1.0) {
        color += vec3(2.0, 2.0, 2.0) * (1.0 - uCollapse);
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `
)
