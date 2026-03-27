import * as THREE from 'three';
import type { GameScene, SceneContext } from '../engine/SceneManager';
import {
  createBox, createPlant, createTextSign, addLighting,
  createCeiling, createFluorescentLight,
} from './SceneHelpers';
import { DIALOGUE } from '../data/dialogue';

export class DeskScene implements GameScene {
  name = 'desk';
  private narratorPhase: 'waiting' | 'playing' | 'booting' | 'done' = 'waiting';
  private monitorScreen!: THREE.Mesh;
  private bootCanvas!: HTMLCanvasElement;
  private bootCtx!: CanvasRenderingContext2D;
  private bootTexture!: THREE.CanvasTexture;
  private bootLines: string[] = [];
  private bootTimer = 0;
  private bootLineIndex = 0;
  private cameraDollyProgress = 0;
  private cameraStart = new THREE.Vector3(0, 1.3, 1.5);
  private cameraEnd = new THREE.Vector3(0, 1.15, 0.4);

  private static BOOT_SEQUENCE = [
    'NEXUSCORP OS v3.1',
    'Booting workstation...',
    'Loading Jira...',
    'Loading Outlook...',
    'Loading Slack...',
    'Loading 47 unread notifications...',
    '',
    'WELCOME, INTERN.',
    'Have a productive day.',
  ];

