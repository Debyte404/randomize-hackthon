import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

const PixelationShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(320, 180) },
    pixelSize: { value: 4.0 },
    colorLevels: { value: 32.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);   
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float pixelSize;
    uniform float colorLevels;
    varying vec2 vUv;

    void main() {
      vec2 dxy = pixelSize / resolution;
      vec2 coord = dxy * floor(vUv / dxy);

      // Chromatic Aberration offset
      float caAmount = 0.0015;
      vec2 distFromCenter = coord - 0.5;
      
      float r = texture2D(tDiffuse, coord + distFromCenter * caAmount).r;
      float g = texture2D(tDiffuse, coord).g;
      float b = texture2D(tDiffuse, coord - distFromCenter * caAmount).b;
      
      vec4 color = vec4(r, g, b, 1.0);

      // Quantize colors
      color.rgb = floor(color.rgb * colorLevels) / colorLevels;

      // Ensure colors stay in bound without crushing shadows
      color.rgb = clamp(color.rgb, 0.0, 1.2);

      // CRT Scanline effect (subtle)
      float scanline = sin(coord.y * resolution.y * 3.14159 * 2.0 / pixelSize) * 0.02;
      color.rgb -= scanline;

      // Subtle CRT Vignette (original dev-frontend logic)
      float vignette = distance(vUv, vec2(0.5));
      color.rgb *= smoothstep(1.0, 0.4, vignette * vignette * 0.5 + 0.15);

      // Brighter overall to improve visibility (dev-frontend source boost)
      color.rgb *= 1.4;

      gl_FragColor = color;
    }
  `,
};

export class PixelationPass extends Pass {
  constructor(pixelSize = 4.0) {
    super();
    this.uniforms = THREE.UniformsUtils.clone(PixelationShader.uniforms);
    this.uniforms.pixelSize.value = pixelSize;

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: PixelationShader.vertexShader,
      fragmentShader: PixelationShader.fragmentShader,
    });

    this.fsQuad = new FullScreenQuad(this.material);
  }

  render(renderer, writeBuffer, readBuffer) {
    this.uniforms.tDiffuse.value = readBuffer.texture;
    this.uniforms.resolution.value.set(readBuffer.width, readBuffer.height);

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
    }
    this.fsQuad.render(renderer);
  }

  dispose() {
    this.material.dispose();
    this.fsQuad.dispose();
  }
}
