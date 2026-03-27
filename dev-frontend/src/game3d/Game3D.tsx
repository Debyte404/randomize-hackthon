import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { PixelationPass } from './shaders/PixelationPass';
import { PlayerController } from './engine/PlayerController';
import { DialogueSystem } from './engine/DialogueSystem';
import { TriggerManager } from './engine/TriggerZone';
import { SceneManager } from './engine/SceneManager';
import type { SceneContext } from './engine/SceneManager';
import { StreetScene } from './scenes/StreetScene';
import { LobbyScene } from './scenes/LobbyScene';
import { InterviewScene } from './scenes/InterviewScene';
import { OfficeScene } from './scenes/OfficeScene';
import { DeskScene } from './scenes/DeskScene';
import { DIALOGUE } from './data/dialogue';
import { AudioSystem } from './engine/AudioSystem';

export default function Game3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioSystem | null>(null);
  const [fadeOpacity, setFadeOpacity] = useState(1);
  const [dialogueState, setDialogueState] = useState({
    active: false, npcName: '', text: '', canAdvance: false,
  });
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [choiceState, setChoiceState] = useState<{
    options: string[];
    onSelect: (i: number) => void;
  } | null>(null);
  const [narratorText, setNarratorText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Refs to hold mutable game state
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const interviewSceneRef = useRef<InterviewScene | null>(null);

  const handleTrigger = useCallback((id: string) => {
    const sm = sceneManagerRef.current;
    if (!sm) return;
    // We'll set this up after sm is created
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1); // We handle pixelation ourselves
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Scene + Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);

    // Post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const pixelPass = new PixelationPass(4.0);
    pixelPass.renderToScreen = true;
    composer.addPass(pixelPass);

    // Player
    const player = new PlayerController(camera, canvas);

    // Dialogue
    const dialogue = new DialogueSystem(setDialogueState);

    // Triggers
    const interviewScene = new InterviewScene();
    interviewSceneRef.current = interviewScene;

    let triggerHandler: (id: string) => void;

    const triggers = new TriggerManager((id) => {
      triggerHandler?.(id);
    });

    // Audio System
    const audio = new AudioSystem();
    audioRef.current = audio;

    // Scene context
    const ctx: SceneContext = {
      scene,
      camera,
      player,
      dialogue,
      triggers,
      transitionTo: (name) => sm.transitionTo(name),
      setFade: setFadeOpacity,
      showChoice: (options, onSelect) => setChoiceState({ options, onSelect }),
      hideChoice: () => setChoiceState(null),
      showNarrator: (text) => setNarratorText(text),
      hideNarrator: () => setNarratorText(null),
        audio,
    };

    // Scene Manager
    const sm = new SceneManager(ctx);
    sceneManagerRef.current = sm;

    // Register scenes
    const streetScene = new StreetScene();
    const lobbyScene = new LobbyScene();
    const officeScene = new OfficeScene();
    const deskScene = new DeskScene();

    sm.register(streetScene);
    sm.register(lobbyScene);
    sm.register(interviewScene);
    sm.register(officeScene);
    sm.register(deskScene);

    // Trigger handler
    triggerHandler = (id: string) => {
      switch (id) {
        case 'door':
          sm.transitionTo('lobby');
          break;
        case 'receptionist':
          player.disable();
          dialogue.play(DIALOGUE.receptionist, () => {
            player.enable();
          });
          break;
        case 'hallway':
          sm.transitionTo('interview');
          break;
        case 'sit':
          interviewScene.onSitDown(ctx);
          break;
        case 'coworkerPrinter':
          officeScene.showAngryReaction('coworkerPrinter');
          player.disable();
          dialogue.play(DIALOGUE.coworkerPrinter, () => {
            player.enable();
          });
          break;
        case 'coworkerDesk':
          officeScene.showAngryReaction('coworkerDesk');
          player.disable();
          dialogue.play(DIALOGUE.coworkerDesk, () => {
            player.enable();
          });
          break;
        case 'yourDesk':
          sm.transitionTo('desk');
          break;
      }
    };

    // Start with street scene
    setLoading(false);
    audio.start();
    sm.transitionTo('street');

    // Game loop
    const clock = new THREE.Clock();
    let animFrameId: number;

    const tick = () => {
      animFrameId = requestAnimationFrame(tick);
      const delta = Math.min(clock.getDelta(), 0.1);

      player.update(delta);
      dialogue.update(delta);
      triggers.update(player.camera.position);
      sm.update(delta);

      // Update interact prompt
      const prompt = triggers.getPrompt();
      setInteractPrompt(prompt);

      composer.render();
    };

    tick();

    // Resize handler
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      composer.dispose();
    };
  }, []);

  return (
    <div className="game-container">
      {loading && <div className="loading-screen">LOADING...</div>}
      <canvas ref={canvasRef} style={{ display: loading ? 'none' : 'block' }} />
      <div className="crosshair" style={{ display: loading ? 'none' : 'block' }} />

      {/* Fade overlay */}
      {!loading && <div className="fade-overlay" style={{ opacity: fadeOpacity }} />}

      {/* Dialogue */}
      {dialogueState.active && (
        <div className="dialogue-overlay">
          {dialogueState.npcName && (
            <div className="npc-name">{dialogueState.npcName}</div>
          )}
          <div>{dialogueState.text}</div>
          {dialogueState.canAdvance && (
            <div className="advance-hint">Click or press [E] to continue</div>
          )}
        </div>
      )}

      {/* Interact prompt */}
      {interactPrompt && !dialogueState.active && (
        <div className="interact-prompt">{interactPrompt}</div>
      )}

      {/* Interview choices */}
      {choiceState && (
        <div className="choice-overlay">
          {choiceState.options.map((opt, i) => (
            <button
              key={i}
              className="choice-btn"
              onClick={() => choiceState.onSelect(i)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Narrator text */}
      {narratorText && (
        <div className="narrator-overlay">{narratorText}</div>
      )}
    </div>
  );
}



