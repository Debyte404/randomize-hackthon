import * as THREE from 'three';

// Reusable geometry builders for the office world

export function createFloor(width, depth, color = 0x937c59) {
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
  width,
  height,
  color = 0xdcd8c0, // Off-white/cream office walls
  position,
  rotationY = 0
) {
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
  w, h, d,
  color,
  pos
) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createDesk(x, z, rotY = 0) {
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

export function createChair(x, z, rotY = 0) {
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

export function createNPC(
  x, z,
  bodyColorOrOpts = 0x4a5a6a,
  label
) {
  let opts;
  if (typeof bodyColorOrOpts === 'number') {
    opts = { bodyColor: bodyColorOrOpts, label };
  } else {
    opts = bodyColorOrOpts;
  }

  const bodyColor = opts.bodyColor ?? 0x4a5a6a;
  const skinTone = opts.skinTone ?? SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
  const hairColor = opts.hairColor ?? HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
  const hairStyle = opts.hairStyle ?? (['flat', 'tall', 'side', 'bald'])[Math.floor(Math.random() * 4)];
  const hasGlasses = opts.hasGlasses ?? (Math.random() > 0.6);
  const hasTie = opts.hasTie ?? (Math.random() > 0.5);
  const tieColor = opts.tieColor ?? [0xaa2222, 0x2244aa, 0x228844, 0x886622][Math.floor(Math.random() * 4)];

  const group = new THREE.Group();
  group.position.set(x, 0, z);
  if (opts.facing) group.rotation.y = opts.facing;

  const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.7 });
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.8 });

  // --- Torso (pivot for lean animations) ---
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.22, 0.65, 8),
    bodyMat
  );
  torso.position.y = 1.0;
  group.add(torso);

  // --- Shoulders ---
  const shoulders = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.08, 0.22),
    bodyMat
  );
  shoulders.position.y = 1.35;
  group.add(shoulders);

  // --- Arms ---
  const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.35, 6), bodyMat);
  leftUpperArm.position.set(-0.3, 1.15, 0);
  leftUpperArm.rotation.z = -0.15;
  group.add(leftUpperArm);

  const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.35, 6), bodyMat);
  rightUpperArm.position.set(0.3, 1.15, 0);
  rightUpperArm.rotation.z = 0.15;
  group.add(rightUpperArm);

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.25, 6), skinMat);
  leftForearm.position.set(-0.32, 0.9, 0.05);
  leftForearm.rotation.z = -0.1;
  leftForearm.rotation.x = -0.3;
  group.add(leftForearm);

  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.25, 6), skinMat);
  rightForearm.position.set(0.32, 0.9, 0.05);
  rightForearm.rotation.z = 0.1;
  rightForearm.rotation.x = -0.3;
  group.add(rightForearm);

  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.06), skinMat);
  leftHand.position.set(-0.33, 0.77, 0.1);
  group.add(leftHand);

  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.06), skinMat);
  rightHand.position.set(0.33, 0.77, 0.1);
  group.add(rightHand);

  // --- Neck ---
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.07, 0.1, 6),
    skinMat
  );
  neck.position.y = 1.42;
  group.add(neck);

  // --- Head Group (pivot at neck level y=1.42) ---
  // All face/hair/glasses parts are children so they rotate together with the head.
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.42, 0);
  group.add(headGroup);

  // Positions below are relative to headGroup (subtract 1.42 from original world Y)
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.24), skinMat);
  head.position.set(0, 0.16, 0);
  headGroup.add(head);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.03, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    eye.position.set(side * 0.06, 0.18, 0.12);
    headGroup.add(eye);

    const pupil = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.025, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x1a1a2a })
    );
    pupil.position.set(side * 0.06, 0.18, 0.13);
    headGroup.add(pupil);
  }

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.015, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x9a6a5a })
  );
  mouth.position.set(0, 0.08, 0.12);
  headGroup.add(mouth);

  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9 });
  if (hairStyle === 'flat') {
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.26), hairMat);
    hair.position.y = 0.32;
    headGroup.add(hair);
    for (const s of [-1, 1]) {
      const sideburn = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.26), hairMat);
      sideburn.position.set(s * 0.14, 0.25, 0);
      headGroup.add(sideburn);
    }
  } else if (hairStyle === 'tall') {
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.26), hairMat);
    hair.position.y = 0.36;
    headGroup.add(hair);
  } else if (hairStyle === 'side') {
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.26), hairMat);
    hair.position.set(0.03, 0.32, 0);
    headGroup.add(hair);
    const sweep = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.26), hairMat);
    sweep.position.set(-0.12, 0.28, 0);
    headGroup.add(sweep);
  }

  if (hasGlasses) {
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    for (const side of [-1, 1]) {
      const frame = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.04, 4), glassMat);
      frame.position.set(side * 0.06, 0.18, 0.135);
      headGroup.add(frame);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), glassMat);
    bridge.position.set(0, 0.18, 0.135);
    headGroup.add(bridge);
    for (const side of [-1, 1]) {
      const lens = new THREE.Mesh(
        new THREE.PlaneGeometry(0.05, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x8888ff, transparent: true, opacity: 0.15 })
      );
      lens.position.set(side * 0.06, 0.18, 0.134);
      headGroup.add(lens);
    }
  }

  if (hasTie) {
    const tieMat = new THREE.MeshStandardMaterial({ color: tieColor, roughness: 0.6 });
    const knot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.04), tieMat);
    knot.position.set(0, -0.12, 0.18);
    headGroup.add(knot);
    const tieBody = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.3, 0.02), tieMat);
    tieBody.position.set(0, -0.32, 0.19);
    headGroup.add(tieBody);
    const tieTip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.02), tieMat);
    tieTip.position.set(0, -0.48, 0.19);
    headGroup.add(tieTip);
  }

  if (label) {
    group.userData.npcLabel = label;
  }

  group.userData.isNPC = true;
  group.userData.idlePhase = Math.random() * Math.PI * 2;

  // headGroup is the animation target — rotating it moves head + all face parts together
  group.userData.parts = {
    head: headGroup,
    torso,
    shoulders,
    leftForearm,
    rightForearm,
    leftUpperArm,
    rightUpperArm,
  };

  return group;
}

