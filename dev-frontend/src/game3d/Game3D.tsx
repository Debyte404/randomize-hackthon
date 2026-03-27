import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
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

export default function Game3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const [escMenuOpen, setEscMenuOpen] = useState(false);
  // DEV MODE: All levels initially unlocked for easier testing. Will revert later.
  const [unlockedLevels, setUnlockedLevels] = useState<string[]>(['street', 'lobby', 'interview', 'office', 'desk']);

  // Refs to hold mutable game state
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const playerControllerRef = useRef<PlayerController | null>(null);
  const interviewSceneRef = useRef<InterviewScene | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1); // Force 1:1 pixel ratio for authentic retro chunkiness
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Scene + Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);

    // Post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // Aesthetic Retro Bloom
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.4, 0.85);
    composer.addPass(bloomPass);

    // BACK TO RETRO! Crunch it up.
    const pixelPass = new PixelationPass(2.5); // Slightly smaller pixel size for readability
    pixelPass.renderToScreen = true;
    composer.addPass(pixelPass);

    // Player
    const player = new PlayerController(camera, canvas);
    playerControllerRef.current = player;

    // Dialogue
    const dialogue = new DialogueSystem(setDialogueState);

    // Triggers
    const interviewScene = new InterviewScene();
    interviewSceneRef.current = interviewScene;

    let triggerHandler: (id: string) => void;

    const triggers = new TriggerManager((id) => {
      triggerHandler?.(id);
    });

    // Scene context
    const ctx: SceneContext = {
      scene,
      camera,
      player,
      dialogue,
      triggers,
      transitionTo: (name) => {
        setUnlockedLevels(prev => prev.includes(name) ? prev : [...prev, name]);
        sm.transitionTo(name);
      },
      setFade: setFadeOpacity,
      showChoice: (options, onSelect) => setChoiceState({ options, onSelect }),
      hideChoice: () => setChoiceState(null),
      showNarrator: (text) => setNarratorText(text),
      hideNarrator: () => setNarratorText(null),
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
          ctx.transitionTo('lobby');
          break;
        case 'receptionist':
          player.disable();
          dialogue.play(DIALOGUE.receptionist, () => {
            player.enable();
          });
          break;
        case 'hallway':
          ctx.transitionTo('interview');
          break;
        case 'sit':
          interviewScene.onSitDown(ctx);
          break;
        case 'coworkerPrinter':
          player.disable();
          dialogue.play(DIALOGUE.coworkerPrinter, () => {
            player.enable();
          });
          break;
        case 'coworkerDesk':
          player.disable();
          dialogue.play(DIALOGUE.coworkerDesk, () => {
            player.enable();
          });
          break;
        case 'yourDesk':
          ctx.transitionTo('desk');
          break;
      }
    };

    // Start with street scene
    setLoading(false);
    ctx.transitionTo('street');

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

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setEscMenuOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      renderer.dispose();
      composer.dispose();
    };
  }, []);

  return (
    <>
      {loading && <div className="loading-screen">LOADING...</div>}
      <div className="game-container" style={{ visibility: loading ? 'hidden' : 'visible' }}>
        <canvas ref={canvasRef} />
        <div className="crosshair" />

      {/* Fade overlay */}
      <div className="fade-overlay" style={{ opacity: fadeOpacity }} />

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

      {/* Pause / Esc Menu */}
      {escMenuOpen && (
        <div className="esc-menu-overlay">
          <div className="esc-menu-title">PAUSED</div>
          <button className="esc-menu-btn" onClick={() => {
            setEscMenuOpen(false);
            // After closing menu, re-acquire pointer lock if not in dialogue
            if (playerControllerRef.current && !dialogueState.active) {
              const canvas = canvasRef.current;
              if (canvas) canvas.requestPointerLock();
            }
          }}>RESUME</button>
          
          <button 
            className="esc-menu-btn" 
            disabled={!unlockedLevels.includes('street')}
            onClick={() => { setEscMenuOpen(false); sceneManagerRef.current?.transitionTo('street'); }}>
            STREET {!unlockedLevels.includes('street') && <span className="button-lock-icon">🔒</span>}
          </button>
          
          <button 
            className="esc-menu-btn" 
            disabled={!unlockedLevels.includes('lobby')}
            onClick={() => { setEscMenuOpen(false); sceneManagerRef.current?.transitionTo('lobby'); }}>
            LOBBY {!unlockedLevels.includes('lobby') && <span className="button-lock-icon">🔒</span>}
          </button>

          <button 
            className="esc-menu-btn" 
            disabled={!unlockedLevels.includes('interview')}
            onClick={() => { setEscMenuOpen(false); sceneManagerRef.current?.transitionTo('interview'); }}>
            INTERVIEW {!unlockedLevels.includes('interview') && <span className="button-lock-icon">🔒</span>}
          </button>

          <button 
            className="esc-menu-btn" 
            disabled={!unlockedLevels.includes('office')}
            onClick={() => { setEscMenuOpen(false); sceneManagerRef.current?.transitionTo('office'); }}>
            OFFICE {!unlockedLevels.includes('office') && <span className="button-lock-icon">🔒</span>}
          </button>

          <button 
            className="esc-menu-btn" 
            disabled={!unlockedLevels.includes('desk')}
            onClick={() => { setEscMenuOpen(false); sceneManagerRef.current?.transitionTo('desk'); }}>
            YOUR DESK {!unlockedLevels.includes('desk') && <span className="button-lock-icon">🔒</span>}
          </button>
        </div>
      )}
      </div>
    </>
  );
}
