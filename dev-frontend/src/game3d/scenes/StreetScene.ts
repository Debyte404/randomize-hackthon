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

    // Road lines
    for (let rz = -8; rz <= 8; rz += 4) {
      ctx.scene.add(createBox(0.15, 0.01, 1.5, 0xcccc88, [-10, 0.005, rz]));
    }

    // Building Main Structure
    const buildingColor = 0x6a6d73;
    const accentColor = 0x3a3c40;

    // Dark core (represents the deep interior behind the glass)
    const buildingCore = createBox(24, 45, 13.5, 0x111115, [0, 22.5, -15.65]);
    ctx.scene.add(buildingCore);

    // Floor Slabs (Horizontal structure)
    for (let wy = 0; wy <= 45; wy += 3.8) {
      ctx.scene.add(createBox(24.5, 0.6, 14.1, buildingColor, [0, wy, -15.35]));
    }

    // Vertical Fins/Pillars (Vertical brutalist structural grid)
    const finColor = 0x5a5d63; 
    for (let wx = -11.7; wx <= 11.7; wx += 2.6) {
      if (Math.abs(wx) < 1.5) continue;
      ctx.scene.add(createBox(1.0, 45.3, 14.4, finColor, [wx, 22.65, -15.2]));
      
      // If outermost left or right fin, add brutalist industrial structures to the blank sides
      if (wx <= -11.6) {
        // Left Fin Outer face (facing -X)
        for (let wy = 5; wy < 40; wy += 5) {
          ctx.scene.add(createBox(0.4, 3.5, 6, 0x222225, [-12.3, wy, -15.2])); // Giant vent box
          ctx.scene.add(createBox(0.1, 3.0, 5.5, 0x111111, [-12.5, wy, -15.2])); // Vent grill 
          // Danger stripe
          ctx.scene.add(createBox(0.45, 0.2, 6.1, 0x886611, [-12.3, wy - 1.6, -15.2]));
        }
        // Vertical huge pipe going all the way up
        ctx.scene.add(createBox(0.8, 45.3, 0.8, 0x1a1a1f, [-12.4, 22.65, -10.5]));
      } else if (wx >= 11.6) {
        // Right Fin Outer face (facing +X)
        for (let wy = 5; wy < 40; wy += 5) {
          ctx.scene.add(createBox(0.4, 3.5, 6, 0x222225, [12.3, wy, -15.2])); // Giant vent box
          ctx.scene.add(createBox(0.1, 3.0, 5.5, 0x111111, [12.5, wy, -15.2])); // Vent grill 
          // Danger stripe
          ctx.scene.add(createBox(0.45, 0.2, 6.1, 0x886611, [12.3, wy - 1.6, -15.2]));
        }
        // Vertical huge pipe going all the way up
        ctx.scene.add(createBox(0.8, 45.3, 0.8, 0x1a1a1f, [12.4, 22.65, -10.5]));
      }
    }
    for (let wx = -7.8; wx <= 7.8; wx += 2.6) {
      ctx.scene.add(createBox(1.0, 15, 10.4, finColor, [wx, 52.5, -15.2]));
    }
    ctx.scene.add(createBox(19, 0.8, 11, accentColor, [0, 60.4, -15.4])); // Top Roof ledge

    // Glass Panes (recessed deeply into the grid)
    for (let wx = -10.4; wx <= 10.4; wx += 2.6) {
      if (Math.abs(wx) < 1.5) continue;
      for (let wy = 1.9; wy < 44; wy += 3.8) {
        const win = createBox(1.6, 3.2, 0.1, 0x334455, [wx, wy, -8.75]);        
        const winMat = win.material as THREE.MeshStandardMaterial;
        
        const isLit = Math.random() > 0.6;
        if (isLit) {
          winMat.color = new THREE.Color(0xccbbaa);
          winMat.emissive = new THREE.Color(0x9a8b66);
          winMat.emissiveIntensity = 0.5; 
        } else {
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
    poster.position.set(-2.8, 1.6, -7.95);

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
    const car = createBox(1.8, 0.8, 3.5, 0x2a3a4a, [-8, 0.4, -2]);
    ctx.scene.add(car);
    // Car windows
    ctx.scene.add(createBox(1.6, 0.3, 1.5, 0x223344, [-8, 0.9, -2]));
    
    const car2 = createBox(1.8, 0.9, 3.8, 0x4a2a2a, [-8, 0.45, 3]);
    ctx.scene.add(car2);
    // Car2 windows
    ctx.scene.add(createBox(1.6, 0.35, 1.5, 0x332233, [-8, 1.0, 3]));
    
    // Concrete barriers / Sidewalk planters
    ctx.scene.add(createBox(5, 0.4, 0.6, 0x555555, [-3.5, 0.2, 0.5]));
    ctx.scene.add(createBox(5, 0.4, 0.6, 0x555555, [3.5, 0.2, 0.5]));
    ctx.scene.add(createBox(0.4, 0.6, 0.4, 0x444444, [-1, 0.5, 0.5]));
    ctx.scene.add(createBox(0.4, 0.6, 0.4, 0x444444, [1, 0.5, 0.5]));
    
    // --- DISTANT CITYSCAPE (Properly framed buildings in the fog) ---

    // === LEFT SIDE BUILDINGS (complete with window grids) ===
    // Building L1: Tall narrow tower
    const bldgL1 = createBox(8, 28, 8, 0x4a4d52, [-15, 14, -10]);
    ctx.scene.add(bldgL1);
    // L1 upper cap
    ctx.scene.add(createBox(8.4, 0.6, 8.4, 0x3a3c40, [-15, 28.3, -10]));
    // L1 window grid
    for (let wy = 2; wy < 27; wy += 3) {
      for (let wz = -13; wz <= -7; wz += 3) {
        const w = createBox(0.1, 2.0, 1.8, 0x0a0f15, [-11.01, wy, wz]);
        const wm = w.material as THREE.MeshStandardMaterial;
        if (Math.random() > 0.5) {
          wm.emissive = new THREE.Color(0x887755);
          wm.emissiveIntensity = 0.35;
        }
        ctx.scene.add(w);
      }
    }

    // L1 Massive Billboard / Wall Greebles (Breaking up the blank front face)
    const l1Billboard = createTextSign(
      'OBEY\nCONSUME\nPRODUCE',
      5.5, 8.0, '#100505', '#ff3333', 52
    );
    l1Billboard.position.set(-15, 16, -5.99); // Stick to the front facing Z
    // Make billboard glow
    const l1bMat = l1Billboard.material as THREE.MeshStandardMaterial;
    l1bMat.emissive = new THREE.Color(0x330000);
    l1bMat.emissiveIntensity = 0.8;
    ctx.scene.add(l1Billboard);

    // L1 Industrial AC Vents on the remaining blank wall
    for (let wy = 3; wy < 12; wy += 2.5) {
      const ventWrap = createBox(3, 1.5, 0.4, 0x222222, [-15, wy, -5.9]);
      const ventGrate = createBox(2.6, 1.1, 0.1, 0x111111, [-15, wy, -5.75]);
      ctx.scene.add(ventWrap);
      ctx.scene.add(ventGrate);
      // Warning stripes on vents
      ctx.scene.add(createBox(3.05, 0.2, 0.45, 0xaa8811, [-15, wy - 0.65, -5.9]));
    }

    // Building L2: Wide mid-height
    const bldgL2 = createBox(6, 35, 8, 0x42454a, [-18, 17.5, -2]);
    ctx.scene.add(bldgL2);
    ctx.scene.add(createBox(6.4, 0.6, 8.4, 0x3a3c40, [-18, 35.3, -2]));
    // L2 window grid (front face)
    for (let wy = 2; wy < 34; wy += 3) {
      for (let wz = -5; wz <= 1; wz += 3) {
        const w = createBox(0.1, 2.0, 1.8, 0x0a0f15, [-15.01, wy, wz]);
        const wm = w.material as THREE.MeshStandardMaterial;
        if (Math.random() > 0.6) {
          wm.emissive = new THREE.Color(0x998866);
          wm.emissiveIntensity = 0.3;
        }
        ctx.scene.add(w);
      }
    }

    // L2 Massive Front Wall Details (Pipes and Warning Signs)
    // Giant vertical exhaust pipes
    ctx.scene.add(createBox(0.6, 35, 0.6, 0x1a1a1f, [-19, 17.5, 2.1]));
    ctx.scene.add(createBox(0.6, 35, 0.6, 0x1a1a1f, [-17, 17.5, 2.1]));
    // Horizontal supports for pipes
    for (let wy = 5; wy < 35; wy += 5) {
      ctx.scene.add(createBox(4, 0.4, 0.4, 0x111111, [-18, wy, 2.05]));
    }
    // Neon vertical stripe down the middle of the pipes
    const neonStripe = createBox(0.1, 35, 0.1, 0x00ffff, [-18, 17.5, 2.15]);
    const neonMat = neonStripe.material as THREE.MeshStandardMaterial;
    neonMat.emissive = new THREE.Color(0x00bbff);
    neonMat.emissiveIntensity = 0.5;
    ctx.scene.add(neonStripe);

    // Building L3: Short wide behind the others
    ctx.scene.add(createBox(10, 15, 6, 0x3e4145, [-20, 7.5, -8]));
    ctx.scene.add(createBox(10.4, 0.5, 6.4, 0x363940, [-20, 15.25, -8]));

    // === RIGHT SIDE BUILDINGS (complete with proper framing) ===
    // Building R1: Large block
    const bldgR1 = createBox(12, 30, 10, 0x45484d, [15, 15, -8]);
    ctx.scene.add(bldgR1);
    ctx.scene.add(createBox(12.4, 0.6, 10.4, 0x3a3c40, [15, 30.3, -8]));
    // R1 window grid
    for (let wy = 2; wy < 29; wy += 3) {
      for (let wz = -12; wz <= -4; wz += 3) {
        const w = createBox(0.1, 2.0, 1.8, 0x0a0f15, [9.01, wy, wz]);
        const wm = w.material as THREE.MeshStandardMaterial;
        if (Math.random() > 0.55) {
          wm.emissive = new THREE.Color(0x887755);
          wm.emissiveIntensity = 0.3;
        }
        ctx.scene.add(w);
      }
    }

    // R1 Huge Cyberpunk Corporate Billboard
    const r1Billboard = createTextSign(
      '07:59 AM\nLATE\nDETECTED',
      8.0, 4.0, '#0a0a0a', '#ff9900', 48
    );
    r1Billboard.position.set(15, 20, -2.99); // Stick to the front facing Z
    const r1bMat = r1Billboard.material as THREE.MeshStandardMaterial;
    r1bMat.emissive = new THREE.Color(0xaa4400);
    r1bMat.emissiveIntensity = 0.6;
    ctx.scene.add(r1Billboard);

    // R1 Huge wall fan
    const fanBox = createBox(4, 4, 1, 0x222222, [15, 10, -2.9]);
    ctx.scene.add(fanBox);
    const fanGrill = createBox(3.4, 3.4, 0.2, 0x111111, [15, 10, -2.8]);
    ctx.scene.add(fanGrill);

    // Building R2: Shorter block
    const bldgR2 = createBox(8, 20, 8, 0x4a4d52, [12, 10, 4]);
    ctx.scene.add(bldgR2);
    ctx.scene.add(createBox(8.4, 0.5, 8.4, 0x3a3c40, [12, 20.25, 4]));
    // R2 window grid
    for (let wy = 2; wy < 19; wy += 3) {
      for (let wz = 1; wz <= 7; wz += 3) {
        const w = createBox(0.1, 2.0, 1.8, 0x0a0f15, [8.01, wy, wz]);
        const wm = w.material as THREE.MeshStandardMaterial;
        if (Math.random() > 0.6) {
          wm.emissive = new THREE.Color(0x998866);
          wm.emissiveIntensity = 0.25;
        }
        ctx.scene.add(w);
      }
    }

    // Building R3: Tall skinny tower (far right back)
    ctx.scene.add(createBox(5, 40, 5, 0x3a3d42, [20, 20, -12]));
    ctx.scene.add(createBox(5.4, 0.5, 5.4, 0x333636, [20, 40.25, -12]));

    // === FAR BACK BUILDINGS (skyline fill) ===
    const farBack = createBox(30, 22, 5, 0x4a4d52, [0, 11, 15]);
    ctx.scene.add(farBack);
    ctx.scene.add(createBox(30.4, 0.5, 5.4, 0x3a3c40, [0, 22.25, 15]));

    // Additional skyline filler (far back, varying heights)
    ctx.scene.add(createBox(8, 25, 4, 0x3e4145, [-10, 12.5, 18]));
    ctx.scene.add(createBox(6, 18, 4, 0x424548, [8, 9, 18]));
    ctx.scene.add(createBox(10, 30, 3, 0x3a3d42, [0, 15, 22]));

    // Street Lights
    for (const zOffset of [-4, 2, 8]) {
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

    // --- SIDEWALK DETAIL ---
    // Fire hydrant
    ctx.scene.add(createBox(0.2, 0.5, 0.2, 0xcc3333, [4.5, 0.25, 1.5]));
    ctx.scene.add(createBox(0.3, 0.08, 0.15, 0xcc3333, [4.5, 0.5, 1.5])); // cap

    // Newspaper box
    ctx.scene.add(createBox(0.4, 0.8, 0.3, 0x2244aa, [-3, 0.4, 2]));
    ctx.scene.add(createBox(0.38, 0.02, 0.28, 0x336699, [-3, 0.81, 2])); // top

    // Player start position
    ctx.player.camera.position.set(0, 1.7, 3);
    ctx.player.enable();

    // Door trigger
    ctx.triggers.add({
      id: 'door',
      position: new THREE.Vector3(0, 1, -7),
      size: new THREE.Vector3(2, 3, 1.5),
      once: true,
      autoTrigger: true,
    });

    // Colliders
    ctx.player.setColliders([
      new THREE.Box3(new THREE.Vector3(-5, 0, -8.5), new THREE.Vector3(5, 4, -7.5)),
      new THREE.Box3(new THREE.Vector3(-10, 0, -15), new THREE.Vector3(-6, 4, 10)),
      new THREE.Box3(new THREE.Vector3(6, 0, -15), new THREE.Vector3(10, 4, 10)),
      new THREE.Box3(new THREE.Vector3(-10, 0, 7), new THREE.Vector3(10, 4, 10)),
      new THREE.Box3(new THREE.Vector3(-6, 0, 0), new THREE.Vector3(-1, 1, 1)),
      new THREE.Box3(new THREE.Vector3(1, 0, 0), new THREE.Vector3(6, 1, 1)),
    ]);
  }

  update(_delta: number, _ctx: SceneContext) {
    // Nothing dynamic in this scene
  }

  cleanup() {}
}
