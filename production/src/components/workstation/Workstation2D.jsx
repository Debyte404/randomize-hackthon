import { useEffect, useRef, useState } from 'react'
import { useWorkStore } from '../../store/useWorkStore'
import { useGameStore } from '../../store/useGameStore'
import './Workstation2D.css'

// ─── Sound helpers (shared AudioContext to avoid browser limit) ──
let _audioCtx = null
const getAudioCtx = () => {
  if (!_audioCtx || _audioCtx.state === 'closed') _audioCtx = new AudioContext()
  if (_audioCtx.state === 'suspended') _audioCtx.resume().catch(() => {})
  return _audioCtx
}
const playBlip = (vol = 0.3) => { try { const v = useGameStore.getState().settings.volume; if (v <= 0) return; const c = getAudioCtx(); const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'square'; o.frequency.setValueAtTime(800, c.currentTime); o.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.08); g.gain.setValueAtTime(vol * v, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08); o.start(); o.stop(c.currentTime + 0.1) } catch(e){} }
const playError = () => { try { const v = useGameStore.getState().settings.volume; if (v <= 0) return; const c = getAudioCtx(); const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'sawtooth'; o.frequency.setValueAtTime(200, c.currentTime); o.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.3); g.gain.setValueAtTime(0.4 * v, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3); o.start(); o.stop(c.currentTime + 0.35) } catch(e){} }
const playSuccess = () => { try { const v = useGameStore.getState().settings.volume; if (v <= 0) return; const c = getAudioCtx(); const o = c.createOscillator(); const g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'sine'; o.frequency.setValueAtTime(523, c.currentTime); o.frequency.setValueAtTime(659, c.currentTime + 0.1); o.frequency.setValueAtTime(784, c.currentTime + 0.2); g.gain.setValueAtTime(0.3 * v, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35); o.start(); o.stop(c.currentTime + 0.4) } catch(e){} }

const GLITCH = '█▓░▒╬╦╩╗╔╣║▐▀▄'
const garble = (text, b) => { if (b < 0.3) return text; return text.split('').map(c => c === ' ' ? c : Math.random() < (b-0.3)*0.8 ? GLITCH[Math.floor(Math.random()*GLITCH.length)] : c).join('') }

const SAFE_EMPTY_ARRAY = []
const SAFE_EMPTY_OBJECT = {}

// ─── Right-Click Context Menu ────────────────────────────────────
const ContextMenu = ({ x, y, onClose }) => {
  const menuRef = useRef(null)
  useEffect(() => {
    const handler = () => onClose()
    window.addEventListener('click', handler)
    window.addEventListener('contextmenu', handler)
    return () => { window.removeEventListener('click', handler); window.removeEventListener('contextmenu', handler) }
  }, [onClose])

  const doCopy = () => {
    const sel = window.getSelection()?.toString()
    if (sel) navigator.clipboard?.writeText(sel).catch(() => {})
    playBlip(0.1)
    onClose()
  }
  const doPaste = async () => {
    try {
      const text = await navigator.clipboard?.readText()
      const el = document.activeElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        const start = el.selectionStart, end = el.selectionEnd
        const val = el.value
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(el, val.substring(0, start) + text + val.substring(end))
          el.dispatchEvent(new Event('input', { bubbles: true }))
          el.setSelectionRange(start + text.length, start + text.length)
        }
      }
    } catch(e) {}
    playBlip(0.1)
    onClose()
  }
  const doCut = () => {
    const el = document.activeElement
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
      const sel = el.value.substring(el.selectionStart, el.selectionEnd)
      if (sel) {
        navigator.clipboard?.writeText(sel).catch(() => {})
        const start = el.selectionStart
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(el, el.value.substring(0, el.selectionStart) + el.value.substring(el.selectionEnd))
          el.dispatchEvent(new Event('input', { bubbles: true }))
          el.setSelectionRange(start, start)
        }
      }
    }
    playBlip(0.1)
    onClose()
  }
  const doSelectAll = () => {
    const el = document.activeElement
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
      el.select()
    } else {
      window.getSelection()?.selectAllChildren(document.querySelector('.nxos-desktop') || document.body)
    }
    playBlip(0.1)
    onClose()
  }
  const doRefresh = () => {
    playBlip(0.1)
    onClose()
  }

  // Clamp menu position to viewport
  const style = { left: Math.min(x, window.innerWidth - 160), top: Math.min(y, window.innerHeight - 160) }

  return (
    <div className="nxos-context-menu" ref={menuRef} style={style} onClick={e => e.stopPropagation()}>
      <div className="nxos-ctx-item" onClick={doCut}><span className="nxos-ctx-key">✂</span> Cut <span className="nxos-ctx-shortcut">Ctrl+X</span></div>
      <div className="nxos-ctx-item" onClick={doCopy}><span className="nxos-ctx-key">📋</span> Copy <span className="nxos-ctx-shortcut">Ctrl+C</span></div>
      <div className="nxos-ctx-item" onClick={doPaste}><span className="nxos-ctx-key">📄</span> Paste <span className="nxos-ctx-shortcut">Ctrl+V</span></div>
      <div className="nxos-ctx-divider"/>
      <div className="nxos-ctx-item" onClick={doSelectAll}><span className="nxos-ctx-key"> </span> Select All <span className="nxos-ctx-shortcut">Ctrl+A</span></div>
      <div className="nxos-ctx-divider"/>
      <div className="nxos-ctx-item" onClick={doRefresh}><span className="nxos-ctx-key">🔄</span> Refresh</div>
    </div>
  )
}

