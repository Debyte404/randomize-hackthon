import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

const PixelationShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
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

      // Chromatic Aberration offset (RGB splitting)
      float caAmount = 0.0015;
      vec2 distFromCenter = coord - 0.5;
      
      // Sample colors with simulated RGB phosphor bleed
      float r = texture2D(tDiffuse, coord + distFromCenter * caAmount).r;
      float g = texture2D(tDiffuse, coord).g;
      float b = texture2D(tDiffuse, coord - distFromCenter * caAmount).b;
      
      vec4 color = vec4(r, g, b, 1.0);

      // Quantize colors for retro look (PS1/Ultrakill style)
      color.rgb = floor(color.rgb * colorLevels) / colorLevels;

      // Deepen shadows and pop highlights (contrast curve)
      color.rgb = smoothstep(0.05, 0.95, color.rgb);

      // Slight warm tint
      color.r *= 1.05;
      color.g *= 1.0;
      color.b *= 0.95;

      // CRT Scanline effect (gives texture to bright areas)
      float scanline = sin(coord.y * resolution.y * 3.14159 * 2.0 / pixelSize) * 0.03;
      color.rgb -= scanline;

      // Soft CRT Vignette overlay
      float vignette = distance(vUv, vec2(0.5));
      color.rgb *= smoothstep(1.0, 0.35, vignette * vignette * 0.6 + 0.1);
    }
  `,
};

export class PixelationPass extends Pass {
  uniforms: typeof PixelationShader.uniforms;
  material: THREE.ShaderMaterial;
  fsQuad: FullScreenQuad;

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

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget
  ) {
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