export function createPlant(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.08, 0.15, 6),
    new THREE.MeshStandardMaterial({ color: 0x8a5a3a })
  );
  pot.position.y = 0.075;
  group.add(pot);

  const plant = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 6, 4),
    new THREE.MeshStandardMaterial({ color: 0x3a7a3a })
  );
  plant.position.y = 0.22;
  group.add(plant);

  return group;
}

export function createTextSign(
  text,
  width,
  height,
  bgColor = '#3a4a5a',
  textColor = '#c8d8e4',
  fontSize = 24
) {
  const canvas = document.createElement('canvas');
  // High resolution for clear text, scaled up by 8
  const scale = 8;
  canvas.width = 512 * scale;
  canvas.height = Math.floor(512 * scale * (height / width));
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = textColor;
  const scaledFontSize = fontSize * scale;
  ctx.font = `bold ${scaledFontSize}px 'Courier New', Courier, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Handle explicit newlines first, then word wrap each paragraph
  const paragraphs = text.split('\n');
  const lines = [];
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
  // Use LinearFilter for high-res text
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;
  
  const geo = new THREE.PlaneGeometry(width, height);
  const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, transparent: true });
  return new THREE.Mesh(geo, mat);
}

export function addLighting(scene) {
  // Stark fluorescent directional (main office light)
  const dir = new THREE.DirectionalLight(0xfff5e6, 2.5);
  dir.position.set(5, 10, 3);
  dir.castShadow = true;
  dir.shadow.mapSize.width = 2048;
  dir.shadow.mapSize.height = 2048;
  dir.shadow.camera.near = 0.5;
  dir.shadow.camera.far = 50;
  dir.shadow.camera.left = -15;
  dir.shadow.camera.right = 15;
  dir.shadow.camera.top = 15;
  dir.shadow.camera.bottom = -15;
  dir.shadow.bias = -0.0005;
  scene.add(dir);

  const dir2 = new THREE.DirectionalLight(0xffffff, 1.8);
  dir2.position.set(-5, 8, -5);
  dir2.castShadow = true;
  dir2.shadow.mapSize.width = 1024;
  dir2.shadow.mapSize.height = 1024;
  dir2.shadow.camera.near = 0.5;
  dir2.shadow.camera.far = 50;
  scene.add(dir2);

  // High ambient fill for corporate feel
  const ambient = new THREE.AmbientLight(0xffffff, 1.0); // Source value
  scene.add(ambient);

  // Hemisphere for subtle color variation
  const hemi = new THREE.HemisphereLight(0xffffff, 0x887755, 1.0); // Source value
  scene.add(hemi);
}

export function createCeiling(width, depth, height, color = 0xefefef) {
  const geo = new THREE.PlaneGeometry(width, depth);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = height;
  mesh.castShadow = false; // Ensure ceiling doesn't block the "sun" shadow map too aggressively
  return mesh;
}

export function createFluorescentLight(x, z, height) {
  const group = new THREE.Group();

  const fixture = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.03, 0.15),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xeeeeff,
      emissiveIntensity: 1.5, // Balanced for 1.4x shader
    })
  );
  fixture.position.set(x, height - 0.02, z);
  group.add(fixture);

  return group;
}
