import * as THREE from 'three';
import type { GameScene, SceneContext } from '../engine/SceneManager';
import {
  createFloor, createBox, createTextSign, addLighting, createPlant,
} from './SceneHelpers';

export class StreetScene implements GameScene {
  name = 'street';

  setup(ctx: SceneContext) {
    addLighting(ctx.scene);

    // Sky color
    ctx.scene.background = new THREE.Color(0x7a9abb);
    ctx.scene.fog = new THREE.Fog(0x7a9abb, 15, 40);

    // Sidewalk
    const sidewalk = createFloor(12, 20, 0x8a8a7a);
    ctx.scene.add(sidewalk);

    // Road (darker)
    const road = createFloor(8, 20, 0x3a3a3a);
    road.position.set(-10, -0.01, 0);
    ctx.scene.add(road);

    // Building facade
    const facade = createBox(10, 6, 0.3, 0x4a5a6a, [0, 3, -8]);
    ctx.scene.add(facade);

    // Windows on facade
    for (let wx = -3; wx <= 3; wx += 2) {
      for (let wy = 2; wy <= 5; wy += 1.5) {
        const win = createBox(0.8, 1.0, 0.05, 0x6a8aaa, [wx, wy, -7.8]);
        (win.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x334455);
        (win.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
        ctx.scene.add(win);
      }
    }

    // Glass door
    const door = createBox(1.6, 2.5, 0.08, 0x88aabb, [0, 1.25, -7.85]);
    const doorMat = door.material as THREE.MeshStandardMaterial;
    doorMat.transparent = true;
    doorMat.opacity = 0.4;
    doorMat.metalness = 0.3;
    ctx.scene.add(door);

    // Company sign
    const sign = createTextSign(
      'NEXUS CORP — Building Futures, One Sprint at a Time',
      4, 0.6, '#2a3a4a', '#c8d8e4', 28
    );
    sign.position.set(0, 4.5, -7.7);
    ctx.scene.add(sign);

    // Hiring poster
    const poster = createTextSign(
      'NOW HIRING: INTERNS — No Experience Needed (But You\'ll Get Plenty)',
      1.5, 1.0, '#4a3a2a', '#e8d8c8', 20
    );
    poster.position.set(-3.5, 1.5, -7.7);
    ctx.scene.add(poster);

    // Trash can with resumes
    const trashCan = createBox(0.4, 0.6, 0.4, 0x3a3a3a, [2.5, 0.3, -7]);
    ctx.scene.add(trashCan);
    // "Resumes" poking out
    for (let i = 0; i < 5; i++) {
      const paper = createBox(0.2, 0.01, 0.15, 0xeeeedd,
        [2.5 + (Math.random() - 0.5) * 0.3, 0.6 + i * 0.02, -7 + (Math.random() - 0.5) * 0.3]);
      paper.rotation.z = (Math.random() - 0.5) * 0.5;
      ctx.scene.add(paper);
    }

    // A tree
    const treeTrunk = createBox(0.2, 2, 0.2, 0x5a4a3a, [-4, 1, -4]);
    ctx.scene.add(treeTrunk);
    const treeTop = new THREE.Mesh(
      new THREE.SphereGeometry(1, 6, 4),
      new THREE.MeshStandardMaterial({ color: 0x4a7a3a })
    );
    treeTop.position.set(-4, 2.8, -4);
    ctx.scene.add(treeTop);

    // Plant near entrance
    ctx.scene.add(createPlant(1.8, -7));

    // Parked car (box approximation)
    const car = createBox(1.8, 0.8, 3.5, 0x4a4a5a, [-8, 0.4, -2]);
    ctx.scene.add(car);

    // Player start position
    ctx.player.camera.position.set(0, 1.7, 3);
    ctx.player.enable();

    // Door trigger — auto trigger when walking close
    ctx.triggers.add({
      id: 'door',
      position: new THREE.Vector3(0, 1, -7),
      size: new THREE.Vector3(2, 3, 1.5),
      once: true,
      autoTrigger: true,
    });

    // Colliders (walls)
    ctx.player.setColliders([
      new THREE.Box3(new THREE.Vector3(-5, 0, -8.5), new THREE.Vector3(5, 4, -7.5)), // building wall
      new THREE.Box3(new THREE.Vector3(-6, 0, -10), new THREE.Vector3(-5, 4, 5)),     // left boundary
      new THREE.Box3(new THREE.Vector3(5, 0, -10), new THREE.Vector3(6, 4, 5)),       // right boundary
      new THREE.Box3(new THREE.Vector3(-6, 0, 4), new THREE.Vector3(6, 4, 5)),        // back boundary
    ]);
  }

  update(_delta: number, _ctx: SceneContext) {
    // Nothing dynamic in this scene
  }

  cleanup() {}
}
