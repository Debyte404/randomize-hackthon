import * as THREE from 'three';
import {
  createWall, createBox, createNPC,
  createTextSign, addLighting, createCeiling,
} from './SceneHelpers';

export class LobbyScene {
  constructor() {
    this.name = 'lobby';
    this.receptionistNPC = null;
    this.totalTime = 0;
    this.flickerLights = [];
    this.flickerTimer = 0;
    this.flickerActive = false;
  }

  setup(ctx) {
    addLighting(ctx.scene);
    ctx.scene.background = new THREE.Color(0x1a1e24);

    // Floor — polished dark marble with high specular
    const floorGeo = new THREE.PlaneGeometry(26, 26);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x2a2d32, // Brightened from 0x111215
      roughness: 0.4, // Increased from 0.1 to show more diffuse light
      metalness: 0.4, // Reduced from 0.8
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    ctx.scene.add(floor);

    // Massive Atrium Ceiling
    ctx.scene.add(createCeiling(26, 26, 8.0, 0xd8d8d8));

    // --- CEILING DETAIL: Fluorescent light strips ---
    this.flickerLights = [];
    for (let lz = -9; lz <= 9; lz += 6) {
      const fixtureGeo = new THREE.BoxGeometry(1.2, 0.06, 0.2);
      const fixtureMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xeeeeff,
        emissiveIntensity: 1.5,
      });
      const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.set(-4, 7.96, lz);
      ctx.scene.add(fixture);
      this.flickerLights.push(fixture);

