import * as THREE from 'three';
import {
  createFloor, createBox, createChair, createNPC,
  createTextSign, addLighting, createCeiling,
} from './SceneHelpers';
import { DIALOGUE, INTERVIEW_CHOICES } from '../data/dialogue';

export class InterviewScene {
  constructor() {
    this.name = 'interview';
    this.phase = 'entering';
    this.phaseTimer = 0;
    this.totalTime = 0;

    // Camera targets
    this.cameraStart = new THREE.Vector3(0, 1.7, 4.5);
    this.doorwayPos = new THREE.Vector3(0, 1.7, 3.0);
    this.seatPos = new THREE.Vector3(0, 1.3, 1.2);
    this.lookAtTable = new THREE.Vector3(0, 1.0, -0.5);
    this.lookAtInterviewer1 = new THREE.Vector3(-0.5, 1.5, -1.8);
    this.lookAtInterviewer2 = new THREE.Vector3(0.5, 1.5, -1.8);

    // Camera cut system
    this.currentCameraPos = new THREE.Vector3();
    this.targetCameraPos = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();
    this.targetLookAt = new THREE.Vector3();
    this.cameraLerpSpeed = 2.0;

    // NPCs
    this.npc1Group = null;
    this.npc2Group = null;
    this.npcBobAmplitude = 0.01;

    // Screen shake
    this.shakeIntensity = 0;
    this.shakeDecay = 3;
  }

  setup(ctx) {
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
    }

    // Walls
    ctx.scene.add(createBox(roomW, roomH, 0.15, wallColor, [0, roomH / 2, -halfD]));
    ctx.scene.add(createBox(roomW, roomH, 0.15, wallColor, [0, roomH / 2, halfD]));
    ctx.scene.add(createBox(0.15, roomH, roomD, wallColor, [-halfW, roomH / 2, 0]));
    
    // Right wall with window
    ctx.scene.add(createBox(0.15, 1.0, roomD, wallColor, [halfW, 0.5, 0]));
    ctx.scene.add(createBox(0.15, 1.0, roomD, wallColor, [halfW, roomH - 0.5, 0]));
    const windowGlass = createBox(0.05, 1.5, roomD - 1, 0x334455, [halfW, 1.75, 0]);
    windowGlass.material.transparent = true; windowGlass.material.opacity = 0.15; windowGlass.material.metalness = 0.9;
    ctx.scene.add(windowGlass);
    
    for (let wz = -halfD + 1; wz <= halfD - 1; wz += 2.5) {
      ctx.scene.add(createBox(0.2, roomH, 0.15, 0x444444, [halfW - 0.02, roomH / 2, wz]));
    }

