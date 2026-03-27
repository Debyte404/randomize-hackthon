import { useState } from 'react';
import Game3D from './game3d/Game3D';
import './App.css';

function App() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="menu-screen">
        <h1 className="game-title" data-glitch="SHADOWINTERN">SHADOWINTERN</h1>
        <p className="subtitle">
          &gt; A Corporate Survival Simulation<span className="terminal-cursor"></span>
        </p>
        <button className="start-btn" onClick={() => setStarted(true)}>
          [ START INIT ]
        </button>
        <p className="disclaimer">
          "This game is based on a true story.<br />
          The names have been changed.<br />
          The suffering has not."
        </p>
      </div>
    );
  }

  return <Game3D />;
}

export default App;
