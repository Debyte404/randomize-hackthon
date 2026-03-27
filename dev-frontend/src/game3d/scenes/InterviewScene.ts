import * as THREE from 'three';
import type { GameScene, SceneContext } from '../engine/SceneManager';
import {
  createFloor, createBox, createChair, createNPC,
  createTextSign, addLighting, createCeiling,
} from './SceneHelpers';
import { DIALOGUE, INTERVIEW_CHOICES } from '../data/dialogue';

type InterviewPhase =
  | 'entering'       // Camera walks in from door
  | 'sitting'        // Camera lerps to seat
  | 'settled'        // Brief pause, look around the room
  | 'dialogue_start' // First interviewer speaks
  | 'choosing'       // Player picks a response
  | 'result'         // Interviewer reacts
  | 'hired'          // "You start Monday" dramatic moment
  | 'farewell'       // Second interviewer wraps up
  | 'transitioning'; // Fade to office

export class InterviewScene implements GameScene {
  name = 'interview';

  private phase: InterviewPhase = 'entering';
  private phaseTimer = 0;
  private totalTime = 0;

  // Camera targets
  private cameraStart = new THREE.Vector3(0, 1.7, 4.5);
  private doorwayPos = new THREE.Vector3(0, 1.7, 3.0);
  private seatPos = new THREE.Vector3(0, 1.3, 1.2);
  private lookAtTable = new THREE.Vector3(0, 1.0, -0.5);
  private lookAtInterviewer1 = new THREE.Vector3(-0.5, 1.5, -1.8);
  private lookAtInterviewer2 = new THREE.Vector3(0.5, 1.5, -1.8);

  // Camera cut system
  private currentCameraPos = new THREE.Vector3();
  private targetCameraPos = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();
  private targetLookAt = new THREE.Vector3();
  private cameraLerpSpeed = 2.0;

  // NPCs
  private npc1Group: THREE.Group | null = null;
  private npc2Group: THREE.Group | null = null;
  private npcBobAmplitude = 0.01;

  // Screen shake
  private shakeIntensity = 0;
  private shakeDecay = 3;

