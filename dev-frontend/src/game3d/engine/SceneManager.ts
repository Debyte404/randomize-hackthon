import * as THREE from 'three';
import { PlayerController } from './PlayerController';
import { DialogueSystem } from './DialogueSystem';
import { TriggerManager } from './TriggerZone';
import { AudioSystem } from './AudioSystem';

export interface GameScene {
  name: string;
  setup(ctx: SceneContext): void;
  update(delta: number, ctx: SceneContext): void;
  cleanup(): void;
}

export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  player: PlayerController;
  dialogue: DialogueSystem;
  triggers: TriggerManager;
  transitionTo: (sceneName: string) => void;
  setFade: (opacity: number) => void;
  showChoice: (options: string[], onSelect: (index: number) => void) => void;
  hideChoice: () => void;
  showNarrator: (text: string) => void;
  hideNarrator: () => void;
  audio: AudioSystem;
}

export class SceneManager {
  private scenes: Map<string, GameScene> = new Map();
  private currentScene: GameScene | null = null;
  private ctx: SceneContext;
  private transitioning = false;

  constructor(ctx: SceneContext) {
    this.ctx = ctx;
  }

  register(scene: GameScene) {
    this.scenes.set(scene.name, scene);
  }

  async transitionTo(sceneName: string) {
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

      if (this.ctx.audio) {
        this.ctx.audio.transitionTo(sceneName);
      }

    // Fade in
    await this.animateFade(1, 0, 0.6);
    this.transitioning = false;
  }

  update(delta: number) {
    this.currentScene?.update(delta, this.ctx);
  }

  private animateFade(from: number, to: number, duration: number): Promise<void> {
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