      const fixture2 = new THREE.Mesh(fixtureGeo.clone(), fixtureMat.clone());
      fixture2.position.set(4, 7.96, lz);
      ctx.scene.add(fixture2);
      this.flickerLights.push(fixture2);
    }

    // --- ARCHITECTURE ---
    const wallColor = 0xc0c4c8;
    const trimColor = 0x9a9ea2;

    // BACK WALL
    const backWall = createWall(24, 8.0, 0x22252a);
    backWall.position.z = -12;
    ctx.scene.add(backWall);

    // FRONT WALL (entrance)
    const frontWallLeft = createBox(7, 8, 0.15, wallColor, [-6.5, 4, 12]);
    ctx.scene.add(frontWallLeft);
    const frontWallRight = createBox(7, 8, 0.15, wallColor, [6.5, 4, 12]);
    ctx.scene.add(frontWallRight);
    const frontWallTop = createBox(10, 4.5, 0.15, wallColor, [0, 5.75, 12]);
    ctx.scene.add(frontWallTop);
    
    // Glass entrance doors
    const entranceDoor = createBox(3.5, 3.2, 0.08, 0x88aabb, [0, 1.6, 12]);
    const entranceDoorMat = entranceDoor.material;
    entranceDoorMat.transparent = true;
    entranceDoorMat.opacity = 0.15;
    entranceDoorMat.metalness = 0.9;
    ctx.scene.add(entranceDoor);
    
    // Door frame
    ctx.scene.add(createBox(3.7, 3.4, 0.12, 0x333333, [0, 1.7, 12]));
    ctx.scene.add(createBox(0.1, 3.2, 0.12, 0x333333, [0, 1.6, 12]));

    // LEFT WALL
    const leftWall = createWall(24, 8.0, wallColor);
    leftWall.position.x = -10;
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.z = 0;
    ctx.scene.add(leftWall);

    // Left wall trim
    ctx.scene.add(createBox(0.15, 0.3, 24, trimColor, [-9.85, 0.15, 0]));
    ctx.scene.add(createBox(0.3, 0.2, 24, trimColor, [-9.8, 7.9, 0]));

    // RIGHT WALL (Glass curtain wall)
    const rightWallBottom = createBox(0.15, 1.0, 24, wallColor, [10, 0.5, 0]);
    ctx.scene.add(rightWallBottom);
    const rightWallTop = createBox(0.15, 1.5, 24, wallColor, [10, 7.25, 0]);
    ctx.scene.add(rightWallTop);
    ctx.scene.add(createBox(0.15, 0.3, 24, 0x444444, [10, 3.75, 0]));

    // Mullions and Glass
    for (let i = -10; i <= 10; i += 4) {
      ctx.scene.add(createBox(0.4, 8, 0.4, 0x333333, [9.8, 4, i]));
      
      const lowerGlass = createBox(0.05, 2.5, 3.6, 0x334455, [10, 2.25, i + 0.2]);
      lowerGlass.material.transparent = true;
      lowerGlass.material.opacity = 0.15;
      lowerGlass.material.metalness = 0.9;
      lowerGlass.material.roughness = 0.05;
      ctx.scene.add(lowerGlass);

      const upperGlass = createBox(0.05, 2.5, 3.6, 0x334455, [10, 5.15, i + 0.2]);
      upperGlass.material.transparent = true;
      upperGlass.material.opacity = 0.15;
      upperGlass.material.metalness = 0.9;
      upperGlass.material.roughness = 0.05;
      ctx.scene.add(upperGlass);
    }

    // Right wall trim
    ctx.scene.add(createBox(0.15, 0.3, 24, trimColor, [9.85, 0.15, 0]));
    ctx.scene.add(createBox(0.3, 0.2, 24, trimColor, [9.8, 7.9, 0]));

    // Back wall trim
    ctx.scene.add(createBox(24, 0.3, 0.15, trimColor, [0, 0.15, -11.85]));
    ctx.scene.add(createBox(24, 0.2, 0.3, trimColor, [0, 7.9, -11.8]));

    // --- EXTERIOR BUILDINGS ---
    const extBldg1 = createBox(8, 30, 6, 0x2a2d32, [18, 15, -4]);
    ctx.scene.add(extBldg1);
    for (let wy = 2; wy < 28; wy += 3) {
      for (let wz = -6; wz <= -2; wz += 2) {
        const extWin = createBox(0.1, 2.0, 1.2, 0x0a0f15, [13.96, wy, wz]);
        if (Math.random() > 0.5) {
          extWin.material.emissive = new THREE.Color(0x998866);
          extWin.material.emissiveIntensity = 0.3;
        }
        ctx.scene.add(extWin);
      }
    }
    ctx.scene.add(createBox(10, 22, 8, 0x353840, [22, 11, 4]));
    ctx.scene.add(createBox(6, 15, 5, 0x3a3d42, [16, 7.5, 8]));
    ctx.scene.add(createBox(4, 40, 4, 0x25282d, [25, 20, -8]));
    ctx.scene.add(createBox(30, 35, 5, 0x1e2126, [0, 17.5, -18]));

    // --- CORNER SEAMS ---
    ctx.scene.add(createBox(0.5, 8, 0.5, 0x22252a, [-10, 4, -12]));
    ctx.scene.add(createBox(0.5, 8, 0.5, 0x22252a, [10, 4, -12]));
    ctx.scene.add(createBox(0.5, 8, 0.5, wallColor, [-10, 4, 12]));
    ctx.scene.add(createBox(0.5, 8, 0.5, wallColor, [10, 4, 12]));

    // --- PILLARS ---
    for (const pz of [-8, -2, 4, 10]) {
      ctx.scene.add(createBox(1.5, 8, 1.5, 0x4a4d52, [-6, 4, pz]));
      ctx.scene.add(createBox(1.5, 8, 1.5, 0x4a4d52, [6, 4, pz]));
      ctx.scene.add(createBox(1.7, 0.15, 1.7, 0x555860, [-6, 7.92, pz]));
      ctx.scene.add(createBox(1.7, 0.15, 1.7, 0x555860, [6, 7.92, pz]));
      ctx.scene.add(createBox(1.7, 0.15, 1.7, 0x3a3d42, [-6, 0.08, pz]));
      ctx.scene.add(createBox(1.7, 0.15, 1.7, 0x3a3d42, [6, 0.08, pz]));
    }

    // --- RECEPTION ---
    ctx.scene.add(createBox(6.0, 1.1, 0.8, 0x2a2d34, [0, 0.55, -8]));
    const rightDesk = createBox(2.0, 1.1, 0.8, 0x2a2d34, [-3.4, 0.55, -7.6]);
    rightDesk.rotation.y = Math.PI / 6;
    ctx.scene.add(rightDesk);
    const leftDesk = createBox(2.0, 1.1, 0.8, 0x2a2d34, [3.4, 0.55, -7.6]);
    leftDesk.rotation.y = -Math.PI / 6;
    ctx.scene.add(leftDesk);

    const dtMesh = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.1, 1.0), new THREE.MeshStandardMaterial({color: 0x111111, roughness: 0.1}));
    dtMesh.position.set(0, 1.15, -8);
    ctx.scene.add(dtMesh);

    // Giant Corporate Logo
    // Giant Corporate Wall Logo behind desk
    const logoMesh1 = createBox(0.8, 4.0, 0.2, 0x111111, [-2.5, 4.5, -11.8]);
    const logoMesh2 = createBox(0.8, 4.0, 0.2, 0x111111, [2.5, 4.5, -11.8]);
    const logoMesh3 = createBox(5.0, 0.8, 0.2, 0x111111, [0, 6.1, -11.8]);
    const logoMesh4 = createBox(5.0, 0.8, 0.2, 0x111111, [0, 2.9, -11.8]);
    ctx.scene.add(logoMesh1); ctx.scene.add(logoMesh2); ctx.scene.add(logoMesh3); ctx.scene.add(logoMesh4);

    const logoInner = createTextSign('N E X U S\nC O R P', 3.4, 2.4, '#0a1a2a', '#44aaff', 48);
    logoInner.position.set(0, 4.5, -11.83);
    logoInner.material.emissive = new THREE.Color(0x113366);
    logoInner.material.emissiveIntensity = 5.0; // Boosted
    ctx.scene.add(logoInner);

    const logoSpot = new THREE.SpotLight(0x4488ff, 150, 10, Math.PI / 5, 0.6, 1); // Normalized from 400
    logoSpot.position.set(0, 7.5, -9);
    logoSpot.target.position.set(0, 4.5, -11.85);
    ctx.scene.add(logoSpot);
    ctx.scene.add(logoSpot.target);

    const corpText = createTextSign('N E X U S   C O R P', 7.0, 1.0, '#11151a', '#e0e0e0', 48);
    corpText.position.set(0, 1.5, -11.8);
    ctx.scene.add(corpText);

    // Receptionist
    const receptionist = createNPC(0, -9.5, { bodyColor: 0x4a5a6a, label: 'receptionist' });
    receptionist.position.y = 0.35;
    receptionist.scale.set(1.1, 1.1, 1.1);
    ctx.scene.add(receptionist);
    this.receptionistNPC = receptionist;
    this.receptionistBaseY = 0.35;

    // --- SEATING ---
    const createCouch = (x, z, rotationY) => {
      const group = new THREE.Group();
      
      // Base
      const base = createBox(2.2, 0.2, 0.8, 0x555555, [0, 0.1, 0]);
      group.add(base);
      
      // Cushions
      const cushion1 = createBox(1.0, 0.3, 0.7, 0x888888, [-0.55, 0.35, 0]);
      const cushion2 = createBox(1.0, 0.3, 0.7, 0x888888, [0.55, 0.35, 0]);
      group.add(cushion1);
      group.add(cushion2);
      
      // Backrest
      const backrest = createBox(2.2, 0.6, 0.2, 0x888888, [0, 0.6, -0.3]);
      group.add(backrest);

      group.position.set(x, 0, z);
      group.rotation.y = rotationY;
      return group;
    };
    ctx.scene.add(createCouch(-6, 2, Math.PI / 2));
    ctx.scene.add(createCouch(-4, 0, 0));
    ctx.scene.add(createCouch(6, 2, -Math.PI / 2));
    ctx.scene.add(createCouch(4, 0, 0));

    // Expensive minimalist planters
    const createLuxPlant = (x, z) => {
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
    ctx.scene.add(createLuxPlant(-8, -10));
    ctx.scene.add(createLuxPlant(8, 10));

    // --- FLOOR DETAIL: Reception area rug/mat ---
    ctx.scene.add(createBox(8, 0.02, 4, 0x1a1520, [0, 0.01, -7]));

    // Guide sign
    const guideSign = createTextSign('CONFERENCE ROOMS\nElevator Bank East →', 2.2, 1.0, '#1a2a3a', '#e0e0e0', 24);
    guideSign.position.set(2, 1.6, 1);
    guideSign.rotation.y = -Math.PI / 6;
    guideSign.material.emissive = new THREE.Color(0xaabbcc);
    guideSign.material.emissiveIntensity = 0.2;
    ctx.scene.add(guideSign);
    ctx.scene.add(createBox(0.1, 1.6, 0.1, 0x333333, [2, 0.8, 0.95]));
    ctx.scene.add(createBox(0.8, 0.1, 0.8, 0x222222, [2, 0.05, 0.95]));

    // TV content
    const tvContent = createTextSign('INNOVATION\nINTEGRITY\nIMPACT', 1.8, 1.0, '#0a0a1a', '#4488cc', 28);
    tvContent.position.set(-9.82, 3.5, 5);
    tvContent.material.emissive = new THREE.Color(0x2244aa);
    tvContent.material.emissiveIntensity = 0.6;
    ctx.scene.add(tvContent);
    ctx.scene.add(createBox(2.2, 1.4, 0.08, 0x222222, [-9.85, 3.5, 5]));

    // Water cooler
    ctx.scene.add(createBox(0.4, 1.0, 0.3, 0xcccccc, [-9, 0.5, -5]));
    const jug = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.3 }));
    jug.position.set(-9, 1.2, -5);
    ctx.scene.add(jug);
    const waterSign = createTextSign('OUT OF\nWATER', 0.5, 0.3, '#ffffff', '#cc3333', 16);
    waterSign.position.set(-9, 0.7, -4.83);
    ctx.scene.add(waterSign);

    // Player start — already inside, near reception
    ctx.player.camera.position.set(0, 1.7, 3);
    ctx.player.enable();

    // Triggers
    ctx.triggers.add({
      id: 'receptionist',
      position: new THREE.Vector3(0, 1, -7),
      size: new THREE.Vector3(4, 3, 2),
      once: true,
      promptText: '[E] Request Access',
    });

    ctx.triggers.add({
      id: 'hallway',
      position: new THREE.Vector3(7, 1, -11.5),
      size: new THREE.Vector3(2, 3, 2),
      once: true,
      autoTrigger: true,
    });

    // Water cooler
    ctx.triggers.add({
      id: 'waterCooler',
      position: new THREE.Vector3(-9, 1, -5),
      size: new THREE.Vector3(2, 2, 2),
      once: true,
      promptText: '[E] Examine Cooler',
    });

    // TV on wall
    ctx.triggers.add({
      id: 'lobbyTV',
      position: new THREE.Vector3(-8, 1.7, 5),
      size: new THREE.Vector3(3, 3, 2),
      once: true,
      promptText: '[E] Watch TV',
    });

    // Couches
    ctx.triggers.add({
      id: 'lobbyCouch',
      position: new THREE.Vector3(0, 0.5, 1),
      size: new THREE.Vector3(3, 2, 2),
      once: true,
      promptText: '[E] Examine Couches',
    });

    // Colliders
    ctx.player.setColliders([
      new THREE.Box3(new THREE.Vector3(-10.5, 0, -12.5), new THREE.Vector3(10.5, 10, -11.5)),
      new THREE.Box3(new THREE.Vector3(-10.5, 0, -12.5), new THREE.Vector3(-9.5, 10, 13)),
      new THREE.Box3(new THREE.Vector3(9.5, 0, -12.5), new THREE.Vector3(10.5, 10, 13)),
      new THREE.Box3(new THREE.Vector3(-10.5, 0, 11.5), new THREE.Vector3(10.5, 10, 13)),
      new THREE.Box3(new THREE.Vector3(-3.5, 0, -9.5), new THREE.Vector3(3.5, 1.2, -7.5)),
      new THREE.Box3(new THREE.Vector3(4.5, 0, -12.5), new THREE.Vector3(5.5, 10, -11)),
      new THREE.Box3(new THREE.Vector3(8.5, 0, -12.5), new THREE.Vector3(9.5, 10, -11)),
      
      // Water cooler
      new THREE.Box3(new THREE.Vector3(-9.3, 0, -5.3), new THREE.Vector3(-8.7, 1.5, -4.7)),
    ]);
  }

  update(delta) {
    this.totalTime += delta;
    const t = this.totalTime;

    // Receptionist per-part animation: corporate automaton at the desk
    if (this.receptionistNPC) {
      const parts = this.receptionistNPC.userData.parts;
      if (parts) {
        // Mechanical typing — fast and robotic (GREETING UNIT)
        const typeCycle = Math.sin(t * 8.0);
        if (parts.leftForearm)  parts.leftForearm.rotation.x  = -0.1 + typeCycle * 0.5;
        if (parts.rightForearm) parts.rightForearm.rotation.x = -0.1 - typeCycle * 0.5;

        // Head: wide slow scan side-to-side, clearly visible
        if (parts.head) {
          parts.head.rotation.y = Math.sin(t * 0.6) * 0.55;
          parts.head.rotation.x = -0.25; // Clearly looking down at keyboard
        }

        // Torso: slight mechanical forward pump with typing
        if (parts.torso) parts.torso.rotation.x = 0.1 + Math.abs(Math.sin(t * 8.0)) * 0.15;
      }
      // Barely perceptible — inhuman
      this.receptionistNPC.position.y = this.receptionistBaseY + Math.sin(t * 0.7) * 0.008;
    }

    // Occasional fluorescent flicker — picks one random light, dims it briefly
    this.flickerTimer += delta;
    if (!this.flickerActive && this.flickerTimer > 8.0 + Math.random() * 6) {
      this.flickerActive = true;
      this.flickerTimer = 0;
      const light = this.flickerLights[Math.floor(Math.random() * this.flickerLights.length)];
      if (light) {
        const originalIntensity = 1.5;
        light.material.emissiveIntensity = 0.1;
        setTimeout(() => { light.material.emissiveIntensity = originalIntensity; }, 80);
        setTimeout(() => { light.material.emissiveIntensity = 0.1; }, 160);
        setTimeout(() => {
          light.material.emissiveIntensity = originalIntensity;
          this.flickerActive = false;
        }, 260);
      }
    }
  }

  cleanup() {
    this.receptionistNPC = null;
    this.totalTime = 0;
    this.flickerLights = [];
    this.flickerTimer = 0;
    this.flickerActive = false;
  }
}
