import { useState } from 'react';
import Game3D from './game3d/Game3D';
import './App.css';

function App() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="menu-screen">
        <h1 className="game-title">SHADOWINTERN</h1>
        <p className="subtitle">A Corporate Survival Simulation</p>
        <button className="start-btn" onClick={() => setStarted(true)}>
          START
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
