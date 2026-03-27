import * as THREE from 'three';
import type { GameScene, SceneContext } from '../engine/SceneManager';
import {
  createWall, createBox, createNPC,
  createTextSign, addLighting, createCeiling,
} from './SceneHelpers';

export class LobbyScene implements GameScene {
  name = 'lobby';

  setup(ctx: SceneContext) {
    addLighting(ctx.scene);
    ctx.scene.background = new THREE.Color(0x3a4a5a);

    // Floor — polished dark marble with high specular
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111215, // Very dark slate/black
      roughness: 0.1,  // Very smooth
      metalness: 0.8,  // Highly reflective
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    ctx.scene.add(floor);

    // Massive Atrium Ceiling
    ctx.scene.add(createCeiling(24, 24, 8.0, 0xefefef)); // Off-white modern ceiling

    // --- ARCHITECTURE ---
    
    const wallColor = 0xc0c4c8; // Clinical corporate off-white

    // Back wall (The focal point)
    const backWall = createWall(24, 8.0, 0x22252a); // Accent dark wall behind reception
    backWall.position.z = -12;
    ctx.scene.add(backWall);

    // Left wall with elevator bank
    const leftWall = createWall(24, 8.0, wallColor);
    leftWall.position.x = -10;
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.z = 0;
    ctx.scene.add(leftWall);

    // Right wall (Glass windows overlooking the street)
    // Create a base wall
    const rightWallBottom = createWall(24, 1.0, wallColor);
    rightWallBottom.position.x = 10;
    rightWallBottom.rotation.y = Math.PI / 2;
    ctx.scene.add(rightWallBottom);
    
    const rightWallTop = createWall(24, 3.0, wallColor);
    rightWallTop.position.x = 10;
    rightWallTop.rotation.y = Math.PI / 2;
    rightWallTop.position.y = 6.5; // Starts at y=5, up to 8
    ctx.scene.add(rightWallTop);
    
    for (let i = -10; i <= 10; i += 4) {
        // Vertical mullions for huge windows
        ctx.scene.add(createBox(0.4, 8, 0.4, 0x333333, [9.8, 4, i]));
    }

    // Monolithic Corporate Pillars
    for (const pz of [-8, -2, 4, 10]) {
      ctx.scene.add(createBox(1.5, 8, 1.5, 0x4a4d52, [-6, 4, pz]));
      ctx.scene.add(createBox(1.5, 8, 1.5, 0x4a4d52, [6, 4, pz]));
    }

    // --- RECEPTION AREA ---

    // Mega-desk base (curved look using multiple boxes)
    ctx.scene.add(createBox(6.0, 1.1, 0.8, 0xffffff, [0, 0.55, -8]));
    const rightDesk = createBox(2.0, 1.1, 0.8, 0xffffff, [-3.4, 0.55, -7.6]);
    rightDesk.rotation.y = Math.PI/6;
    ctx.scene.add(rightDesk);
    const leftDesk = createBox(2.0, 1.1, 0.8, 0xffffff, [3.4, 0.55, -7.6]);
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

    const corpText = createTextSign('N E X U S   C O R P', 7.0, 1.0, '#ffffff', '#22252a', 48);
    corpText.position.set(0, 1.5, -11.8);
    ctx.scene.add(corpText);

    // Receptionist NPC (now behind the grand desk)
    const receptionist = createNPC(0, -9.5, 0x4a5a6a, 'receptionist');
    ctx.scene.add(receptionist);

    // Add seating area in the massive atrium
    // A symmetrical arrangement of high-end corporate couches
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
    
    // --- ELEVATOR BANK (Right corner) ---
    // The actual elevator doors
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
    const elevatorSign = createTextSign('INTERVIEWS \u2193', 3.0, 0.6, '#111111', '#ffaa00', 32);
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
    const guideSign = createTextSign('CONFERENCE ROOMS\nElevator Bank East \u2192', 2.2, 1.0, '#1a2a3a', '#e0e0e0', 24);
    guideSign.position.set(2, 1.6, 1);
    guideSign.rotation.y = -Math.PI / 6; // Angled to face player walking in
    const guideMat = guideSign.material as THREE.MeshStandardMaterial;
    guideMat.emissive = new THREE.Color(0xaabbcc);
    guideMat.emissiveIntensity = 0.2; // Add a slight glow so it's readable
    ctx.scene.add(guideSign);
    // Post
    ctx.scene.add(createBox(0.1, 1.6, 0.1, 0x333333, [2, 0.8, 0.95]));
    ctx.scene.add(createBox(0.8, 0.1, 0.8, 0x222222, [2, 0.05, 0.95])); // Base

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
      new THREE.Box3(new THREE.Vector3(-10.5, 0, -12.5), new THREE.Vector3(-9.5, 10, 10)),   // Left Wall
      new THREE.Box3(new THREE.Vector3(9.5, 0, -12.5), new THREE.Vector3(10.5, 10, 10)),     // Right Wall
      new THREE.Box3(new THREE.Vector3(-10.5, 0, 9.5), new THREE.Vector3(10.5, 10, 10.5)),   // Front Wall
      
      // Reception Desk
      new THREE.Box3(new THREE.Vector3(-3.5, 0, -9.5), new THREE.Vector3(3.5, 1.2, -7.5)),
      
      // Elevators section
      new THREE.Box3(new THREE.Vector3(4.5, 0, -12.5), new THREE.Vector3(5.5, 10, -11)), // Pillar L
      new THREE.Box3(new THREE.Vector3(8.5, 0, -12.5), new THREE.Vector3(9.5, 10, -11)), // Pillar R
      
      // Big Coffee Table
      new THREE.Box3(new THREE.Vector3(-1.0, 0, 0.4), new THREE.Vector3(1.0, 0.4, 1.6)),
    ]);
  }
  update() {}
  cleanup() {}
}

