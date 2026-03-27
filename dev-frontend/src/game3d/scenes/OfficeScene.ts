import * as THREE from 'three';
import type { GameScene, SceneContext } from '../engine/SceneManager';
import {
  createFloor, createWall, createDesk, createChair, createNPC, createPlant,
  createTextSign, addLighting, createCeiling, createFluorescentLight, createBox,
} from './SceneHelpers';

export class OfficeScene implements GameScene {
  name = 'office';
  private npcs: THREE.Group[] = [];
  private fluorLights: THREE.PointLight[] = [];
  private flickerTimers: number[] = [];
  private dustParticles: THREE.Points | null = null;
  private elapsedTime = 0;

  setup(ctx: SceneContext) {
    this.npcs = [];
    this.fluorLights = [];
    this.flickerTimers = [];
    this.elapsedTime = 0;

    addLighting(ctx.scene);
    ctx.scene.background = new THREE.Color(0x1a1e24);

    // Large office floor
    const floor = createFloor(18, 22, 0x4a5a5a);
    ctx.scene.add(floor);
    ctx.scene.add(createCeiling(18, 22, 3.2, 0xd8d8d8));

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

    // Fluorescent lights (removed flicker for performance)
    for (let x = -4; x <= 4; x += 4) {
      for (let z = -6; z <= 6; z += 4) {
        const lightGroup = createFluorescentLight(x, z, 3.2);
        ctx.scene.add(lightGroup);
      }
    }

    // Desk pods — 3 rows of 4
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const x = -4.5 + col * 3;
        const z = -6 + row * 4;
        const desk = createDesk(x, z);
        ctx.scene.add(desk);
        ctx.scene.add(createChair(x, z + 0.8, Math.PI));
      }
    }

    // NPC Coworkers — properly seated with expressions
    // Printer coworker (standing near printer)
    const printerNPC = createNPC(5.5, -4, {
      bodyColor: 0x5a6a5a,
      label: 'coworkerPrinter',
      facing: -Math.PI / 2,
    });
    ctx.scene.add(printerNPC);
    this.npcs.push(printerNPC);

    // Desk coworker (seated)
    const deskNPC = createNPC(-1.5, -5.2, {
      bodyColor: 0x6a5a5a,
      label: 'coworkerDesk',
      facing: Math.PI,
    });
    deskNPC.scale.y = 0.7;
    deskNPC.position.y = 0.3;
    ctx.scene.add(deskNPC);
    this.npcs.push(deskNPC);

    // Ambient NPCs (seated at desks)
    const seatedPositions = [
      { x: 1.5, z: -5.2, color: 0x5a5a6a },
      { x: -4.5, z: -1.2, color: 0x6a6a5a },
      { x: 4.5, z: -1.2, color: 0x5a6a6a },
      { x: -1.5, z: 2.8, color: 0x6a5a6a },
      { x: 1.5, z: 2.8, color: 0x5a5a5a },
    ];
    for (const pos of seatedPositions) {
      const npc = createNPC(pos.x, pos.z, {
        bodyColor: pos.color,
        facing: Math.PI,
      });
      npc.scale.y = 0.7;
      npc.position.y = 0.3;
      ctx.scene.add(npc);
      this.npcs.push(npc);
    }

    // Printer area
    const printer = createBox(0.6, 0.4, 0.4, 0x7a7a7a, [6, 0.8, -4]);
    ctx.scene.add(printer);
    const printerTable = createBox(0.8, 0.75, 0.5, 0x5a4a3a, [6, 0.375, -4]);
    ctx.scene.add(printerTable);

    // Sprint board on wall
    const sprintBoard = createTextSign(
      'SPRINT BOARD\nTODO | IN PROGRESS\nBLOCKED | DONE(empty)',
      2.5, 1.5, '#e8e8e0', '#2a2a2a', 18
    );
    sprintBoard.position.set(-7.8, 2.0, 0);
    sprintBoard.rotation.y = Math.PI / 2;
    ctx.scene.add(sprintBoard);

    // "Days without incident: 0"
    const incidentCounter = createTextSign(
      'DAYS WITHOUT\nINCIDENT: 0',
      1.2, 0.5, '#aa3333', '#eeeeee', 20
    );
    incidentCounter.position.set(7.8, 2.5, -2);
    incidentCounter.rotation.y = -Math.PI / 2;
    ctx.scene.add(incidentCounter);

    // "Please Do Not Discuss Salary. Or Feelings."
    const salarySign = createTextSign(
      'Please Do Not Discuss\nSalary. Or Feelings.',
      2.0, 0.5, '#2a3a4a', '#aabbcc', 18
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

    // YOUR desk — last desk, marked special
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

    // Name tag on your desk
    const nameTag = createTextSign('INTERN', 0.3, 0.1, '#eeeedd', '#2a2a2a', 20);
    nameTag.position.set(4.5, 0.82, 6.3);
    nameTag.rotation.x = -Math.PI / 4;
    ctx.scene.add(nameTag);

    // Floating dust particles (removed for performance)
    // this.dustParticles = this.createDustParticles();
    // ctx.scene.add(this.dustParticles);

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

  private createDustParticles(): THREE.Points {
    const count = 60; // Halved for performance
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xccccaa,
      size: 0.02,
      transparent: true,
      opacity: 0.4,
    });
    return new THREE.Points(geo, mat);
  }

  private slowTick = 0;

  update(delta: number, _ctx: SceneContext) {
    this.elapsedTime += delta;
    this.slowTick += delta;
    const doSlow = this.slowTick >= 0.05; // 20fps for expensive updates
    if (doSlow) this.slowTick = 0;

    // NPC idle animations (removed for performance)
    /*
    if (doSlow) {
      for (const npc of this.npcs) {
        const phase = npc.userData.idlePhase || 0;
        const t = this.elapsedTime + phase;
        npc.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry) {
            if (Math.abs(child.position.y - 1.58) < 0.05) {
              child.rotation.y = Math.sin(t * 0.5) * 0.08;
              child.rotation.x = Math.sin(t * 0.3) * 0.03;
            }
          }
        });
      }
    }
    */

    // Fluorescent light flicker (removed for performance)
    /*
    if (doSlow) {
      for (let i = 0; i < this.fluorLights.length; i++) {
        this.flickerTimers[i] += this.slowTick;
        const light = this.fluorLights[i];
        if (Math.sin(this.elapsedTime * 15 + i * 7) > 0.97) {
          light.intensity = 0.3 + Math.random() * 0.5;
        } else {
          light.intensity = 0.8;
        }
      }
    }
    */

    // Dust particle drift (removed for performance)
    /*
    if (doSlow && this.dustParticles) {
      const positions = this.dustParticles.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        y += 0.05 * 0.05 * Math.sin(this.elapsedTime + i);
        const x = positions.getX(i) + 0.05 * 0.02 * Math.sin(this.elapsedTime * 0.3 + i * 0.5);
        if (y > 3) y = 0;
        if (y < 0) y = 3;
        positions.setY(i, y);
        positions.setX(i, x);
      }
      positions.needsUpdate = true;
    }
    */
  }

  cleanup() {
    this.npcs = [];
    this.fluorLights = [];
    this.flickerTimers = [];
    this.dustParticles = null;
  }
}
