import * as THREE from 'three';
import type { GameScene, SceneContext } from '../engine/SceneManager';
import {
  createFloor, createWall, createBox, createChair, createNPC,
  createTextSign, addLighting, createCeiling, setNPCExpression,
} from './SceneHelpers';
import { DIALOGUE, INTERVIEW_CHOICES } from '../data/dialogue';

export class InterviewScene implements GameScene {
  name = 'interview';
  private seated = false;
  private choiceMade = false;
  private cameraTarget = new THREE.Vector3();
  private cameraLerping = false;
  private npc1!: THREE.Group;
  private npc2!: THREE.Group;

  // Evil smile zoom state
  private evilZooming = false;
  private evilZoomProgress = 0;
  private evilZoomStart = new THREE.Vector3();
  private evilZoomEnd = new THREE.Vector3();
  private postEvilCallback: (() => void) | null = null;

  setup(ctx: SceneContext) {
    this.seated = false;
    this.choiceMade = false;
    this.cameraLerping = false;
    this.evilZooming = false;
    this.evilZoomProgress = 0;

    addLighting(ctx.scene);
    ctx.scene.background = new THREE.Color(0x3a4a5a);

    const floor = createFloor(8, 8, 0x5a6a6a);
    ctx.scene.add(floor);
    ctx.scene.add(createCeiling(8, 8, 3.2));

    // Walls
    for (const [x, z, ry] of [
      [0, -4, 0], [0, 4, 0], [-4, 0, Math.PI / 2], [4, 0, Math.PI / 2],
    ] as [number, number, number][]) {
      const wall = createWall(8, 3.2, 0x5a6a7a);
      wall.position.set(x, 1.6, z);
      wall.rotation.y = ry;
      ctx.scene.add(wall);
    }

    // Conference table
    const table = createBox(3, 0.08, 1.2, 0x5a4a3a, [0, 0.75, 0]);
    ctx.scene.add(table);

    // Coffee stain on table
    const stain = new THREE.Mesh(
      new THREE.CircleGeometry(0.08, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 1 })
    );
    stain.rotation.x = -Math.PI / 2;
    stain.position.set(0.5, 0.8, 0.2);
    ctx.scene.add(stain);

    // Interviewer chairs
    ctx.scene.add(createChair(-0.5, -1.2, 0));
    ctx.scene.add(createChair(0.5, -1.2, 0));

    // Player side chairs
    ctx.scene.add(createChair(-0.8, 1.2, Math.PI));
    ctx.scene.add(createChair(0.8, 1.2, Math.PI));