// ─── How to Play / Tutorial Dialog ──────────────────────────────
const HowToPlayDialog = ({ onClose }) => {
  const [page, setPage] = useState(0)
  const pages = [
    {
      title: '🎮 Welcome to NexusOS 98',
      content: (
        <div className="nxos-tutorial-page">
          <p className="nxos-tut-intro">You are <strong>INTERN_9921</strong> at NexusCorp. Your goal: survive the workday without burning out.</p>
          <div className="nxos-tut-section">
            <div className="nxos-tut-heading">THE BASICS</div>
            <ul className="nxos-tut-list">
              <li><strong>Double-click</strong> desktop icons to open apps</li>
              <li><strong>Right-click</strong> anywhere for context menu (Copy/Paste)</li>
              <li>Use the <strong>Start menu</strong> for all apps & settings</li>
              <li>Check the <strong>taskbar</strong> at the bottom for open apps & stats</li>
            </ul>
          </div>
          <div className="nxos-tut-section">
            <div className="nxos-tut-heading">YOUR OBJECTIVE</div>
            <p>Complete tasks, answer emails, and survive meetings to earn <strong>points</strong> and <strong>XP</strong>. Don't let your burnout meter hit 100% or it's game over!</p>
          </div>
        </div>
      )
    },
    {
      title: '📋 ShadowJira & Puzzles',
      content: (
        <div className="nxos-tutorial-page">
          <div className="nxos-tut-section">
            <div className="nxos-tut-heading">HOW TASKS WORK</div>
            <ul className="nxos-tut-list">
              <li>Open <strong>ShadowJira</strong> to see your task board</li>
              <li><strong>Click</strong> or <strong>drag</strong> cards: Backlog → In Progress → Done</li>
              <li>Moving a task to Done opens a <strong>puzzle</strong> — solve it for points!</li>
              <li>Tasks have <strong>deadlines</strong> — expired tasks hurt your score</li>
              <li>Higher priority tasks (CRITICAL/HIGH) = more points</li>
            </ul>
          </div>
          <div className="nxos-tut-section">
            <div className="nxos-tut-heading">PUZZLE TYPES</div>
            <div className="nxos-tut-grid">
              <span>🧠 Neural Network</span><span>Wire inputs to hidden nodes</span>
              <span>🔍 Pattern Match</span><span>Pick the correct pattern</span>
              <span>🔗 Node Connection</span><span>Click nodes in order</span>
              <span>📊 Sorting</span><span>Arrange items correctly</span>
              <span>🧩 Logic Grid</span><span>Solve the logic problem</span>
              <span>🗺️ Pathfinding</span><span>Navigate the maze</span>
              <span>⌨️ Text Input</span><span>Type the answer</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '⚡ Combos, XP & Scoring',
      content: (
        <div className="nxos-tutorial-page">
          <div className="nxos-tut-section">
            <div className="nxos-tut-heading">COMBO SYSTEM</div>
            <ul className="nxos-tut-list">
              <li>Complete tasks within <strong>30 seconds</strong> of each other for a combo!</li>
              <li>Each combo level adds <strong>+0.5x</strong> to your multiplier (max 5x)</li>
              <li>The combo counter appears on screen when active</li>
            </ul>
          </div>
          <div className="nxos-tut-section">
            <div className="nxos-tut-heading">XP & LEVELS</div>
            <ul className="nxos-tut-list">
              <li>Earn XP from tasks, emails, and meetings</li>
              <li>Level up to face harder challenges and earn more points</li>
              <li>Your level shows in the taskbar tray: <strong>Lv.X</strong></li>
            </ul>
          </div>
          <div className="nxos-tut-section">
            <div className="nxos-tut-heading">ACHIEVEMENTS</div>
            <p>Unlock achievements for milestones like first task, speed completions, and high combos. They pop up as gold banners!</p>
          </div>
        </div>
      )
    },
    {
      title: '🔥 Burnout & Survival',
      content: (
        <div className="nxos-tutorial-page">
          <div className="nxos-tut-section">
            <div className="nxos-tut-heading">BURNOUT METER</div>
            <ul className="nxos-tut-list">
              <li>Burnout rises over time and when tasks expire</li>
              <li>At <strong>50%+</strong> — screen starts glitching, text garbles</li>
              <li>At <strong>70%+</strong> — critical effects, screen shakes</li>
              <li>At <strong>100%</strong> — GAME OVER (Blue Screen of Death)</li>
              <li>Completing tasks <strong>reduces</strong> burnout. Take coffee breaks!</li>
            </ul>
          </div>
          <div className="nxos-tut-section">
            <div className="nxos-tut-heading">EVENTS TO WATCH FOR</div>
            <div className="nxos-tut-grid">
              <span>🚨 Boss Alert</span><span>Close all non-work apps in 5 seconds!</span>
              <span>📅 Meetings</span><span>Join meetings on time or lose points</span>
              <span>💬 Slack</span><span>Reply to messages for bonus points</span>
              <span>📧 Emails</span><span>Read emails before they expire</span>
              <span>☕ Coffee</span><span>Accept coffee breaks to lower burnout</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '⌨️ Keyboard Shortcuts',
      content: (
        <div className="nxos-tutorial-page">
          <div className="nxos-tut-section">
            <div className="nxos-tut-heading">QUICK KEYS</div>
            <div className="nxos-tut-grid shortcuts">
              <span className="nxos-tut-key">Ctrl+1</span><span>Open ShadowJira</span>
              <span className="nxos-tut-key">Ctrl+2</span><span>Open QuickOutlook</span>
              <span className="nxos-tut-key">Ctrl+3</span><span>Open NexusNet</span>
              <span className="nxos-tut-key">Ctrl+4</span><span>Open Terminal</span>
              <span className="nxos-tut-key">Ctrl+5</span><span>Open Notepad</span>
              <span className="nxos-tut-key">Ctrl+6</span><span>Open My Documents</span>
              <span className="nxos-tut-key">Ctrl+7</span><span>Open My Computer</span>
              <span className="nxos-tut-key">Escape</span><span>Close active window</span>
              <span className="nxos-tut-key">Ctrl+C/V</span><span>Copy / Paste</span>
              <span className="nxos-tut-key">Right-click</span><span>Context menu</span>
            </div>
          </div>
          <div className="nxos-tut-section">
            <div className="nxos-tut-heading">DIFFICULTY MODES</div>
            <div className="nxos-tut-grid shortcuts">
              <span>🎯 Balanced</span><span>Normal pace, good for learning</span>
              <span>⏱️ Deadline Rush</span><span>Faster tasks, tighter deadlines</span>
              <span>📅 Meeting Hell</span><span>Non-stop meetings interrupt you</span>
              <span>💀 Nightmare</span><span>Everything at once. Good luck.</span>
            </div>
            <p style={{marginTop:'6px',color:'#808080',fontSize:'0.45rem'}}>Change difficulty in the Start menu.</p>
          </div>
          <div className="nxos-tut-ready">
            <p>You're ready. Open <strong>ShadowJira</strong> and start completing tickets!</p>
            <p style={{color:'#808080'}}>Tip: Open this guide anytime from Start → Help</p>
          </div>
        </div>
      )
    },
  ]

  return (
    <div className="nxos-puzzle-overlay" onClick={e => e.stopPropagation()}>
      <div className="nxos-tutorial-dialog">
        <div className="nxos-window-titlebar" style={{background:'linear-gradient(90deg,#000080,#1084d0)'}}>
          <div className="nxos-window-titlebar-left"><span className="nxos-window-icon">❓</span><span className="nxos-window-title">How to Play — ShadowIntern</span></div>
          <div className="nxos-window-buttons"><button className="nxos-win-btn close" onClick={()=>{onClose();playBlip()}}>✕</button></div>
        </div>
        <div className="nxos-tutorial-body">
          <div className="nxos-tutorial-title">{pages[page].title}</div>
          {pages[page].content}
          <div className="nxos-tutorial-nav">
            <button className="nxos-btn" disabled={page===0} onClick={()=>{setPage(p=>p-1);playBlip()}}>◄ Back</button>
            <span className="nxos-tutorial-dots">{pages.map((_,i)=><span key={i} className={`nxos-tut-dot ${i===page?'active':''}`}/>)}</span>
            {page < pages.length - 1 ? (
              <button className="nxos-btn" onClick={()=>{setPage(p=>p+1);playBlip()}}>Next ►</button>
            ) : (
              <button className="nxos-btn" style={{background:'#000080',color:'#fff',fontWeight:'bold'}} onClick={()=>{onClose();playBlip()}}>Let's Go!</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Desktop Icon ────────────────────────────────────────────────
const DesktopIcon = ({ icon, label, onClick }) => (
  <div className="nxos-desktop-icon" onDoubleClick={() => { onClick(); playBlip() }}>
    <div className="nxos-icon-img">{icon}</div>
    <div className="nxos-icon-label">{label}</div>
  </div>
)

// ─── Start Menu ──────────────────────────────────────────────────
const GAME_MODES = [
  { id: 'balanced', icon: '🎯', label: 'Balanced' },
  { id: 'deadline_rush', icon: '⏱️', label: 'Deadline Rush' },
  { id: 'meeting_hell', icon: '📅', label: 'Meeting Hell' },
  { id: 'nightmare', icon: '💀', label: 'Nightmare' },
]

const StartMenu = ({ onClose, onOpenApp, onShowHelp }) => {
  const gameMode = useWorkStore(s => s.gameMode)
  const setGameMode = useWorkStore(s => s.setGameMode)
  return (
    <div className="nxos-start-menu" onClick={e => e.stopPropagation()}>
      <div className="nxos-start-sidebar"><span className="nxos-start-sidebar-text">NexusOS 98</span></div>
      <div className="nxos-start-items">
        {[['jira','📋','ShadowJira™'],['email','📧','QuickOutlook™'],['browser','🌐','NexusNet Explorer'],['notepad','📝','Notepad.exe'],['terminal','⬛','Command Prompt']].map(([id,ic,nm])=>(
          <div key={id} className="nxos-start-item" onClick={()=>{onOpenApp(id);onClose()}}><span className="nxos-start-item-icon">{ic}</span> {nm}</div>
        ))}
        <div className="nxos-start-divider"/>
        {[['mycomputer','💻','My Computer'],['documents','📁','My Documents']].map(([id,ic,nm])=>(
          <div key={id} className="nxos-start-item" onClick={()=>{onOpenApp(id);onClose()}}><span className="nxos-start-item-icon">{ic}</span> {nm}</div>
        ))}
        <div className="nxos-start-divider"/>
        <div className="nxos-start-item" style={{cursor:'default',fontWeight:'bold',fontSize:'0.5rem',color:'#808080'}}>
          <span className="nxos-start-item-icon">⚙️</span> Difficulty
        </div>
        {GAME_MODES.map(m => (
          <div key={m.id} className={`nxos-start-item ${gameMode === m.id ? 'selected' : ''}`}
            style={gameMode === m.id ? {background:'#000080',color:'#fff'} : {}}
            onClick={() => { setGameMode(m.id); playBlip(); onClose() }}>
            <span className="nxos-start-item-icon">{m.icon}</span> {m.label}
          </div>
        ))}
        <div className="nxos-start-divider"/>
        <div className="nxos-start-item" onClick={()=>{onShowHelp();onClose()}}><span className="nxos-start-item-icon">❓</span> Help — How to Play</div>
        <div className="nxos-start-item shutdown" onClick={()=>{useGameStore.getState().setGameState('START');useWorkStore.getState().reset();onClose()}}><span className="nxos-start-item-icon">🔌</span> Shut Down...</div>
      </div>
    </div>
  )
}

// ─── Win98 Window Chrome ─────────────────────────────────────────
const Win98Window = ({ title, icon, children, onClose, onMinimize, isActive, zIndex, menuItems }) => (
  <div className={`nxos-window ${isActive ? 'active' : ''}`} style={{ zIndex }}>
    <div className="nxos-window-titlebar">
      <div className="nxos-window-titlebar-left"><span className="nxos-window-icon">{icon}</span><span className="nxos-window-title">{title}</span></div>
      <div className="nxos-window-buttons">
        <button className="nxos-win-btn minimize" onClick={onMinimize}>_</button>
        <button className="nxos-win-btn maximize">□</button>
        <button className="nxos-win-btn close" onClick={onClose}>✕</button>
      </div>
    </div>
    <div className="nxos-window-menubar">{(menuItems||['File','Edit','View','Help']).map(m=><span key={m}>{m}</span>)}</div>
    <div className="nxos-window-content">{children}</div>
    <div className="nxos-window-statusbar">Ready</div>
  </div>
)

// ═══════════════════════════════════════════════════════════════════
// VISUAL PUZZLE RENDERERS
// ═══════════════════════════════════════════════════════════════════

const NeuralNetworkPuzzle = ({ puzzle }) => {
  const wires = useWorkStore(s => s.puzzleState.wires || SAFE_EMPTY_ARRAY)
  const setPuzzleState = useWorkStore(s => s.setPuzzleState)
  const [dragging, setDragging] = useState(null) // inputIdx being dragged
  const toggleWire = (inputIdx, hiddenIdx) => {
    setPuzzleState(prev => {
      const existing = (prev.wires || []).findIndex(w => w[0] === inputIdx && w[1] === hiddenIdx)
      if (existing >= 0) return { ...prev, wires: prev.wires.filter((_, i) => i !== existing) }
      return { ...prev, wires: [...(prev.wires || []), [inputIdx, hiddenIdx]] }
    })
    playBlip(0.1)
  }
  return (
    <div className="nxos-nn-puzzle">
      <div className="nxos-nn-desc">{puzzle.description}</div>
      <div className="nxos-nn-grid">
        <div className="nxos-nn-col">
          <div className="nxos-nn-label">INPUTS</div>
          {puzzle.inputs.map((inp, i) => (
            <div key={i} className="nxos-nn-node input" onClick={() => setDragging(dragging === i ? null : i)} style={{outline: dragging === i ? '2px solid #ff0' : 'none'}}>
              {inp}
            </div>
          ))}
        </div>
        <div className="nxos-nn-col">
          <div className="nxos-nn-label">HIDDEN</div>
          {Array.from({length: puzzle.hiddenCount}, (_, i) => {
            const connected = wires.filter(w => w[1] === i).map(w => w[0])
            return (
              <div key={i} className={`nxos-nn-node node-hidden ${connected.length > 0 ? 'active' : ''}`}
                onClick={() => { if (dragging !== null) { toggleWire(dragging, i); setDragging(null) } }}>
                H{i+1} {connected.length > 0 && `←[${connected.map(c => puzzle.inputs[c].split('=')[0]).join(',')}]`}
              </div>
            )
          })}
        </div>
        <div className="nxos-nn-col">
          <div className="nxos-nn-label">OUTPUT</div>
          <div className="nxos-nn-node output">Target: {puzzle.target}</div>
        </div>
      </div>
      <div className="nxos-nn-hint">Click an input, then click a hidden node to wire them. Click again to remove.</div>
    </div>
  )
}

const PatternMatchPuzzle = ({ puzzle }) => {
  const selected = useWorkStore(s => s.puzzleState.selected)
  const setPuzzleState = useWorkStore(s => s.setPuzzleState)
  return (
    <div className="nxos-pattern-puzzle">
      <div className="nxos-pattern-corrupted"><div className="nxos-pattern-label">CORRUPTED:</div><pre>{puzzle.corrupted}</pre></div>
      <div className="nxos-pattern-label">SELECT THE CORRECT RESTORATION:</div>
      <div className="nxos-pattern-options">
        {puzzle.options.map((opt, i) => (
          <div key={i} className={`nxos-pattern-option ${selected === i ? 'selected' : ''}`} onClick={() => { setPuzzleState({ selected: i }); playBlip(0.1) }}>
            <pre>{opt}</pre>
            <span className="nxos-pattern-num">#{i+1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const NodeConnectionPuzzle = ({ puzzle }) => {
  const clickedOrder = useWorkStore(s => s.puzzleState.clickedOrder || SAFE_EMPTY_ARRAY)
  const setPuzzleState = useWorkStore(s => s.setPuzzleState)
  const clickNode = (idx) => {
    if (clickedOrder.includes(idx)) return
    setPuzzleState(prev => ({ ...prev, clickedOrder: [...(prev.clickedOrder || []), idx] }))
    playBlip(0.1)
  }
  const resetNodes = () => setPuzzleState({ clickedOrder: [] })
  return (
    <div className="nxos-node-puzzle">
      <div className="nxos-node-grid">
        {puzzle.nodes.map((node, i) => {
          const order = clickedOrder.indexOf(i)
          return (
            <div key={i} className={`nxos-node-item ${order >= 0 ? 'clicked' : ''}`} onClick={() => clickNode(i)}>
              {order >= 0 && <span className="nxos-node-order">{order+1}</span>}
              <span className="nxos-node-name">{node}</span>
            </div>
          )
        })}
      </div>
      <button className="nxos-btn" onClick={resetNodes}>Reset Order</button>
    </div>
  )
}

const SortingPuzzle = ({ puzzle }) => {
  const sortedItems = useWorkStore(s => s.puzzleState.sortedItems || puzzle.items || SAFE_EMPTY_ARRAY)
  const setPuzzleState = useWorkStore(s => s.setPuzzleState)
  const moveItem = (fromIdx, direction) => {
    const items = [...sortedItems]
    const toIdx = fromIdx + direction
    if (toIdx < 0 || toIdx >= items.length) return
    ;[items[fromIdx], items[toIdx]] = [items[toIdx], items[fromIdx]]
    setPuzzleState({ sortedItems: items })
    playBlip(0.05)
  }
  return (
    <div className="nxos-sort-puzzle">
      {sortedItems.map((item, i) => (
        <div key={item.label} className="nxos-sort-item">
          <span className="nxos-sort-pos">{i+1}.</span>
          <span className="nxos-sort-label">{item.label}</span>
          <div className="nxos-sort-btns">
            <button className="nxos-btn" style={{height:'14px',padding:'0 3px',fontSize:'0.45rem'}} onClick={() => moveItem(i,-1)}>▲</button>
            <button className="nxos-btn" style={{height:'14px',padding:'0 3px',fontSize:'0.45rem'}} onClick={() => moveItem(i,1)}>▼</button>
          </div>
        </div>
      ))}
    </div>
  )
}

const LogicGridPuzzle = ({ puzzle }) => {
  const selected = useWorkStore(s => s.puzzleState.selected)
  const setPuzzleState = useWorkStore(s => s.setPuzzleState)
  return (
    <div className="nxos-logic-puzzle">
      <pre className="nxos-logic-question">{puzzle.question}</pre>
      <div className="nxos-logic-options">
        {puzzle.options.map((opt, i) => (
          <button key={i} className={`nxos-btn ${selected === i ? 'nxos-logic-selected' : ''}`} onClick={() => { setPuzzleState({ selected: i }); playBlip(0.1) }}>{opt}</button>
        ))}
      </div>
    </div>
  )
}

const PathfindingPuzzle = ({ puzzle }) => {
  const path = useWorkStore(s => s.puzzleState.path || SAFE_EMPTY_ARRAY)
  const setPuzzleState = useWorkStore(s => s.setPuzzleState)
  const clickCell = (r, c) => {
    const cell = puzzle.grid[r][c]
    if (cell === 1) return // wall
    const newPath = [...path]
    const existingIdx = newPath.findIndex(p => p[0] === r && p[1] === c)
    if (existingIdx >= 0) {
      newPath.splice(existingIdx)
    } else {
      if (newPath.length === 0) {
        if (cell !== 2) return // must start at start
        newPath.push([r, c])
      } else {
        const last = newPath[newPath.length - 1]
        const dr = Math.abs(last[0] - r), dc = Math.abs(last[1] - c)
        if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
          newPath.push([r, c])
        } else return // must be adjacent
      }
    }
    setPuzzleState({ path: newPath })
    playBlip(0.05)
  }
  const CELL_ICONS = { 0: '', 1: '🧱', 2: '🚀', 3: '🎯' }
  return (
    <div className="nxos-path-puzzle">
      <div className="nxos-path-grid">
        {puzzle.grid.map((row, r) => (
          <div key={r} className="nxos-path-row">
            {row.map((cell, c) => {
              const inPath = path.some(p => p[0] === r && p[1] === c)
              const pathIdx = path.findIndex(p => p[0] === r && p[1] === c)
              return (
                <div key={c} className={`nxos-path-cell ${cell === 1 ? 'wall' : ''} ${inPath ? 'active' : ''} ${cell === 2 ? 'start' : ''} ${cell === 3 ? 'end' : ''}`}
                  onClick={() => clickCell(r, c)}>
                  {CELL_ICONS[cell] || (inPath ? pathIdx + 1 : '')}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div style={{fontSize:'0.45rem',color:'#808080',textAlign:'center'}}>Steps: {path.length} / Max: {puzzle.optimalLength + 2}</div>
      <button className="nxos-btn" onClick={() => setPuzzleState({ path: [] })}>Clear Path</button>
    </div>
  )
}

// ─── Puzzle Modal (routes to correct renderer) ───────────────────
const PuzzleModal = () => {
  const activePuzzle = useWorkStore(s => s.activePuzzle)
  const puzzleInput = useWorkStore(s => s.puzzleInput)
  const setPuzzleInput = useWorkStore(s => s.setPuzzleInput)
  const submitPuzzle = useWorkStore(s => s.submitPuzzle)
  const cancelPuzzle = useWorkStore(s => s.cancelPuzzle)
  const [wrongAnswer, setWrongAnswer] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef(null)
  useEffect(() => { if (activePuzzle && inputRef.current) inputRef.current.focus(); setWrongAnswer(false); setShowHint(false) }, [activePuzzle])
  if (!activePuzzle) return null
  const { puzzle, taskId } = activePuzzle
  const handleSubmit = (e) => { e?.preventDefault(); const ok = submitPuzzle(); if (ok) playSuccess(); else { setWrongAnswer(true); playError(); setTimeout(() => setWrongAnswer(false), 600) } }
  const isVisual = puzzle.type !== 'text_input'
  return (
    <div className="nxos-puzzle-overlay" onClick={e => e.stopPropagation()}>
      <div className={`nxos-puzzle-dialog ${wrongAnswer ? 'shake' : ''}`} style={isVisual ? {width:'460px'} : undefined}>
        <div className="nxos-window-titlebar" style={{background:'linear-gradient(90deg,#000080,#1084d0)'}}>
          <div className="nxos-window-titlebar-left"><span className="nxos-window-icon">🧩</span><span className="nxos-window-title">Code Review — {taskId}</span></div>
          <div className="nxos-window-buttons"><button className="nxos-win-btn close" onClick={()=>{cancelPuzzle();playBlip()}}>✕</button></div>
        </div>
        <div className="nxos-puzzle-body">
          <div className="nxos-puzzle-type">{puzzle.prompt}</div>
          {puzzle.type === 'text_input' && (
            <>
              <pre className="nxos-puzzle-code">{puzzle.code}</pre>
              <form onSubmit={handleSubmit} className="nxos-puzzle-form">
                <input ref={inputRef} type="text" className="nxos-puzzle-input" value={puzzleInput} onChange={e=>setPuzzleInput(e.target.value)} placeholder="Type your answer..." autoComplete="off" spellCheck={false}/>
              </form>
            </>
          )}
          {puzzle.type === 'neural_network' && <NeuralNetworkPuzzle puzzle={puzzle}/>}
          {puzzle.type === 'pattern_match' && <PatternMatchPuzzle puzzle={puzzle}/>}
          {puzzle.type === 'node_connection' && <NodeConnectionPuzzle puzzle={puzzle}/>}
          {puzzle.type === 'sorting' && <SortingPuzzle puzzle={puzzle}/>}
          {puzzle.type === 'logic_grid' && <LogicGridPuzzle puzzle={puzzle}/>}
          {puzzle.type === 'pathfinding' && <PathfindingPuzzle puzzle={puzzle}/>}
          {puzzle.description && <div style={{fontSize:'0.5rem',color:'#404040',textAlign:'center'}}>{puzzle.description}</div>}
          <div className="nxos-puzzle-actions">
            <button className="nxos-btn" onClick={handleSubmit}>SUBMIT</button>
            <button className="nxos-btn" onClick={()=>setShowHint(true)}>HINT</button>
            <button className="nxos-btn" onClick={()=>{cancelPuzzle();playBlip()}}>SKIP</button>
          </div>
          {showHint && <div className="nxos-puzzle-hint">💡 {puzzle.hint}</div>}
          {wrongAnswer && <div className="nxos-puzzle-wrong">✘ INCORRECT — Try again</div>}
          <div className="nxos-puzzle-bonus">Bonus: +{puzzle.points} pts</div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MEETING WINDOW
// ═══════════════════════════════════════════════════════════════════
const MeetingWindow = () => {
  const activeMeeting = useWorkStore(s => s.activeMeeting)
  const meetingChoice = useWorkStore(s => s.meetingChoice)
  const endMeetingEarly = useWorkStore(s => s.endMeetingEarly)
  if (!activeMeeting) return null
  const { meeting, dialogues, currentDialogue, timer, totalTime } = activeMeeting
  const dialogue = dialogues[currentDialogue]
  if (!dialogue) return null
  const progress = Math.max(0, timer / totalTime)
  return (
    <div className="nxos-meeting-overlay" onClick={e => e.stopPropagation()}>
      <div className="nxos-meeting-dialog">
        <div className="nxos-window-titlebar" style={{background:'linear-gradient(90deg,#006000,#40a040)'}}>
          <div className="nxos-window-titlebar-left"><span className="nxos-window-icon">📅</span><span className="nxos-window-title">{meeting.title} — {meeting.room}</span></div>
          <div className="nxos-window-buttons"><button className="nxos-win-btn close" onClick={endMeetingEarly}>✕</button></div>
        </div>
        <div className="nxos-meeting-body">
          <div className="nxos-meeting-progress"><div className="nxos-meeting-bar" style={{width:`${progress*100}%`}}/></div>
          <div className="nxos-meeting-round">Round {currentDialogue+1}/{dialogues.length}</div>
          <div className="nxos-meeting-speaker">{dialogue.speaker}:</div>
          <div className="nxos-meeting-text">{dialogue.text}</div>
          <div className="nxos-meeting-choices">
            {dialogue.choices.map((c, i) => (
              <button key={i} className={`nxos-meeting-choice ${c.type}`} onClick={() => { meetingChoice(i); playBlip() }}>{c.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SLACK POPUP
// ═══════════════════════════════════════════════════════════════════
const QUICK_REPLIES = [
  'Got it, thanks!', 'On it 👍', 'Will do!', 'Looking into it now.',
  'Sure, let me check.', 'Noted!', 'ACK', 'lgtm', '👀', 'brb',
  'Can you file a ticket?', 'Per my last message...',
]

const SlackPopup = () => {
  const messages = useWorkStore(s => s.slackMessages)
  const respondSlack = useWorkStore(s => s.respondSlack)
  const ignoreSlack = useWorkStore(s => s.ignoreSlack)
  const [replyMode, setReplyMode] = useState(false)
  const [replyText, setReplyText] = useState('')
  const replyRef = useRef(null)

  useEffect(() => { if (replyMode && replyRef.current) replyRef.current.focus() }, [replyMode])

  if (messages.length === 0) return null
  const msg = messages[0]

  const sendReply = () => {
    if (!replyText.trim() && !replyMode) return
    respondSlack(msg.id)
    playSuccess()
    setReplyMode(false)
    setReplyText('')
  }

  const pickQuickReply = (text) => {
    setReplyText(text)
    setTimeout(() => {
      respondSlack(msg.id)
      playSuccess()
      setReplyMode(false)
      setReplyText('')
    }, 200)
  }

  return (
    <div className="nxos-slack-popup" onClick={e => e.stopPropagation()}>
      <div className="nxos-slack-header">
        <span>💬 Slack — {msg.channel}</span>
        <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
          {msg.urgent && <span className="nxos-urgent-badge">!</span>}
          <button className="nxos-slack-close" onClick={() => { ignoreSlack(msg.id); playBlip() }}>✕</button>
        </div>
      </div>
      <div className="nxos-slack-body">
        <strong>{msg.from}:</strong> {msg.text}
      </div>
      {!replyMode ? (
        <div className="nxos-slack-actions">
          <button className="nxos-btn" onClick={() => { setReplyMode(true); playBlip() }}>Reply</button>
          <button className="nxos-btn" onClick={() => { ignoreSlack(msg.id); playBlip() }}>Ignore</button>
        </div>
      ) : (
        <div className="nxos-slack-reply-area">
          <div className="nxos-slack-quick-replies">
            {QUICK_REPLIES.slice(0, 6).map(r => (
              <button key={r} className="nxos-slack-quick-btn" onClick={() => pickQuickReply(r)}>{r}</button>
            ))}
          </div>
          <div className="nxos-slack-reply-row">
            <input
              ref={replyRef}
              className="nxos-slack-reply-input"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && replyText.trim()) sendReply() }}
              placeholder="Type a reply..."
              autoComplete="off"
              spellCheck={false}
            />
            <button className="nxos-btn" disabled={!replyText.trim()} onClick={sendReply}>Send</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// REALISM EVENT DIALOG
// ═══════════════════════════════════════════════════════════════════
const EventDialog = () => {
  const event = useWorkStore(s => s.activeEvent)
  const dismissEvent = useWorkStore(s => s.dismissEvent)
  const takeCoffeeBreak = useWorkStore(s => s.takeCoffeeBreak)
  if (!event) return null
  return (
    <div className="nxos-event-popup">
      <div className="nxos-event-title">{event.title}</div>
      <div className="nxos-event-text">{event.text}</div>
      <div className="nxos-event-actions">
        {event.effect === 'offer_break' ? (
          <>
            <button className="nxos-btn" onClick={()=>{takeCoffeeBreak();playSuccess()}}>☕ Take Break</button>
            <button className="nxos-btn" onClick={()=>{dismissEvent();playBlip()}}>Keep Working</button>
          </>
        ) : (
          <button className="nxos-btn" onClick={()=>{dismissEvent();playBlip()}}>OK</button>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// REMAINING CONTENT COMPONENTS (from previous code, kept intact)
// ═══════════════════════════════════════════════════════════════════
const PRIORITY_COLORS = { CRITICAL: '#ff3333', HIGH: '#ff8800', MEDIUM: '#cc9900', LOW: '#669966' }

const ShadowJiraContent = () => {
  const tasks = useWorkStore(s => s.tasks)
  const completeTask = useWorkStore(s => s.completeTask)
  const moveToInProgress = useWorkStore(s => s.moveToInProgress)
  const burnout = useWorkStore(s => s.burnout)
  const backlog = tasks.filter(t => t.status === 'backlog' && !t.expired)
  const inProgress = tasks.filter(t => t.status === 'in_progress')
  const done = tasks.filter(t => t.status === 'done').slice(-6)
  const handleDrop = (e, s) => { e.preventDefault(); const id = e.dataTransfer.getData('taskId'); if (s === 'in_progress') { moveToInProgress(id); playBlip(0.2) } else if (s === 'done') { completeTask(id); playBlip() } }
  const TaskCard = ({ task }) => {
    const elapsed = (Date.now() - task.createdAt) / 1000
    const remaining = Math.max(0, task.deadline - elapsed)
    const urgent = remaining < 15
    return (
      <div className={`nxos-task-card ${urgent?'urgent':''}`} draggable onDragStart={e=>e.dataTransfer.setData('taskId',task.id)}
        onClick={()=>{ if (task.status==='backlog'){moveToInProgress(task.id);playBlip(0.2)} else if(task.status==='in_progress'){completeTask(task.id);playBlip()} }}>
        <div className="nxos-task-hdr"><span className="nxos-task-id">{task.id}{task.aiGenerated?' 🤖':''}</span><span style={{color:PRIORITY_COLORS[task.priority],fontSize:'0.55rem',fontWeight:'bold'}}>{task.priority}</span></div>
        <div className="nxos-task-title">{garble(task.title, burnout)}</div>
        <div className="nxos-task-meta"><span>+{task.points}pts</span>{task.status!=='done'&&<span className={urgent?'nxos-timer-urgent':''}>⏱{Math.floor(remaining)}s</span>}</div>
      </div>
    )
  }
  return (
    <div className="nxos-jira-board">
      <div className="nxos-jira-col" onDrop={e=>handleDrop(e,'backlog')} onDragOver={e=>e.preventDefault()}><div className="nxos-col-hdr backlog">BACKLOG ({backlog.length})</div><div className="nxos-col-body">{backlog.map(t=><TaskCard key={t.id} task={t}/>)}</div></div>
      <div className="nxos-jira-col" onDrop={e=>handleDrop(e,'in_progress')} onDragOver={e=>e.preventDefault()}><div className="nxos-col-hdr progress">IN PROGRESS ({inProgress.length})</div><div className="nxos-col-body">{inProgress.map(t=><TaskCard key={t.id} task={t}/>)}</div></div>
      <div className="nxos-jira-col" onDrop={e=>handleDrop(e,'done')} onDragOver={e=>e.preventDefault()}><div className="nxos-col-hdr done">DONE ({done.length})</div><div className="nxos-col-body">{done.map(t=>(<div key={t.id} className={`nxos-task-card done ${t.expired?'expired':''}`}><span className="nxos-task-id">{t.id}</span><span className="nxos-task-title">{t.expired?'⚠ EXPIRED':'✓'} {t.title}</span></div>))}</div></div>
    </div>
  )
}

const QuickOutlookContent = () => {
  const emails = useWorkStore(s => s.emails); const dismissEmail = useWorkStore(s => s.dismissEmail); const burnout = useWorkStore(s => s.burnout)
  const unread = emails.filter(e => !e.read); const read = emails.filter(e => e.read).slice(-4)
  return (
    <div className="nxos-outlook-list">
      {unread.length===0&&read.length===0&&<div className="nxos-outlook-empty">Inbox Zero. Enjoy the silence.</div>}
      {unread.map(email => { const rem = Math.max(0,email.expiresIn-(Date.now()-email.createdAt)/1000); return (
        <div key={email.id} className={`nxos-email ${email.urgent?'urgent':''}`}><div className="nxos-email-hdr"><strong>{garble(email.from,burnout)}</strong>{email.urgent&&<span className="nxos-urgent-badge">!</span>}<span className="nxos-email-timer">⏱{Math.floor(rem)}s</span></div><div className="nxos-email-subject">{garble(email.subject,burnout)}</div><div className="nxos-email-body">{garble(email.body,burnout)}</div><div className="nxos-email-actions"><button className="nxos-btn" onClick={()=>{dismissEmail(email.id);playBlip()}}>OK</button><button className="nxos-btn" onClick={()=>{dismissEmail(email.id);playBlip()}}>Ignore</button></div></div>
      )})}
      {read.map(email => <div key={email.id} className="nxos-email read"><strong>{email.from}</strong> — {email.subject}</div>)}
    </div>
  )
}

// ─── Fake Apps (NexusNet, Notepad, MyComputer, MyDocuments, RecycleBin) ──
const NexusNetContent = () => {
  const [page, setPage] = useState('home')
  const pages = {
    home: <div className="nxos-browser-page"><div className="nxos-intranet-header"><h2>🏢 NexusCorp Intranet</h2><p style={{color:'#808080',fontSize:'0.5rem'}}>Welcome, INTERN_9921</p></div><div className="nxos-intranet-grid">{[['news','📰','Company News','Q4 Earnings!'],['cafe','☕','Café Menu','Mystery Meat Monday'],['hr','👥','HR Portal','3 overdue trainings'],['memes','😂','Water Cooler','Office gossip']].map(([id,ic,t,s])=>(<div key={id} className="nxos-intranet-card" onClick={()=>setPage(id)}><span className="nxos-card-icon">{ic}</span><strong>{t}</strong><span>{s}</span></div>))}</div><div className="nxos-intranet-ticker">📢 Mandatory fun Friday • 🏆 Employee of month: VACANT • ⚠️ Parking lot B closed since 2019</div></div>,
    news: <div className="nxos-browser-page"><h3>📰 News</h3><div className="nxos-news-item"><strong>Q4 Earnings Beat</strong><br/>CEO credits "synergistic paradigm shifts." Stock up 0.3%.</div><div className="nxos-news-item"><strong>Open Office Plan</strong><br/>Walls removed. Noise complaints up 400%.</div><button className="nxos-btn" onClick={()=>setPage('home')}>← Back</button></div>,
    cafe: <div className="nxos-browser-page"><h3>☕ Café</h3><table className="nxos-cafe-table"><thead><tr><th>Item</th><th>Price</th><th>Status</th></tr></thead><tbody><tr><td>Mystery Meat</td><td>$4.99</td><td style={{color:'green'}}>Available</td></tr><tr><td>Lukewarm Coffee</td><td>$2.50</td><td style={{color:'green'}}>Available</td></tr><tr><td>Sad Salad</td><td>$7.99</td><td style={{color:'red'}}>SOLD OUT</td></tr></tbody></table><button className="nxos-btn" onClick={()=>setPage('home')}>← Back</button></div>,
    hr: <div className="nxos-browser-page"><h3>👥 HR</h3><div style={{background:'#fff0f0',border:'1px solid red',padding:'6px',marginBottom:'6px',fontSize:'0.5rem'}}>⚠️ 3 overdue trainings</div><div className="nxos-news-item"><strong>PTO:</strong> 0.5 days remaining</div><button className="nxos-btn" onClick={()=>setPage('home')}>← Back</button></div>,
    memes: <div className="nxos-browser-page"><h3>😂 Water Cooler</h3><div className="nxos-news-item"><strong>@Kevin:</strong> whoever microwaves fish, please stop</div><div className="nxos-news-item"><strong>@DevOps:</strong> deploy succeeded! JK. Rollback.</div><button className="nxos-btn" onClick={()=>setPage('home')}>← Back</button></div>,
  }
  return <div className="nxos-browser"><div className="nxos-browser-toolbar"><button className="nxos-btn" style={{height:'16px',padding:'0 4px'}} onClick={()=>setPage('home')}>🏠</button><div className="nxos-browser-urlbar">http://intranet.nexuscorp.local/</div></div>{pages[page]||pages.home}</div>
}

const NotepadContent = () => { const [t,setT]=useState(`=== README.txt ===\nWelcome to NexusCorp, Intern #9921!\n\nTIPS:\n1. Coffee machine on Floor 3 works\n2. Don't sit in Chad's chair\n3. "Reply All" is never the answer\n4. The printer is sentient; be nice\n5. If Brad asks about "synergies," nod\n\nEMERGENCY CONTACTS:\n- IT: ext.0000 (3-5 business days)\n- HR: ext.1234 (at "off-site retreat")\n- Manager: ??? (unknown)\n\nGood luck!\n— Onboarding Bot`); return <textarea className="nxos-notepad-area" value={t} onChange={e=>setT(e.target.value)} spellCheck={false}/> }
const MyComputerContent = () => <div className="nxos-mycomputer"><div className="nxos-mc-section"><div className="nxos-mc-header">Hard Disks</div><div className="nxos-mc-drives"><div className="nxos-mc-drive"><span className="nxos-mc-drive-icon">💾</span><div><strong>C: (NexusOS)</strong><br/><span className="nxos-mc-detail">4.2 GB free of 8 GB</span></div></div><div className="nxos-mc-drive"><span className="nxos-mc-drive-icon">💿</span><div><strong>D: (DATA)</strong><br/><span className="nxos-mc-detail">127 MB free of 2 GB</span></div></div></div></div><div className="nxos-mc-sysinfo"><strong>System:</strong> Pentium II 400MHz | 128MB RAM | NexusOS 98 SE</div></div>
const MyDocumentsContent = () => { const [sel,setSel]=useState(null); const files=[{name:'new_hire_checklist.doc',icon:'📄',content:'Step 1: Find desk\nStep 2: Login\nStep 3: Look busy'},{name:'totally_not_resume.doc',icon:'📄',content:'Dear [Better Company]...\n[CORRUPTED]'},{name:'meeting_notes_FINAL_v2.doc',icon:'📄',content:'Notes:\n- TBD\n- Follow up: Next meeting\n- Duration: 2h (could be email)'},{name:'cat_pictures',icon:'📁',content:'🐱 cat1.jpg\n🐱 cat2.jpg\n🐱 spreadsheet.jpg.exe ⚠️'}]; return <div className="nxos-documents"><div className="nxos-doc-list">{files.map(f=><div key={f.name} className={`nxos-doc-item ${sel===f.name?'selected':''}`} onClick={()=>setSel(f.name)}><span className="nxos-doc-icon">{f.icon}</span><span className="nxos-doc-name">{f.name}</span></div>)}</div>{sel&&<div className="nxos-doc-preview"><pre>{files.find(f=>f.name===sel)?.content}</pre></div>}</div> }
const RecycleBinContent = () => <div className="nxos-recycle"><div className="nxos-recycle-empty"><span style={{fontSize:'2rem'}}>🗑️</span><p>Empty.</p><p style={{color:'#808080',fontSize:'0.5rem'}}>Like your work-life balance.</p></div></div>

const TerminalContent = () => {
  const [history, setHistory] = useState([
    { type: 'system', text: 'NexusCorp Terminal v3.1' },
    { type: 'system', text: 'Type "help" for available commands.' },
    { type: 'system', text: '─────────────────────────────────' },
  ])
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [history])
  useEffect(() => { if (inputRef.current) inputRef.current.focus() }, [])

  const COMMANDS = {
    help: () => ['Commands: help, status, whoami, uptime, hack, coffee, sudo, clear, neofetch, fortune, ls, ping'],
    status: () => {
      const s = useWorkStore.getState()
      return [`Score: ${s.score} | Tasks: ${s.completedCount} | Burnout: ${Math.round(s.burnout*100)}%`, `Level: ${s.level} | Combo: ${s.combo}x | Mode: ${s.gameMode}`]
    },
    whoami: () => ['INTERN_9921 (permissions: none)'],
    uptime: () => {
      const gc = useWorkStore.getState().globalClock
      return [`System uptime: ${Math.floor(gc/60)}m ${Math.floor(gc%60)}s`, `Emotional uptime: declining`]
    },
    hack: () => {
      useWorkStore.setState(s => ({ score: s.score + 5, notifications: [...s.notifications, { id: Date.now(), text: '🎮 +5 pts (hacker bonus)', type: 'success' }] }))
      return ['[ACCESS GRANTED]', '██████████████████ 100%', 'Mainframe compromised. +5 bonus points.', '...just kidding. But the points are real.']
    },
    coffee: () => {
      useWorkStore.setState(s => ({ burnout: Math.max(0, s.burnout - 0.03) }))
      return ['☕ Brewing virtual coffee...', '████████████████ done.', 'Burnout reduced slightly. Caffeine is not a personality.']
    },
    sudo: () => ['Nice try. You don\'t have sudo access.', 'Your request has been logged and will be ignored.'],
    clear: () => { setHistory([]); return [] },
    neofetch: () => [
      '   ███╗  NexusOS 98 SE',
      '  ██╔██╗ Kernel: BURNOUT.SYS v4.2',
      ' ██╔╝██║ CPU: Pentium II 400MHz',
      '███████║ RAM: 128MB (96MB used by Outlook)',
      '╚══════╝ Disk: 42% (cat pictures)',
      '         Shell: cmd.exe (no bash sorry)',
      '         Theme: Corporate Despair',
    ],
    fortune: () => {
      const fortunes = [
        '"Every commit brings you closer to burnout." — Git Wisdom',
        '"There are only 2 hard problems: naming things, cache invalidation, and off-by-one errors."',
        '"It works on my machine." — Last words before incident report',
        '"Meetings are where minutes are kept and hours are lost."',
        '"Deadline: The point at which scope creep becomes scope sprint."',
        '"Your code has no bugs. Only undocumented features."',
        '"rm -rf /problems    (permission denied)"',
      ]
      return [fortunes[Math.floor(Math.random() * fortunes.length)]]
    },
    ls: () => ['budget_2024_FINAL_v3_REAL_FINAL.xlsx', 'todo.txt (4.2 GB)', 'definitely_not_resume.docx', 'node_modules/ (∞ GB)', '.env.production.bak.old.DONOTUSE'],
    ping: () => {
      const targets = ['prod-server-1', 'jira.nexuscorp.local', 'motivation.exe']
      const t = targets[Math.floor(Math.random() * targets.length)]
      return [`PING ${t}...`, `Reply: 404 Not Found`, `${t} is unreachable. Like your career goals.`]
    },
  }

  const handleCommand = (e) => {
    if (e.key !== 'Enter' || !input.trim()) return
    const cmd = input.trim().toLowerCase()
    const newHistory = [...history, { type: 'input', text: `C:\\NEXUS> ${input}` }]
    const handler = COMMANDS[cmd]
    if (handler) {
      const output = handler()
      output.forEach(line => newHistory.push({ type: 'output', text: line }))
    } else {
      newHistory.push({ type: 'error', text: `'${cmd}' is not recognized as an internal or external command.` })
      newHistory.push({ type: 'error', text: 'Type "help" for a list of commands.' })
    }
    setHistory(newHistory.slice(-80))
    setInput('')
  }

  return (
    <div className="nxos-terminal" onClick={() => inputRef.current?.focus()}>
      <div className="nxos-terminal-output" ref={scrollRef}>
        {history.map((line, i) => (
          <div key={i} className={`nxos-term-line ${line.type}`}>{line.text}</div>
        ))}
      </div>
      <div className="nxos-terminal-input-row">
        <span className="nxos-term-prompt">C:\NEXUS&gt;</span>
        <input ref={inputRef} className="nxos-terminal-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleCommand} autoComplete="off" spellCheck={false} />
      </div>
    </div>
  )
}

const AchievementPopup = () => {
  const popup = useWorkStore(s => s.achievementPopup)
  const dismiss = useWorkStore(s => s.dismissAchievement)
  useEffect(() => {
    if (popup) {
      playSuccess()
      const t = setTimeout(dismiss, 4000)
      return () => clearTimeout(t)
    }
  }, [popup, dismiss])
  if (!popup) return null
  return (
    <div className="nxos-achievement-popup">
      <div className="nxos-achievement-inner">
        <div className="nxos-achievement-title">ACHIEVEMENT UNLOCKED</div>
        <div className="nxos-achievement-name">{popup.title}</div>
        <div className="nxos-achievement-desc">{popup.desc}</div>
      </div>
    </div>
  )
}

const ComboIndicator = () => {
  const combo = useWorkStore(s => s.combo)
  const multiplier = useWorkStore(s => s.comboMultiplier)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (combo > 1) { setVisible(true); const t = setTimeout(() => setVisible(false), 2000); return () => clearTimeout(t) }
  }, [combo])
  if (!visible || combo <= 1) return null
  return (
    <div className="nxos-combo-indicator">
      <div className="nxos-combo-count">{combo}x</div>
      <div className="nxos-combo-label">COMBO! ({multiplier}x pts)</div>
    </div>
  )
}

const NON_WORK_APPS = ['browser', 'notepad', 'documents', 'recyclebin', 'terminal', 'mycomputer']

const BossAlertOverlay = ({ openWindows, closeApp }) => {
  const bossAlert = useWorkStore(s => s.bossAlert)
  const resolveBossAlert = useWorkStore(s => s.resolveBossAlert)
  const [timer, setTimer] = useState(5)

  const nonWorkOpen = openWindows.filter(w => NON_WORK_APPS.includes(w))
  const isClear = nonWorkOpen.length === 0

  useEffect(() => {
    if (!bossAlert) return
    setTimer(bossAlert.deadline)
    const iv = setInterval(() => {
      const elapsed = (Date.now() - bossAlert.startTime) / 1000
      const remaining = Math.max(0, bossAlert.deadline - elapsed)
      setTimer(remaining)
      if (remaining <= 0) {
        clearInterval(iv)
        // Check at deadline: did they close everything?
        resolveBossAlert(false)
      }
    }, 100)
    return () => clearInterval(iv)
  }, [bossAlert, resolveBossAlert])

  // Auto-resolve success when player closes all non-work apps
  useEffect(() => {
    if (bossAlert && isClear) {
      resolveBossAlert(true)
      playSuccess()
    }
  }, [bossAlert, isClear, resolveBossAlert])

  if (!bossAlert) return null
  return (
    <div className="nxos-boss-overlay">
      <div className="nxos-boss-inner">
        <div className="nxos-boss-icon">🚨</div>
        <div className="nxos-boss-title">BOSS APPROACHING!</div>
        <div className="nxos-boss-desc">Close non-work apps NOW! Use Escape or click ✕</div>
        <div className="nxos-boss-timer">{timer.toFixed(1)}s</div>
        {nonWorkOpen.length > 0 ? (
          <div style={{fontSize:'0.5rem',color:'#ff8888',marginTop:'4px'}}>
            ⚠ Still open: {nonWorkOpen.map(w => APP_REGISTRY[w]?.icon || w).join(' ')}
          </div>
        ) : (
          <div style={{fontSize:'0.5rem',color:'#88ff88',marginTop:'4px'}}>✅ All clear!</div>
        )}
      </div>
    </div>
  )
}

// ─── NotificationCenter, OsPopupBalloons, NotificationToast, GameOver, Boot ──
const NotificationCenter = ({ onOpenApp, onClose }) => { const h=useWorkStore(s=>s.notificationHistory); const cl=useWorkStore(s=>s.clearHistory); const fmt=ts=>{const s=Math.floor((Date.now()-ts)/1000);return s<60?`${s}s ago`:`${Math.floor(s/60)}m ago`}; return <div className="nxos-notif-center" onClick={e=>e.stopPropagation()}><div className="nxos-notif-center-header"><span>🔔 Notifications</span><div className="nxos-notif-center-actions"><button className="nxos-btn" style={{height:'14px',fontSize:'0.45rem',padding:'0 4px'}} onClick={cl}>Clear</button><button className="nxos-btn" style={{height:'14px',fontSize:'0.45rem',padding:'0 4px'}} onClick={onClose}>✕</button></div></div><div className="nxos-notif-center-body">{h.length===0&&<div className="nxos-notif-center-empty">No notifications yet.</div>}{[...h].reverse().slice(0,30).map(n=><div key={n.id} className={`nxos-notif-center-item ${n.type}`} onClick={()=>{if(n.app){onOpenApp(n.app);onClose()}}} style={{cursor:n.app?'pointer':'default'}}><span className="nxos-notif-center-icon">{n.icon}</span><div className="nxos-notif-center-text"><div className="nxos-notif-center-msg">{n.text}</div><div className="nxos-notif-center-time">{fmt(n.createdAt)}</div></div></div>)}</div></div> }
const OsPopupBalloons = () => { const p=useWorkStore(s=>s.osPopups); const d=useWorkStore(s=>s.dismissOsPopup); if(!p.length) return null; return <div className="nxos-os-balloons">{p.slice(-3).map(pp=><div key={pp.id} className={`nxos-os-balloon ${pp.type}`} onClick={()=>d(pp.id)}><div className="nxos-balloon-header"><span className="nxos-balloon-icon">{pp.icon}</span><span className="nxos-balloon-title">{pp.title}</span><button className="nxos-balloon-close" onClick={e=>{e.stopPropagation();d(pp.id)}}>✕</button></div><div className="nxos-balloon-text">{pp.text}</div></div>)}</div> }
const NotificationToast = () => { const n=useWorkStore(s=>s.notifications); const c=useWorkStore(s=>s.clearNotification); useEffect(()=>{ if(n.length>0){const t=setTimeout(()=>c(n[0].id),3000);return()=>clearTimeout(t)} },[n,c]); return <div className="nxos-notifications">{n.slice(0,3).map(x=><div key={x.id} className={`nxos-notification ${x.type}`}>{x.text}</div>)}</div> }
const GameOverOverlay = () => { const s=useWorkStore(x=>x.score); const cc=useWorkStore(x=>x.completedCount); const gc=useWorkStore(x=>x.globalClock); const r=useWorkStore(x=>x.reset); const sg=useGameStore(x=>x.setGameState); const sh=useGameStore(x=>x.setHighScore); const ap=useGameStore(x=>x.addPlaythrough); useEffect(()=>{sh(s);ap({score:s,tasksCompleted:cc,timeElapsed:Math.floor(gc),date:new Date().toISOString()})},[s,cc,gc,sh,ap]);return <div className="nxos-bsod"><div className="nxos-bsod-inner"><h1>NexusOS</h1><p>A fatal exception 0E has occurred in VXD BURNOUT(01)</p><br/><div className="nxos-bsod-stats"><span>SCORE: {s} pts</span><span>TASKS: {cc}</span><span>LEVEL: {useWorkStore.getState().level}</span><span>BEST COMBO: {useWorkStore.getState().combo}x</span><span>TIME: {Math.floor(gc/60)}m {Math.floor(gc%60)}s</span></div><br/><div className="nxos-bsod-actions"><button className="nxos-btn" onClick={()=>r()}>RETRY</button><button className="nxos-btn" onClick={()=>{r();sg('START')}}>LOG OFF</button></div></div></div> }

const BootSequence = ({ onComplete }) => { const [lines,setLines]=useState([]); const [prog,setProg]=useState(0); const BL=['NexusOS 98 [Version 4.10.1998]','(C) Nexus Corp 1981-1998.','','HIMEM testing extended memory...done.','Loading WIN98.SYS...','NEXUSCORP PROPRIETARY','','C:\\NEXUS> Mounting drives...','C:\\NEXUS> Connecting to INTRANET...','C:\\NEXUS> Authenticating INTERN_9921...','C:\\NEXUS> Loading desktop...']; useEffect(()=>{let i=0;const iv=setInterval(()=>{if(i<BL.length){setLines(p=>[...p,BL[i]]);setProg((i+1)/BL.length);if(BL[i])playBlip(0.05);i++}else{clearInterval(iv);setTimeout(onComplete,600)}},300);return()=>clearInterval(iv)},[]); return <div className="nxos-boot"><div className="nxos-boot-terminal">{lines.map((l,i)=><div key={i} className="nxos-boot-line">{l}</div>)}<span className="nxos-boot-cursor">_</span></div><div className="nxos-boot-bar"><div className="nxos-boot-bar-fill" style={{width:`${prog*100}%`}}/></div></div> }

// ═══════════════════════════════════════════════════════════════════
// APP REGISTRY
// ═══════════════════════════════════════════════════════════════════
const APP_REGISTRY = {
  jira:{title:'ShadowJira™ — Sprint Board',icon:'📋',menu:['File','Sprint','View','Help']},
  email:{title:'QuickOutlook™ — Inbox',icon:'📧',menu:['File','Edit','View','Tools','Help']},
  browser:{title:'NexusNet Explorer',icon:'🌐',menu:['File','Edit','View','Favorites','Help']},
  notepad:{title:'Notepad — README.txt',icon:'📝',menu:['File','Edit','Format','Help']},
  mycomputer:{title:'My Computer',icon:'💻',menu:['File','Edit','View','Help']},
  documents:{title:'My Documents',icon:'📁',menu:['File','Edit','View','Help']},
  recyclebin:{title:'Recycle Bin',icon:'🗑️',menu:['File','Edit','View','Help']},
  terminal:{title:'Command Prompt',icon:'⬛',menu:['File','Edit','Help']},
}
const APP_CONTENT = { jira:()=><ShadowJiraContent/>, email:()=><QuickOutlookContent/>, browser:()=><NexusNetContent/>, notepad:()=><NotepadContent/>, mycomputer:()=><MyComputerContent/>, documents:()=><MyDocumentsContent/>, recyclebin:()=><RecycleBinContent/>, terminal:()=><TerminalContent/> }

// ═══════════════════════════════════════════════════════════════════
// MAIN WORKSTATION COMPONENT
// ═══════════════════════════════════════════════════════════════════
const MODE_LABELS = { balanced:'🎯', deadline_rush:'⏱️', meeting_hell:'📅', nightmare:'💀' }

const Workstation2D = () => {
  const tick=useWorkStore(s=>s.tick); const spawnTask=useWorkStore(s=>s.spawnTask); const spawnEmail=useWorkStore(s=>s.spawnEmail); const spawnMeeting=useWorkStore(s=>s.spawnMeeting); const spawnSlack=useWorkStore(s=>s.spawnSlack); const triggerEvent=useWorkStore(s=>s.triggerEvent)
  const activePuzzle=useWorkStore(s=>s.activePuzzle); const activeMeeting=useWorkStore(s=>s.activeMeeting); const activeEvent=useWorkStore(s=>s.activeEvent)
  const bootComplete=useWorkStore(s=>s.bootComplete); const setBootComplete=useWorkStore(s=>s.setBootComplete)
  const gameOver=useWorkStore(s=>s.gameOver); const activeWindow=useWorkStore(s=>s.activeWindow); const setActiveWindow=useWorkStore(s=>s.setActiveWindow)
  const burnout=useWorkStore(s=>s.burnout); const score=useWorkStore(s=>s.score); const completedCount=useWorkStore(s=>s.completedCount); const globalClock=useWorkStore(s=>s.globalClock)
  const gameMode=useWorkStore(s=>s.gameMode); const setGameMode=useWorkStore(s=>s.setGameMode)
  const combo=useWorkStore(s=>s.combo); const level=useWorkStore(s=>s.level); const xp=useWorkStore(s=>s.xp)
  const bossAlert=useWorkStore(s=>s.bossAlert)
  const reset=useWorkStore(s=>s.reset); const meetings=useWorkStore(s=>s.meetings); const startMeeting=useWorkStore(s=>s.startMeeting)
  const unreadEmails=useWorkStore(s=>s.emails.filter(e=>!e.read).length)
  const notifCount=useWorkStore(s=>s.notificationHistory.length)

  const [startMenuOpen,setStartMenuOpen]=useState(false); const [notifCenterOpen,setNotifCenterOpen]=useState(false)
  const [openWindows,setOpenWindows]=useState([]); const [minimizedWindows,setMinimizedWindows]=useState([])
  const [contextMenu,setContextMenu]=useState(null)
  const [showTutorial,setShowTutorial]=useState(false)
  const animFrameRef=useRef(null); const lastTimeRef=useRef(performance.now()); const taskTimerRef=useRef(0); const emailTimerRef=useRef(0); const meetingTimerRef=useRef(0); const slackTimerRef=useRef(0); const eventTimerRef=useRef(0)

  useEffect(()=>{reset()},[])

  // Keyboard shortcuts
  useEffect(() => {
    if (!bootComplete) return
    const handleKeyboard = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const shortcuts = { '1': 'jira', '2': 'email', '3': 'browser', '4': 'terminal', '5': 'notepad', '6': 'documents', '7': 'mycomputer' }
      if (e.ctrlKey && shortcuts[e.key]) {
        e.preventDefault()
        openApp(shortcuts[e.key])
        playBlip()
      }
      if (e.key === 'Escape' && activeWindow) {
        closeApp(activeWindow)
        playBlip()
      }
      if (e.key === 'F1') {
        e.preventDefault()
        setShowTutorial(true)
        playBlip()
      }
    }
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [bootComplete, activeWindow])

  // Check for meetings to attend
  const pendingMeetings = meetings.filter(m => !m.dismissed && (Date.now()-m.createdAt)/1000 > m.startsIn - 5 && (Date.now()-m.createdAt)/1000 < m.startsIn + 10)

  useEffect(()=>{
    if(!bootComplete)return
    const ModeSpawn = { balanced:{t:20,e:30,m:60,s:40,ev:90}, deadline_rush:{t:12,e:25,m:80,s:50,ev:60}, meeting_hell:{t:25,e:35,m:20,s:30,ev:70}, nightmare:{t:10,e:15,m:25,s:20,ev:45} }
    const cfg=ModeSpawn[gameMode]||ModeSpawn.balanced
    const gameLoop=(time)=>{
      const delta=Math.min((time-lastTimeRef.current)/1000,0.1); lastTimeRef.current=time; tick(delta)
      const clock=useWorkStore.getState().globalClock
      taskTimerRef.current+=delta; const tI=Math.max(5,cfg.t-clock*0.04); if(taskTimerRef.current>tI){spawnTask().catch(()=>{});taskTimerRef.current=0}
      emailTimerRef.current+=delta; const eI=Math.max(8,cfg.e-clock*0.05); if(emailTimerRef.current>eI){spawnEmail();emailTimerRef.current=0}
      meetingTimerRef.current+=delta; const mI=Math.max(15,cfg.m-clock*0.06); if(meetingTimerRef.current>mI){spawnMeeting();meetingTimerRef.current=0}
      slackTimerRef.current+=delta; const sI=Math.max(12,cfg.s-clock*0.04); if(slackTimerRef.current>sI){spawnSlack();slackTimerRef.current=0}
      eventTimerRef.current+=delta; const evI=Math.max(30,cfg.ev-clock*0.08); if(eventTimerRef.current>evI){triggerEvent();eventTimerRef.current=0}
      animFrameRef.current=requestAnimationFrame(gameLoop)
    }
    spawnTask().catch(()=>{});spawnTask().catch(()=>{})
    lastTimeRef.current=performance.now()
    animFrameRef.current=requestAnimationFrame(gameLoop)
    return()=>{if(animFrameRef.current)cancelAnimationFrame(animFrameRef.current)}
  },[bootComplete,gameMode])

  const formatClock=(s)=>{const h=9+Math.floor(s/60);const m=Math.floor(s%60);return `${h>12?h-12:h}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`}
  const openApp=(id)=>{setActiveWindow(id);if(!openWindows.includes(id))setOpenWindows(p=>[...p,id]);setMinimizedWindows(p=>p.filter(w=>w!==id))}
  const closeApp=(id)=>{setOpenWindows(p=>p.filter(w=>w!==id));setMinimizedWindows(p=>p.filter(w=>w!==id));if(activeWindow===id)setActiveWindow(openWindows.filter(w=>w!==id)[0]||null)}
  const toggleMinimize=(id)=>{if(minimizedWindows.includes(id)){setMinimizedWindows(p=>p.filter(w=>w!==id));setActiveWindow(id)}else{setMinimizedWindows(p=>[...p,id]);if(activeWindow===id)setActiveWindow(null)}}

  return (
    <div className="nxos-monitor-frame" onClick={()=>{startMenuOpen&&setStartMenuOpen(false);setContextMenu(null)}}
      onContextMenu={e=>{e.preventDefault();setContextMenu({x:e.clientX,y:e.clientY});playBlip(0.05)}}>
      <div className="nxos-crt-bezel">
        <div className="nxos-scanlines"/><div className="nxos-screen-curve"/>
        {!bootComplete ? <BootSequence onComplete={()=>{setBootComplete(true);if(!localStorage.getItem('nxos_tutorial_seen')){setShowTutorial(true);localStorage.setItem('nxos_tutorial_seen','1')}}}/> : (
          <div className={`nxos-desktop ${burnout>0.7?'burnout-critical':burnout>0.5?'burnout-high':''} ${bossAlert?'nxos-screen-shake':''}`} style={{filter:burnout>0.5?`hue-rotate(${Math.sin(Date.now()*0.005)*burnout*20}deg)`:undefined}}>
            <div className="nxos-desktop-icons">
              <DesktopIcon icon="📋" label="ShadowJira" onClick={()=>openApp('jira')}/>
              <DesktopIcon icon="📧" label="QuickOutlook" onClick={()=>openApp('email')}/>
              <DesktopIcon icon="🌐" label="NexusNet" onClick={()=>openApp('browser')}/>
              <DesktopIcon icon="📁" label="My Documents" onClick={()=>openApp('documents')}/>
              <DesktopIcon icon="🗑️" label="Recycle Bin" onClick={()=>openApp('recyclebin')}/>
              <DesktopIcon icon="📝" label="README.txt" onClick={()=>openApp('notepad')}/>
              <DesktopIcon icon="💻" label="My Computer" onClick={()=>openApp('mycomputer')}/>
              <DesktopIcon icon="⬛" label="Terminal" onClick={()=>openApp('terminal')}/>
            </div>
            {openWindows.map((appId,idx)=>{if(minimizedWindows.includes(appId))return null;const reg=APP_REGISTRY[appId];if(!reg)return null;const C=APP_CONTENT[appId];return <Win98Window key={appId} title={appId==='email'?`${reg.title} (${unreadEmails})`:reg.title} icon={reg.icon} menuItems={reg.menu} isActive={activeWindow===appId} zIndex={activeWindow===appId?20:10+idx} onClose={()=>closeApp(appId)} onMinimize={()=>toggleMinimize(appId)}><C/></Win98Window>})}
            {/* Pending meetings bar */}
            {pendingMeetings.length>0&&!activeMeeting&&<div className="nxos-meeting-alert">{pendingMeetings.map(m=><div key={m.id} className="nxos-meeting-alert-item"><span>📅 {m.title} starting NOW!</span><button className="nxos-btn" onClick={()=>startMeeting(m.id)}>Join</button></div>)}</div>}
            {/* Taskbar */}
            <div className="nxos-taskbar">
              <button className={`nxos-start-btn ${startMenuOpen?'pressed':''}`} onClick={e=>{e.stopPropagation();setStartMenuOpen(!startMenuOpen);playBlip()}}><span className="nxos-start-flag">⊞</span> Start</button>
              <div className="nxos-taskbar-divider"/>
              <div className="nxos-taskbar-apps">{openWindows.map(id=>{const r=APP_REGISTRY[id];if(!r)return null;return <button key={id} className={`nxos-taskbar-app-btn ${activeWindow===id&&!minimizedWindows.includes(id)?'active':''}`} onClick={()=>{if(activeWindow===id&&!minimizedWindows.includes(id))toggleMinimize(id);else openApp(id)}}>{r.icon} {id==='email'&&unreadEmails>0?`Mail(${unreadEmails})`:r.title.split('—')[0].trim().split(' ').slice(0,2).join(' ')}</button>})}</div>
              <div className="nxos-systray">
                <span className="nxos-systray-item nxos-xp-display" title={`XP: ${xp}/${level*50}`}>Lv.{level}</span>
                <span className="nxos-systray-item" title={`Mode: ${gameMode}`}>{MODE_LABELS[gameMode]||'🎯'}</span>
                <span className="nxos-systray-item" title={`Burnout: ${Math.round(burnout*100)}%`}>{burnout>0.7?'🔴':burnout>0.4?'🟡':'🟢'}</span>
                <span className="nxos-systray-item">⚡{score}</span>
                <span className="nxos-systray-item">✓{completedCount}</span>
                <button className="nxos-systray-bell" onClick={e=>{e.stopPropagation();setNotifCenterOpen(!notifCenterOpen);playBlip()}}>🔔{notifCount>0&&<span className="nxos-bell-badge">{notifCount>99?'99+':notifCount}</span>}</button>
                <span className="nxos-systray-clock">{formatClock(globalClock)}</span>
              </div>
            </div>
            {startMenuOpen&&<StartMenu onClose={()=>setStartMenuOpen(false)} onOpenApp={openApp} onShowHelp={()=>setShowTutorial(true)}/>}
            {notifCenterOpen&&<NotificationCenter onOpenApp={openApp} onClose={()=>setNotifCenterOpen(false)}/>}
            <OsPopupBalloons/><NotificationToast/><SlackPopup/><EventDialog/><AchievementPopup/><ComboIndicator/>
            {contextMenu&&<ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={()=>setContextMenu(null)}/>}
            {showTutorial&&<HowToPlayDialog onClose={()=>setShowTutorial(false)}/>}
            {activePuzzle&&<PuzzleModal/>}
            {activeMeeting&&<MeetingWindow/>}
            {bossAlert&&<BossAlertOverlay openWindows={openWindows} closeApp={closeApp}/>}
            {gameOver&&<GameOverOverlay/>}
          </div>
        )}
      </div>
      <div className="nxos-monitor-stand"/><div className="nxos-monitor-base"/><div className="nxos-power-led"/>
    </div>
  )
}

export default Workstation2D
