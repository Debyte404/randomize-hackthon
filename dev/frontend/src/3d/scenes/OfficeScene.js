import * as THREE from 'three';
import {
  createFloor, createWall, createDesk, createChair, createNPC,
  addLighting, createCeiling, createFluorescentLight,
} from './SceneHelpers';

export class OfficeScene {
  constructor() {
    this.name = 'office';
    this.coworkerNpcs = [];
    this.totalTime = 0;
    this.phoneRung = false;
    this.phoneTimer = 0;
  }

  setup(ctx) {
    addLighting(ctx.scene);
    ctx.scene.background = new THREE.Color(0x1a1e24);

    // Floor
    ctx.scene.add(createFloor(40, 40, 0x4a4d52));
    
    // Ceiling
    ctx.scene.add(createCeiling(40, 40, 3.5, 0xd8d8d8));

    // Walls
    const wallColor = 0xc0c4c8;
    ctx.scene.add(createBox(40, 3.5, 0.2, wallColor, [0, 1.75, -20])); // Back
    ctx.scene.add(createBox(40, 3.5, 0.2, wallColor, [0, 1.75, 20])); // Front
    ctx.scene.add(createBox(0.2, 3.5, 40, wallColor, [-20, 1.75, 0])); // Left
    ctx.scene.add(createBox(0.2, 3.5, 40, wallColor, [20, 1.75, 0])); // Right

    // --- LIGHTING GRID ---
    for (let lx = -15; lx <= 15; lx += 10) {
      for (let lz = -15; lz <= 15; lz += 8) {
        ctx.scene.add(createFluorescentLight(lx, lz, 3.5));
      }
    }

    // --- DESK PODS (3 rows of 4 pods) ---
    for (let row = -1; row <= 1; row++) {
      for (let col = -1.5; col <= 1.5; col++) {
        const x = col * 8.5;
        const z = row * 10;
        this.addDeskPod(ctx, x, z);
      }
    }

    // --- NPCs (seated at desks in pods) ---
    // Place coworkers at actual desk chair positions within desk pods
    // Pod grid: col * 8.5, row * 10. Chairs at pod ± 1 for x, pod ± 2.2 for z
    const coworkers = [
      { x: -12.75 - 1, z: -10 - 2.2, ry: 0 },          // Pod(-1.5,-1) left desk
      { x: -4.25 + 1, z: 0 + 2.2, ry: Math.PI },        // Pod(-0.5, 0) right desk back
      { x: 4.25 - 1, z: -10 - 2.2, ry: 0 },             // Pod(0.5,-1) left desk
      { x: 12.75 + 1, z: 0 - 2.2, ry: 0 },              // Pod(1.5, 0) right desk
      { x: -12.75 + 1, z: 10 + 2.2, ry: Math.PI },      // Pod(-1.5, 1) right desk back
      { x: 12.75 - 1, z: -10 + 2.2, ry: Math.PI },      // Pod(1.5,-1) left desk back
    ];
    this.coworkerNpcs = [];
    coworkers.forEach((pos, i) => {
      const npc = createNPC(pos.x, pos.z, {
        bodyColor: 0x334455,
        label: i === 0 ? 'coworkerPrinter' : 'coworkerDesk'
      });
      npc.rotation.y = pos.ry;
      ctx.scene.add(npc);
      this.coworkerNpcs.push(npc);
    });

    // --- YOUR DESK ---
    // Specifically marked desk in the front-center pod
    const yourDeskX = 0;
    const yourDeskZ = 8;
    
    const yourDeskMarker = createTextSign('YOUR DESK', 0.4, 0.15, '#115511', '#ffffff', 16);
    yourDeskMarker.position.set(yourDeskX, 1.15, yourDeskZ - 0.1);
    ctx.scene.add(yourDeskMarker);

    // Sprint board on wall (placed on actual left wall at x=-19.8)
    const sprintBoard = createTextSign(
      'SPRINT BOARD\nTODO | IN PROGRESS\nBLOCKED | DONE(empty)',
      2.5, 1.5, '#e8e8e0', '#2a2a2a', 18
    );
    sprintBoard.position.set(-19.8, 2.0, 0);
    sprintBoard.rotation.y = Math.PI / 2;
    ctx.scene.add(sprintBoard);

    // "Days without incident: 0" (on right wall at x=19.8)
    const incidentCounter = createTextSign(
      'DAYS WITHOUT\nINCIDENT: 0',
      1.2, 0.5, '#aa3333', '#eeeeee', 20
    );
    incidentCounter.position.set(19.8, 2.5, -2);
    incidentCounter.rotation.y = -Math.PI / 2;
    ctx.scene.add(incidentCounter);

    // "Please Do Not Discuss Salary. Or Feelings." (on back wall at z=-19.8)
    const salarySign = createTextSign(
      'Please Do Not Discuss\nSalary. Or Feelings.',
      2.0, 0.5, '#2a3a4a', '#aabbcc', 18
    );
    salarySign.position.set(0, 2.8, -19.8);
    ctx.scene.add(salarySign);

    // 14 coffee cups on a specific desk (pod col=0.5, row=-1 → center 4.25, -10, desk at +1, -1.5)
    const cupDeskX = 4.25 + 1;
    const cupDeskZ = -10 - 1.5;
    for (let i = 0; i < 14; i++) {
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.025, 0.08, 6),
        new THREE.MeshStandardMaterial({ color: 0xeeddcc })
      );
      cup.position.set(
        cupDeskX + (Math.random() - 0.5) * 0.8,
        0.82,
        cupDeskZ + (Math.random() - 0.5) * 0.4
      );
      ctx.scene.add(cup);
    }

    // Player start — drop them near the desk area, not the far end
    ctx.player.camera.position.set(0, 1.7, 14);
    ctx.player.enable();

    // Trigger for your desk
    ctx.triggers.add({
      id: 'yourDesk',
      position: new THREE.Vector3(yourDeskX, 1, yourDeskZ),
      size: new THREE.Vector3(2, 2, 2),
      once: true,
      promptText: '[E] Start Work',
    });

    // --- COWORKER NPC TRIGGERS ---
    // Coworker at printer (index 0) — at pod(-1.5,-1) left desk
    ctx.triggers.add({
      id: 'coworkerPrinter',
      position: new THREE.Vector3(-13.75, 1, -12.2),
      size: new THREE.Vector3(3, 2, 3),
      once: true,
      promptText: '[E] Talk to Coworker',
    });

    // Coworker at desk (index 1) — at pod(-0.5,0) right desk back
    ctx.triggers.add({
      id: 'coworkerDesk',
      position: new THREE.Vector3(-3.25, 1, 2.2),
      size: new THREE.Vector3(3, 2, 3),
      once: true,
      promptText: '[E] Talk to Coworker',
    });

    // --- ENVIRONMENTAL TRIGGERS ---
    // Sprint board (on left wall)
    ctx.triggers.add({
      id: 'sprintBoard',
      position: new THREE.Vector3(-18, 1.5, 0),
      size: new THREE.Vector3(3, 3, 4),
      once: true,
      promptText: '[E] Read Sprint Board',
    });

    // Incident counter (on right wall)
    ctx.triggers.add({
      id: 'incidentSign',
      position: new THREE.Vector3(18, 1.5, -2),
      size: new THREE.Vector3(3, 3, 4),
      once: true,
      promptText: '[E] Read Sign',
    });

    // Salary sign (on back wall)
    ctx.triggers.add({
      id: 'salarySign',
      position: new THREE.Vector3(0, 1.5, -18),
      size: new THREE.Vector3(4, 3, 3),
      once: true,
      promptText: '[E] Read Sign',
    });

    // 14 coffee cups desk
    ctx.triggers.add({
      id: 'coffeeCups',
      position: new THREE.Vector3(5.25, 1, -11.5),
      size: new THREE.Vector3(3, 2, 3),
      once: true,
      promptText: '[E] Examine Desk',
    });

    // Colliders (rough grid)
    const colliders = [
        new THREE.Box3(new THREE.Vector3(-20, 0, -20.5), new THREE.Vector3(20, 4, -19.5)),
        new THREE.Box3(new THREE.Vector3(-20, 0, 19.5), new THREE.Vector3(20, 4, 20.5)),
        new THREE.Box3(new THREE.Vector3(-20.5, 0, -20), new THREE.Vector3(-19.5, 4, 20)),
        new THREE.Box3(new THREE.Vector3(19.5, 0, -20), new THREE.Vector3(20.5, 4, 20)),
    ];
    ctx.player.setColliders(colliders);
  }

  addDeskPod(ctx, x, z) {
    // 4 desks in a pod
    ctx.scene.add(createDesk(x - 1, z - 1.5, 0));
    ctx.scene.add(createChair(x - 1, z - 2.2, 0));
    
    ctx.scene.add(createDesk(x + 1, z - 1.5, 0));
    ctx.scene.add(createChair(x + 1, z - 2.2, 0));

    // This desk is replaced by "yourDesk" in the main setup, but for other pods, it's a regular desk
    if (x === 0 && z === 10) { // Assuming this is the "your desk" pod
      // The "yourDesk" is added in the setup function, so we skip adding a generic one here
      // Instead, add the specific chair and name tag for the intern's desk
      ctx.scene.add(createChair(x - 1, z + 2.2, Math.PI)); // Chair for "your desk"
      const nameTag = createTextSign('INTERN', 0.3, 0.1, '#eeeedd', '#2a2a2a', 20);
      nameTag.position.set(x - 1, 0.82, z + 1.3); // Position relative to this desk
      nameTag.rotation.x = -Math.PI / 4;
      ctx.scene.add(nameTag);
    } else {
      ctx.scene.add(createDesk(x - 1, z + 1.5, Math.PI));
      ctx.scene.add(createChair(x - 1, z + 2.2, Math.PI));
    }

    ctx.scene.add(createDesk(x + 1, z + 1.5, Math.PI));
    ctx.scene.add(createChair(x + 1, z + 2.2, Math.PI));
    
    // Low cubicle dividers
    ctx.scene.add(createBox(4, 1.1, 0.05, 0x5a6d7a, [x, 0.55, z]));
    ctx.scene.add(createBox(0.05, 1.1, 4, 0x5a6d7a, [x, 0.55, z]));
  }

  update(delta, ctx) {
    this.totalTime += delta;

    // Per-part NPC animations — exhausted office workers typing at desks
    this.coworkerNpcs.forEach((npc, i) => {
      const parts = npc.userData.parts;
      if (!parts) return;

      const phase = npc.userData.idlePhase ?? 0;
      const t = this.totalTime + phase;

      // Typing rhythm: alternating forearm tap, slow and mechanical
      const typingCycle = Math.sin(t * 3.8 + i * 0.9);
      if (parts.leftForearm)  parts.leftForearm.rotation.x  = -0.3 + typingCycle * 0.09;
      if (parts.rightForearm) parts.rightForearm.rotation.x = -0.3 - typingCycle * 0.09;

      // Slight torso forward lean (hunched over desk)
      if (parts.torso) parts.torso.rotation.x = 0.07 + Math.sin(t * 0.4) * 0.015;

      // Head: normally tilted slightly down (reading screen),
      // occasionally slowly raises to look at something, then back down
      if (parts.head) {
        const lookUp = Math.sin(t * 0.18 + i * 1.7) > 0.72
          ? 0.12   // briefly glances up
          : -0.14; // back to staring at screen
        parts.head.rotation.x += (lookUp - parts.head.rotation.x) * Math.min(1, 1.5 * delta);
        // Very slow side-to-side micro-sway (dead-eyed stare drift)
        parts.head.rotation.y = Math.sin(t * 0.22 + i * 2.3) * 0.04;
      }

      // Whole-group very subtle vertical drift (breathing)
      const baseY = npc.userData.baseY ?? (npc.userData.baseY = npc.position.y);
      npc.position.y = baseY + Math.sin(t * 0.9) * 0.005;
    });

    // Phone ring event — fires once ~5 seconds after entering
    if (!this.phoneRung) {
      this.phoneTimer += delta;
      if (this.phoneTimer > 5.0) {
        this.phoneRung = true;
        ctx.showNarrator('A phone rings somewhere in the office.');
        setTimeout(() => {
          ctx.hideNarrator();
          setTimeout(() => {
            ctx.showNarrator('Nobody looks up.');
            setTimeout(() => ctx.hideNarrator(), 2500);
          }, 2200);
        }, 2000);
      }
    }
  }

  cleanup() {
    this.coworkerNpcs = [];
    this.totalTime = 0;
    this.phoneRung = false;
    this.phoneTimer = 0;
  }
}

function createBox(w, h, d, color, pos) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

function createTextSign(text, width, height, bgColor, textColor, fontSize) {
    const canvas = document.createElement('canvas');
    const scale = 4;
    canvas.width = 256 * scale;
    canvas.height = 64 * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0,0, canvas.width, canvas.height);
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize * scale}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width/2, canvas.height/2);
    const texture = new THREE.CanvasTexture(canvas);
    const geo = new THREE.PlaneGeometry(width, height);
    const mat = new THREE.MeshBasicMaterial({ map: texture });
    return new THREE.Mesh(geo, mat);
}