    // Corner pillars
    for (const [cx, cz] of [[-halfW, -halfD], [halfW, -halfD], [-halfW, halfD], [halfW, halfD]]) {
      ctx.scene.add(createBox(0.3, roomH, 0.3, 0x555d65, [cx, roomH / 2, cz]));
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
    const stain = new THREE.Mesh(new THREE.CircleGeometry(0.08, 8), new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 1 }));
    stain.rotation.x = -Math.PI / 2;
    stain.position.set(0.5, 0.8, 0.2);
    ctx.scene.add(stain);

    // Papers, pen, laptop
    ctx.scene.add(createBox(0.3, 0.01, 0.22, 0xeeeedd, [-0.8, 0.8, -0.3]));
    ctx.scene.add(createBox(0.15, 0.01, 0.01, 0x222222, [-0.6, 0.805, -0.2]));
    ctx.scene.add(createBox(0.35, 0.02, 0.25, 0x222222, [0.5, 0.8, -0.4]));
    ctx.scene.add(createBox(0.35, 0.25, 0.02, 0x111111, [0.5, 0.93, -0.53]));
    
    const screenGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.22), new THREE.MeshStandardMaterial({ color: 0x2244aa, emissive: 0x112244, emissiveIntensity: 0.8 }));
    screenGlow.position.set(0.5, 0.93, -0.515);
    ctx.scene.add(screenGlow);

    // --- CHAIRS ---
    ctx.scene.add(createChair(-0.8, -1.4, 0));
    ctx.scene.add(createChair(0.8, -1.4, 0));
    ctx.scene.add(createChair(-0.8, 1.4, Math.PI));
    ctx.scene.add(createChair(0.8, 1.4, Math.PI));
    
    const playerChair = createChair(0, 1.4, Math.PI);
    playerChair.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.color.set(0x4a6a7a);
        child.material.emissive = new THREE.Color(0x1a2a3a);
        child.material.emissiveIntensity = 0.3;
      }
    });
    ctx.scene.add(playerChair);

    // --- NPCs ---
    this.npc1Group = createNPC(-0.5, -1.8, {
      bodyColor: 0x2a3a5a,
      label: 'interviewer1',
      skinTone: 0xd4a574,
      hairColor: 0x2a1a0a,
      hairStyle: 'flat',
      hasGlasses: true,
      hasTie: true,
      tieColor: 0xaa2222,
      facing: Math.PI,
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

    // --- props ---
    const wb = createTextSign('Q3 OKRs:\nSYNERGY | LEVERAGE\nDISRUPT | PIVOT', 3.0, 1.8, '#e8e8e0', '#2a2a2a', 20);
    wb.position.set(0, 2.2, -halfD + 0.1);
    ctx.scene.add(wb);
    
    const poster = createTextSign('TEAMWORK\nBecause None of Us\nIs As Underpaid\nAs All of Us', 1.6, 1.4, '#2a3a4a', '#aabbcc', 16);
    poster.position.set(-halfW + 0.1, 2.2, -1);
    poster.rotation.y = Math.PI / 2;
    ctx.scene.add(poster);

    // Door
    ctx.scene.add(createBox(1.2, 2.4, 0.16, 0x4a3a2a, [-2, 1.2, halfD - 0.01]));

    // --- INITIAL CAMERA ---
    ctx.player.disable();
    this.currentCameraPos.copy(this.cameraStart);
    this.targetCameraPos.copy(this.doorwayPos);
    this.currentLookAt.copy(this.lookAtTable);
    this.targetLookAt.copy(this.lookAtTable);
    ctx.player.camera.position.copy(this.cameraStart);
    ctx.player.camera.lookAt(this.lookAtTable);

    ctx.player.setColliders([]);
    ctx.showNarrator('You push open the door to Conference Room B.');
  }

  update(delta, ctx) {
    this.totalTime += delta;
    this.phaseTimer += delta;

    // Phase-driven NPC body language
    this._animateInterviewerNPC(delta, this.npc1Group, this.totalTime, 0);
    this._animateInterviewerNPC(delta, this.npc2Group, this.totalTime * 1.1, 1.4);

    // Screen shake
    let shakeOffset = new THREE.Vector3();
    if (this.shakeIntensity > 0.001) {
      shakeOffset.set((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity * 0.5, 0);
      this.shakeIntensity *= (1 - this.shakeDecay * delta);
    }

    // Camera lerp
    this.currentCameraPos.lerp(this.targetCameraPos, delta * this.cameraLerpSpeed);
    this.currentLookAt.lerp(this.targetLookAt, delta * this.cameraLerpSpeed);
    ctx.player.camera.position.copy(this.currentCameraPos).add(shakeOffset);
    ctx.player.camera.lookAt(this.currentLookAt);

    // Phase machine
    switch (this.phase) {
      case 'entering':
        if (this.phaseTimer > 0.8) {
          this.phase = 'sitting';
          this.phaseTimer = 0;
          ctx.hideNarrator();
          ctx.showNarrator('Two interviewers stare at you from across the table.');
          this.targetCameraPos.copy(this.seatPos);
          this.targetLookAt.copy(this.lookAtInterviewer1);
          this.cameraLerpSpeed = 2.5;
        }
        break;

      case 'sitting':
        if (this.phaseTimer > 1.0) {
          this.phase = 'settled';
          this.phaseTimer = 0;
          ctx.hideNarrator();
          this.targetLookAt.set(0, 2.2, -5); // Look at whiteboard
          this.cameraLerpSpeed = 1.5;
        }
        break;

      case 'settled':
        if (this.phaseTimer > 0.4) {
          this.targetLookAt.copy(this.lookAtInterviewer1);
          this.cameraLerpSpeed = 2.5;
        }
        if (this.phaseTimer > 1.0) {
          this.phase = 'dialogue_start';
          this.phaseTimer = 0;
          this.cutToSpeaker(1);
          ctx.dialogue.play(DIALOGUE.interviewer, () => {
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
        break;

      case 'choosing':
        this.targetLookAt.set(0, 1.4, -1.8);
        break;

      case 'result':
        break;

      case 'hired':
        break;

      case 'farewell':
        break;

      case 'transitioning':
        if (this.phaseTimer > 2.0) {
          ctx.transitionTo('office');
        }
        break;
    }
  }

  _animateInterviewerNPC(delta, npc, t, phaseOffset) {
    if (!npc) return;
    const parts = npc.userData.parts;
    if (!parts) return;

    const baseY = npc.userData.baseY ?? (npc.userData.baseY = npc.position.y);

    switch (this.phase) {
      case 'entering':
      case 'sitting':
        // Interviewers sit back, arms on table — waiting, slightly bored
        if (parts.torso) parts.torso.rotation.x += (-0.06 - parts.torso.rotation.x) * Math.min(1, 3 * delta);
        if (parts.head) {
          parts.head.rotation.x += (-0.08 - parts.head.rotation.x) * Math.min(1, 2 * delta);
          parts.head.rotation.y += (Math.sin(t * 0.2 + phaseOffset) * 0.06 - parts.head.rotation.y) * Math.min(1, 1.5 * delta);
        }
        if (parts.leftForearm)  parts.leftForearm.rotation.x  = -0.15;
        if (parts.rightForearm) parts.rightForearm.rotation.x = -0.15;
        npc.position.y = baseY + Math.sin(t * 0.9 + phaseOffset) * 0.004;
        break;

      case 'dialogue_start':
      case 'result':
        // Leaning slightly forward, engaged — subtle "interviewer mode"
        if (parts.torso) parts.torso.rotation.x += (0.1 - parts.torso.rotation.x) * Math.min(1, 3 * delta);
        if (parts.head) {
          // Head bobs slightly while speaking
          parts.head.rotation.x += (Math.sin(t * 2.5 + phaseOffset) * 0.04 - parts.head.rotation.x) * Math.min(1, 4 * delta);
        }
        // "Shuffling papers" — forearm rocks side to side
        if (parts.leftForearm)  parts.leftForearm.rotation.x  = -0.25 + Math.sin(t * 1.8 + phaseOffset) * 0.07;
        if (parts.rightForearm) parts.rightForearm.rotation.x = -0.25 - Math.sin(t * 1.8 + phaseOffset) * 0.05;
        npc.position.y = baseY + Math.sin(t * 1.4 + phaseOffset) * 0.008;
        break;

      case 'choosing':
        // Interviewers sit back, arms folded, watching — eerie stillness
        if (parts.torso) parts.torso.rotation.x += (-0.04 - parts.torso.rotation.x) * Math.min(1, 2 * delta);
        if (parts.head) {
          // Slow, deliberate tilt toward the player
          parts.head.rotation.x += (-0.05 - parts.head.rotation.x) * Math.min(1, 1.5 * delta);
          parts.head.rotation.y += (0 - parts.head.rotation.y) * Math.min(1, 2 * delta);
        }
        if (parts.leftForearm)  parts.leftForearm.rotation.x  = -0.1;
        if (parts.rightForearm) parts.rightForearm.rotation.x = -0.1;
        npc.position.y = baseY + Math.sin(t * 0.5 + phaseOffset) * 0.002;
        break;

      case 'hired':
      case 'farewell':
        // Interviewer 2 leans forward excitedly, interviewer 1 relaxes back
        if (parts.torso) {
          const targetLean = phaseOffset < 1 ? 0.14 : -0.05;
          parts.torso.rotation.x += (targetLean - parts.torso.rotation.x) * Math.min(1, 3 * delta);
        }
        if (parts.head) {
          parts.head.rotation.x += (0.05 - parts.head.rotation.x) * Math.min(1, 2.5 * delta);
          parts.head.rotation.y += (Math.sin(t * 0.4 + phaseOffset) * 0.05 - parts.head.rotation.y) * Math.min(1, 2 * delta);
        }
        if (parts.leftForearm)  parts.leftForearm.rotation.x  = -0.3 + Math.sin(t * 1.2 + phaseOffset) * 0.06;
        if (parts.rightForearm) parts.rightForearm.rotation.x = -0.3 - Math.sin(t * 1.2 + phaseOffset) * 0.06;
        npc.position.y = baseY + Math.sin(t * 1.1 + phaseOffset) * 0.006;
        break;

      default:
        npc.position.y = baseY + Math.sin(t * 0.8 + phaseOffset) * 0.003;
    }
  }

  cutToSpeaker(num) {
    if (num === 1) {
      this.targetCameraPos.set(-0.3, 1.35, 1.0);
      this.targetLookAt.copy(this.lookAtInterviewer1);
    } else {
      this.targetCameraPos.set(0.3, 1.35, 1.0);
      this.targetLookAt.copy(this.lookAtInterviewer2);
    }
    this.cameraLerpSpeed = 3.0;
  }

  onChoiceMade(ctx, index) {
    this.phase = 'result';
    this.phaseTimer = 0;

    // Each choice gets a different camera reaction
    if (index === 2) {
      // Choice C (...): camera locks slowly on interviewer 1 staring
      this.cameraLerpSpeed = 0.6;
      this.targetCameraPos.set(-0.3, 1.35, 1.0);
      this.targetLookAt.copy(this.lookAtInterviewer1);
    } else {
      this.cutToSpeaker(1);
    }

    const narratorText = index === 0
      ? 'The interviewer nods immediately.'
      : index === 1
      ? 'The interviewer pauses.'
      : 'The interviewer stares at you.';

    const resultKey = index === 0 ? 'interviewResultA' : index === 1 ? 'interviewResultB' : 'interviewResultC';
    const pauseDuration = index === 0 ? 600 : index === 1 ? 2800 : 5000;
    const shakeIntensity = index === 0 ? 0.03 : index === 1 ? 0.07 : 0.18;

    ctx.showNarrator(narratorText);

    setTimeout(() => {
      ctx.hideNarrator();
      this.cameraLerpSpeed = 3.0;
      this.cutToSpeaker(1);
      ctx.dialogue.play(DIALOGUE[resultKey], () => {
        this.phase = 'hired';
        this.phaseTimer = 0;
        this.shakeIntensity = shakeIntensity;
        ctx.setFade(0.4);
        setTimeout(() => ctx.setFade(0), 300);
        ctx.showNarrator('...wait, that\'s it?');

        setTimeout(() => {
          ctx.hideNarrator();
          this.cutToSpeaker(2);
          this.phase = 'farewell';
          this.phaseTimer = 0;
          ctx.dialogue.play(DIALOGUE.interviewer2, () => {
            ctx.showNarrator('Welcome to Nexus Corp. Your desk is waiting.');
            this.phase = 'transitioning';
            this.phaseTimer = 0;
            setTimeout(() => ctx.hideNarrator(), 2000);
          });
        }, 2500);
      });
    }, pauseDuration);
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

  onSitDown(_ctx) {}
}
