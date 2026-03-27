import * as THREE from 'three';
import type { GameScene, SceneContext } from '../engine/SceneManager';
import {
  createFloor, createBox, createChair, createNPC,
  createTextSign, addLighting, createCeiling,
} from './SceneHelpers';
import { DIALOGUE, INTERVIEW_CHOICES } from '../data/dialogue';

export class InterviewScene implements GameScene {
  name = 'interview';
  private seated = false;
  private cameraTarget = new THREE.Vector3();
  private cameraLerping = false;

  setup(ctx: SceneContext) {
    this.seated = false;
    this.cameraLerping = false;

    addLighting(ctx.scene);
    ctx.scene.background = new THREE.Color(0x1a1e24);

    // --- ROOM SHELL (fully sealed conference room) ---
    const roomW = 10;
    const roomD = 10;
    const roomH = 3.5;

    // Floor — grey carpet tile
    const floor = createFloor(roomW + 1, roomD + 1, 0x4a5055);
    ctx.scene.add(floor);

    // Ceiling — oversized to prevent edge gaps
    ctx.scene.add(createCeiling(roomW + 1, roomD + 1, roomH, 0xd8d8d8));

    // Fluorescent ceiling lights (3 strips)
    for (const lx of [-2, 0, 2]) {
      const fixtureGeo = new THREE.BoxGeometry(0.8, 0.04, 0.15);
      const fixtureMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xeeeeff,
        emissiveIntensity: 1.8,
      });
      const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.set(lx, roomH - 0.02, 0);
      ctx.scene.add(fixture);

