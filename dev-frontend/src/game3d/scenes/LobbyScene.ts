import * as THREE from 'three';
import type { GameScene, SceneContext } from '../engine/SceneManager';
import {
  createFloor, createWall, createBox, createChair, createNPC, createPlant,
  createTextSign, addLighting, createCeiling,
} from './SceneHelpers';

export class LobbyScene implements GameScene {
  name = 'lobby';

  setup(ctx: SceneContext) {
    addLighting(ctx.scene);
    ctx.scene.background = new THREE.Color(0x3a4a5a);

    const floor = createFloor(10, 16, 0x5a6a6a);
    ctx.scene.add(floor);
    ctx.scene.add(createCeiling(10, 16, 3.2));

    // Walls
    const backWall = createWall(10, 3.2, 0x5a6a7a);
    backWall.position.z = -8;
    ctx.scene.add(backWall);

    const leftWall = createWall(16, 3.2, 0x5a6a7a);
    leftWall.position.x = -5;
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.z = 0;
    ctx.scene.add(leftWall);

    const rightWall = createWall(16, 3.2, 0x5a6a7a);
    rightWall.position.x = 5;
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.z = 0;
    ctx.scene.add(rightWall);

    // Reception desk
    const desk = createBox(2.5, 1.0, 0.6, 0x5a4a3a, [0, 0.5, -5]);
    ctx.scene.add(desk);

    // Receptionist NPC — seated behind desk, facing player (+Z)
    const receptionist = createNPC({
      x: 0, z: -5.8,
      bodyColor: 0x4a5a6a,
      label: 'receptionist',
      seated: true,
      facingY: Math.PI, // faces toward player
      expression: 'bored',
    });
    ctx.scene.add(receptionist);
    // Chair for receptionist
    ctx.scene.add(createChair(0, -6.2, Math.PI));

    // Waiting chairs
    ctx.scene.add(createChair(-3, -3));
    ctx.scene.add(createChair(-3, -1.5));
    ctx.scene.add(createChair(-3, 0));

    // Coffee table
    const coffeeTable = createBox(0.6, 0.4, 0.6, 0x5a4a3a, [-1.5, 0.2, -1.5]);
    ctx.scene.add(coffeeTable);

    // Magazine on table
    const magazine = createTextSign(
      'Forbes: Top 10 Companies That Definitely Don\'t Exploit Interns',
      0.4, 0.3, '#aa8866', '#2a1a0a', 14
    );
    magazine.rotation.x = -Math.PI / 2;
    magazine.position.set(-1.5, 0.42, -1.5);
    ctx.scene.add(magazine);

    // Empty water cooler
    const cooler = createBox(0.3, 1.0, 0.3, 0x8a9aaa, [3.5, 0.5, -3]);
    ctx.scene.add(cooler);
    const coolerTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.3, 6),
      new THREE.MeshStandardMaterial({ color: 0xaabbcc, transparent: true, opacity: 0.3 })
    );
    coolerTop.position.set(3.5, 1.15, -3);
    ctx.scene.add(coolerTop);

    // Plants
    ctx.scene.add(createPlant(4, -6));
    ctx.scene.add(createPlant(-4, -6));

    // Reserved chair in dark corner
    const reservedChair = createChair(4, 2);
    ctx.scene.add(reservedChair);
    const reservedSign = createTextSign('RESERVED FOR CANDIDATES', 0.5, 0.15, '#3a3a3a', '#888', 16);
    reservedSign.position.set(4, 0.9, 2.3);
    ctx.scene.add(reservedSign);

    // Hallway sign
    const hallSign = createTextSign('CONFERENCE ROOMS →', 1.0, 0.3, '#2a3a4a', '#aabbcc', 20);
    hallSign.position.set(3, 2.5, -7.8);
    ctx.scene.add(hallSign);

    // Player start
    ctx.player.camera.position.set(0, 1.7, 5);
    ctx.player.enable();

    // Trigger: talk to receptionist
    ctx.triggers.add({
      id: 'receptionist',
      position: new THREE.Vector3(0, 1, -4),
      size: new THREE.Vector3(3, 3, 2),
      once: true,
      promptText: '[E] Talk',
    });

    // Trigger: hallway to next scene
    ctx.triggers.add({
      id: 'hallway',
      position: new THREE.Vector3(3.5, 1, -7.5),
      size: new THREE.Vector3(2, 3, 1),
      once: true,
      autoTrigger: true,
    });

    // Colliders
    ctx.player.setColliders([
      new THREE.Box3(new THREE.Vector3(-5.5, 0, -8.5), new THREE.Vector3(5.5, 4, -7.5)),
      new THREE.Box3(new THREE.Vector3(-5.5, 0, -8.5), new THREE.Vector3(-4.5, 4, 6)),
      new THREE.Box3(new THREE.Vector3(4.5, 0, -8.5), new THREE.Vector3(5.5, 4, 6)),
      new THREE.Box3(new THREE.Vector3(-5.5, 0, 5.5), new THREE.Vector3(5.5, 4, 6.5)),
      new THREE.Box3(new THREE.Vector3(-1.5, 0, -5.5), new THREE.Vector3(1.5, 1.2, -4.5)),
    ]);
  }

  update(_delta: number, _ctx: SceneContext) {}
  cleanup() {}
}
