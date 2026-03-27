import * as THREE from 'three';
import type { GameScene, SceneContext } from '../engine/SceneManager';
import {
  createWall, createBox, createNPC,
  createTextSign, addLighting, createCeiling,
} from './SceneHelpers';

export class LobbyScene implements GameScene {
  name = 'lobby';
  private dustParticles: THREE.Points | null = null;
  private elapsedTime = 0;
  private slowTick = 0;

  setup(ctx: SceneContext) {
    this.elapsedTime = 0;
    addLighting(ctx.scene);
    ctx.scene.background = new THREE.Color(0x1a1e24);

    // Floor — polished dark marble with high specular
    const floorGeo = new THREE.PlaneGeometry(26, 26);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111215,
      roughness: 0.1,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    ctx.scene.add(floor);

    // Massive Atrium Ceiling (slightly oversized to prevent edge gaps)
    ctx.scene.add(createCeiling(26, 26, 8.0, 0xd8d8d8));

    // --- CEILING DETAIL: Fluorescent light strips ---
    for (let lz = -9; lz <= 9; lz += 6) {
      // Light fixture box (recessed panel look)
      const fixtureGeo = new THREE.BoxGeometry(1.2, 0.06, 0.2);
      const fixtureMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xeeeeff,
        emissiveIntensity: 1.5,
      });
      const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.set(-4, 7.96, lz);
      ctx.scene.add(fixture);

      const fixture2 = fixture.clone();
      fixture2.position.set(4, 7.96, lz);
      ctx.scene.add(fixture2);