  setup(ctx: SceneContext) {
    this.narratorPhase = 'waiting';
    this.cameraDollyProgress = 0;
    this.bootLines = [];
    this.bootLineIndex = 0;
    this.bootTimer = 0;

    addLighting(ctx.scene);
    ctx.scene.background = new THREE.Color(0x1a1e24);

    // Small office area around desk
    const floor = createBox(7, 0.05, 7, 0x4a5a5a, [0, 0, 0]);
    ctx.scene.add(floor);
    ctx.scene.add(createCeiling(7, 7, 3.2, 0xd8d8d8));

    // Back wall
    const backWall = createBox(6, 3.2, 0.15, 0x5a6a7a, [0, 1.6, -2.5]);
    ctx.scene.add(backWall);

    // Side walls (partial — gives sense of cubicle)
    const leftWall = createBox(0.15, 3.2, 4, 0x5a6a7a, [-2.5, 1.6, 0]);
    ctx.scene.add(leftWall);
    const rightWall = createBox(0.15, 3.2, 4, 0x5a6a7a, [2.5, 1.6, 0]);
    ctx.scene.add(rightWall);

    // Fluorescent light
    ctx.scene.add(createFluorescentLight(0, 0, 3.2));

    // === YOUR DESK (high detail) ===
    // Desk surface
    const deskSurface = createBox(1.4, 0.05, 0.7, 0x6a5a4a, [0, 0.75, -0.5]);
    ctx.scene.add(deskSurface);

    // Desk legs
    for (const [lx, lz] of [[-0.65, -0.8], [0.65, -0.8], [-0.65, -0.2], [0.65, -0.2]]) {
      ctx.scene.add(createBox(0.04, 0.75, 0.04, 0x4a3a2a, [lx, 0.375, lz]));
    }

    // Monitor (the star of the show)
    // Monitor body/bezel
    const monitorBezel = createBox(0.55, 0.4, 0.04, 0x1a1a1a, [0, 1.05, -0.7]);
    ctx.scene.add(monitorBezel);

    // Monitor stand
    ctx.scene.add(createBox(0.06, 0.25, 0.06, 0x2a2a2a, [0, 0.9, -0.7]));
    ctx.scene.add(createBox(0.2, 0.02, 0.12, 0x2a2a2a, [0, 0.78, -0.7]));

    // Monitor screen — THIS IS WHERE THE 2D GAME WILL RENDER
    this.bootCanvas = document.createElement('canvas');
    this.bootCanvas.width = 512;
    this.bootCanvas.height = 320;
    this.bootCtx = this.bootCanvas.getContext('2d')!;
    this.bootCtx.fillStyle = '#000';
    this.bootCtx.fillRect(0, 0, 512, 320);

    this.bootTexture = new THREE.CanvasTexture(this.bootCanvas);
    this.bootTexture.minFilter = THREE.NearestFilter;
    this.bootTexture.magFilter = THREE.NearestFilter;

    const screenGeo = new THREE.PlaneGeometry(0.48, 0.32);
    const screenMat = new THREE.MeshStandardMaterial({
      map: this.bootTexture,
      emissive: 0xffffff,
      emissiveMap: this.bootTexture,
      emissiveIntensity: 0.3,
      roughness: 0.1,
    });
    this.monitorScreen = new THREE.Mesh(screenGeo, screenMat);
    this.monitorScreen.position.set(0, 1.05, -0.675);
    ctx.scene.add(this.monitorScreen);

    // Keyboard
    ctx.scene.add(createBox(0.35, 0.02, 0.12, 0x2a2a2a, [0, 0.79, -0.35]));

    // Mouse
    ctx.scene.add(createBox(0.06, 0.02, 0.1, 0x2a2a2a, [0.3, 0.79, -0.35]));

    // Sticky note: "TODO: Everything"
    const todoNote = createTextSign('TODO: Everything', 0.12, 0.1, '#e8e860', '#2a2a2a', 16);
    todoNote.position.set(-0.35, 1.15, -0.65);
    todoNote.rotation.y = 0.1;
    ctx.scene.add(todoNote);

    // Mug: "I Survived Onboarding"
    const mug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.03, 0.1, 8),
      new THREE.MeshStandardMaterial({ color: 0xeeddcc })
    );
    mug.position.set(0.5, 0.83, -0.4);
    ctx.scene.add(mug);

    // Wi-Fi post-it
    const wifiNote = createTextSign('Wi-Fi: NexusCorp\nPW: intern123', 0.15, 0.1, '#90d0ff', '#1a1a1a', 10);
    wifiNote.position.set(0.3, 1.2, -0.65);
    ctx.scene.add(wifiNote);

    // Email pinned to wall
    const email = createTextSign('RE: RE: RE: RE:\nPlease Fix The Bug', 0.3, 0.2, '#eeeeee', '#333333', 12);
    email.position.set(-1.0, 1.5, -2.4);
    ctx.scene.add(email);

    // Calendar — every day is MEETING
    const calendar = createTextSign('MON: MTG\nTUE: MTG\nWED: MTG\nTHU: MTG\nFRI: MTG', 0.35, 0.3, '#ffffff', '#aa3333', 10);
    calendar.position.set(0.5, 0.82, -0.65);
    calendar.rotation.x = -Math.PI / 3;
    ctx.scene.add(calendar);

    // Sad plant
    const plant = createPlant(-0.55, -0.3);
    ctx.scene.add(plant);

    // Coworker visible in background
    const bgCoworker = createBox(0.3, 0.8, 0.3, 0x5a6a5a, [2, 1.0, -1.5]);
    ctx.scene.add(bgCoworker);
    const bgHead = createBox(0.2, 0.2, 0.2, 0xd4a574, [2, 1.5, -1.5]);
    ctx.scene.add(bgHead);

    // Camera — fixed at desk, looking at monitor
    ctx.player.disable();
    ctx.player.camera.position.copy(this.cameraStart);
    ctx.player.camera.lookAt(0, 1.05, -0.7);

    // Start narrator after a beat
    setTimeout(() => {
      this.narratorPhase = 'playing';
      this.playNarrator(ctx);
    }, 1000);
  }

  private playNarrator(ctx: SceneContext) {
    const lines = DIALOGUE.narratorScene5.lines;
    let lineIndex = 0;

    const showNext = () => {
      if (lineIndex >= lines.length) {
        ctx.hideNarrator();
        this.narratorPhase = 'booting';
        return;
      }

      ctx.showNarrator(lines[lineIndex].text);
      const delay = lines[lineIndex].delay || 1500;
      lineIndex++;

      setTimeout(() => {
        showNext();
      }, delay);
    };

    showNext();
  }

  update(delta: number, _ctx: SceneContext) {
    if (this.narratorPhase === 'booting') {
      // Camera dolly toward monitor
      this.cameraDollyProgress += delta * 0.3;
      if (this.cameraDollyProgress > 1) this.cameraDollyProgress = 1;

      _ctx.player.camera.position.lerpVectors(
        this.cameraStart, this.cameraEnd, this.cameraDollyProgress
      );
      _ctx.player.camera.lookAt(0, 1.05, -0.7);

      // Increase screen glow
      const mat = this.monitorScreen.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + this.cameraDollyProgress * 2.0;

      // Boot sequence text
      this.bootTimer += delta;
      if (this.bootTimer > 0.4 && this.bootLineIndex < DeskScene.BOOT_SEQUENCE.length) {
        this.bootTimer = 0;
        this.bootLines.push(DeskScene.BOOT_SEQUENCE[this.bootLineIndex]);
        this.bootLineIndex++;
        this.renderBootScreen();
      }

      if (this.bootLineIndex >= DeskScene.BOOT_SEQUENCE.length && this.cameraDollyProgress >= 1) {
        this.narratorPhase = 'done';
        // The 2D game would start here — for now show completion state
        this.renderFinalScreen();
      }
    }
  }

  private renderBootScreen() {
    const ctx = this.bootCtx;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, 512, 320);

    // Add a slight CRT scanline effect to the 2D canvas itself
    for (let i = 0; i < 320; i += 4) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, i, 512, 2);
    }

    ctx.fillStyle = '#33aa55';
    ctx.font = '16px "Courier New", Courier, monospace';
    ctx.textAlign = 'left';
    ctx.shadowColor = '#33aa55';
    ctx.shadowBlur = 8;

    this.bootLines.forEach((line, i) => {
      ctx.fillText(line, 20, 30 + i * 24);
    });

    // Blinking cursor
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      const lastY = 30 + this.bootLines.length * 24;
      ctx.fillText('█', 20, lastY);
    }

    // Reset shadow
    ctx.shadowBlur = 0;

    this.bootTexture.needsUpdate = true;
  }

  private renderFinalScreen() {
    const ctx = this.bootCtx;
    ctx.fillStyle = '#0a0a2a';
    ctx.fillRect(0, 0, 512, 320);

    for (let i = 0; i < 320; i += 4) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, i, 512, 2);
    }

    ctx.fillStyle = '#4488cc';
    ctx.font = 'bold 28px "Courier New", Courier, monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#4488cc';
    ctx.shadowBlur = 10;
    ctx.fillText('SIMULATION READY', 256, 140);

    ctx.fillStyle = '#336699';
    ctx.font = '16px "Courier New", Courier, monospace';
    ctx.shadowBlur = 0;
    ctx.fillText('2D Phase Coming Soon...', 256, 180);
    
    if (Math.floor(Date.now() / 800) % 2 === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Press [E] to begin', 256, 220);
    }

    this.bootTexture.needsUpdate = true;
  }

  cleanup() {
    this.narratorPhase = 'waiting';
  }
}
