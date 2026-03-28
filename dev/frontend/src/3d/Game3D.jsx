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
import { StreetScene } from './scenes/StreetScene';
import { LobbyScene } from './scenes/LobbyScene';
import { InterviewScene } from './scenes/InterviewScene';
import { OfficeScene } from './scenes/OfficeScene';
import { DeskScene } from './scenes/DeskScene';
import { AudioSystem } from './engine/AudioSystem';
import { DIALOGUE } from './data/dialogue';
import { useGameStore } from '../store/useGameStore';

export default function Game3D() {
  const canvasRef = useRef(null);
  const [fadeOpacity, setFadeOpacity] = useState(1);
  const [dialogueState, setDialogueState] = useState({
    active: false, npcName: '', text: '', canAdvance: false,
  });
  const [interactPrompt, setInteractPrompt] = useState(null);
  const [choiceState, setChoiceState] = useState(null);
  const [narratorText, setNarratorText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [escMenuOpen, setEscMenuOpen] = useState(false);
  const [unlockedLevels, setUnlockedLevels] = useState(['street', 'lobby', 'interview', 'office', 'desk']);

  // Refs to hold mutable game state
  const sceneManagerRef = useRef(null);
  const playerControllerRef = useRef(null);
  const interviewSceneRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0; // Reset to source scale
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows from dev-frontend

    // Scene + Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);

    // Post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    // Aesthetic Retro Bloom
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), 0.4, 0.4, 0.9);
    composer.addPass(bloomPass);

    const pixelPass = new PixelationPass(2.0);
    pixelPass.renderToScreen = true;
    composer.addPass(pixelPass);

    // Player
    const player = new PlayerController(camera, canvas);
    playerControllerRef.current = player;

    // Audio
    const audio = new AudioSystem();
    audio.start();
    audioRef.current = audio;

    // Dialogue
    const dialogue = new DialogueSystem(setDialogueState);

    // Triggers
    const interviewScene = new InterviewScene();
    interviewSceneRef.current = interviewScene;

    let triggerHandler;

    const triggers = new TriggerManager((id) => {
      triggerHandler?.(id);
    });

    // Scene context
    const ctx = {
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
      audio,
    };

    // Scene Manager
    const sm = new SceneManager(ctx);
    sceneManagerRef.current = sm;

    // Register scenes
    sm.register(new StreetScene());
    sm.register(new LobbyScene());
    sm.register(interviewScene);
    sm.register(new OfficeScene());
    sm.register(new DeskScene());

    // Trigger handler
    triggerHandler = (id) => {
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
    let animFrameId;

    const tick = () => {
      animFrameId = requestAnimationFrame(tick);
      const delta = Math.min(clock.getDelta(), 0.1);

      player.update(delta);
      dialogue.update(delta);
      triggers.update(player.camera.position);
      sm.update(delta);

      const prompt = triggers.getPrompt();
      setInteractPrompt(prompt);

      composer.render();
    };

    tick();

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const onKeyDown = (e) => {
      if (e.code === 'Escape') {
        setEscMenuOpen(prev => {
          const next = !prev;
          audioRef.current?.setMuted(next);
          // When closing menu, re-acquire pointer lock if not in dialogue
          if (!next && playerControllerRef.current && !dialogueState.active) {
            const canvas = canvasRef.current;
            if (canvas) canvas.requestPointerLock();
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      renderer.dispose();
      composer.dispose();
      audio.dispose();
    };
  }, []);

  return (
    <>
      {loading && <div className="fixed inset-0 flex items-center justify-center bg-black text-white font-mono z-[100]">LOADING...</div>}
      <div className="fixed inset-0 w-full h-full overflow-hidden" style={{ visibility: loading ? 'hidden' : 'visible' }}>
        <canvas ref={canvasRef} className="w-full h-full" />
        <div className="fixed top-1/2 left-1/2 w-1 h-1 bg-white opacity-50 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Fade overlay */}
      <div className="fixed inset-0 bg-black pointer-events-none z-50 transition-opacity duration-300" style={{ opacity: fadeOpacity }} />

      {/* Dialogue */}
      {dialogueState.active && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-[800px] bg-black/80 border-2 border-white p-6 font-mono text-white text-lg z-40">
          {dialogueState.npcName && (
            <div className="text-nexus-accent font-bold mb-2 uppercase">{dialogueState.npcName}</div>
          )}
          <div>{dialogueState.text}</div>
          {dialogueState.canAdvance && (
            <div className="mt-4 text-xs opacity-50 animate-pulse text-right">Click or press [E] to continue</div>
          )}
        </div>
      )}

      {/* Interact prompt */}
      {interactPrompt && !dialogueState.active && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 translate-y-8 bg-black/50 px-4 py-2 border border-white/20 text-white font-mono z-30 uppercase tracking-widest text-sm">
          {interactPrompt}
        </div>
      )}

      {/* Interview choices */}
      {choiceState && (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 z-[60]">
          {choiceState.options.map((opt, i) => (
            <button
              key={i}
              className="bg-black/90 border-2 border-white px-8 py-3 text-white font-mono text-xl hover:bg-white hover:text-black transition-colors min-w-[300px]"
              onClick={() => choiceState.onSelect(i)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Narrator text */}
      {narratorText && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 text-white font-mono text-center text-3xl tracking-tighter uppercase max-w-4xl leading-tight text-shadow-glow z-20">
            {narratorText}
        </div>
      )}

      {/* Pause / Esc Menu */}
      {escMenuOpen && (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-2 bg-black/90 z-[200] font-mono">
          <div className="text-4xl font-black mb-8 tracking-tighter">PAUSED</div>
          <button className="bg-white text-black px-12 py-2 w-64 font-bold hover:bg-nexus-accent hover:text-black transition-all" onClick={() => {
            setEscMenuOpen(false);
            if (playerControllerRef.current && !dialogueState.active) {
              const canvas = canvasRef.current;
              if (canvas) canvas.requestPointerLock();
            }
          }}>RESUME</button>
          
          {['street', 'lobby', 'interview', 'office', 'desk'].map(level => (
            <button 
              key={level}
              className="border-2 border-white/20 px-12 py-2 w-64 hover:border-white transition-all disabled:opacity-20 flex justify-between uppercase"
              disabled={!unlockedLevels.includes(level)}
              onClick={() => { setEscMenuOpen(false); sceneManagerRef.current?.transitionTo(level); }}>
              {level} {!unlockedLevels.includes(level) && <span>🔒</span>}
            </button>
          ))}

          <button 
              className="mt-8 text-xs underline opacity-40 hover:opacity-100"
              onClick={() => {
                  setEscMenuOpen(false);
                  useGameStore.getState().setGameState('START');
              }}
          >
              // ABORT SIMULATION
          </button>
        </div>
      )}
      </div>
    </>
  );
}
