import * as THREE from 'three';

// Reusable geometry builders for the office world

export function createFloor(width: number, depth: number, color = 0x937c59): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(width, depth);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    metalness: 0.0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

export function createWall(
  width: number,
  height: number,
  color = 0xdcd8c0, // Off-white/cream office walls
  position?: THREE.Vector3,
  rotationY = 0
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(width, height, 0.15);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = height / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
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
  mesh.castShadow = true;
  mesh.receiveShadow = true;
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

// Skin tone palette for variety
const SKIN_TONES = [0xf5d0a9, 0xd4a574, 0xc68642, 0x8d5524, 0xffdbac, 0xe0ac69];
const HAIR_COLORS = [0x2a1a0a, 0x4a3020, 0x8a6a4a, 0x1a1a2a, 0x6a3a2a, 0xc0a080];

export interface NPCOptions {
  bodyColor?: number;
  label?: string;
  skinTone?: number;
  hairColor?: number;
  hairStyle?: 'flat' | 'tall' | 'side' | 'bald';
  hasGlasses?: boolean;
  hasTie?: boolean;
  tieColor?: number;
  facing?: number; // rotation Y
}

export function createNPC(
  x: number, z: number,
  bodyColorOrOpts: number | NPCOptions = 0x4a5a6a,
  label?: string
): THREE.Group {
  // Support old call signature: createNPC(x, z, color, label)
  let opts: NPCOptions;
  if (typeof bodyColorOrOpts === 'number') {
    opts = { bodyColor: bodyColorOrOpts, label };
  } else {
    opts = bodyColorOrOpts;
  }

  const bodyColor = opts.bodyColor ?? 0x4a5a6a;
  const skinTone = opts.skinTone ?? SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
  const hairColor = opts.hairColor ?? HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
  const hairStyle = opts.hairStyle ?? (['flat', 'tall', 'side', 'bald'] as const)[Math.floor(Math.random() * 4)];
  const hasGlasses = opts.hasGlasses ?? (Math.random() > 0.6);
  const hasTie = opts.hasTie ?? (Math.random() > 0.5);
  const tieColor = opts.tieColor ?? [0xaa2222, 0x2244aa, 0x228844, 0x886622][Math.floor(Math.random() * 4)];

  const group = new THREE.Group();
  group.position.set(x, 0, z);
  if (opts.facing) group.rotation.y = opts.facing;

  const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.7 });
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.8 });

  // --- Torso (tapered cylinder for slight shoulder width) ---
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.22, 0.65, 8),
    bodyMat
  );
  torso.position.y = 1.0;
  group.add(torso);

  // --- Shoulders (wider top) ---
  const shoulders = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.08, 0.22),
    bodyMat
  );
  shoulders.position.y = 1.35;
  group.add(shoulders);

  // --- Arms ---
  for (const side of [-1, 1]) {
    // Upper arm
    const upperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.055, 0.35, 6),
      bodyMat
    );
    upperArm.position.set(side * 0.3, 1.15, 0);
    upperArm.rotation.z = side * 0.15; // slight outward angle
    group.add(upperArm);

    // Forearm (sleeve rolled up — skin visible)
    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.045, 0.25, 6),
      skinMat
    );
    forearm.position.set(side * 0.32, 0.9, 0.05);
    forearm.rotation.z = side * 0.1;
    forearm.rotation.x = -0.3; // slightly forward as if resting on table
    group.add(forearm);

    // Hand
    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.04, 0.06),
      skinMat
    );
    hand.position.set(side * 0.33, 0.77, 0.1);
    group.add(hand);
  }

  // --- Neck ---
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.07, 0.1, 6),
    skinMat
  );
  neck.position.y = 1.42;
  group.add(neck);

  // --- Head ---
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.26, 0.24),
    skinMat
  );
  head.position.y = 1.58;
  group.add(head);

  // --- Eyes ---
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.03, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    eye.position.set(side * 0.06, 1.6, 0.12);
    group.add(eye);

    // Pupil
    const pupil = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.025, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x1a1a2a })
    );
    pupil.position.set(side * 0.06, 1.6, 0.13);
    group.add(pupil);
  }

  // --- Mouth (simple line) ---
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.015, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x9a6a5a })
  );
  mouth.position.set(0, 1.5, 0.12);
  group.add(mouth);

  // --- Hair ---
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9 });
  if (hairStyle === 'flat') {
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.26), hairMat);
    hair.position.y = 1.74;
    group.add(hair);
    // Side burns
    for (const s of [-1, 1]) {
      const sideburn = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.26), hairMat);
      sideburn.position.set(s * 0.14, 1.67, 0);
      group.add(sideburn);
    }
  } else if (hairStyle === 'tall') {
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.26), hairMat);
    hair.position.y = 1.78;
    group.add(hair);
  } else if (hairStyle === 'side') {
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.26), hairMat);
    hair.position.set(0.03, 1.74, 0);
    group.add(hair);
    // Side sweep
    const sweep = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.26), hairMat);
    sweep.position.set(-0.12, 1.7, 0);
    group.add(sweep);
  }
  // 'bald' gets no hair

  // --- Glasses (if applicable) ---
  if (hasGlasses) {
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    // Frames
    for (const side of [-1, 1]) {
      const frame = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.04, 4), glassMat);
      frame.position.set(side * 0.06, 1.6, 0.135);
      group.add(frame);
    }
    // Bridge
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), glassMat);
    bridge.position.set(0, 1.6, 0.135);
    group.add(bridge);
    // Lens tint
    for (const side of [-1, 1]) {
      const lens = new THREE.Mesh(
        new THREE.PlaneGeometry(0.05, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x8888ff, transparent: true, opacity: 0.15 })
      );
      lens.position.set(side * 0.06, 1.6, 0.134);
      group.add(lens);
    }
  }

  // --- Tie (if applicable) ---
  if (hasTie) {
    const tieMat = new THREE.MeshStandardMaterial({ color: tieColor, roughness: 0.6 });
    // Knot
    const knot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.04), tieMat);
    knot.position.set(0, 1.3, 0.18);
    group.add(knot);
    // Body of tie
    const tieBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.3, 0.02),
      tieMat
    );
    tieBody.position.set(0, 1.1, 0.19);
    group.add(tieBody);
    // Tip (wider at end)
    const tieTip = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.04, 0.02),
      tieMat
    );
    tieTip.position.set(0, 0.94, 0.19);
    group.add(tieTip);
  }

  if (opts.label) {
    group.userData.npcLabel = opts.label;
  }

  // Mark group for idle animation
  group.userData.isNPC = true;
  group.userData.idlePhase = Math.random() * Math.PI * 2; // random start phase

  return group;
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
  // High resolution for clear text, scaled up by 4
  const scale = 4;
  canvas.width = 512 * scale;
  canvas.height = Math.floor(512 * scale * (height / width));
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = textColor;
  const scaledFontSize = fontSize * scale;
  ctx.font = `bold ${scaledFontSize}px 'Courier New', Courier, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Handle explicit newlines first, then word wrap each paragraph
  const paragraphs = text.split('\n');
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(' ');
    let currentLine = '';
    for (const word of words) {
      const test = currentLine ? currentLine + ' ' + word : word;
      if (ctx.measureText(test).width > canvas.width - (40 * scale)) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  // Auto-shrink font if text overflows vertically
  let lineHeight = scaledFontSize * 1.25;
  const totalTextHeight = lines.length * lineHeight;
  if (totalTextHeight > canvas.height - (20 * scale)) {
    const shrinkRatio = (canvas.height - (20 * scale)) / totalTextHeight;
    const shrunkFontSize = Math.floor(scaledFontSize * shrinkRatio);
    ctx.font = `bold ${shrunkFontSize}px 'Courier New', Courier, monospace`;
    lineHeight = shrunkFontSize * 1.25;
  }

  const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  // Use LinearFilter for high-res text, it looks so much better when scaled down.
  // We're dropping NearestFilter here specifically for signs so they remain readable
  // despite the whole screen getting pixelated.
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16;

  const geo = new THREE.PlaneGeometry(width, height);
  const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  return new THREE.Mesh(geo, mat);
}

export function addLighting(scene: THREE.Scene) {
  // Main directional light — no shadows for performance
  const dir = new THREE.DirectionalLight(0xfff5e6, 2.8);
  dir.position.set(5, 10, 3);
  dir.castShadow = false;
  scene.add(dir);

  const dir2 = new THREE.DirectionalLight(0xffffff, 2.0);
  dir2.position.set(-5, 8, -5);
  dir2.castShadow = false;
  scene.add(dir2);

  // Strong ambient for brightness + flat retro look
  const ambient = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambient);

  // Hemisphere for subtle color variation
  const hemi = new THREE.HemisphereLight(0xffffff, 0x887755, 1.4);
  scene.add(hemi);
}

export function createCeiling(width: number, depth: number, height: number, color = 0xefefef): THREE.Mesh {
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

  // const light = new THREE.PointLight(0xeeeeff, 0.8, 8);
  // light.position.set(x, height - 0.1, z);
  // group.add(light);

  return group;
}

