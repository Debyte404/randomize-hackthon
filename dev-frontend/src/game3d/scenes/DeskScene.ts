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
    ctx.scene.background = new THREE.Color(0x2a3a4a);

    // Small office area around desk
    const floor = createBox(6, 0.05, 6, 0x4a5a5a, [0, 0, 0]);
    ctx.scene.add(floor);
    ctx.scene.add(createCeiling(6, 6, 3.2));

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
    this.bootCanvas.width = 1024;
    this.bootCanvas.height = 640;
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
    const wifiNote = createTextSign('Wi-Fi: NexusCorp_Guest PW: intern123', 0.15, 0.08, '#90d0ff', '#1a1a1a', 12);
    wifiNote.position.set(0.3, 1.2, -0.65);
    ctx.scene.add(wifiNote);

    // Email pinned to wall
    const email = createTextSign('RE: RE: RE: RE: Please Fix The Bug', 0.3, 0.2, '#eeeeee', '#333333', 14);
    email.position.set(-1.0, 1.5, -2.4);
    ctx.scene.add(email);

    // Calendar — every day is MEETING
    const calendar = createTextSign('MON: MEETING | TUE: MEETING | WED: MEETING | THU: MEETING | FRI: MEETING', 0.35, 0.25, '#ffffff', '#aa3333', 11);
    calendar.position.set(0.5, 0.82, -0.65);
    calendar.rotation.x = -Math.PI / 3;
    ctx.scene.add(calendar);

    // Sad plant
    const plant = createPlant(-0.55, -0.3);
    ctx.scene.add(plant);

    // Background details — other cubicle partitions visible
    const partition1 = createBox(0.05, 1.5, 1.5, 0x5a6a7a, [2.2, 0.75, -1.5]);
    ctx.scene.add(partition1);
    const partition2 = createBox(0.05, 1.5, 1.5, 0x5a6a7a, [-2.2, 0.75, -1.5]);
    ctx.scene.add(partition2);

    // Distant desk visible through gap
    const bgDesk = createBox(0.8, 0.04, 0.4, 0x6a5a4a, [2, 0.75, -2]);
    ctx.scene.add(bgDesk);
    const bgMonitor = createBox(0.25, 0.2, 0.02, 0x1a1a1a, [2, 0.95, -2.15]);
    ctx.scene.add(bgMonitor);

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
    const w = this.bootCanvas.width;
    const h = this.bootCanvas.height;

    // CRT-style dark background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    // Subtle scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }

    // Green terminal text
    ctx.fillStyle = '#33ee66';
    ctx.font = 'bold 28px Courier New, monospace';
    ctx.textAlign = 'left';
    ctx.shadowColor = '#33aa55';
    ctx.shadowBlur = 4;

    this.bootLines.forEach((line, i) => {
      ctx.fillText(line, 40, 60 + i * 44);
    });

    // Blinking cursor
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      const lastY = 60 + this.bootLines.length * 44;
      ctx.fillText('█', 40, lastY);
    }

    ctx.shadowBlur = 0;
    this.bootTexture.needsUpdate = true;
  }

  private renderFinalScreen() {
    const ctx = this.bootCtx;
    const w = this.bootCanvas.width;
    const h = this.bootCanvas.height;

    ctx.fillStyle = '#0a0a2a';
    ctx.fillRect(0, 0, w, h);

    // Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }

    ctx.shadowColor = '#4488cc';
    ctx.shadowBlur = 8;

    ctx.fillStyle = '#4488cc';
    ctx.font = 'bold 48px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SIMULATION READY', w / 2, h / 2 - 20);

    ctx.fillStyle = '#336699';
    ctx.font = '24px Courier New, monospace';
    ctx.fillText('2D Phase Coming Soon...', w / 2, h / 2 + 40);

    ctx.shadowBlur = 0;
    this.bootTexture.needsUpdate = true;
  }

  cleanup() {
    this.narratorPhase = 'waiting';
  }
}
