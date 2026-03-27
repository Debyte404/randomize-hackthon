import * as THREE from 'three';
import type { GameScene, SceneContext } from '../engine/SceneManager';
import {
  createFloor, createBox, createTextSign, addLighting, createPlant,
} from './SceneHelpers';

export class StreetScene implements GameScene {
  name = 'street';

  setup(ctx: SceneContext) {
    addLighting(ctx.scene);

    // Sky color (Gloomy Corporate Overcast)
    ctx.scene.background = new THREE.Color(0xb0b5c0);
    ctx.scene.fog = new THREE.Fog(0xb0b5c0, 15, 40);

    // Sidewalk
    const sidewalk = createFloor(12, 20, 0x828480);
    ctx.scene.add(sidewalk);

    // Road (darker)
    const road = createFloor(8, 20, 0x3a3a3a);
    road.position.set(-10, -0.01, 0);
    ctx.scene.add(road);

// Building Main Structure
    const buildingColor = 0x6a6d73;
    const accentColor = 0x3a3c40;

    // Dark core (represents the deep interior behind the glass)
    const buildingCore = createBox(24, 45, 13.5, 0x111115, [0, 22.5, -15.65]); // front face at z = -8.9
    ctx.scene.add(buildingCore);

    // Floor Slabs (Horizontal structure)
    for (let wy = 0; wy <= 45; wy += 3.8) {
      // Slabs protrude outward slightly to z = -8.3
      ctx.scene.add(createBox(24.5, 0.6, 14.1, buildingColor, [0, wy, -15.35]));
    }

    // Vertical Fins/Pillars (Vertical brutalist structural grid)
    const finColor = 0x5a5d63; 
    for (let wx = -11.7; wx <= 11.7; wx += 2.6) {
      if (Math.abs(wx) < 1.5) continue; // Skip entrance void at x=0
      // Fins stick out further than slabs to z = -8.0
      ctx.scene.add(createBox(1.0, 45.3, 14.4, finColor, [wx, 22.65, -15.2]));
    }

    // Upper tier (Penthouse / Top blocks)
    ctx.scene.add(createBox(18, 15, 10, buildingColor, [0, 52.5, -15.4]));
    for (let wx = -7.8; wx <= 7.8; wx += 2.6) {
      ctx.scene.add(createBox(1.0, 15, 10.4, finColor, [wx, 52.5, -15.2]));
    }
    ctx.scene.add(createBox(19, 0.8, 11, accentColor, [0, 60.4, -15.4])); // Top Roof ledge

    // Glass Panes (recessed deeply into the grid)
    for (let wx = -10.4; wx <= 10.4; wx += 2.6) {
      if (Math.abs(wx) < 1.5) continue; // Skip center column above entrance
      for (let wy = 1.9; wy < 44; wy += 3.8) {
        // Positioned at z = -8.8 (set deep inside behind the front fins and slabs)
        const win = createBox(1.6, 3.2, 0.1, 0x334455, [wx, wy, -8.75]);        
        const winMat = win.material as THREE.MeshStandardMaterial;
        
        // Soft gradient office lights
        const isLit = Math.random() > 0.6;
        if (isLit) {
          // Warm yellowish office lighting
          winMat.color = new THREE.Color(0xccbbaa);
          winMat.emissive = new THREE.Color(0x9a8b66);
          winMat.emissiveIntensity = 0.5; 
        } else {
          // Dark empty offices
          winMat.color = new THREE.Color(0x0a0f12);
          winMat.emissive = new THREE.Color(0x000000);
        }
        winMat.roughness = 0.1;
        winMat.metalness = 0.9;
        ctx.scene.add(win);
      }
    }

    // --- GRAND ENTRANCE ---
    // Monumental steps
    ctx.scene.add(createBox(8, 0.2, 3, accentColor, [0, 0.1, -7.0]));
    ctx.scene.add(createBox(6, 0.2, 2, accentColor, [0, 0.3, -7.5]));

    // Imposing Entrance Awning
    ctx.scene.add(createBox(6, 0.6, 4.0, accentColor, [0, 3.8, -7.0]));
    // Awning supports
    ctx.scene.add(createBox(0.8, 3.8, 0.8, 0x333333, [-2.6, 1.9, -5.8]));
    ctx.scene.add(createBox(0.8, 3.8, 0.8, 0x333333, [2.6, 1.9, -5.8]));

    // Entrance wall inset (Dark Void)
    ctx.scene.add(createBox(4.4, 3.4, 0.5, 0x111111, [0, 1.7, -8.3]));

    // Massive Glass double doors
    const door = createBox(3.4, 3.0, 0.08, 0x88aabb, [0, 1.8, -8.0]);
    const doorMat = door.material as THREE.MeshStandardMaterial;
    doorMat.transparent = true;
    doorMat.opacity = 0.3;
    doorMat.metalness = 0.8;
    ctx.scene.add(door);
    // Door frame & center divider
    ctx.scene.add(createBox(3.6, 3.2, 0.1, accentColor, [0, 1.9, -8.05]));
    ctx.scene.add(createBox(0.2, 3.0, 0.1, accentColor, [0, 1.8, -7.95]));

// Company sign (mounted on front lip of awning)
    const sign = createTextSign(
      'NEXUS CORP',
      5.8, 1.2, '#111111', '#e0e0e0', 64
    );
    sign.position.set(0, 4.2, -4.95);
    ctx.scene.add(sign);

    // Sub-sign
    const subSign = createTextSign(
      'Building Futures, One Sprint at a Time',
      5.8, 0.4, '#111111', '#a0a0a0', 24
    );
    subSign.position.set(0, 3.8, -4.95);
    ctx.scene.add(subSign);

    // Hiring poster
    const poster = createTextSign(
      'NOW HIRING: INTERNS — No Experience Needed (But You\'ll Get Plenty)',
      2.0, 1.2, '#aa3333', '#e8d8c8', 24
    );
    poster.position.set(-2.8, 1.6, -7.95); // Moved nearer the door, between pillars
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
      new THREE.SphereGeometry(1.2, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0x3a5a2a })
    );
    treeTop.position.set(-4, 2.8, -4);
    ctx.scene.add(treeTop);

    // Another tree
    ctx.scene.add(createBox(0.2, 2, 0.2, 0x5a4a3a, [5, 1, -3]));
    const treeTop2 = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0x3a5a2a })
    );
    treeTop2.position.set(5, 3.0, -3);
    treeTop2.rotation.y = Math.PI / 4;
    ctx.scene.add(treeTop2);

    // Plant near entrance
    ctx.scene.add(createPlant(1.8, -7));

    // Parked cars
    const car = createBox(1.8, 0.8, 3.5, 0x2a3a4a, [-8, 0.4, -2]); // Dark blue car
    ctx.scene.add(car);
    const car2 = createBox(1.8, 0.9, 3.8, 0x4a2a2a, [-8, 0.45, 3]); // Dark red car
    ctx.scene.add(car2);
    
    // Concrete barriers / Sidewalk planters (with a central gap for the player to walk through)
    ctx.scene.add(createBox(5, 0.4, 0.6, 0x555555, [-3.5, 0.2, 0.5])); // left barrier
    ctx.scene.add(createBox(5, 0.4, 0.6, 0x555555, [3.5, 0.2, 0.5])); // right barrier
    ctx.scene.add(createBox(0.4, 0.6, 0.4, 0x444444, [-1, 0.5, 0.5])); // left post
    ctx.scene.add(createBox(0.4, 0.6, 0.4, 0x444444, [1, 0.5, 0.5]));  // right post
    
    // Distant Cityscape (Silhouette buildings in the fog)
    // Left side block
    ctx.scene.add(createBox(8, 20, 8, 0x4a4d52, [-15, 10, -10]));
    ctx.scene.add(createBox(6, 30, 8, 0x42454a, [-18, 15, -2]));
    // Right side block
    ctx.scene.add(createBox(12, 25, 10, 0x45484d, [15, 12.5, -8]));
    ctx.scene.add(createBox(8, 15, 8, 0x4a4d52, [12, 7.5, 4]));
    // Far back block
    ctx.scene.add(createBox(30, 18, 5, 0x4a4d52, [0, 9, 15]));

    // Street Lights
    for (let zOffset of [-4, 2, 8]) {
      const pole = createBox(0.1, 4, 0.1, 0x222222, [-6, 2, zOffset]);
      const reach = createBox(1.2, 0.1, 0.1, 0x222222, [-6.6, 4, zOffset]);
      const lamp = createBox(0.3, 0.1, 0.2, 0xddddaa, [-7.1, 3.95, zOffset]);
      
      const pLight = new THREE.PointLight(0xffddaa, 0.8, 10);
      pLight.position.set(-7.1, 3.5, zOffset);
      ctx.scene.add(pLight);
      
      ctx.scene.add(pole);
      ctx.scene.add(reach);
      ctx.scene.add(lamp);
    }

    // Bus stop shelter
    ctx.scene.add(createBox(3, 0.1, 1.5, 0x333333, [3, 2.5, 4])); // roof
    ctx.scene.add(createBox(0.1, 2.5, 0.1, 0x555555, [1.6, 1.25, 3.3])); // pole FL
    ctx.scene.add(createBox(0.1, 2.5, 0.1, 0x555555, [4.4, 1.25, 3.3])); // pole FR
    ctx.scene.add(createBox(3, 2.5, 0.1, 0x223344, [3, 1.25, 4.7])); // back wall (glass/dark)
    ctx.scene.add(createBox(2, 0.1, 0.6, 0x664422, [3, 0.5, 4.3])); // bench

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

    // Colliders (walls) updated to include new planters and stop player leaving
    ctx.player.setColliders([
      new THREE.Box3(new THREE.Vector3(-5, 0, -8.5), new THREE.Vector3(5, 4, -7.5)), // building wall
      new THREE.Box3(new THREE.Vector3(-10, 0, -15), new THREE.Vector3(-6, 4, 10)),  // left boundary (street/cars)
      new THREE.Box3(new THREE.Vector3(6, 0, -15), new THREE.Vector3(10, 4, 10)),    // right boundary
      new THREE.Box3(new THREE.Vector3(-10, 0, 7), new THREE.Vector3(10, 4, 10)),    // back boundary
      new THREE.Box3(new THREE.Vector3(-6, 0, 0), new THREE.Vector3(-1, 1, 1)),      // left planters (gap in middle)
      new THREE.Box3(new THREE.Vector3(1, 0, 0), new THREE.Vector3(6, 1, 1)),        // right planters (gap in middle)
    ]);
  }

  update(_delta: number, _ctx: SceneContext) {
    // Nothing dynamic in this scene
  }

  cleanup() {}
}

