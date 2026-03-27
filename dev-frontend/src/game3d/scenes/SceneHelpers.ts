import * as THREE from 'three';

// Reusable geometry builders for the office world

export function createFloor(width: number, depth: number, color = 0x3a4a5a): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(width, depth);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

export function createWall(
  width: number,
  height: number,
  color = 0x5a6a7a,
  position?: THREE.Vector3,
  rotationY = 0
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(width, height, 0.15);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = height / 2;
  if (position) mesh.position.copy(position).setY(height / 2);
  mesh.rotation.y = rotationY;
  return mesh;
}

export function createBox(
  w: number, h: number, d: number,
  color: number,
  pos: [number, number, number]
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  return mesh;
}

export function createDesk(x: number, z: number, rotY = 0): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotY;

  // Desk surface
  const surface = createBox(1.2, 0.05, 0.6, 0x6a5a4a, [0, 0.75, 0]);
  group.add(surface);

  // Legs
  for (const [lx, lz] of [[-0.55, -0.25], [0.55, -0.25], [-0.55, 0.25], [0.55, 0.25]]) {
    const leg = createBox(0.04, 0.75, 0.04, 0x4a3a2a, [lx, 0.375, lz]);
    group.add(leg);
  }

  // Monitor
  const monitor = createBox(0.4, 0.3, 0.03, 0x1a1a1a, [0, 1.0, -0.15]);
  group.add(monitor);

  // Monitor screen (emissive)
  const screenGeo = new THREE.PlaneGeometry(0.36, 0.26);
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x2244aa,
    emissive: 0x112244,
    emissiveIntensity: 0.5,
    roughness: 0.2,
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 1.0, -0.13);
  group.add(screen);

  // Keyboard
  const kb = createBox(0.3, 0.02, 0.1, 0x2a2a2a, [0, 0.79, 0.1]);
  group.add(kb);

  return group;
}

export function createChair(x: number, z: number, rotY = 0): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotY;

  // Seat
  const seat = createBox(0.4, 0.05, 0.4, 0x2a2a2a, [0, 0.5, 0]);
  group.add(seat);

  // Back
  const back = createBox(0.4, 0.4, 0.05, 0x2a2a2a, [0, 0.75, -0.175]);
  group.add(back);

  // Pole
  const pole = createBox(0.05, 0.5, 0.05, 0x333333, [0, 0.25, 0]);
  group.add(pole);

  return group;
}

export type FaceExpression = 'neutral' | 'angry' | 'evil_smile' | 'bored' | 'surprised';

