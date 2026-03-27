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

export function createNPC(
  x: number, z: number,
  bodyColor = 0x4a5a6a,
  label?: string
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // Body (capsule approximation)
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.8, 6),
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.8 })
  );
  body.position.y = 1.0;
  group.add(body);

  // Head
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.25, 0.25),
    new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.7 })
  );
  head.position.y = 1.55;
  group.add(head);

  if (label) {
    group.userData.npcLabel = label;
  }

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

  // Word wrap
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const test = currentLine ? currentLine + ' ' + word : word;
    if (ctx.measureText(test).width > canvas.width - (40 * scale)) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  lines.push(currentLine);

  const lineHeight = scaledFontSize * 1.25;
  const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  // Use LinearFilter for high-res text, it looks so much better when scaled down.
  // We're dropping NearestFilter here specifically for signs so they remain readable
  // despite the whole screen getting pixelated.
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  // texture.anisotropy = 4; (optional but helpful if viewed at an angle)
  
  const geo = new THREE.PlaneGeometry(width, height);
  const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, transparent: true });
  return new THREE.Mesh(geo, mat);
}

export function addLighting(scene: THREE.Scene) {
  // Stark fluorescent directional (main office light)
  const dir = new THREE.DirectionalLight(0xfff5e6, 2.5);
  dir.position.set(5, 10, 3);
  scene.add(dir);

  const dir2 = new THREE.DirectionalLight(0xffffff, 1.8);
  dir2.position.set(-5, 8, -5);
  scene.add(dir2);

  // High ambient fill for corporate feel
  const ambient = new THREE.AmbientLight(0xffffff, 2.0);
  scene.add(ambient);

  // Hemisphere for subtle color variation
  const hemi = new THREE.HemisphereLight(0xffffff, 0x887755, 1.5);
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

  const light = new THREE.PointLight(0xeeeeff, 0.8, 8);
  light.position.set(x, height - 0.1, z);
  group.add(light);

  return group;
}
