import React from 'react';
import { useGameStore } from '../../store/useGameStore';

const MainMenu = () => {
  const { settings, updateSettings, clearHistory, playthroughs, highScore, setGameState } = useGameStore();

  const handleBegin = () => {
    if (settings.skip3D) {
      setGameState('2D_WORK');
    } else {
      setGameState('3D_STREET');
    }
  };

  return (
    <div className="crt-screen bg-black flex flex-col items-center justify-center p-8 font-mono">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 z-30">
        
        {/* Left Column: Actions & Settings */}
        <div className="flex flex-col gap-8">
          <button 
            onClick={() => setGameState('START')}
            className="text-left text-xs opacity-40 hover:opacity-100 hover:text-nexus-accent transition-all flex items-center gap-2"
          >
            ← RETURN TO TERMINAL
          </button>
          
          <section>
            <h2 className="text-4xl font-bold mb-6 border-b border-nexus-accent/30 tracking-tighter uppercase">Employment Protocol</h2>
            <button 
              onClick={handleBegin}
              className="w-full py-4 bg-nexus-accent text-black font-black text-2xl hover:bg-white transition-colors uppercase tracking-widest clip-path-polygon-[0_0,100%_0,95%_100%,0%_100%]"
            >
              Begin the game
            </button>
          </section>

          <section className="bg-nexus-accent/5 p-6 border border-nexus-accent/20">
            <h3 className="text-xl font-bold mb-4 opacity-70">// Settings</h3>
            
            <div className="flex flex-col gap-4">
              <label className="flex items-center justify-between group cursor-pointer">
                <span>Master Volume</span>
                <input 
                  type="range" 
                  min="0" max="1" step="0.1" 
                  value={settings.volume} 
                  onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
                  className="accent-nexus-accent"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className={settings.skip3D ? 'text-nexus-accent' : 'opacity-60'}>Bypass 3D Orientation</span>
                <input 
                  type="checkbox" 
                  checked={settings.skip3D} 
                  onChange={(e) => updateSettings({ skip3D: e.target.checked })}
                  className="w-5 h-5 accent-nexus-accent"
                />
              </label>

              <div className="flex items-center justify-between">
                <span>Visual Fidelity</span>
                <select 
                  value={settings.graphics}
                  onChange={(e) => updateSettings({ graphics: e.target.value })}
                  className="bg-black border border-nexus-accent/40 text-xs p-1 outline-none"
                >
                  <option value="ULTRAKILL">ULTRAKILL (Low)</option>
                  <option value="STANDARD">STANDARD (High)</option>
                </select>
              </div>
            </div>
          </section>

          <button 
            onClick={() => {
              if(window.confirm("Warning: Asset liquidation will result in total data loss. Proceed?")) clearHistory();
            }}
            className="text-xs opacity-40 hover:opacity-100 hover:text-red-500 uppercase text-left transition-all"
          >
            Liquidate Personnel Record (Clear History)
          </button>
        </div>

        {/* Right Column: Personnel History */}
        <div className="flex flex-col gap-6">
          <section className="bg-white/5 p-8 border-l-4 border-nexus-accent">
            <div className="text-xs opacity-50 mb-1 uppercase tracking-widest">Global Productivity High-Water Mark</div>
            <div className="text-7xl font-black text-white leading-none">{highScore}</div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4 opacity-70 tracking-tighter uppercase">// Previous Assignments</h3>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {playthroughs.length === 0 ? (
                <div className="text-xs opacity-30 italic">No historical data found in NexusCorp archives.</div>
              ) : (
                playthroughs.map((log, i) => (
                  <div key={i} className="text-xs flex justify-between p-2 border border-white/10 hover:bg-white/5 transition-colors">
                    <span className="opacity-60">{log.date}</span>
                    <span className="font-bold text-nexus-accent">{log.score} pts</span>
                    <span className="hidden lg:inline opacity-40 italic">{log.ending}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 p-4 opacity-10 text-[10px] uppercase pointer-events-none">
        Unauthorized access punishable by termination.
      </div>
    </div>
  );
};

export default MainMenu;
