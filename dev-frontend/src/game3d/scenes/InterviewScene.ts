import * as THREE from 'three';
import type { GameScene, SceneContext } from '../engine/SceneManager';
import {
  createFloor, createWall, createBox, createChair, createNPC,
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

    // Chairs around table
    ctx.scene.add(createChair(-0.8, -1.2, 0));
    ctx.scene.add(createChair(0.8, -1.2, 0));
    ctx.scene.add(createChair(-0.8, 1.2, Math.PI));
    ctx.scene.add(createChair(0.8, 1.2, Math.PI));

    // Player's empty chair (highlighted)
    const playerChair = createChair(0, 1.2, Math.PI);
    playerChair.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshStandardMaterial).color.set(0x4a6a7a);
        (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x1a2a3a);
        (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
      }
    });
    ctx.scene.add(playerChair);

    // Interviewer NPCs (seated)
    const npc1 = createNPC(-0.5, -1.5, 0x4a5a6a, 'interviewer1');
    npc1.scale.y = 0.7; // "Seated"
    npc1.position.y = 0.3;
    ctx.scene.add(npc1);

    const npc2 = createNPC(0.5, -1.5, 0x5a4a4a, 'interviewer2');
    npc2.scale.y = 0.7;
    npc2.position.y = 0.3;
    ctx.scene.add(npc2);

    // Whiteboard
    const wb = createTextSign(
      'Q3 OKRs: SYNERGY | LEVERAGE | DISRUPT | PIVOT',
      2.5, 1.2, '#e8e8e0', '#2a2a2a', 22
    );
    wb.position.set(0, 2.0, -3.8);
    ctx.scene.add(wb);

    // Crossed out text
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

    // Seat camera target
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
      // Table
      new THREE.Box3(new THREE.Vector3(-1.5, 0, -0.7), new THREE.Vector3(1.5, 0.9, 0.7)),
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
            // this.choiceMade = true;
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
