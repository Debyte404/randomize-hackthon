import * as THREE from 'three';
import {
  createBox, createCeiling, createFluorescentLight, addLighting,
} from './SceneHelpers';
import { useGameStore } from '../../store/useGameStore';

export class DeskScene {
  constructor() {
    this.name = 'desk';
    this.bootProgress = 0;
    this.booting = false;
    this.totalTime = 0;

    // Cinematic camera
    this.cameraStart = new THREE.Vector3(0, 1.4, 1.5);
    this.cameraEnd = new THREE.Vector3(0, 1.05, 0.6);
    this.lookAtTarget = new THREE.Vector3(0, 1.0, -0.4);

    // Canvas for the 2D boot sequence
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 384;
    this.ctx2d = this.canvas.getContext('2d');
    this.screenTexture = new THREE.CanvasTexture(this.canvas);
  }

  setup(ctx) {
    this.bootProgress = 0;
    this.booting = false;
    this.totalTime = 0;

    addLighting(ctx.scene);
    ctx.scene.background = new THREE.Color(0x0a0c10);

    // Floor (carpet)
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial({ color: 0x2a2d32, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    ctx.scene.add(floor);

    // Ceiling
    ctx.scene.add(createCeiling(10, 10, 3.5, 0x909090));
    ctx.scene.add(createFluorescentLight(0, 0, 3.5));

    // Walls (Cubicle)
    const wallColor = 0x5a6d7a;
    ctx.scene.add(createBox(4, 1.6, 0.1, wallColor, [0, 0.8, -0.8])); // Forward
    ctx.scene.add(createBox(0.1, 1.6, 3, wallColor, [-2.0, 0.8, 0.7])); // Left
    ctx.scene.add(createBox(0.1, 1.6, 3, wallColor, [2.0, 0.8, 0.7])); // Right

    // --- DESK ---
    ctx.scene.add(createBox(2.2, 0.05, 0.9, 0x3a2a1a, [0, 0.75, -0.3]));
    // Legs
    for (const [lx, lz] of [[-1.0, -0.6], [1.0, -0.6], [-1.0, 0], [1.0, 0]]) {
      ctx.scene.add(createBox(0.04, 0.75, 0.04, 0x221100, [lx, 0.375, lz]));
    }

    // --- HIGH DETAIL MONITOR ---
    // The base
    ctx.scene.add(createBox(0.3, 0.02, 0.2, 0x111111, [0, 0.76, -0.4]));
    ctx.scene.add(createBox(0.06, 0.3, 0.06, 0x111111, [0, 0.9, -0.4]));
    // The frame
    ctx.scene.add(createBox(0.8, 0.6, 0.08, 0x222222, [0, 1.1, -0.45]));
    // The screen face (the actual texture)
    const screenGeo = new THREE.PlaneGeometry(0.74, 0.54);
    const screenMat = new THREE.MeshStandardMaterial({
      map: this.screenTexture,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: this.screenTexture,
      emissiveIntensity: 1.2, // Reduced from 5.0 to prevent overblown bloom
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 1.1, -0.405);
    ctx.scene.add(screenMesh);

    // --- PROPS ---
    // Keyboard
    ctx.scene.add(createBox(0.5, 0.03, 0.18, 0x1a1a1a, [0, 0.77, -0.1]));
    for (let k = -0.22; k <= 0.22; k += 0.03) {
      ctx.scene.add(createBox(0.02, 0.01, 0.02, 0x333333, [k, 0.79, -0.1]));
    }
    // Mouse
    ctx.scene.add(createBox(0.08, 0.04, 0.12, 0x222222, [0.4, 0.77, -0.1]));
    
    // Coffee Mug (sad cold coffee)
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0xdddddd })
    );
    mug.position.set(-0.5, 0.82, -0.3);
    ctx.scene.add(mug);

    // Sticky notes
    ctx.scene.add(createBox(0.12, 0.01, 0.12, 0xffff88, [0.6, 0.76, -0.4]));
    ctx.scene.add(createBox(0.12, 0.01, 0.12, 0xff88ff, [-0.6, 0.76, -0.45]));

    // --- INITIAL CAMERA ---
    ctx.player.disable();
    ctx.player.camera.position.copy(this.cameraStart);
    ctx.player.camera.lookAt(this.lookAtTarget);

    // Start boot sequence
    setTimeout(() => {
        this.booting = true;
    }, 1000);
  }

  update(delta, ctx) {
    this.totalTime += delta;

    if (this.booting) {
      this.bootProgress += delta * 0.15; // Slow deliberate boot
      
      // Camera dolly-in
      const t = Math.min(this.bootProgress * 1.5, 1);
      ctx.player.camera.position.lerpVectors(this.cameraStart, this.cameraEnd, t);
      ctx.player.camera.lookAt(this.lookAtTarget);

      this.drawBootSequence();
      this.screenTexture.needsUpdate = true;

      if (this.bootProgress >= 1.0) {
        this.booting = false;
        // FINAL TRANSITION TO 2D WORKPLACE
        ctx.setFade(1.0);
        setTimeout(() => {
          useGameStore.getState().setGameState('2D_WORK');
        }, 1000);
      }
    }
  }

  drawBootSequence() {
    const c = this.ctx2d;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear background
    c.fillStyle = '#000000';
    c.fillRect(0, 0, w, h);

    // CRT Scanlines overlay (subtle)
    c.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < h; i += 4) {
      c.fillRect(0, i, w, 2);
    }

    // Modern Terminal Look
    c.font = '16px monospace';
    c.textAlign = 'left';

    const lines = [
      '[  OK  ] Initializing NexusOS Kernel 4.0.1...',
      '[  OK  ] Mounting shared volumes...',
      '[  OK  ] Connecting to Central Intelligence...',
      '[ WAIT ] Authenticating user: INTERN_9921...',
      '[  OK  ] Persona matched. Welcome.',
      '----------------------------------------',
      'SYS_RESOURCES: 98% AVAILABLE',
      'PENDING_TASKS: 1,492',
      'PRIORITY: MAXIMUM',
    ];

    const showCount = Math.floor(this.bootProgress * 15);
    c.fillStyle = '#00ff00';
    for (let i = 0; i < Math.min(showCount, lines.length); i++) {
        c.fillText(lines[i], 20, 40 + i * 25);
    }

    // Progress bar
    const barW = w - 80;
    c.strokeStyle = '#00ff00';
    c.strokeRect(40, h - 60, barW, 20);
    c.fillStyle = '#00ff00';
    c.fillRect(43, h - 57, (barW - 6) * this.bootProgress, 14);
    
    // Booting label
    c.font = '12px monospace';
    c.fillText('LOADING WORK ENVIRONMENT...', 40, h - 75);
    
    // Random noise flicker
    if (Math.random() > 0.98) {
        c.fillStyle = 'rgba(0, 255, 0, 0.1)';
        c.fillRect(0, 0, w, h);
    }
  }

  cleanup() {
      this.booting = false;
      this.bootProgress = 0;
  }
}
