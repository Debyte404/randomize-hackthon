import * as THREE from 'three';

export class SceneManager {
  constructor(ctx) {
    this.scenes = new Map();
    this.currentScene = null;
    this.ctx = ctx;
    this.transitioning = false;
  }

  register(scene) {
    this.scenes.set(scene.name, scene);
  }

  async transitionTo(sceneName) {
    if (this.transitioning) return;
    this.transitioning = true;

    // Fade out
    await this.animateFade(0, 1, 0.6);

    // Cleanup current
    if (this.currentScene) {
      this.currentScene.cleanup();
    }

    // Clear scene
    while (this.ctx.scene.children.length > 0) {
      const child = this.ctx.scene.children[0];
      this.ctx.scene.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    }

    // Clear triggers
    this.ctx.triggers.clear();

    // Setup new scene
    const next = this.scenes.get(sceneName);
    if (!next) {
      console.error(`Scene "${sceneName}" not found`);
      this.transitioning = false;
      return;
    }

    this.currentScene = next;
    next.setup(this.ctx);

    // Transition audio to new scene
    this.ctx.audio.transitionTo(sceneName);

    // Show location title card
    const titles = {
      street: 'ACT I — THE STREET',
      lobby: 'ACT II — THE LOBBY',
      interview: 'ACT III — THE INTERVIEW',
      office: 'ACT IV — THE OFFICE',
      desk: 'ACT V — THE DESK',
    };
    const title = titles[sceneName];
    if (title) {
      this.ctx.showNarrator(title);
      await this.animateFade(1, 0, 0.8);
      await this.delay(1800);
      this.ctx.hideNarrator();
    } else {
      await this.animateFade(1, 0, 0.6);
    }
    this.transitioning = false;
  }

  update(delta) {
    this.currentScene?.update(delta, this.ctx);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  animateFade(from, to, duration) {
    return new Promise((resolve) => {
      const start = performance.now();
      const tick = () => {
        const elapsed = (performance.now() - start) / 1000;
        const t = Math.min(elapsed / duration, 1);
        this.ctx.setFade(from + (to - from) * t);
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };
      tick();
    });
  }
}