      const pLight = new THREE.PointLight(0xeeeeff, 0.5, 6);
      pLight.position.set(lx, roomH - 0.1, 0);
      ctx.scene.add(pLight);
    }

    const wallColor = 0x6a7580;
    const halfW = roomW / 2;
    const halfD = roomD / 2;

    // Back wall (z = -halfD)
    const backWall = createBox(roomW, roomH, 0.15, wallColor, [0, roomH / 2, -halfD]);
    ctx.scene.add(backWall);

    // Front wall (z = +halfD)
    const frontWall = createBox(roomW, roomH, 0.15, wallColor, [0, roomH / 2, halfD]);
    ctx.scene.add(frontWall);

    // Left wall (x = -halfW)
    const leftWall = createBox(0.15, roomH, roomD, wallColor, [-halfW, roomH / 2, 0]);
    ctx.scene.add(leftWall);

    // Right wall (x = +halfW) — with a window panel
    // Lower solid portion
    ctx.scene.add(createBox(0.15, 1.0, roomD, wallColor, [halfW, 0.5, 0]));
    // Upper solid portion
    ctx.scene.add(createBox(0.15, 1.0, roomD, wallColor, [halfW, roomH - 0.5, 0]));
    // Window glass between (1.0 to 2.5)
    const windowGlass = createBox(0.05, 1.5, roomD - 1, 0x334455, [halfW, 1.75, 0]);
    const windowMat = windowGlass.material as THREE.MeshStandardMaterial;
    windowMat.transparent = true;
    windowMat.opacity = 0.15;
    windowMat.metalness = 0.9;
    ctx.scene.add(windowGlass);
    // Window mullions
    for (let wz = -halfD + 1; wz <= halfD - 1; wz += 2.5) {
      ctx.scene.add(createBox(0.2, roomH, 0.15, 0x444444, [halfW - 0.02, roomH / 2, wz]));
    }

    // Corner pillars to seal all seams
    const cornerColor = 0x555d65;
    ctx.scene.add(createBox(0.3, roomH, 0.3, cornerColor, [-halfW, roomH / 2, -halfD]));
    ctx.scene.add(createBox(0.3, roomH, 0.3, cornerColor, [halfW, roomH / 2, -halfD]));
    ctx.scene.add(createBox(0.3, roomH, 0.3, cornerColor, [-halfW, roomH / 2, halfD]));
    ctx.scene.add(createBox(0.3, roomH, 0.3, cornerColor, [halfW, roomH / 2, halfD]));

    // Baseboard trim
    const trimColor = 0x555860;
    ctx.scene.add(createBox(roomW, 0.12, 0.08, trimColor, [0, 0.06, -halfD + 0.04]));
    ctx.scene.add(createBox(roomW, 0.12, 0.08, trimColor, [0, 0.06, halfD - 0.04]));
    ctx.scene.add(createBox(0.08, 0.12, roomD, trimColor, [-halfW + 0.04, 0.06, 0]));
    ctx.scene.add(createBox(0.08, 0.12, roomD, trimColor, [halfW - 0.04, 0.06, 0]));

    // --- CONFERENCE TABLE ---
    const table = createBox(3.5, 0.08, 1.4, 0x5a4a3a, [0, 0.75, 0]);
    ctx.scene.add(table);
    // Table legs
    for (const [lx, lz] of [[-1.6, -0.55], [1.6, -0.55], [-1.6, 0.55], [1.6, 0.55]]) {
      ctx.scene.add(createBox(0.06, 0.75, 0.06, 0x3a2a1a, [lx, 0.375, lz]));
    }

    // Coffee stain on table
    const stain = new THREE.Mesh(
      new THREE.CircleGeometry(0.08, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 1 })
    );
    stain.rotation.x = -Math.PI / 2;
    stain.position.set(0.5, 0.8, 0.2);
    ctx.scene.add(stain);

    // Papers and pen on table
    ctx.scene.add(createBox(0.3, 0.01, 0.22, 0xeeeedd, [-0.8, 0.8, -0.3]));
    ctx.scene.add(createBox(0.3, 0.01, 0.22, 0xeeeedd, [-0.4, 0.8, -0.35]));
    ctx.scene.add(createBox(0.15, 0.01, 0.01, 0x222222, [-0.6, 0.805, -0.2])); // pen

    // Laptop on interviewer side
    const laptopBase = createBox(0.35, 0.02, 0.25, 0x222222, [0.5, 0.8, -0.4]);
    ctx.scene.add(laptopBase);
    const laptopScreen = createBox(0.35, 0.25, 0.02, 0x111111, [0.5, 0.93, -0.53]);
    ctx.scene.add(laptopScreen);
    // Screen glow
    const screenGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.22),
      new THREE.MeshStandardMaterial({
        color: 0x2244aa,
        emissive: 0x112244,
        emissiveIntensity: 0.5,
      })
    );
    screenGlow.position.set(0.5, 0.93, -0.515);
    ctx.scene.add(screenGlow);

    // --- CHAIRS ---
    // Interviewer chairs (far side)
    ctx.scene.add(createChair(-0.8, -1.4, 0));
    ctx.scene.add(createChair(0.8, -1.4, 0));

    // Other candidate chairs
    ctx.scene.add(createChair(-0.8, 1.4, Math.PI));
    ctx.scene.add(createChair(0.8, 1.4, Math.PI));

    // Player's empty chair (highlighted)
    const playerChair = createChair(0, 1.4, Math.PI);
    playerChair.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshStandardMaterial).color.set(0x4a6a7a);
        (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x1a2a3a);
        (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
      }
    });
    ctx.scene.add(playerChair);

    // --- NPCs ---
    const npc1 = createNPC(-0.5, -1.8, 0x4a5a6a, 'interviewer1');
    npc1.scale.y = 0.7;
    npc1.position.y = 0.3;
    ctx.scene.add(npc1);

    const npc2 = createNPC(0.5, -1.8, 0x5a4a4a, 'interviewer2');
    npc2.scale.y = 0.7;
    npc2.position.y = 0.3;
    ctx.scene.add(npc2);

    // --- WHITEBOARD (text properly fitted) ---
    // Make the sign wider to fit the long OKR text
    const wb = createTextSign(
      'Q3 OKRs:\nSYNERGY | LEVERAGE\nDISRUPT | PIVOT',
      3.0, 1.8, '#e8e8e0', '#2a2a2a', 20
    );
    wb.position.set(0, 2.2, -halfD + 0.1);
    ctx.scene.add(wb);

    // Whiteboard frame
    ctx.scene.add(createBox(3.2, 0.08, 0.05, 0x888888, [0, 3.15, -halfD + 0.08])); // top
    ctx.scene.add(createBox(3.2, 0.08, 0.05, 0x888888, [0, 1.25, -halfD + 0.08])); // bottom
    ctx.scene.add(createBox(0.08, 1.98, 0.05, 0x888888, [-1.56, 2.2, -halfD + 0.08])); // left
    ctx.scene.add(createBox(0.08, 1.98, 0.05, 0x888888, [1.56, 2.2, -halfD + 0.08])); // right

    // Marker tray
    ctx.scene.add(createBox(1.0, 0.04, 0.08, 0x888888, [0, 1.22, -halfD + 0.12]));
    // Markers
    ctx.scene.add(createBox(0.12, 0.03, 0.03, 0x3333cc, [-0.3, 1.25, -halfD + 0.12]));
    ctx.scene.add(createBox(0.12, 0.03, 0.03, 0xcc3333, [0.0, 1.25, -halfD + 0.12]));
    ctx.scene.add(createBox(0.12, 0.03, 0.03, 0x222222, [0.3, 1.25, -halfD + 0.12]));

    // Crossed out old OKR text (placed below whiteboard)
    const wbOld = createTextSign(
      "Q2: Don't Lose\nAny More Interns",
      1.8, 0.5, '#e8e8e0', '#aa4444', 16
    );
    wbOld.position.set(2.0, 2.2, -halfD + 0.1);
    ctx.scene.add(wbOld);

    // --- MOTIVATIONAL POSTER (text properly fitted) ---
    const poster = createTextSign(
      'TEAMWORK\nBecause None of Us\nIs As Underpaid\nAs All of Us',
      1.6, 1.4, '#2a3a4a', '#aabbcc', 16
    );
    poster.position.set(-halfW + 0.1, 2.2, -1);
    poster.rotation.y = Math.PI / 2;
    ctx.scene.add(poster);
    // Poster frame
    ctx.scene.add(createBox(0.05, 1.5, 1.7, 0x333333, [-halfW + 0.08, 2.2, -1]));

    // --- CLOCK on right wall ---
    const clockFace = new THREE.Mesh(
      new THREE.CircleGeometry(0.25, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    clockFace.position.set(halfW - 0.1, 2.8, 0);
    clockFace.rotation.y = -Math.PI / 2;
    ctx.scene.add(clockFace);
    // Clock frame
    const clockRing = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.28, 16),
      new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide })
    );
    clockRing.position.set(halfW - 0.1, 2.8, 0);
    clockRing.rotation.y = -Math.PI / 2;
    ctx.scene.add(clockRing);

    // --- DOOR (on front wall, visual only) ---
    ctx.scene.add(createBox(1.2, 2.4, 0.16, 0x4a3a2a, [-2, 1.2, halfD - 0.01]));
    ctx.scene.add(createBox(1.4, 2.5, 0.02, 0x333333, [-2, 1.25, halfD - 0.02])); // frame
    // Door handle
    ctx.scene.add(createBox(0.08, 0.03, 0.06, 0xaaaaaa, [-1.45, 1.1, halfD - 0.1]));
    // Room label
    const roomLabel = createTextSign('CONF. ROOM B', 1.0, 0.25, '#333333', '#dddddd', 18);
    roomLabel.position.set(-2, 2.6, halfD - 0.05);
    ctx.scene.add(roomLabel);

    // --- Player start ---
    ctx.player.camera.position.set(0, 1.7, 3.8);
    ctx.player.enable();

    // Seat camera target
    this.cameraTarget.set(0, 1.3, 1.2);

    // Sit trigger
    ctx.triggers.add({
      id: 'sit',
      position: new THREE.Vector3(0, 1, 1.4),
      size: new THREE.Vector3(1.5, 2, 1.5),
      once: true,
      promptText: '[E] Sit Down',
    });

    ctx.player.setColliders([
      // Walls
      new THREE.Box3(new THREE.Vector3(-halfW - 0.5, 0, -halfD - 0.5), new THREE.Vector3(-halfW + 0.2, roomH, halfD + 0.5)),
      new THREE.Box3(new THREE.Vector3(halfW - 0.2, 0, -halfD - 0.5), new THREE.Vector3(halfW + 0.5, roomH, halfD + 0.5)),
      new THREE.Box3(new THREE.Vector3(-halfW - 0.5, 0, -halfD - 0.5), new THREE.Vector3(halfW + 0.5, roomH, -halfD + 0.2)),
      new THREE.Box3(new THREE.Vector3(-halfW - 0.5, 0, halfD - 0.2), new THREE.Vector3(halfW + 0.5, roomH, halfD + 0.5)),
      // Table
      new THREE.Box3(new THREE.Vector3(-1.8, 0, -0.8), new THREE.Vector3(1.8, 0.9, 0.8)),
    ]);
  }

  update(delta: number, ctx: SceneContext) {
    if (this.cameraLerping) {
      ctx.player.camera.position.lerp(this.cameraTarget, delta * 2);
      // Look at interviewers
      const lookTarget = new THREE.Vector3(0, 1.3, -1.5);
      const currentDir = new THREE.Vector3();
      ctx.player.camera.getWorldDirection(currentDir);
      const targetDir = lookTarget.clone().sub(ctx.player.camera.position).normalize();
      currentDir.lerp(targetDir, delta * 2);
      ctx.player.camera.lookAt(
        ctx.player.camera.position.clone().add(currentDir)
      );

      if (ctx.player.camera.position.distanceTo(this.cameraTarget) < 0.1) {
        this.cameraLerping = false;
        // Start interview dialogue
        ctx.dialogue.play(DIALOGUE.interviewer, () => {
          // Show choices
          ctx.showChoice(INTERVIEW_CHOICES, (_index) => {
            ctx.hideChoice();
            ctx.dialogue.play(DIALOGUE.interviewResult, () => {
              ctx.dialogue.play(DIALOGUE.interviewer2, () => {
                // Transition to office
                setTimeout(() => ctx.transitionTo('office'), 1000);
              });
            });
          });
        });
      }
    }
  }

  cleanup() {
    this.seated = false;
    this.cameraLerping = false;
  }

  // Called by Game3D when 'sit' trigger fires
  onSitDown(ctx: SceneContext) {
    if (this.seated) return;
    this.seated = true;
    ctx.player.disable();
    this.cameraLerping = true;
  }
}