      // Subtle point lights under each fixture
      // (removed for performance)
    }

    // --- ARCHITECTURE: SOLID ENCLOSURE ---

    const wallColor = 0xc0c4c8;
    const trimColor = 0x9a9ea2;

    // ======= BACK WALL (Focal point behind reception) =======
    const backWall = createWall(24, 8.0, 0x22252a);
    backWall.position.z = -12;
    ctx.scene.add(backWall);

    // ======= FRONT WALL (entrance side, with door opening) =======
    // Left portion of front wall
    const frontWallLeft = createBox(7, 8, 0.15, wallColor, [-6.5, 4, 12]);
    ctx.scene.add(frontWallLeft);
    // Right portion of front wall
    const frontWallRight = createBox(7, 8, 0.15, wallColor, [6.5, 4, 12]);
    ctx.scene.add(frontWallRight);
    // Top portion above door
    const frontWallTop = createBox(10, 4.5, 0.15, wallColor, [0, 5.75, 12]);
    ctx.scene.add(frontWallTop);
    // Glass entrance doors (transparent)
    const entranceDoor = createBox(3.5, 3.2, 0.08, 0x88aabb, [0, 1.6, 12]);
    const entranceDoorMat = entranceDoor.material as THREE.MeshStandardMaterial;
    entranceDoorMat.transparent = true;
    entranceDoorMat.opacity = 0.15;
    entranceDoorMat.metalness = 0.9;
    ctx.scene.add(entranceDoor);
    // Door frame
    ctx.scene.add(createBox(3.7, 3.4, 0.12, 0x333333, [0, 1.7, 12]));
    ctx.scene.add(createBox(0.1, 3.2, 0.12, 0x333333, [0, 1.6, 12])); // center divider

    // ======= LEFT WALL (solid, with elevator bank) =======
    const leftWall = createWall(24, 8.0, wallColor);
    leftWall.position.x = -10;
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.z = 0;
    ctx.scene.add(leftWall);

    // Left wall baseboard trim
    ctx.scene.add(createBox(0.15, 0.3, 24, trimColor, [-9.85, 0.15, 0]));

    // Left wall crown molding
    ctx.scene.add(createBox(0.3, 0.2, 24, trimColor, [-9.8, 7.9, 0]));

    // ======= RIGHT WALL (Glass curtain wall with proper framing) =======
    // Solid base (0 to 1m)
    const rightWallBottom = createBox(0.15, 1.0, 24, wallColor, [10, 0.5, 0]);
    ctx.scene.add(rightWallBottom);

    // Solid header band (6.5 to 8m)
    const rightWallTop = createBox(0.15, 1.5, 24, wallColor, [10, 7.25, 0]);
    ctx.scene.add(rightWallTop);

    // Horizontal spandrel at mid-height for structural feel
    ctx.scene.add(createBox(0.15, 0.3, 24, 0x444444, [10, 3.75, 0]));

    // Vertical mullions (full height, creating the window grid)
    for (let i = -10; i <= 10; i += 4) {
      ctx.scene.add(createBox(0.4, 8, 0.4, 0x333333, [9.8, 4, i]));
    }

    // Glass panes filling the window openings
    for (let i = -10; i <= 10; i += 4) {
      // Lower window pane (1m to 3.6m)
      const lowerGlass = createBox(0.05, 2.5, 3.6, 0x334455, [10, 2.25, i + 0.2]);
      const lgMat = lowerGlass.material as THREE.MeshStandardMaterial;
      lgMat.transparent = true;
      lgMat.opacity = 0.15;
      lgMat.metalness = 0.9;
      lgMat.roughness = 0.05;
      ctx.scene.add(lowerGlass);

      // Upper window pane (3.9m to 6.4m)
      const upperGlass = createBox(0.05, 2.5, 3.6, 0x334455, [10, 5.15, i + 0.2]);
      const ugMat = upperGlass.material as THREE.MeshStandardMaterial;
      ugMat.transparent = true;
      ugMat.opacity = 0.15;
      ugMat.metalness = 0.9;
      ugMat.roughness = 0.05;
      ctx.scene.add(upperGlass);
    }

    // Right wall baseboard trim  
    ctx.scene.add(createBox(0.15, 0.3, 24, trimColor, [9.85, 0.15, 0]));

    // Right wall crown molding
    ctx.scene.add(createBox(0.3, 0.2, 24, trimColor, [9.8, 7.9, 0]));

    // Back wall baseboard
    ctx.scene.add(createBox(24, 0.3, 0.15, trimColor, [0, 0.15, -11.85]));

    // Back wall crown molding
    ctx.scene.add(createBox(24, 0.2, 0.3, trimColor, [0, 7.9, -11.8]));

    // ======= EXTERIOR BUILDINGS (visible through right-side windows) =======
    // These sit outside the right wall, giving the sense of a cityscape

    // Nearby building (close, tall)
    const extBldg1 = createBox(8, 30, 6, 0x2a2d32, [18, 15, -4]);
    ctx.scene.add(extBldg1);
    // Window grid on nearby building
    for (let wy = 2; wy < 28; wy += 3) {
      for (let wz = -6; wz <= -2; wz += 2) {
        const extWin = createBox(0.1, 2.0, 1.2, 0x0a0f15, [13.96, wy, wz]);
        const extWinMat = extWin.material as THREE.MeshStandardMaterial;
        if (Math.random() > 0.5) {
          extWinMat.emissive = new THREE.Color(0x998866);
          extWinMat.emissiveIntensity = 0.3;
        }
        ctx.scene.add(extWin);
      }
    }

    // Mid-distance building
    const extBldg2 = createBox(10, 22, 8, 0x353840, [22, 11, 4]);
    ctx.scene.add(extBldg2);

    // Far building (shorter)
    const extBldg3 = createBox(6, 15, 5, 0x3a3d42, [16, 7.5, 8]);
    ctx.scene.add(extBldg3);
    
    // Tall skinny tower in the distance 
    const extBldg4 = createBox(4, 40, 4, 0x25282d, [25, 20, -8]);
    ctx.scene.add(extBldg4);

    // Another mid-range building
    const extBldg5 = createBox(7, 18, 6, 0x2e3136, [20, 9, -10]);
    ctx.scene.add(extBldg5);

    // ======= EXTERIOR BUILDINGS (visible behind - through any gaps above back wall) =======
    ctx.scene.add(createBox(30, 35, 5, 0x1e2126, [0, 17.5, -18]));
    ctx.scene.add(createBox(20, 25, 4, 0x252830, [-8, 12.5, -16]));

    // ======= CORNER SEAM COVERS (hide any gaps at wall intersections) =======
    // Back-left corner
    ctx.scene.add(createBox(0.5, 8, 0.5, 0x22252a, [-10, 4, -12]));
    // Back-right corner
    ctx.scene.add(createBox(0.5, 8, 0.5, 0x22252a, [10, 4, -12]));
    // Front-left corner
    ctx.scene.add(createBox(0.5, 8, 0.5, wallColor, [-10, 4, 12]));
    // Front-right corner
    ctx.scene.add(createBox(0.5, 8, 0.5, wallColor, [10, 4, 12]));

    // Monolithic Corporate Pillars
    for (const pz of [-8, -2, 4, 10]) {
      ctx.scene.add(createBox(1.5, 8, 1.5, 0x4a4d52, [-6, 4, pz]));
      ctx.scene.add(createBox(1.5, 8, 1.5, 0x4a4d52, [6, 4, pz]));

      // Capital detail at top of each pillar
      ctx.scene.add(createBox(1.7, 0.15, 1.7, 0x555860, [-6, 7.92, pz]));
      ctx.scene.add(createBox(1.7, 0.15, 1.7, 0x555860, [6, 7.92, pz]));

      // Base detail at bottom of each pillar
      ctx.scene.add(createBox(1.7, 0.15, 1.7, 0x3a3d42, [-6, 0.08, pz]));
      ctx.scene.add(createBox(1.7, 0.15, 1.7, 0x3a3d42, [6, 0.08, pz]));
    }

    // --- RECEPTION AREA ---

    // Mega-desk base (curved look using multiple boxes)
    ctx.scene.add(createBox(6.0, 1.1, 0.8, 0x2a2d34, [0, 0.55, -8]));
    const rightDesk = createBox(2.0, 1.1, 0.8, 0x2a2d34, [-3.4, 0.55, -7.6]);
    rightDesk.rotation.y = Math.PI/6;
    ctx.scene.add(rightDesk);
    const leftDesk = createBox(2.0, 1.1, 0.8, 0x2a2d34, [3.4, 0.55, -7.6]);
    leftDesk.rotation.y = -Math.PI/6;
    ctx.scene.add(leftDesk);

    // Sleek black granite counter top
    const deskTopMat = new THREE.MeshStandardMaterial({color: 0x111111, roughness: 0.1});
    const deskTop = new THREE.BoxGeometry(6.2, 0.1, 1.0);
    const dtMesh = new THREE.Mesh(deskTop, deskTopMat);
    dtMesh.position.set(0, 1.15, -8);
    ctx.scene.add(dtMesh);

    // Giant Corporate Wall Logo behind desk
    const logoMesh1 = createBox(0.8, 4.0, 0.2, 0x111111, [-2.5, 4.5, -11.8]);
    const logoMesh2 = createBox(0.8, 4.0, 0.2, 0x111111, [2.5, 4.5, -11.8]);
    const logoMesh3 = createBox(5.0, 0.8, 0.2, 0x111111, [0, 6.1, -11.8]);
    const logoMesh4 = createBox(5.0, 0.8, 0.2, 0x111111, [0, 2.9, -11.8]);
    ctx.scene.add(logoMesh1); ctx.scene.add(logoMesh2); ctx.scene.add(logoMesh3); ctx.scene.add(logoMesh4);

    const logoInner = createBox(3.4, 2.4, 0.15, 0xffffff, [0, 4.5, -11.85]);
    const logoMat = logoInner.material as THREE.MeshStandardMaterial;
    logoMat.emissive = new THREE.Color(0x3388ff);
    logoMat.emissiveIntensity = 1.0;
    ctx.scene.add(logoInner);

    // Spotlight on logo
    const logoSpot = new THREE.SpotLight(0x4488ff, 15, 10, Math.PI / 5, 0.6, 1);
    logoSpot.position.set(0, 7.5, -9);
    logoSpot.target.position.set(0, 4.5, -11.85);
    ctx.scene.add(logoSpot);
    ctx.scene.add(logoSpot.target);

    const corpText = createTextSign('N E X U S   C O R P', 7.0, 1.0, '#11151a', '#e0e0e0', 48);
    corpText.position.set(0, 1.5, -11.8);
    ctx.scene.add(corpText);

    // Receptionist NPC (now behind the grand desk)
    const receptionist = createNPC(0, -9.5, 0x4a5a6a, 'receptionist');
    receptionist.position.y = 0.35; // Lift up behind the tall desk
    receptionist.scale.set(1.1, 1.1, 1.1); // Make slightly larger
    ctx.scene.add(receptionist);

    // Add seating area in the massive atrium
    const createCouch = (x: number, z: number, rotationY: number) => {
      const group = new THREE.Group();
      
      // Base
      const base = createBox(2.2, 0.2, 0.8, 0x111111, [0, 0.1, 0]);
      group.add(base);
      
      // Cushions
      const cushion1 = createBox(1.0, 0.3, 0.7, 0x222222, [-0.55, 0.35, 0]);
      const cushion2 = createBox(1.0, 0.3, 0.7, 0x222222, [0.55, 0.35, 0]);
      group.add(cushion1);
      group.add(cushion2);
      
      // Backrest
      const backrest = createBox(2.2, 0.6, 0.2, 0x222222, [0, 0.6, -0.3]);
      group.add(backrest);

      group.position.set(x, 0, z);
      group.rotation.y = rotationY;
      return group;
    };

    ctx.scene.add(createCouch(-6, 2, Math.PI / 2));
    ctx.scene.add(createCouch(-4, 0, 0));
    ctx.scene.add(createCouch(6, 2, -Math.PI / 2));
    ctx.scene.add(createCouch(4, 0, 0));

    // A monolithic coffee table
    const bigCoffeeTable = createBox(2.0, 0.4, 1.2, 0x0a0a0a, [0, 0.2, 1]);
    ctx.scene.add(bigCoffeeTable);

    // Expensive minimalist planters
    const createLuxPlant = (x: number, z: number) => {
      const group = new THREE.Group();
      const pot = createBox(0.8, 1.0, 0.8, 0x1a1a1a, [0, 0.5, 0]);
      group.add(pot);
      
      const plant = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.6),
        new THREE.MeshStandardMaterial({ color: 0x1a3a1a, flatShading: true })
      );
      plant.position.set(0, 1.5, 0);
      group.add(plant);
      
      group.position.set(x, 0, z);
      return group;
    };

    ctx.scene.add(createLuxPlant(-8, -10)); // Left corner plant
    ctx.scene.add(createLuxPlant(8, 10));   // Right corner plant (symmetry)
    
    // --- ELEVATOR BANK (Right corner) ---
    const elevatorDoors = createBox(3.0, 3.2, 0.1, 0x8899aa, [7, 1.6, -11.9]);
    const elevatorMat = elevatorDoors.material as THREE.MeshStandardMaterial;
    elevatorMat.metalness = 0.9;
    elevatorMat.roughness = 0.2;
    ctx.scene.add(elevatorDoors);
    
    // Center divider
    ctx.scene.add(createBox(0.1, 3.2, 0.15, 0x333333, [7, 1.6, -11.85]));
    // Door frames
    ctx.scene.add(createBox(3.4, 3.4, 0.2, 0x222222, [7, 1.7, -11.95]));

    // Glowing directional sign above elevator
    const elevatorSign = createTextSign('INTERVIEWS ↓', 3.0, 0.6, '#111111', '#ffaa00', 32);
    elevatorSign.position.set(7, 4.2, -11.9);
    const signMat = elevatorSign.material as THREE.MeshStandardMaterial;
    signMat.emissive = new THREE.Color(0xffaa00);
    signMat.emissiveIntensity = 0.4;
    ctx.scene.add(elevatorSign);

    // Light on the floor in front of elevator to draw attention
    const elevatorSpot = new THREE.SpotLight(0xffddaa, 40, 15, Math.PI / 6, 0.5, 1);
    elevatorSpot.position.set(7, 6, -9.5);
    elevatorSpot.target.position.set(7, 0, -11.5);
    ctx.scene.add(elevatorSpot);
    ctx.scene.add(elevatorSpot.target);

    // Red waiting mat in front of elevator
    ctx.scene.add(createBox(3.4, 0.05, 2.4, 0x551111, [7, 0.03, -10.6]));

    // Freestanding sign post near entrance
    const guideSign = createTextSign('CONFERENCE ROOMS\nElevator Bank East →', 2.2, 1.0, '#1a2a3a', '#e0e0e0', 24);
    guideSign.position.set(2, 1.6, 1);
    guideSign.rotation.y = -Math.PI / 6;
    const guideMat = guideSign.material as THREE.MeshStandardMaterial;
    guideMat.emissive = new THREE.Color(0xaabbcc);
    guideMat.emissiveIntensity = 0.2;
    ctx.scene.add(guideSign);
    // Post
    ctx.scene.add(createBox(0.1, 1.6, 0.1, 0x333333, [2, 0.8, 0.95]));
    ctx.scene.add(createBox(0.8, 0.1, 0.8, 0x222222, [2, 0.05, 0.95])); // Base

    // --- CORE VALUES TV (Left wall) ---
    const tvScreen = createBox(2.0, 1.2, 0.05, 0x000000, [-9.85, 3.5, 5]);
    ctx.scene.add(tvScreen);
    // TV frame
    ctx.scene.add(createBox(2.2, 1.4, 0.08, 0x222222, [-9.85, 3.5, 5]));
    // TV content (emissive text sign)
    const tvContent = createTextSign('INNOVATION\nINTEGRITY\nIMPACT', 1.8, 1.0, '#0a0a1a', '#4488cc', 28);
    tvContent.position.set(-9.82, 3.5, 5);
    const tvMat = tvContent.material as THREE.MeshStandardMaterial;
    tvMat.emissive = new THREE.Color(0x2244aa);
    tvMat.emissiveIntensity = 0.6;
    ctx.scene.add(tvContent);

    // --- WATER COOLER (Left wall, near back) ---
    // Main body
    ctx.scene.add(createBox(0.4, 1.0, 0.3, 0xcccccc, [-9, 0.5, -5]));
    // Water jug (on top)
    const jug = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.15, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.3 })
    );
    jug.position.set(-9, 1.2, -5);
    ctx.scene.add(jug);
    // Sign: "Out of Water" 
    const waterSign = createTextSign('OUT OF\nWATER', 0.5, 0.3, '#ffffff', '#cc3333', 16);
    waterSign.position.set(-9, 0.7, -4.83);
    ctx.scene.add(waterSign);

    // --- FLOOR DETAIL: Reception area rug/mat ---
    ctx.scene.add(createBox(8, 0.02, 4, 0x1a1520, [0, 0.01, -7]));

    // Dust particles removed for performance
    /*
    {
      const count = 40;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 6; // x
        positions[i * 3 + 1] = Math.random() * 7;      // y
        positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 5; // z
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));    
      const mat = new THREE.PointsMaterial({
        color: 0xffffee,
        size: 0.05,
        transparent: true,
        opacity: 0.3,
      });
      this.dustParticles = new THREE.Points(geo, mat);
      ctx.scene.add(this.dustParticles);
    }
    */

    // Player start (centered at doors)
    ctx.player.camera.position.set(0, 1.7, 8);
    ctx.player.enable();

    // Trigger: talk to receptionist
    ctx.triggers.add({
      id: 'receptionist',
      position: new THREE.Vector3(0, 1, -7),
      size: new THREE.Vector3(4, 3, 2),
      once: true,
      promptText: '[E] Request Access',
    });

    // Trigger: hallway (elevator) to next scene
    ctx.triggers.add({
      id: 'hallway',
      position: new THREE.Vector3(7, 1, -11.5),
      size: new THREE.Vector3(2, 3, 2),
      once: true,
      autoTrigger: true,
    });

    // Colliders for the massively expanded lobby
    ctx.player.setColliders([
      // Outer Walls
      new THREE.Box3(new THREE.Vector3(-10.5, 0, -12.5), new THREE.Vector3(10.5, 10, -11.5)), // Back Wall
      new THREE.Box3(new THREE.Vector3(-10.5, 0, -12.5), new THREE.Vector3(-9.5, 10, 13)),   // Left Wall
      new THREE.Box3(new THREE.Vector3(9.5, 0, -12.5), new THREE.Vector3(10.5, 10, 13)),     // Right Wall
      new THREE.Box3(new THREE.Vector3(-10.5, 0, 11.5), new THREE.Vector3(10.5, 10, 13)),    // Front Wall
      
      // Reception Desk
      new THREE.Box3(new THREE.Vector3(-3.5, 0, -9.5), new THREE.Vector3(3.5, 1.2, -7.5)),
      
      // Elevators section
      new THREE.Box3(new THREE.Vector3(4.5, 0, -12.5), new THREE.Vector3(5.5, 10, -11)),
      new THREE.Box3(new THREE.Vector3(8.5, 0, -12.5), new THREE.Vector3(9.5, 10, -11)),
      
      // Big Coffee Table
      new THREE.Box3(new THREE.Vector3(-1.0, 0, 0.4), new THREE.Vector3(1.0, 0.4, 1.6)),

      // Water cooler
      new THREE.Box3(new THREE.Vector3(-9.3, 0, -5.3), new THREE.Vector3(-8.7, 1.5, -4.7)),
    ]);
  }
  update(delta: number) {
    this.elapsedTime += delta;
    this.slowTick += delta;
    if (this.slowTick < 0.05) return; // throttle to 20fps
    this.slowTick = 0;
    if (this.dustParticles) {
      const positions = this.dustParticles.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        y += 0.05 * 0.08 * Math.sin(this.elapsedTime * 0.5 + i);
        const x = positions.getX(i) + 0.05 * 0.015 * Math.cos(this.elapsedTime * 0.2 + i * 0.3);
        if (y > 7) y = 0.5;
        if (y < 0) y = 7;
        positions.setY(i, y);
        positions.setX(i, x);
      }
      positions.needsUpdate = true;
    }
  }
  cleanup() {
    this.dustParticles = null;
  }
}
