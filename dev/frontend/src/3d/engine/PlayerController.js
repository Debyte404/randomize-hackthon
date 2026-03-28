import * as THREE from 'three';

export class PlayerController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.camera.position.set(0, 1.7, 0); // Eye height
    this.enabled = true;
    this.moveSpeed = 10.0;
    this.sprintMultiplier = 2.5;
    this.mouseSensitivity = 0.002;
    this.pitchLimit = Math.PI * 0.44;
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.keys = {};
    this.isLocked = false;
    this.colliders = [];
    this.playerRadius = 0.4;

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
      this.euler.setFromQuaternion(this.camera.quaternion);
      this.euler.y -= e.movementX * this.mouseSensitivity;
      this.euler.x -= e.movementY * this.mouseSensitivity;
      this.euler.x = Math.max(-this.pitchLimit, Math.min(this.pitchLimit, this.euler.x));
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
    this.velocity.set(0, 0, 0);
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
