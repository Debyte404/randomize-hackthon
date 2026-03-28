import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useWorkStore } from '../../store/useWorkStore'
import { useGameStore } from '../../store/useGameStore'
import './Workstation2D.css'

// ─── Sound helpers ───────────────────────────────────────────────
const playBlip = (volume = 0.3) => {
  try {
    const v = useGameStore.getState().settings.volume
    if (v <= 0) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(volume * v, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.start(); osc.stop(ctx.currentTime + 0.1)
  } catch (e) { /* audio blocked */ }
}

const playError = () => {
  try {
    const v = useGameStore.getState().settings.volume
    if (v <= 0) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.4 * v, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(); osc.stop(ctx.currentTime + 0.35)
  } catch (e) { /* audio blocked */ }
}

const playSuccess = () => {
  try {
    const v = useGameStore.getState().settings.volume
    if (v <= 0) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(523, ctx.currentTime)
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.3 * v, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start(); osc.stop(ctx.currentTime + 0.4)
  } catch (e) { /* audio blocked */ }
}

// ─── Garble text based on burnout ────────────────────────────────
const GLITCH_CHARS = '█▓░▒╬╦╩╗╔╣║▐▀▄'
const garbleText = (text, burnout) => {
  if (burnout < 0.3) return text
  return text.split('').map(c => {
    if (c === ' ') return c
    if (Math.random() < (burnout - 0.3) * 0.8) {
      return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
    }
    return c
  }).join('')
}

// ─── Desktop Icon ────────────────────────────────────────────────
const DesktopIcon = ({ icon, label, onClick, x, y }) => (
  <div
    className="nxos-desktop-icon"
    style={{ gridColumn: x, gridRow: y }}
    onDoubleClick={() => { onClick(); playBlip() }}
  >
    <div className="nxos-icon-img">{icon}</div>
    <div className="nxos-icon-label">{label}</div>
  </div>
)

// ─── Start Menu ──────────────────────────────────────────────────
const StartMenu = ({ onClose, onOpenApp }) => (
  <div className="nxos-start-menu" onClick={e => e.stopPropagation()}>
    <div className="nxos-start-sidebar">
      <span className="nxos-start-sidebar-text">NexusOS 98</span>
    </div>
    <div className="nxos-start-items">
      <div className="nxos-start-item" onClick={() => { onOpenApp('jira'); onClose() }}>
        <span className="nxos-start-item-icon">📋</span> ShadowJira™
      </div>
      <div className="nxos-start-item" onClick={() => { onOpenApp('email'); onClose() }}>
        <span className="nxos-start-item-icon">📧</span> QuickOutlook™
      </div>
      <div className="nxos-start-item disabled">
        <span className="nxos-start-item-icon">🌐</span> NexusNet Explorer
      </div>
      <div className="nxos-start-item disabled">
        <span className="nxos-start-item-icon">📝</span> Notepad.exe
      </div>
      <div className="nxos-start-divider" />
      <div className="nxos-start-item disabled">
        <span className="nxos-start-item-icon">⚙️</span> Control Panel
      </div>
      <div className="nxos-start-item disabled">
        <span className="nxos-start-item-icon">❓</span> Help (Access Denied)
      </div>
      <div className="nxos-start-divider" />
      <div className="nxos-start-item shutdown" onClick={() => {
        useGameStore.getState().setGameState('START')
        useWorkStore.getState().reset()
        onClose()
      }}>
        <span className="nxos-start-item-icon">🔌</span> Shut Down...
      </div>
    </div>
  </div>
)

// ─── Window Chrome (Win98 Style) ─────────────────────────────────
const Win98Window = ({ title, icon, children, onClose, onMinimize, isActive, zIndex }) => (
  <div className={`nxos-window ${isActive ? 'active' : ''}`} style={{ zIndex }}>
    <div className="nxos-window-titlebar">
      <div className="nxos-window-titlebar-left">
        <span className="nxos-window-icon">{icon}</span>
        <span className="nxos-window-title">{title}</span>
      </div>
      <div className="nxos-window-buttons">
        <button className="nxos-win-btn minimize" onClick={onMinimize}>_</button>
        <button className="nxos-win-btn maximize">□</button>
        <button className="nxos-win-btn close" onClick={onClose}>✕</button>
      </div>
    </div>
    <div className="nxos-window-menubar">
      <span>File</span><span>Edit</span><span>View</span><span>Help</span>
    </div>
    <div className="nxos-window-content">
      {children}
    </div>
    <div className="nxos-window-statusbar">Ready</div>
  </div>
)

// ─── ShadowJira Content ──────────────────────────────────────────
const PRIORITY_COLORS = {
  CRITICAL: '#ff3333',
  HIGH: '#ff8800',
  MEDIUM: '#cc9900',
  LOW: '#669966',
}

const ShadowJiraContent = () => {
  const tasks = useWorkStore(s => s.tasks)
  const completeTask = useWorkStore(s => s.completeTask)
  const moveToInProgress = useWorkStore(s => s.moveToInProgress)
  const burnout = useWorkStore(s => s.burnout)

  const backlog = tasks.filter(t => t.status === 'backlog' && !t.expired)
  const inProgress = tasks.filter(t => t.status === 'in_progress')
  const done = tasks.filter(t => t.status === 'done').slice(-6)

  const handleDrop = (e, targetStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (targetStatus === 'in_progress') { moveToInProgress(taskId); playBlip(0.2) }
    else if (targetStatus === 'done') { completeTask(taskId); playSuccess() }
  }

  const TaskCard = ({ task }) => {
    const elapsed = (Date.now() - task.createdAt) / 1000
    const remaining = Math.max(0, task.deadline - elapsed)
    const urgent = remaining < 10
    return (
      <div
        className={`nxos-task-card ${urgent ? 'urgent' : ''}`}
        draggable
        onDragStart={e => e.dataTransfer.setData('taskId', task.id)}
        onClick={() => {
          if (task.status === 'backlog') { moveToInProgress(task.id); playBlip(0.2) }
          else if (task.status === 'in_progress') { completeTask(task.id); playSuccess() }
        }}
      >
        <div className="nxos-task-hdr">
          <span className="nxos-task-id">{task.id}</span>
          <span style={{ color: PRIORITY_COLORS[task.priority], fontSize: '0.55rem', fontWeight: 'bold' }}>{task.priority}</span>
        </div>
        <div className="nxos-task-title">{garbleText(task.title, burnout)}</div>
        <div className="nxos-task-meta">
          <span>+{task.points}pts</span>
          {task.dependency && <span className="nxos-dep">🔗 {garbleText(task.dependency, burnout)}</span>}
          {task.status !== 'done' && <span className={urgent ? 'nxos-timer-urgent' : ''}>⏱{Math.floor(remaining)}s</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="nxos-jira-board">
      <div className="nxos-jira-col" onDrop={e => handleDrop(e, 'backlog')} onDragOver={e => e.preventDefault()}>
        <div className="nxos-col-hdr backlog">BACKLOG ({backlog.length})</div>
        <div className="nxos-col-body">{backlog.map(t => <TaskCard key={t.id} task={t} />)}</div>
      </div>
      <div className="nxos-jira-col" onDrop={e => handleDrop(e, 'in_progress')} onDragOver={e => e.preventDefault()}>
        <div className="nxos-col-hdr progress">IN PROGRESS ({inProgress.length})</div>
        <div className="nxos-col-body">{inProgress.map(t => <TaskCard key={t.id} task={t} />)}</div>
      </div>
      <div className="nxos-jira-col" onDrop={e => handleDrop(e, 'done')} onDragOver={e => e.preventDefault()}>
        <div className="nxos-col-hdr done">DONE ({done.length})</div>
        <div className="nxos-col-body">
          {done.map(t => (
            <div key={t.id} className={`nxos-task-card done ${t.expired ? 'expired' : ''}`}>
              <span className="nxos-task-id">{t.id}</span>
              <span className="nxos-task-title">{t.expired ? '⚠ EXPIRED' : '✓'} {t.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── QuickOutlook Content ────────────────────────────────────────
const QuickOutlookContent = () => {
  const emails = useWorkStore(s => s.emails)
  const dismissEmail = useWorkStore(s => s.dismissEmail)
  const burnout = useWorkStore(s => s.burnout)
  const unread = emails.filter(e => !e.read)
  const read = emails.filter(e => e.read).slice(-4)

  return (
    <div className="nxos-outlook-list">
      {unread.length === 0 && read.length === 0 && (
        <div className="nxos-outlook-empty">Inbox Zero. Enjoy the silence while it lasts.</div>
      )}
      {unread.map(email => {
        const remaining = Math.max(0, email.expiresIn - (Date.now() - email.createdAt) / 1000)
        return (
          <div key={email.id} className={`nxos-email ${email.urgent ? 'urgent' : ''}`}>
            <div className="nxos-email-hdr">
              <strong>{garbleText(email.from, burnout)}</strong>
              {email.urgent && <span className="nxos-urgent-badge">!</span>}
              <span className="nxos-email-timer">⏱ {Math.floor(remaining)}s</span>
            </div>
            <div className="nxos-email-subject">{garbleText(email.subject, burnout)}</div>
            <div className="nxos-email-body">{garbleText(email.body, burnout)}</div>
            <div className="nxos-email-actions">
              <button className="nxos-btn" onClick={() => { dismissEmail(email.id); playBlip() }}>OK</button>
              <button className="nxos-btn" onClick={() => playError()}>Ignore</button>
            </div>
          </div>
        )
      })}
      {read.map(email => (
        <div key={email.id} className="nxos-email read">
          <strong>{email.from}</strong> — {email.subject}
        </div>
      ))}
    </div>
  )
}

// ─── Puzzle Modal (Win98 Dialog) ─────────────────────────────────
const PuzzleModal = () => {
  const activePuzzle = useWorkStore(s => s.activePuzzle)
  const puzzleInput = useWorkStore(s => s.puzzleInput)
  const setPuzzleInput = useWorkStore(s => s.setPuzzleInput)
  const submitPuzzle = useWorkStore(s => s.submitPuzzle)
  const cancelPuzzle = useWorkStore(s => s.cancelPuzzle)
  const [wrongAnswer, setWrongAnswer] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (activePuzzle && inputRef.current) inputRef.current.focus()
    setWrongAnswer(false)
    setShowHint(false)
  }, [activePuzzle])

  if (!activePuzzle) return null
  const { puzzle, taskId } = activePuzzle

  const handleSubmit = (e) => {
    e.preventDefault()
    const ok = submitPuzzle()
    if (ok) { playSuccess() }
    else { setWrongAnswer(true); playError(); setTimeout(() => setWrongAnswer(false), 600) }
  }

  return (
    <div className="nxos-puzzle-overlay" onClick={e => e.stopPropagation()}>
      <div className={`nxos-puzzle-dialog ${wrongAnswer ? 'shake' : ''}`}>
        <div className="nxos-window-titlebar" style={{ background: 'linear-gradient(90deg, #000080, #1084d0)' }}>
          <div className="nxos-window-titlebar-left">
            <span className="nxos-window-icon">🧩</span>
            <span className="nxos-window-title">Code Review Required — {taskId}</span>
          </div>
          <div className="nxos-window-buttons">
            <button className="nxos-win-btn close" onClick={() => { cancelPuzzle(); playBlip() }}>✕</button>
          </div>
        </div>
        <div className="nxos-puzzle-body">
          <div className="nxos-puzzle-type">{puzzle.prompt}</div>
          <pre className="nxos-puzzle-code">{puzzle.code}</pre>
          <form onSubmit={handleSubmit} className="nxos-puzzle-form">
            <input
              ref={inputRef}
              type="text"
              className="nxos-puzzle-input"
              value={puzzleInput}
              onChange={e => setPuzzleInput(e.target.value)}
              placeholder="Type your answer..."
              autoComplete="off"
              spellCheck={false}
            />
            <div className="nxos-puzzle-actions">
              <button type="submit" className="nxos-btn">SUBMIT</button>
              <button type="button" className="nxos-btn" onClick={() => setShowHint(true)}>HINT</button>
              <button type="button" className="nxos-btn" onClick={() => { cancelPuzzle(); playBlip() }}>SKIP (-5pts)</button>
            </div>
          </form>
          {showHint && <div className="nxos-puzzle-hint">💡 {puzzle.hint}</div>}
          {wrongAnswer && <div className="nxos-puzzle-wrong">✘ INCORRECT — Try again</div>}
          <div className="nxos-puzzle-bonus">Bonus: +{puzzle.points} pts on correct answer</div>
        </div>
      </div>
    </div>
  )
}

// ─── OS Popup Balloons (System Tray) ─────────────────────────────
const OsPopupBalloons = () => {
  const osPopups = useWorkStore(s => s.osPopups)
  const dismissOsPopup = useWorkStore(s => s.dismissOsPopup)

  if (osPopups.length === 0) return null

  return (
    <div className="nxos-os-balloons">
      {osPopups.slice(-3).map(popup => (
        <div key={popup.id} className={`nxos-os-balloon ${popup.type}`} onClick={() => dismissOsPopup(popup.id)}>
          <div className="nxos-balloon-header">
            <span className="nxos-balloon-icon">{popup.icon}</span>
            <span className="nxos-balloon-title">{popup.title}</span>
            <button className="nxos-balloon-close" onClick={e => { e.stopPropagation(); dismissOsPopup(popup.id) }}>✕</button>
          </div>
          <div className="nxos-balloon-text">{popup.text}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Notification Toasts ─────────────────────────────────────────
const NotificationToast = () => {
  const notifications = useWorkStore(s => s.notifications)
  const clearNotification = useWorkStore(s => s.clearNotification)
  useEffect(() => {
    if (notifications.length > 0) {
      const t = setTimeout(() => clearNotification(notifications[0].id), 3000)
      return () => clearTimeout(t)
    }
  }, [notifications, clearNotification])
  return (
    <div className="nxos-notifications">
      {notifications.slice(0, 3).map(n => (
        <div key={n.id} className={`nxos-notification ${n.type}`}>{n.text}</div>
      ))}
    </div>
  )
}

// ─── Game Over ───────────────────────────────────────────────────
const GameOverOverlay = () => {
  const score = useWorkStore(s => s.score)
  const completedCount = useWorkStore(s => s.completedCount)
  const globalClock = useWorkStore(s => s.globalClock)
  const reset = useWorkStore(s => s.reset)
  const setGameState = useGameStore(s => s.setGameState)
  const setHighScore = useGameStore(s => s.setHighScore)
  const addPlaythrough = useGameStore(s => s.addPlaythrough)

  useEffect(() => {
    setHighScore(score)
    addPlaythrough({ score, tasksCompleted: completedCount, timeElapsed: Math.floor(globalClock), date: new Date().toISOString() })
  }, [])

  return (
    <div className="nxos-bsod">
      <div className="nxos-bsod-inner">
        <h1>NexusOS</h1>
        <p>A fatal exception 0E has occurred at 0028:C0011E36 in VXD BURNOUT(01) +</p>
        <p>00010E36. The current employee will be terminated.</p>
        <br/>
        <p>* Press RETRY to restart your shift.</p>
        <p>* Press LOG OFF to exit to desktop.</p>
        <br/>
        <div className="nxos-bsod-stats">
          <span>PRODUCTIVITY: {score} pts</span>
          <span>TASKS COMPLETED: {completedCount}</span>
          <span>TIME SURVIVED: {Math.floor(globalClock / 60)}m {Math.floor(globalClock % 60)}s</span>
        </div>
        <br/>
        <div className="nxos-bsod-actions">
          <button className="nxos-btn" onClick={() => reset()}>RETRY SHIFT</button>
          <button className="nxos-btn" onClick={() => { reset(); setGameState('START') }}>LOG OFF</button>
        </div>
        <br/>
        <p>Press any key to continue _</p>
      </div>
    </div>
  )
}

// ─── Boot Sequence ───────────────────────────────────────────────
const BootSequence = ({ onComplete }) => {
  const [lines, setLines] = useState([])
  const [progress, setProgress] = useState(0)
  const BOOT_LINES = [
    'NexusOS 98 [Version 4.10.1998]',
    '(C) Copyright Nexus Corp 1981-1998.',
    '',
    'HIMEM is testing extended memory...done.',
    'Loading NexusOS 98 Command Interpreter...',
    'NEXUS CORP PROPRIETARY - UNAUTHORIZED ACCESS PROHIBITED',
    '',
    'C:\\NEXUS> Loading WIN98.SYS...',
    'C:\\NEXUS> Mounting network drives...',
    'C:\\NEXUS> Connecting to NEXUSCORP\\INTRANET...',
    'C:\\NEXUS> Authenticating user: INTERN_9921...',
    'C:\\NEXUS> WARNING: 1,492 tasks pending',
    'C:\\NEXUS> Loading desktop...',
  ]

  useEffect(() => {
    let idx = 0
    const iv = setInterval(() => {
      if (idx < BOOT_LINES.length) {
        setLines(prev => [...prev, BOOT_LINES[idx]])
        setProgress((idx + 1) / BOOT_LINES.length)
        if (BOOT_LINES[idx]) playBlip(0.05)
        idx++
      } else { clearInterval(iv); setTimeout(onComplete, 600) }
    }, 350)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="nxos-boot">
      <div className="nxos-boot-terminal">
        {lines.map((line, i) => <div key={i} className="nxos-boot-line">{line}</div>)}
        <span className="nxos-boot-cursor">_</span>
      </div>
      <div className="nxos-boot-bar">
        <div className="nxos-boot-bar-fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ─── MAIN WORKSTATION COMPONENT ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
const Workstation2D = () => {
  const tick = useWorkStore(s => s.tick)
  const spawnTask = useWorkStore(s => s.spawnTask)
  const spawnEmail = useWorkStore(s => s.spawnEmail)
  const spawnMeeting = useWorkStore(s => s.spawnMeeting)
  const activePuzzle = useWorkStore(s => s.activePuzzle)
  const bootComplete = useWorkStore(s => s.bootComplete)
  const setBootComplete = useWorkStore(s => s.setBootComplete)
  const gameOver = useWorkStore(s => s.gameOver)
  const activeWindow = useWorkStore(s => s.activeWindow)
  const setActiveWindow = useWorkStore(s => s.setActiveWindow)
  const burnout = useWorkStore(s => s.burnout)
  const score = useWorkStore(s => s.score)
  const completedCount = useWorkStore(s => s.completedCount)
  const globalClock = useWorkStore(s => s.globalClock)
  const dayPhase = useWorkStore(s => s.dayPhase)
  const reset = useWorkStore(s => s.reset)
  const unreadEmails = useWorkStore(s => s.emails.filter(e => !e.read).length)

  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [minimizedWindows, setMinimizedWindows] = useState([])

  const animFrameRef = useRef(null)
  const lastTimeRef = useRef(performance.now())
  const taskTimerRef = useRef(0)
  const emailTimerRef = useRef(0)
  const meetingTimerRef = useRef(0)

  // Reset on mount
  useEffect(() => { reset() }, [])

  // Game loop
  useEffect(() => {
    if (!bootComplete) return
    const gameLoop = (time) => {
      const delta = Math.min((time - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = time
      tick(delta)

      taskTimerRef.current += delta
      const taskInterval = Math.max(3, 12 - useWorkStore.getState().globalClock * 0.02)
      if (taskTimerRef.current > taskInterval) { spawnTask(); taskTimerRef.current = 0 }

      emailTimerRef.current += delta
      const emailInterval = Math.max(8, 25 - useWorkStore.getState().globalClock * 0.03)
      if (emailTimerRef.current > emailInterval) { spawnEmail(); emailTimerRef.current = 0 }

      // Meetings spawn less frequently
      meetingTimerRef.current += delta
      const meetingInterval = Math.max(20, 45 - useWorkStore.getState().globalClock * 0.03)
      if (meetingTimerRef.current > meetingInterval) { spawnMeeting(); meetingTimerRef.current = 0 }

      animFrameRef.current = requestAnimationFrame(gameLoop)
    }
    spawnTask(); spawnTask(); spawnTask()
    lastTimeRef.current = performance.now()
    animFrameRef.current = requestAnimationFrame(gameLoop)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [bootComplete])

  const formatClock = (seconds) => {
    const h = 9 + Math.floor(seconds / 60)
    const m = Math.floor(seconds % 60)
    const period = h >= 12 ? 'PM' : 'AM'
    return `${h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')} ${period}`
  }

  const toggleMinimize = (windowId) => {
    setMinimizedWindows(prev =>
      prev.includes(windowId) ? prev.filter(w => w !== windowId) : [...prev, windowId]
    )
  }

  const openApp = (appId) => {
    setActiveWindow(appId)
    setMinimizedWindows(prev => prev.filter(w => w !== appId))
  }

  return (
    <div className="nxos-monitor-frame" onClick={() => startMenuOpen && setStartMenuOpen(false)}>
      {/* CRT Bezel */}
      <div className="nxos-crt-bezel">
        {/* Scanlines overlay */}
        <div className="nxos-scanlines" />
        {/* Screen curvature overlay */}
        <div className="nxos-screen-curve" />

        {!bootComplete ? (
          <BootSequence onComplete={() => setBootComplete(true)} />
        ) : (
          <div className="nxos-desktop" style={{
            filter: burnout > 0.5 ? `hue-rotate(${Math.sin(Date.now() * 0.005) * burnout * 20}deg)` : undefined
          }}>

            {/* ═══ Desktop Icons ═══ */}
            <div className="nxos-desktop-icons">
              <DesktopIcon icon="📋" label="ShadowJira" onClick={() => openApp('jira')} />
              <DesktopIcon icon="📧" label="QuickOutlook" onClick={() => openApp('email')} />
              <DesktopIcon icon="🌐" label="NexusNet" onClick={() => {}} />
              <DesktopIcon icon="📁" label="My Documents" onClick={() => {}} />
              <DesktopIcon icon="🗑️" label="Recycle Bin" onClick={() => {}} />
              <DesktopIcon icon="📝" label="README.txt" onClick={() => {}} />
              <DesktopIcon icon="💻" label="My Computer" onClick={() => {}} />
              <DesktopIcon icon="🔧" label="System32" onClick={() => {}} />
            </div>

            {/* ═══ Windows ═══ */}
            {activeWindow === 'jira' && !minimizedWindows.includes('jira') && (
              <Win98Window
                title="ShadowJira™ — Sprint Board"
                icon="📋"
                isActive={true}
                zIndex={20}
                onClose={() => setActiveWindow(null)}
                onMinimize={() => toggleMinimize('jira')}
              >
                <ShadowJiraContent />
              </Win98Window>
            )}

            {activeWindow === 'email' && !minimizedWindows.includes('email') && (
              <Win98Window
                title={`QuickOutlook™ — Inbox (${unreadEmails} unread)`}
                icon="📧"
                isActive={true}
                zIndex={20}
                onClose={() => setActiveWindow(null)}
                onMinimize={() => toggleMinimize('email')}
              >
                <QuickOutlookContent />
              </Win98Window>
            )}

            {/* ═══ Win98 Taskbar ═══ */}
            <div className="nxos-taskbar">
              <button
                className={`nxos-start-btn ${startMenuOpen ? 'pressed' : ''}`}
                onClick={e => { e.stopPropagation(); setStartMenuOpen(!startMenuOpen); playBlip() }}
              >
                <span className="nxos-start-flag">⊞</span> Start
              </button>

              <div className="nxos-taskbar-divider" />

              {/* Running app buttons */}
              <div className="nxos-taskbar-apps">
                {activeWindow === 'jira' && (
                  <button
                    className={`nxos-taskbar-app-btn ${!minimizedWindows.includes('jira') ? 'active' : ''}`}
                    onClick={() => { toggleMinimize('jira'); openApp('jira') }}
                  >📋 ShadowJira</button>
                )}
                {activeWindow === 'email' && (
                  <button
                    className={`nxos-taskbar-app-btn ${!minimizedWindows.includes('email') ? 'active' : ''}`}
                    onClick={() => { toggleMinimize('email'); openApp('email') }}
                  >📧 Outlook {unreadEmails > 0 && `(${unreadEmails})`}</button>
                )}
              </div>

              {/* System tray */}
              <div className="nxos-systray">
                <span className="nxos-systray-item" title={`Burnout: ${Math.round(burnout * 100)}%`}>
                  {burnout > 0.7 ? '🔴' : burnout > 0.4 ? '🟡' : '🟢'}
                </span>
                <span className="nxos-systray-item">⚡{score}</span>
                <span className="nxos-systray-item">✓{completedCount}</span>
                <span className="nxos-systray-clock">{formatClock(globalClock)}</span>
              </div>
            </div>

            {/* ═══ Start Menu ═══ */}
            {startMenuOpen && <StartMenu onClose={() => setStartMenuOpen(false)} onOpenApp={openApp} />}

            {/* OS Popup Balloons from system tray */}
            <OsPopupBalloons />

            {/* Notifications */}
            <NotificationToast />

            {/* Puzzle Modal */}
            {activePuzzle && <PuzzleModal />}

            {/* Game Over BSOD */}
            {gameOver && <GameOverOverlay />}
          </div>
        )}
      </div>

      {/* Monitor base stand */}
      <div className="nxos-monitor-stand" />
      <div className="nxos-monitor-base" />

      {/* Power LED */}
      <div className="nxos-power-led" />
    </div>
  )
}

export default Workstation2D