function createFaceTexture(expression: FaceExpression, skinColor = '#d4a574'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Skin base
  ctx.fillStyle = skinColor;
  ctx.fillRect(0, 0, 64, 64);

  ctx.fillStyle = '#1a1a1a';

  switch (expression) {
    case 'neutral':
      // Eyes — simple dots
      ctx.fillRect(16, 22, 8, 8);
      ctx.fillRect(40, 22, 8, 8);
      // Mouth — flat line
      ctx.fillRect(20, 44, 24, 3);
      break;

    case 'angry':
      // Eyes — narrow angry
      ctx.fillRect(14, 24, 10, 6);
      ctx.fillRect(40, 24, 10, 6);
      // Angry eyebrows — diagonal
      ctx.fillStyle = '#2a1a0a';
      // Left brow: high outside, low inside
      for (let i = 0; i < 12; i++) {
        ctx.fillRect(12 + i, 16 + Math.floor(i * 0.5), 2, 3);
      }
      // Right brow: low inside, high outside
      for (let i = 0; i < 12; i++) {
        ctx.fillRect(40 + i, 22 - Math.floor(i * 0.5), 2, 3);
      }
      ctx.fillStyle = '#1a1a1a';
      // Mouth — frown
      ctx.fillRect(18, 46, 28, 3);
      ctx.fillRect(16, 44, 4, 3);
      ctx.fillRect(44, 44, 4, 3);
      // Red tint around eyes
      ctx.fillStyle = 'rgba(180, 60, 60, 0.3)';
      ctx.fillRect(10, 18, 18, 16);
      ctx.fillRect(36, 18, 18, 16);
      break;

    case 'evil_smile':
      // Eyes — narrow, gleaming
      ctx.fillRect(14, 22, 10, 6);
      ctx.fillRect(40, 22, 10, 6);
      // Eye glint
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(18, 22, 3, 3);
      ctx.fillRect(44, 22, 3, 3);
      ctx.fillStyle = '#1a1a1a';
      // Raised eyebrows
      ctx.fillRect(12, 14, 14, 3);
      ctx.fillRect(38, 14, 14, 3);
      // Wide curved smile
      ctx.fillRect(16, 42, 32, 4);
      ctx.fillRect(14, 40, 4, 4);
      ctx.fillRect(46, 40, 4, 4);
      ctx.fillRect(12, 38, 4, 3);
      ctx.fillRect(48, 38, 4, 3);
      // Teeth
      ctx.fillStyle = '#eeeedd';
      ctx.fillRect(20, 42, 4, 3);
      ctx.fillRect(28, 42, 4, 3);
      ctx.fillRect(36, 42, 4, 3);
      break;

    case 'bored':
      // Half-closed eyes
      ctx.fillRect(16, 26, 8, 4);
      ctx.fillRect(40, 26, 8, 4);
      // Droopy mouth
      ctx.fillRect(22, 44, 20, 2);
      ctx.fillRect(20, 46, 4, 2);
      break;

    case 'surprised':
      // Wide eyes
      ctx.fillRect(14, 20, 12, 12);
      ctx.fillRect(38, 20, 12, 12);
      // Pupils
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(16, 22, 4, 4);
      ctx.fillRect(40, 22, 4, 4);
      ctx.fillStyle = '#1a1a1a';
      // Open mouth
      ctx.fillRect(24, 42, 16, 10);
      break;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

export interface NPCOptions {
  x: number;
  z: number;
  bodyColor?: number;
  skinColor?: string;
  label?: string;
  seated?: boolean;       // properly seated in a chair
  facingY?: number;       // Y rotation (radians)
  expression?: FaceExpression;
}

export function createNPC(opts: NPCOptions): THREE.Group {
  const {
    x, z,
    bodyColor = 0x4a5a6a,
    skinColor = '#d4a574',
    label,
    seated = false,
    facingY = 0,
    expression = 'neutral',
  } = opts;

  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = facingY;

  const bodyY = seated ? 0.65 : 1.0;
  const headY = seated ? 1.15 : 1.55;

  // Body
  const bodyHeight = seated ? 0.5 : 0.8;
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, bodyHeight, 6),
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.8 })
  );
  body.position.y = bodyY;
  group.add(body);

  // Arms (two small cylinders on sides)
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.45, 4),
      new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.8 })
    );
    arm.position.set(side * 0.26, bodyY - 0.05, 0);
    arm.rotation.z = side * 0.15;
    group.add(arm);

    // Hand
    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.08),
      new THREE.MeshStandardMaterial({ color: parseInt(skinColor.replace('#', ''), 16), roughness: 0.7 })
    );
    hand.position.set(side * 0.28, bodyY - 0.3, 0);
    group.add(hand);
  }

  if (seated) {
    // Upper legs (horizontal)
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.35, 4),
        new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.8 })
      );
      leg.position.set(side * 0.12, 0.42, 0.15);
      leg.rotation.x = Math.PI / 2;
      group.add(leg);
    }
    // Lower legs (vertical, hanging down)
    for (const side of [-1, 1]) {
      const lowerLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.35, 4),
        new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.8 })
      );
      lowerLeg.position.set(side * 0.12, 0.2, 0.32);
      group.add(lowerLeg);
    }
  }

  // Head — box with face texture on front
  const faceTex = createFaceTexture(expression, skinColor);
  const skinMat = new THREE.MeshStandardMaterial({ color: parseInt(skinColor.replace('#', ''), 16), roughness: 0.7 });
  const faceMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.7 });

  // Box has 6 faces: +X, -X, +Y, -Y, +Z (front), -Z (back)
  const headMaterials = [skinMat, skinMat, skinMat, skinMat, faceMat, skinMat];
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.28, 0.28),
    headMaterials
  );
  head.position.y = headY;
  head.name = 'npc_head';
  group.add(head);

  // Hair on top
  const hair = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.06, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9 })
  );
  hair.position.y = headY + 0.17;
  group.add(hair);

  if (label) {
    group.userData.npcLabel = label;
  }

  // Store expression data for dynamic changes
  group.userData.faceMat = faceMat;
  group.userData.skinColor = skinColor;

  return group;
}

