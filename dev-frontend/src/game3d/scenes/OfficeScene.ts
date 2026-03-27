import * as THREE from 'three';
import type { GameScene, SceneContext } from '../engine/SceneManager';
import {
  createFloor, createWall, createDesk, createChair, createNPC, createPlant,
  createTextSign, addLighting, createCeiling, createFluorescentLight, createBox,
  setNPCExpression, createSpeechBubble,
} from './SceneHelpers';

export class OfficeScene implements GameScene {
  name = 'office';
  private npcs: THREE.Group[] = [];
  private bubbles: THREE.Mesh[] = [];
  private scene!: THREE.Scene;

  setup(ctx: SceneContext) {
    this.npcs = [];
    this.bubbles = [];
    this.scene = ctx.scene;

    addLighting(ctx.scene);
    ctx.scene.background = new THREE.Color(0x3a4a5a);

    // Large office floor
    const floor = createFloor(16, 20, 0x4a5a5a);
    ctx.scene.add(floor);
    ctx.scene.add(createCeiling(16, 20, 3.2));

    // Walls
    const backWall = createWall(16, 3.2, 0x5a6a7a);
    backWall.position.z = -10;
    ctx.scene.add(backWall);

    const frontWall = createWall(16, 3.2, 0x5a6a7a);
    frontWall.position.z = 10;
    ctx.scene.add(frontWall);

    const leftWall = createWall(20, 3.2, 0x5a6a7a);
    leftWall.position.x = -8;
    leftWall.rotation.y = Math.PI / 2;
    ctx.scene.add(leftWall);

    const rightWall = createWall(20, 3.2, 0x5a6a7a);
    rightWall.position.x = 8;
    rightWall.rotation.y = Math.PI / 2;
    ctx.scene.add(rightWall);

    // Fluorescent lights
    for (let x = -4; x <= 4; x += 4) {
      for (let z = -6; z <= 6; z += 4) {
        ctx.scene.add(createFluorescentLight(x, z, 3.2));
      }
    }

    // Desk pods — 3 rows of 4
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const x = -4.5 + col * 3;
        const z = -6 + row * 4;
        ctx.scene.add(createDesk(x, z));
        ctx.scene.add(createChair(x, z + 0.8, Math.PI));
      }
    }

    // === NPC Coworkers — ALL properly seated ===

    // Printer coworker — standing by printer (the only one standing, on purpose)
    const printerNPC = createNPC({
      x: 5.5, z: -4,
      bodyColor: 0x5a6a5a,
      label: 'coworkerPrinter',
      seated: false,
      facingY: Math.PI * 0.75,
      expression: 'neutral',
    });
    ctx.scene.add(printerNPC);
    this.npcs.push(printerNPC);

    // Desk coworker — seated at their desk, bored
    const deskNPC = createNPC({
      x: -1.5, z: -5.2,
      bodyColor: 0x6a5a5a,
      label: 'coworkerDesk',
      seated: true,
      facingY: 0, // facing their monitor
      expression: 'bored',
    });
    ctx.scene.add(deskNPC);
    this.npcs.push(deskNPC);

    // Ambient NPC 1 — seated, working
    const npc3 = createNPC({
      x: 1.5, z: -1.2,
      bodyColor: 0x5a5a6a,
      seated: true,
      facingY: 0,
      expression: 'neutral',
    });
    ctx.scene.add(npc3);
    this.npcs.push(npc3);

    // Ambient NPC 2 — seated, bored
    const npc4 = createNPC({
      x: -4.5, z: 2.8,
      bodyColor: 0x6a6a5a,
      skinColor: '#c49a6c',
      seated: true,
      facingY: 0,
      expression: 'bored',
    });
    ctx.scene.add(npc4);
    this.npcs.push(npc4);

    // Ambient NPC 3 — seated far corner
    const npc5 = createNPC({
      x: 4.5, z: -1.2,
      bodyColor: 0x5a6a6a,
      skinColor: '#b8946a',
      seated: true,
      facingY: 0,
      expression: 'neutral',
    });
    ctx.scene.add(npc5);
    this.npcs.push(npc5);

    // Printer area
    const printer = createBox(0.6, 0.4, 0.4, 0x7a7a7a, [6, 0.8, -4]);
    ctx.scene.add(printer);
    const printerTable = createBox(0.8, 0.75, 0.5, 0x5a4a3a, [6, 0.375, -4]);
    ctx.scene.add(printerTable);

    // Sprint board on wall
    const sprintBoard = createTextSign(
      'SPRINT BOARD: TODO | IN PROGRESS | BLOCKED | DONE(empty)',
      2.5, 1.5, '#e8e8e0', '#2a2a2a', 18
    );
    sprintBoard.position.set(-7.8, 2.0, 0);
    sprintBoard.rotation.y = Math.PI / 2;
    ctx.scene.add(sprintBoard);

    // "Days without incident: 0"
    const incidentCounter = createTextSign(
      'DAYS WITHOUT INCIDENT: 0',
      1.2, 0.4, '#aa3333', '#eeeeee', 22
    );
    incidentCounter.position.set(7.8, 2.5, -2);
    incidentCounter.rotation.y = -Math.PI / 2;
    ctx.scene.add(incidentCounter);

    // "Please Do Not Discuss Salary. Or Feelings."
    const salarySign = createTextSign(
      'Please Do Not Discuss Salary. Or Feelings.',
      2.0, 0.4, '#2a3a4a', '#aabbcc', 20
    );
    salarySign.position.set(0, 2.8, -9.8);
    ctx.scene.add(salarySign);

    // 14 coffee cups on one desk
    for (let i = 0; i < 14; i++) {
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.025, 0.08, 6),
        new THREE.MeshStandardMaterial({ color: 0xeeddcc })
      );
      cup.position.set(
        1.5 + (Math.random() - 0.5) * 0.8,
        0.82,
        -6 + (Math.random() - 0.5) * 0.4
      );
      ctx.scene.add(cup);
    }

    // Plants
    ctx.scene.add(createPlant(-6, -8));
    ctx.scene.add(createPlant(6, 8));

    // YOUR desk — marked special with glow
    const yourDesk = createDesk(4.5, 6);
    yourDesk.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat.emissive) {
          mat.emissiveIntensity = 1.0;
          mat.emissive.set(0x2244aa);
        }
      }
    });
    ctx.scene.add(yourDesk);
    ctx.scene.add(createChair(4.5, 6.8, Math.PI));

    // Name tag
    const nameTag = createTextSign('INTERN', 0.3, 0.1, '#eeeedd', '#2a2a2a', 20);
    nameTag.position.set(4.5, 0.82, 6.3);
    nameTag.rotation.x = -Math.PI / 4;
    ctx.scene.add(nameTag);

    // Player start
    ctx.player.camera.position.set(0, 1.7, 9);
    ctx.player.enable();

    // NPC dialogue triggers
    ctx.triggers.add({
      id: 'coworkerPrinter',
      position: new THREE.Vector3(5.5, 1, -4),
      size: new THREE.Vector3(2.5, 3, 2.5),
      once: true,
      promptText: '[E] Talk',
    });

    ctx.triggers.add({
      id: 'coworkerDesk',
      position: new THREE.Vector3(-1.5, 1, -5.2),
      size: new THREE.Vector3(2.5, 3, 2.5),
      once: true,
      promptText: '[E] Talk',
    });

    // YOUR desk trigger
    ctx.triggers.add({
      id: 'yourDesk',
      position: new THREE.Vector3(4.5, 1, 6.5),
      size: new THREE.Vector3(2, 3, 2),
      once: true,
      autoTrigger: true,
    });

    // Colliders
    ctx.player.setColliders([
      new THREE.Box3(new THREE.Vector3(-8.5, 0, -10.5), new THREE.Vector3(-7.5, 4, 10.5)),
      new THREE.Box3(new THREE.Vector3(7.5, 0, -10.5), new THREE.Vector3(8.5, 4, 10.5)),
      new THREE.Box3(new THREE.Vector3(-8.5, 0, -10.5), new THREE.Vector3(8.5, 4, -9.5)),
      new THREE.Box3(new THREE.Vector3(-8.5, 0, 9.5), new THREE.Vector3(8.5, 4, 10.5)),
    ]);
  }

  /** Make nearby seated NPCs react angrily when player gets close */
  showAngryReaction(npcLabel: string) {
    const npc = this.npcs.find(n => n.userData.npcLabel === npcLabel);
    if (!npc) return;

    // Set angry face
    setNPCExpression(npc, 'angry');

    // Show speech bubble
    const phrases = [
      "Can't you see I'm busy?!",
      "Don't you have work to do?",
      "New intern... great.",
      "Headphones means NO.",
      "I'm in the zone!",
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    const bubble = createSpeechBubble(phrase, npc);
    this.scene.add(bubble);
    this.bubbles.push(bubble);

    // Remove bubble and reset face after 3 seconds
    setTimeout(() => {
      this.scene.remove(bubble);
      bubble.geometry.dispose();
      (bubble.material as THREE.MeshBasicMaterial).dispose();
      this.bubbles = this.bubbles.filter(b => b !== bubble);
      setNPCExpression(npc, 'bored');
    }, 3000);
  }

  update(_delta: number, _ctx: SceneContext) {
    // Make speech bubbles always face camera
    for (const bubble of this.bubbles) {
      bubble.lookAt(_ctx.player.camera.position);
    }
  }

  cleanup() {
    this.npcs = [];
    this.bubbles = [];
  }
}
