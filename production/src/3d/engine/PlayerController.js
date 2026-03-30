import * as THREE from 'three';

export class PlayerController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.camera.position.set(0, 1.7, 0); // Eye height
    this.enabled = true;
    this.moveSpeed = 25.5;
    this.sprintMultiplier = 3.0;
    this.mouseSensitivity = 0.001;
    this.pitchLimit = Math.PI * 0.44;
    this.pitch = 0;
    this.yaw = 0;
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.keys = {};
    this.isLocked = false;
    this.colliders = [];
    this.playerRadius = 0.4;

    // --- Movement animation state ---
    this.cameraBaseY = 1.7;          // logical eye height
    this.bobTime = 0;                 // running phase clock
    this.bobAmount = 0;               // current smoothed bob amplitude
    this.targetBobAmount = 0;
    this.cameraRoll = 0;              // strafe tilt (Z rotation)
    this.sprintLean = 0;              // forward pitch lean on sprint
    this.landImpact = 0;              // brief downward "footfall" thud

    domElement.addEventListener('click', () => {
      if (!this.isLocked && this.enabled) {
        domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === domElement;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked || !this.enabled) return;
      this.yaw -= e.movementX * this.mouseSensitivity;
      this.pitch -= e.movementY * this.mouseSensitivity;
      
      this.pitch = Math.max(-this.pitchLimit, Math.min(this.pitchLimit, this.pitch));

      this.euler.set(this.pitch, this.yaw, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(this.euler);
    });

    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  setColliders(colliders) {
    this.colliders = colliders;
  }

  lock() {
    // Implement if manual lock needed
  }

  unlock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    this.isLocked = false;
  }

  disable() {
    this.enabled = false;
    this.unlock();
    this.velocity.set(0, 0, 0);
    this.bobAmount = 0;
    this.targetBobAmount = 0;
    this.cameraRoll = 0;
    this.sprintLean = 0;
    this.landImpact = 0;
    this.camera.position.y = this.cameraBaseY;
    this.euler.set(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this.euler);
  }

  enable() {
    this.enabled = true;
  }

  update(delta) {
    if (!this.enabled || !this.isLocked) return;

    const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const speed = isSprinting ? this.moveSpeed * this.sprintMultiplier : this.moveSpeed;

    // Damping
    this.velocity.x *= 0.85;
    this.velocity.z *= 0.85;

    // Input direction
    this.direction.set(0, 0, 0);
    if (this.keys['KeyW']) this.direction.z -= 1;
    if (this.keys['KeyS']) this.direction.z += 1;
    if (this.keys['KeyA']) this.direction.x -= 1;
    if (this.keys['KeyD']) this.direction.x += 1;
    this.direction.normalize();

    const isMoving = this.direction.lengthSq() > 0.01;

    // Apply movement in camera's forward/right direction (XZ only)
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    this.velocity.x += (right.x * this.direction.x + forward.x * -this.direction.z) * speed * delta;
    this.velocity.z += (right.z * this.direction.x + forward.z * -this.direction.z) * speed * delta;

    // Proposed new position
    const newPos = this.camera.position.clone();
    newPos.x += this.velocity.x * delta;
    newPos.z += this.velocity.z * delta;

    // Simple collision check
    if (!this.checkCollision(newPos)) {
      this.camera.position.x = newPos.x;
      this.camera.position.z = newPos.z;
    } else {
      this.velocity.set(0, 0, 0);
    }

    // ---- Movement animations ----

    // Bob: corporate exhaustion — heavy, low-frequency trudge, bigger on sprint
    const bobFreq = isSprinting ? 11 : 7;
    const bobTarget = isSprinting ? 0.055 : (isMoving ? 0.022 : 0.003);
    if (isMoving) {
      this.bobTime += delta * bobFreq;
    } else {
      // Idle: nearly imperceptible breathing sway
      this.bobTime += delta * 1.6;
    }
    this.bobAmount += (bobTarget - this.bobAmount) * Math.min(1, 10 * delta);

    const bobY = Math.sin(this.bobTime) * this.bobAmount;
    // Footfall thud: when bob crosses zero going negative, hit slightly harder
    const prevSin = Math.sin(this.bobTime - delta * bobFreq);
    if (isMoving && prevSin > 0 && Math.sin(this.bobTime) <= 0) {
      this.landImpact = isSprinting ? 0.018 : 0.008;
    }
    this.landImpact *= Math.max(0, 1 - 18 * delta);

    this.camera.position.y = this.cameraBaseY + bobY - this.landImpact;

    // Strafe camera tilt: lean into the direction you're moving sideways
    const strafeTilt = -this.direction.x * 0.028;
    this.cameraRoll += (strafeTilt - this.cameraRoll) * Math.min(1, 6 * delta);

    // Sprint lean: slight pitch forward when sprinting
    const targetLean = (isSprinting && isMoving) ? 0.06 : 0;
    this.sprintLean += (targetLean - this.sprintLean) * Math.min(1, 5 * delta);

    // Apply tilt and lean to camera rotation
    this.euler.set(this.pitch - this.sprintLean, this.yaw, this.cameraRoll, 'YXZ');
    this.camera.quaternion.setFromEuler(this.euler);
  }

  checkCollision(pos) {
    const playerBox = new THREE.Box3(
      new THREE.Vector3(pos.x - this.playerRadius, pos.y - 1.7, pos.z - this.playerRadius),
      new THREE.Vector3(pos.x + this.playerRadius, pos.y, pos.z + this.playerRadius)
    );
    for (const box of this.colliders) {
      if (playerBox.intersectsBox(box)) return true;
    }
    return false;
  }

  get isPointerLocked() {
    return this.isLocked;
  }
}
