import * as THREE from 'three';

export class TriggerZone {
  constructor(config) {
    this.id = config.id;
    this.once = config.once;
    this.promptText = config.promptText || '[E] Interact';
    this.autoTrigger = config.autoTrigger || false;
    this.fired = false;
    this.isPlayerInside = false;

    const half = config.size.clone().multiplyScalar(0.5);
    // Expand the Y size bounds massively so player's camera height doesn't easily miss the box
    this.box = new THREE.Box3(
      config.position.clone().sub(half).setY(-10),
      config.position.clone().add(half).setY(10)
    );
  }

  check(playerPos, ePressed, onTrigger, onProximity) {
    if (this.once && this.fired) return;

    const inside = this.box.containsPoint(playerPos);

    if (inside) {
      if (this.autoTrigger && !this.isPlayerInside) {
        this.fired = true;
        onTrigger(this.id);
      } else if (!this.autoTrigger) {
        onProximity?.(this.id, this.promptText);
        if (ePressed) {
          this.fired = true;
          onTrigger(this.id);
        }
      }
    }

    this.isPlayerInside = inside;
  }

  reset() {
    this.fired = false;
    this.isPlayerInside = false;
  }
}

export class TriggerManager {
  constructor(onTrigger) {
    this.triggers = [];
    this.ePressed = false;
    this.onTrigger = onTrigger;
    this.proximityId = null;
    this.proximityPrompt = '';

    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE') this.ePressed = true;
    });
    document.addEventListener('keyup', (e) => {
      if (e.code === 'KeyE') this.ePressed = false;
    });
  }

  add(config) {
    this.triggers.push(new TriggerZone(config));
  }

  clear() {
    this.triggers = [];
  }

  update(playerPos) {
    this.proximityId = null;
    this.proximityPrompt = '';

    for (const trigger of this.triggers) {
      trigger.check(
        playerPos,
        this.ePressed,
        this.onTrigger,
        (id, prompt) => {
          this.proximityId = id;
          this.proximityPrompt = prompt;
        }
      );
    }

    // Consume E press
    this.ePressed = false;
  }

  getPrompt() {
    return this.proximityId ? this.proximityPrompt : null;
  }
}