  setup(ctx: SceneContext) {
    this.phase = 'entering';
    this.phaseTimer = 0;
    this.totalTime = 0;
    this.shakeIntensity = 0;
    this.npc1Group = null;
    this.npc2Group = null;

    addLighting(ctx.scene);
    ctx.scene.background = new THREE.Color(0x1a1e24);

    // --- ROOM SHELL ---
    const roomW = 10;
    const roomD = 10;
    const roomH = 3.5;
    const halfW = roomW / 2;
    const halfD = roomD / 2;
    const wallColor = 0x6a7580;

    ctx.scene.add(createFloor(roomW + 1, roomD + 1, 0x4a5055));
    ctx.scene.add(createCeiling(roomW + 1, roomD + 1, roomH, 0xd8d8d8));

    // Fluorescent ceiling lights
    for (const lx of [-2, 0, 2]) {
      const fixture = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.04, 0.15),
        new THREE.MeshStandardMaterial({
          color: 0xffffff, emissive: 0xeeeeff, emissiveIntensity: 1.8,
        })
      );
      fixture.position.set(lx, roomH - 0.02, 0);
      ctx.scene.add(fixture);
      const pLight = new THREE.PointLight(0xeeeeff, 0.5, 6);
      pLight.position.set(lx, roomH - 0.1, 0);
      ctx.scene.add(pLight);
    }

    // Walls
    ctx.scene.add(createBox(roomW, roomH, 0.15, wallColor, [0, roomH / 2, -halfD]));
    ctx.scene.add(createBox(roomW, roomH, 0.15, wallColor, [0, roomH / 2, halfD]));
    ctx.scene.add(createBox(0.15, roomH, roomD, wallColor, [-halfW, roomH / 2, 0]));
    // Right wall with window
    ctx.scene.add(createBox(0.15, 1.0, roomD, wallColor, [halfW, 0.5, 0]));
    ctx.scene.add(createBox(0.15, 1.0, roomD, wallColor, [halfW, roomH - 0.5, 0]));
    const windowGlass = createBox(0.05, 1.5, roomD - 1, 0x334455, [halfW, 1.75, 0]);
    const wMat = windowGlass.material as THREE.MeshStandardMaterial;
    wMat.transparent = true; wMat.opacity = 0.15; wMat.metalness = 0.9;
    ctx.scene.add(windowGlass);
    for (let wz = -halfD + 1; wz <= halfD - 1; wz += 2.5) {
      ctx.scene.add(createBox(0.2, roomH, 0.15, 0x444444, [halfW - 0.02, roomH / 2, wz]));
    }

    // Corner pillars
    const cc = 0x555d65;
    for (const [cx, cz] of [[-halfW, -halfD], [halfW, -halfD], [-halfW, halfD], [halfW, halfD]]) {
      ctx.scene.add(createBox(0.3, roomH, 0.3, cc, [cx, roomH / 2, cz]));
    }

    // Baseboard trim
    const tc = 0x555860;
    ctx.scene.add(createBox(roomW, 0.12, 0.08, tc, [0, 0.06, -halfD + 0.04]));
    ctx.scene.add(createBox(roomW, 0.12, 0.08, tc, [0, 0.06, halfD - 0.04]));
    ctx.scene.add(createBox(0.08, 0.12, roomD, tc, [-halfW + 0.04, 0.06, 0]));
    ctx.scene.add(createBox(0.08, 0.12, roomD, tc, [halfW - 0.04, 0.06, 0]));

    // --- CONFERENCE TABLE ---
    ctx.scene.add(createBox(3.5, 0.08, 1.4, 0x5a4a3a, [0, 0.75, 0]));
    for (const [lx, lz] of [[-1.6, -0.55], [1.6, -0.55], [-1.6, 0.55], [1.6, 0.55]]) {
      ctx.scene.add(createBox(0.06, 0.75, 0.06, 0x3a2a1a, [lx, 0.375, lz]));
    }

    // Coffee stain
    const stain = new THREE.Mesh(
      new THREE.CircleGeometry(0.08, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 1 })
    );
    stain.rotation.x = -Math.PI / 2;
    stain.position.set(0.5, 0.8, 0.2);
    ctx.scene.add(stain);

    // Papers, pen, laptop
    ctx.scene.add(createBox(0.3, 0.01, 0.22, 0xeeeedd, [-0.8, 0.8, -0.3]));
    ctx.scene.add(createBox(0.3, 0.01, 0.22, 0xeeeedd, [-0.4, 0.8, -0.35]));
    ctx.scene.add(createBox(0.15, 0.01, 0.01, 0x222222, [-0.6, 0.805, -0.2]));
    ctx.scene.add(createBox(0.35, 0.02, 0.25, 0x222222, [0.5, 0.8, -0.4]));
    ctx.scene.add(createBox(0.35, 0.25, 0.02, 0x111111, [0.5, 0.93, -0.53]));
    const screenGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.22),
      new THREE.MeshStandardMaterial({
        color: 0x2244aa, emissive: 0x112244, emissiveIntensity: 0.5,
      })
    );
    screenGlow.position.set(0.5, 0.93, -0.515);
    ctx.scene.add(screenGlow);

    // Water glass on table
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.025, 0.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.3 })
    );
    glass.position.set(-1.2, 0.84, 0.3);
    ctx.scene.add(glass);

    // Resume folder
    ctx.scene.add(createBox(0.25, 0.02, 0.35, 0x334466, [0.8, 0.81, 0.3]));

    // --- CHAIRS ---
    ctx.scene.add(createChair(-0.8, -1.4, 0));
    ctx.scene.add(createChair(0.8, -1.4, 0));
    ctx.scene.add(createChair(-0.8, 1.4, Math.PI));
    ctx.scene.add(createChair(0.8, 1.4, Math.PI));
    // Player chair (highlighted)
    const playerChair = createChair(0, 1.4, Math.PI);
    playerChair.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshStandardMaterial).color.set(0x4a6a7a);
        (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x1a2a3a);
        (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
      }
    });
    ctx.scene.add(playerChair);

    // --- NPCs (detailed characters) ---
    this.npc1Group = createNPC(-0.5, -1.8, {
      bodyColor: 0x2a3a5a,
      label: 'interviewer1',
      skinTone: 0xd4a574,
      hairColor: 0x2a1a0a,
      hairStyle: 'flat',
      hasGlasses: true,
      hasTie: true,
      tieColor: 0xaa2222,
      facing: Math.PI, // face toward player
    });
    this.npc1Group.scale.y = 0.7;
    this.npc1Group.position.y = 0.3;
    ctx.scene.add(this.npc1Group);

    this.npc2Group = createNPC(0.5, -1.8, {
      bodyColor: 0x4a3a3a,
      label: 'interviewer2',
      skinTone: 0xc68642,
      hairColor: 0x1a1a2a,
      hairStyle: 'tall',
      hasGlasses: false,
      hasTie: true,
      tieColor: 0x2244aa,
      facing: Math.PI,
    });
    this.npc2Group.scale.y = 0.7;
    this.npc2Group.position.y = 0.3;
    ctx.scene.add(this.npc2Group);

    // --- WHITEBOARD ---
    const wb = createTextSign(
      'Q3 OKRs:\nSYNERGY | LEVERAGE\nDISRUPT | PIVOT',
      3.0, 1.8, '#e8e8e0', '#2a2a2a', 20
    );
    wb.position.set(0, 2.2, -halfD + 0.1);
    ctx.scene.add(wb);
    // Frame
    ctx.scene.add(createBox(3.2, 0.08, 0.05, 0x888888, [0, 3.15, -halfD + 0.08]));
    ctx.scene.add(createBox(3.2, 0.08, 0.05, 0x888888, [0, 1.25, -halfD + 0.08]));
    ctx.scene.add(createBox(0.08, 1.98, 0.05, 0x888888, [-1.56, 2.2, -halfD + 0.08]));
    ctx.scene.add(createBox(0.08, 1.98, 0.05, 0x888888, [1.56, 2.2, -halfD + 0.08]));
    // Markers
    ctx.scene.add(createBox(1.0, 0.04, 0.08, 0x888888, [0, 1.22, -halfD + 0.12]));
    ctx.scene.add(createBox(0.12, 0.03, 0.03, 0x3333cc, [-0.3, 1.25, -halfD + 0.12]));
    ctx.scene.add(createBox(0.12, 0.03, 0.03, 0xcc3333, [0.0, 1.25, -halfD + 0.12]));
    ctx.scene.add(createBox(0.12, 0.03, 0.03, 0x222222, [0.3, 1.25, -halfD + 0.12]));

    // Old OKR
    const wbOld = createTextSign("Q2: Don't Lose\nAny More Interns", 1.8, 0.5, '#e8e8e0', '#aa4444', 16);
    wbOld.position.set(2.0, 2.2, -halfD + 0.1);
    ctx.scene.add(wbOld);

    // Motivational poster
    const poster = createTextSign(
      'TEAMWORK\nBecause None of Us\nIs As Underpaid\nAs All of Us',
      1.6, 1.4, '#2a3a4a', '#aabbcc', 16
    );
    poster.position.set(-halfW + 0.1, 2.2, -1);
    poster.rotation.y = Math.PI / 2;
    ctx.scene.add(poster);
    ctx.scene.add(createBox(0.05, 1.5, 1.7, 0x333333, [-halfW + 0.08, 2.2, -1]));

    // Clock
    const clockFace = new THREE.Mesh(
      new THREE.CircleGeometry(0.25, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    clockFace.position.set(halfW - 0.1, 2.8, 0);
    clockFace.rotation.y = -Math.PI / 2;
    ctx.scene.add(clockFace);
    const clockRing = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.28, 16),
      new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide })
    );
    clockRing.position.set(halfW - 0.1, 2.8, 0);
    clockRing.rotation.y = -Math.PI / 2;
    ctx.scene.add(clockRing);

    // Door
    ctx.scene.add(createBox(1.2, 2.4, 0.16, 0x4a3a2a, [-2, 1.2, halfD - 0.01]));
    ctx.scene.add(createBox(1.4, 2.5, 0.02, 0x333333, [-2, 1.25, halfD - 0.02]));
    ctx.scene.add(createBox(0.08, 0.03, 0.06, 0xaaaaaa, [-1.45, 1.1, halfD - 0.1]));
    const roomLabel = createTextSign('CONF. ROOM B', 1.0, 0.25, '#333333', '#dddddd', 18);
    roomLabel.position.set(-2, 2.6, halfD - 0.05);
    ctx.scene.add(roomLabel);

    // --- INITIAL CAMERA ---
    ctx.player.disable();
    this.currentCameraPos.copy(this.cameraStart);
    this.targetCameraPos.copy(this.doorwayPos);
    this.currentLookAt.copy(this.lookAtTable);
    this.targetLookAt.copy(this.lookAtTable);
    ctx.player.camera.position.copy(this.cameraStart);
    ctx.player.camera.lookAt(this.lookAtTable);

    ctx.player.setColliders([]);

    // Narrator: you enter the room
    ctx.showNarrator('You push open the door to Conference Room B.');
  }

  update(delta: number, ctx: SceneContext) {
    this.totalTime += delta;
    this.phaseTimer += delta;

    // --- NPC idle bob animation (removed for performance) ---
    /*
    if (this.npc1Group) {
      const bob1 = Math.sin(this.totalTime * 1.5 + 0) * this.npcBobAmplitude;
      this.npc1Group.position.y = 0.3 + bob1;
    }
    if (this.npc2Group) {
      const bob2 = Math.sin(this.totalTime * 1.8 + 2) * this.npcBobAmplitude;
      this.npc2Group.position.y = 0.3 + bob2;
    }
    */

    // --- Screen shake ---
    let shakeOffset = new THREE.Vector3();
    if (this.shakeIntensity > 0.001) {
      shakeOffset.set(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity * 0.5,
        0
      );
      this.shakeIntensity *= (1 - this.shakeDecay * delta);
    }

    // --- Camera lerp ---
    this.currentCameraPos.lerp(this.targetCameraPos, delta * this.cameraLerpSpeed);
    this.currentLookAt.lerp(this.targetLookAt, delta * this.cameraLerpSpeed);
    ctx.player.camera.position.copy(this.currentCameraPos).add(shakeOffset);
    ctx.player.camera.lookAt(this.currentLookAt);

    // --- Phase state machine ---
    switch (this.phase) {
      case 'entering':
        // Walk through door toward table (2s)
        if (this.phaseTimer > 2.0) {
          this.phase = 'sitting';
          this.phaseTimer = 0;
          ctx.hideNarrator();
          ctx.showNarrator('Two interviewers stare at you from across the table.');
          this.targetCameraPos.copy(this.seatPos);
          this.targetLookAt.copy(this.lookAtInterviewer1);
          this.cameraLerpSpeed = 1.5;
        }
        break;

      case 'sitting':
        // Camera lerps to seat (2.5s)
        if (this.phaseTimer > 2.5) {
          this.phase = 'settled';
          this.phaseTimer = 0;
          ctx.hideNarrator();
          // Brief look-around: glance at the whiteboard
          this.targetLookAt.set(0, 2.2, -5);
          this.cameraLerpSpeed = 1.0;
        }
        break;

      case 'settled':
        // Look around the room briefly before dialogue starts
        if (this.phaseTimer > 0.8) {
          this.targetLookAt.copy(this.lookAtInterviewer1);
          this.cameraLerpSpeed = 2.0;
        }
        if (this.phaseTimer > 2.0) {
          this.phase = 'dialogue_start';
          this.phaseTimer = 0;
          // Start dialogue — camera cuts to interviewer 1
          this.cutToSpeaker(1);
          ctx.dialogue.play(DIALOGUE.interviewer, () => {
            // After "tell me about yourself", show choices
            this.phase = 'choosing';
            this.phaseTimer = 0;
            ctx.showChoice(INTERVIEW_CHOICES, (index) => {
              ctx.hideChoice();
              this.onChoiceMade(ctx, index);
            });
          });
        }
        break;

      case 'dialogue_start':
        // NPC1 "talks" — slight head bob increase while dialogue active
        this.npcBobAmplitude = 0.025;
        break;

      case 'choosing':
        // Waiting for player choice — look straight ahead at both
        this.targetLookAt.set(0, 1.4, -1.8);
        this.npcBobAmplitude = 0.01; // calm down while waiting
        break;

      case 'result':
        // Interviewer reacting
        this.npcBobAmplitude = 0.015;
        break;

      case 'hired':
        // "You start Monday" — dramatic
        this.npcBobAmplitude = 0.03;
        break;

      case 'farewell':
        // Second interviewer
        this.npcBobAmplitude = 0.02;
        break;

      case 'transitioning':
        // Wait then go to office
        if (this.phaseTimer > 2.0) {
          ctx.transitionTo('office');
        }
        break;
    }
  }

  private cutToSpeaker(speakerNum: 1 | 2) {
    if (speakerNum === 1) {
      // Slightly offset camera angle for speaker 1 — cinematic over-the-shoulder feel
      this.targetCameraPos.set(-0.3, 1.35, 1.0);
      this.targetLookAt.copy(this.lookAtInterviewer1);
    } else {
      this.targetCameraPos.set(0.3, 1.35, 1.0);
      this.targetLookAt.copy(this.lookAtInterviewer2);
    }
    this.cameraLerpSpeed = 3.0;
  }

  private onChoiceMade(ctx: SceneContext, _index: number) {
    // Cut to interviewer 1 reacting
    this.phase = 'result';
    this.phaseTimer = 0;
    this.cutToSpeaker(1);

    // Brief dramatic pause
    ctx.showNarrator('The interviewer scribbles something on their notepad.');
    setTimeout(() => ctx.hideNarrator(), 1800);

    setTimeout(() => {
      // Play interview result
      this.cutToSpeaker(1);
      ctx.dialogue.play(DIALOGUE.interviewResult, () => {
        // "You start Monday" moment — screen shake!
        this.phase = 'hired';
        this.phaseTimer = 0;
        this.shakeIntensity = 0.08;

        // Flash the lights briefly
        ctx.setFade(0.4);
        setTimeout(() => ctx.setFade(0), 300);

        ctx.showNarrator('...wait, that\'s it?');
        setTimeout(() => ctx.hideNarrator(), 2000);

        // Cut to interviewer 2
        setTimeout(() => {
          this.cutToSpeaker(2);
          this.phase = 'farewell';
          this.phaseTimer = 0;

          ctx.dialogue.play(DIALOGUE.interviewer2, () => {
            // Final narrator
            ctx.showNarrator('Welcome to Nexus Corp. Your desk is waiting.');
            this.phase = 'transitioning';
            this.phaseTimer = 0;

            setTimeout(() => ctx.hideNarrator(), 2000);
          });
        }, 2500);
      });
    }, 2000);
  }

  cleanup() {
    this.phase = 'entering';
    this.phaseTimer = 0;
    this.totalTime = 0;
    this.shakeIntensity = 0;
    this.npcBobAmplitude = 0.01;
    this.npc1Group = null;
    this.npc2Group = null;
  }

  // Kept for compatibility with Game3D trigger handler
  onSitDown(_ctx: SceneContext) {
    // No-op — scene is now fully scripted
  }
}