/** Change an NPC's facial expression at runtime */
export function setNPCExpression(npc: THREE.Group, expression: FaceExpression) {
  const faceMat = npc.userData.faceMat as THREE.MeshStandardMaterial;
  const skinColor = npc.userData.skinColor as string || '#d4a574';
  if (faceMat) {
    const newTex = createFaceTexture(expression, skinColor);
    faceMat.map?.dispose();
    faceMat.map = newTex;
    faceMat.needsUpdate = true;
  }
}

/** Create a speech bubble above an NPC */
export function createSpeechBubble(text: string, npc: THREE.Group): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Bubble background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.roundRect(4, 4, 248, 48, 8);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Text
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 16px Courier New, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 28);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;

  const geo = new THREE.PlaneGeometry(1.0, 0.25);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
  const bubble = new THREE.Mesh(geo, mat);

  // Position above head
  const headY = npc.userData.seated ? 1.45 : 1.85;
  bubble.position.set(npc.position.x, headY, npc.position.z);

  return bubble;
}

export function createPlant(x: number, z: number): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // Pot
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.08, 0.15, 6),
    new THREE.MeshStandardMaterial({ color: 0x8a5a3a })
  );
  pot.position.y = 0.075;
  group.add(pot);

  // Plant
  const plant = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 6, 4),
    new THREE.MeshStandardMaterial({ color: 0x3a7a3a })
  );
  plant.position.y = 0.22;
  group.add(plant);

  return group;
}

export function createTextSign(
  text: string,
  width: number,
  height: number,
  bgColor = '#3a4a5a',
  textColor = '#c8d8e4',
  fontSize = 24
): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = Math.floor(512 * (height / width));
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = textColor;
  ctx.font = `${fontSize}px Courier New, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Word wrap
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const test = currentLine ? currentLine + ' ' + word : word;
    if (ctx.measureText(test).width > canvas.width - 40) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  lines.push(currentLine);

  const lineHeight = fontSize * 1.4;
  const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;

  const geo = new THREE.PlaneGeometry(width, height);
  const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 });
  return new THREE.Mesh(geo, mat);
}

export function addLighting(scene: THREE.Scene) {
  // Warm directional (sun/office light)
  const dir = new THREE.DirectionalLight(0xffd4a0, 1.2);
  dir.position.set(5, 8, 3);
  scene.add(dir);

  // Cool ambient fill
  const ambient = new THREE.AmbientLight(0x6688aa, 0.6);
  scene.add(ambient);

  // Hemisphere for subtle color variation
  const hemi = new THREE.HemisphereLight(0x8899bb, 0x443322, 0.3);
  scene.add(hemi);
}

export function createCeiling(width: number, depth: number, height: number, color = 0x4a5a6a): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(width, depth);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = height;
  return mesh;
}

export function createFluorescentLight(x: number, z: number, height: number): THREE.Group {
  const group = new THREE.Group();

  const fixture = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.03, 0.15),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xeeeeff,
      emissiveIntensity: 2.0,
    })
  );
  fixture.position.set(x, height - 0.02, z);
  group.add(fixture);

  // Keep the mesh to look like a light
  // But DO NOT add a PointLight, which lags the game significantly when tiled
  // const light = new THREE.PointLight(0xeeeeff, 0.8, 8);
  // light.position.set(x, height - 0.1, z);
  // group.add(light);

  return group;
}
