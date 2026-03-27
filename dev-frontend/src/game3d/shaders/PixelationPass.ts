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
      vec4 color = texture2D(tDiffuse, coord);

      // Quantize colors for retro look (PS1/Ultrakill style)
      color.rgb = floor(color.rgb * colorLevels) / colorLevels;

      // Slight warm tint
      color.r *= 1.02;
      color.g *= 1.0;
      color.b *= 0.97;

      // CRT Scanline effect (subtle)
      float scanline = sin(coord.y * resolution.y * 3.14159 * 2.0 / pixelSize) * 0.02;
      color.rgb -= scanline;

      // Subtle CRT Vignette (less punishing)
      float vignette = distance(vUv, vec2(0.5));
      color.rgb *= smoothstep(1.0, 0.4, vignette * vignette * 0.5 + 0.15);

      // Brighter overall to improve visibility
      color.rgb *= 1.4;

      gl_FragColor = color;
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
