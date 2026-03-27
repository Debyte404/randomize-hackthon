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
    this.bootCanvas.width = 640;
    this.bootCanvas.height = 400;
    this.bootCtx = this.bootCanvas.getContext('2d')!;
    this.bootCtx.fillStyle = '#000';
    this.bootCtx.fillRect(0, 0, 640, 400);

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
    const c = this.bootCtx;
    const W = 640, H = 400;
    c.fillStyle = '#050510';
    c.fillRect(0, 0, W, H);

    // CRT scanline overlay
    for (let i = 0; i < H; i += 3) {
      c.fillStyle = 'rgba(0, 0, 0, 0.25)';
      c.fillRect(0, i, W, 1);
    }

    // NexusCorp logo header
    if (this.bootLineIndex >= 1) {
      c.fillStyle = '#1a3a2a';
      c.fillRect(15, 10, W - 30, 40);
      c.fillStyle = '#33cc66';
      c.font = 'bold 20px "Courier New", Courier, monospace';
      c.textAlign = 'center';
      c.fillText('▓▓ NEXUSCORP OS v3.1 ▓▓', W / 2, 36);
      c.textAlign = 'left';
    }

    // Boot text
    c.fillStyle = '#33aa55';
    c.font = '18px "Courier New", Courier, monospace';
    c.shadowColor = '#33aa55';
    c.shadowBlur = 6;

    const startY = 70;
    this.bootLines.forEach((line, i) => {
      // Skip first line (shown in header)
      if (i === 0) return;
      const prefix = i < this.bootLines.length - 2 ? '> ' : '';
      c.fillText(prefix + line, 24, startY + (i - 1) * 28);
    });

    // Blinking cursor
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      const lastY = startY + Math.max(0, this.bootLines.length - 2) * 28;
      c.fillText('█', 24, lastY);
    }

    // Progress bar at bottom
    const progress = this.bootLineIndex / DeskScene.BOOT_SEQUENCE.length;
    c.fillStyle = '#1a2a1a';
    c.fillRect(20, H - 30, W - 40, 12);
    c.fillStyle = '#33aa55';
    c.fillRect(20, H - 30, (W - 40) * progress, 12);

    c.shadowBlur = 0;
    this.bootTexture.needsUpdate = true;
  }

  private renderFinalScreen() {
    const c = this.bootCtx;
    const W = 640, H = 400;

    // Dark blue background
    c.fillStyle = '#060820';
    c.fillRect(0, 0, W, H);

    // CRT scanlines
    for (let i = 0; i < H; i += 3) {
      c.fillStyle = 'rgba(0, 0, 0, 0.3)';
      c.fillRect(0, i, W, 1);
    }

    // Glow border
    c.strokeStyle = '#2255aa';
    c.lineWidth = 2;
    c.shadowColor = '#4488ff';
    c.shadowBlur = 15;
    c.strokeRect(30, 30, W - 60, H - 60);
    c.shadowBlur = 0;

    // Main title
    c.fillStyle = '#4499ff';
    c.font = 'bold 36px "Courier New", Courier, monospace';
    c.textAlign = 'center';
    c.shadowColor = '#4499ff';
    c.shadowBlur = 12;
    c.fillText('WORKSTATION READY', W / 2, 140);
    c.shadowBlur = 0;

    // Subtitle
    c.fillStyle = '#336699';
    c.font = '16px "Courier New", Courier, monospace';
    c.fillText('Welcome to your new desk, Intern.', W / 2, 180);
    c.fillText('47 unread emails. 3 urgent tickets.', W / 2, 205);
    c.fillText('Good luck.', W / 2, 230);

    // Blinking prompt
    if (Math.floor(Date.now() / 700) % 2 === 0) {
      c.fillStyle = '#ffffff';
      c.font = 'bold 18px "Courier New", Courier, monospace';
      c.fillText('[ PRESS E TO BEGIN ]', W / 2, 300);
    }

    // NexusCorp footer
    c.fillStyle = '#222244';
    c.font = '12px "Courier New", Courier, monospace';
    c.fillText('NexusCorp™ — Productivity Through Compliance', W / 2, H - 20);

    this.bootTexture.needsUpdate = true;
  }

  cleanup() {
    this.narratorPhase = 'waiting';
  }
}