    // Player's chair (highlighted)
    const playerChair = createChair(0, 1.2, Math.PI);
    playerChair.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshStandardMaterial).color.set(0x4a6a7a);
        (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x1a2a3a);
        (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
      }
    });
    ctx.scene.add(playerChair);

    // Laptop on table near NPC2 (staring at it)
    const laptop = createBox(0.25, 0.15, 0.2, 0x2a2a2a, [0.5, 0.83, -0.3]);
    ctx.scene.add(laptop);
    const laptopScreen = createBox(0.23, 0.01, 0.15, 0x334466, [0.5, 0.91, -0.35]);
    (laptopScreen.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x223344);
    (laptopScreen.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
    ctx.scene.add(laptopScreen);

    // Interviewer 1 — seated, facing player (+Z), neutral initially
    this.npc1 = createNPC({
      x: -0.5, z: -1.5,
      bodyColor: 0x4a5a6a,
      label: 'interviewer1',
      seated: true,
      facingY: Math.PI, // faces toward player
      expression: 'neutral',
    });
    ctx.scene.add(this.npc1);

    // Interviewer 2 — seated, bored, staring at laptop
    this.npc2 = createNPC({
      x: 0.5, z: -1.5,
      bodyColor: 0x5a4a4a,
      skinColor: '#c49a6c',
      label: 'interviewer2',
      seated: true,
      facingY: Math.PI,
      expression: 'bored',
    });
    ctx.scene.add(this.npc2);

    // Whiteboard
    const wb = createTextSign(
      'Q3 OKRs: SYNERGY | LEVERAGE | DISRUPT | PIVOT',
      2.5, 1.2, '#e8e8e0', '#2a2a2a', 22
    );
    wb.position.set(0, 2.0, -3.8);
    ctx.scene.add(wb);

    // Crossed out Q2
    const wbOld = createTextSign(
      'Q2 OKR: Don\'t Lose Any More Interns',
      1.5, 0.3, '#e8e8e0', '#aa4444', 16
    );
    wbOld.position.set(0, 1.2, -3.78);
    ctx.scene.add(wbOld);

    // Motivational poster
    const poster = createTextSign(
      'TEAMWORK — Because None of Us Is As Underpaid As All of Us',
      1.2, 0.8, '#2a3a4a', '#aabbcc', 16
    );
    poster.position.set(-3.8, 2.0, 0);
    poster.rotation.y = Math.PI / 2;
    ctx.scene.add(poster);

    // Player start
    ctx.player.camera.position.set(0, 1.7, 3.5);
    ctx.player.enable();

    this.cameraTarget.set(0, 1.3, 1.0);

    // Sit trigger
    ctx.triggers.add({
      id: 'sit',
      position: new THREE.Vector3(0, 1, 1.2),
      size: new THREE.Vector3(1.5, 2, 1.5),
      once: true,
      promptText: '[E] Sit Down',
    });

    ctx.player.setColliders([
      new THREE.Box3(new THREE.Vector3(-4.5, 0, -4.5), new THREE.Vector3(-3.5, 4, 4.5)),
      new THREE.Box3(new THREE.Vector3(3.5, 0, -4.5), new THREE.Vector3(4.5, 4, 4.5)),
      new THREE.Box3(new THREE.Vector3(-4.5, 0, -4.5), new THREE.Vector3(4.5, 4, -3.5)),
      new THREE.Box3(new THREE.Vector3(-4.5, 0, 3.5), new THREE.Vector3(4.5, 4, 4.5)),
      new THREE.Box3(new THREE.Vector3(-1.5, 0, -0.7), new THREE.Vector3(1.5, 0.9, 0.7)),
    ]);
  }

  update(delta: number, ctx: SceneContext) {
    // Evil smile zoom-in on interviewer1's face
    if (this.evilZooming) {
      this.evilZoomProgress += delta * 1.2;
      if (this.evilZoomProgress > 1) this.evilZoomProgress = 1;

      // Ease in-out
      const t = this.evilZoomProgress < 0.5
        ? 2 * this.evilZoomProgress * this.evilZoomProgress
        : 1 - Math.pow(-2 * this.evilZoomProgress + 2, 2) / 2;

      ctx.player.camera.position.lerpVectors(this.evilZoomStart, this.evilZoomEnd, t);

      // Look at NPC1's head
      const headPos = new THREE.Vector3(
        this.npc1.position.x,
        this.npc1.position.y + 1.15,
        this.npc1.position.z
      );
      ctx.player.camera.lookAt(headPos);

      if (this.evilZoomProgress >= 1) {
        this.evilZooming = false;
        // Hold for a beat then continue
        setTimeout(() => {
          // Zoom back out
          this.zoomOut(ctx, () => {
            this.postEvilCallback?.();
          });
        }, 1200);
      }
      return;
    }

    if (this.cameraLerping) {
      ctx.player.camera.position.lerp(this.cameraTarget, delta * 2);
      const lookTarget = new THREE.Vector3(0, 1.15, -1.5);
      ctx.player.camera.lookAt(lookTarget);

      if (ctx.player.camera.position.distanceTo(this.cameraTarget) < 0.1) {
        this.cameraLerping = false;
        ctx.player.camera.lookAt(new THREE.Vector3(0, 1.15, -1.5));

        // NPC1 notices you — slight surprise
        setNPCExpression(this.npc1, 'neutral');

        // Start interview dialogue
        ctx.dialogue.play(DIALOGUE.interviewer, () => {
          // Show choices
          ctx.showChoice(INTERVIEW_CHOICES, (_index) => {
            this.choiceMade = true;
            ctx.hideChoice();

            // NPC1 does the evil smile + zoom
            setNPCExpression(this.npc1, 'evil_smile');

            this.evilZoomStart.copy(ctx.player.camera.position);
            this.evilZoomEnd.set(
              this.npc1.position.x,
              this.npc1.position.y + 1.15,
              this.npc1.position.z + 0.6 // close to face
            );
            this.evilZooming = true;
            this.evilZoomProgress = 0;

            this.postEvilCallback = () => {
              setNPCExpression(this.npc1, 'neutral');
              ctx.dialogue.play(DIALOGUE.interviewResult, () => {
                // NPC2 finally speaks — still bored
                ctx.dialogue.play(DIALOGUE.interviewer2, () => {
                  setTimeout(() => ctx.transitionTo('office'), 1000);
                });
              });
            };
          });
        });
      }
    }
  }

  private zoomOut(ctx: SceneContext, onDone: () => void) {
    const start = ctx.player.camera.position.clone();
    const end = this.cameraTarget.clone();
    const startTime = performance.now();
    const duration = 600;

    const tick = () => {
      const t = Math.min((performance.now() - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 2);
      ctx.player.camera.position.lerpVectors(start, end, ease);
      ctx.player.camera.lookAt(new THREE.Vector3(0, 1.15, -1.5));
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        onDone();
      }
    };
    tick();
  }

  cleanup() {
    this.seated = false;
    this.choiceMade = false;
    this.cameraLerping = false;
    this.evilZooming = false;
  }

  onSitDown(ctx: SceneContext) {
    if (this.seated) return;
    this.seated = true;
    ctx.player.disable();
    this.cameraLerping = true;
  }
}
