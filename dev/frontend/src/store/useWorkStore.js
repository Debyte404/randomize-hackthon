import { create } from 'zustand'
import { generatePuzzle, OFFLINE_TASKS, MEETING_TEMPLATES, MEETING_DIALOGUES, SLACK_MESSAGES, REALISM_EVENTS } from './puzzleEngine'

// ─── Gemini API (task generation) ────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

const fetchGeminiTask = async () => {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Generate a single realistic software engineering Jira ticket. Return ONLY valid JSON with fields: title (string, max 50 chars), priority (one of CRITICAL/HIGH/MEDIUM/LOW), points (number 5-40). Example: {"title":"Fix login form validation","priority":"HIGH","points":18}' }] }],
          generationConfig: { temperature: 1.0, maxOutputTokens: 100 },
        }),
      }
    )
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const jsonMatch = text.match(/\{[^}]+\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.title && parsed.priority && parsed.points) {
        return { title: parsed.title, priority: parsed.priority, points: Math.min(40, Math.max(5, parsed.points)) }
      }
    }
  } catch (e) { /* fallback to offline */ }
  return null
}

// ─── Shuffled offline task pool ──────────────────────────────────
let taskIdCounter = 0
let spawnCounter = 0

const shuffleArray = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

let taskPool = shuffleArray(OFFLINE_TASKS)
let poolIndex = 0

const resetPool = () => {
  taskPool = shuffleArray(OFFLINE_TASKS)
  poolIndex = 0
}

const getNextOfflineTask = () => {
  if (!taskPool.length || poolIndex >= taskPool.length) resetPool()
  const template = taskPool[poolIndex++]
  if (!template) {
    resetPool()
    return taskPool[0] || { title: 'Fix unknown bug', priority: 'MEDIUM', points: 10 }
  }
  return template
}

// ─── Email templates ─────────────────────────────────────────────
const EMAIL_TEMPLATES = [
  { from: 'Karen M. (HR)', subject: 'MANDATORY: Diversity Training at 3PM', body: 'Please confirm attendance. This is not optional.' },
  { from: 'Chad B. (PM)', subject: 'Quick sync? (15 min)', body: 'Just want to align on the sprint velocity metrics real quick.' },
  { from: 'System Admin', subject: 'PASSWORD EXPIRES IN 24H', body: 'Your password must contain 3 emojis and a haiku.' },
  { from: 'Janet (Legal)', subject: 'RE: RE: RE: RE: NDA Addendum', body: 'Please review the attached 47-page document by EOD.' },
  { from: 'Brad (CTO)', subject: 'Innovation Hour!', body: 'Mandatory fun session. Bring your best startup pitch.' },
  { from: 'Slack Bot', subject: 'You have 847 unread messages', body: '#general is on fire again.' },
  { from: 'IT Support', subject: 'Ticket #9921 Resolved', body: 'We turned it off and on again. Issue closed.' },
  { from: 'Dave (Finance)', subject: 'Expense Report REJECTED', body: 'Coffee is not a business expense. Please resubmit.' },
  { from: 'Motivational Bot', subject: '🌟 Daily Inspiration', body: '"You miss 100% of the deadlines you don\'t set." — Corporate Wisdom' },
  { from: 'Wellness Program', subject: 'Reminder: Stretch Break!', body: 'Your ergonomic assessment is overdue by 3 months.' },
]

const generateTask = async (useGemini = false) => {
  let template = null
  let wasAiGenerated = false
  if (useGemini) {
    try {
      template = await fetchGeminiTask()
      if (template) wasAiGenerated = true
    } catch(e) { /* fallback */ }
  }
  if (!template) {
    template = getNextOfflineTask()
  }
  taskIdCounter++
  return {
    id: `TASK-${String(taskIdCounter).padStart(4, '0')}`,
    title: template.title,
    priority: template.priority,
    points: template.points,
    dependency: null,
    status: 'backlog',
    createdAt: Date.now(),
    deadline: 60 + Math.random() * 60,
    aiGenerated: wasAiGenerated,
  }
}

const generateEmail = () => {
  const template = EMAIL_TEMPLATES[Math.floor(Math.random() * EMAIL_TEMPLATES.length)]
  return {
    id: `EMAIL-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    ...template,
    read: false,
    urgent: Math.random() > 0.75,
    createdAt: Date.now(),
    expiresIn: 30,
  }
}

const generateMeeting = () => {
  const template = MEETING_TEMPLATES[Math.floor(Math.random() * MEETING_TEMPLATES.length)]
  return {
    id: `MTG-${Date.now()}`,
    ...template,
    createdAt: Date.now(),
    startsIn: 20 + Math.floor(Math.random() * 20),
    dismissed: false,
  }
}

// ─── Chaos phases ────────────────────────────────────────────────
const getChaosMultiplier = (clock, gameMode) => {
  let base
  if (clock < 120) base = 0.4
  else if (clock < 240) base = 0.7
  else if (clock < 300) base = 1.0
  else if (clock < 360) base = 1.5
  else base = 2.0

  // Game mode multipliers
  const modeMultipliers = {
    balanced: 1.0,
    deadline_rush: 1.3,
    meeting_hell: 0.8,
    nightmare: 1.8,
  }
  return base * (modeMultipliers[gameMode] || 1.0)
}

export const useWorkStore = create((set, get) => ({
  // Core metrics
  score: 0,
  burnout: 0,
  globalClock: 0,
  dayPhase: 'MORNING',
  gameMode: 'balanced',

  // Task system
  tasks: [],
  completedCount: 0,

  // Email system
  emails: [],

  // Meeting system
  meetings: [],
  activeMeeting: null, // { meeting, dialogues, currentDialogue, timer, totalTime }

  // Puzzle system
  activePuzzle: null,
  puzzleInput: '',
  puzzleState: {}, // for visual puzzles (clicked nodes, dragged items, etc.)

  // Slack interruptions
  slackMessages: [],

  // Realism events
  activeEvent: null,

  // UI state
  activeWindow: null,
  notifications: [],
  notificationHistory: [],
  osPopups: [],
  bootComplete: false,
  gameOver: false,

  // Combo system
  combo: 0,
  comboMultiplier: 1,
  lastCompletionTime: 0,

  // XP & Level
  xp: 0,
  level: 1,

  // Boss alert
  bossAlert: null, // { deadline, startTime }

  // Achievements
  achievements: [],
  achievementPopup: null,

  // --- Actions ---
  setGameMode: (mode) => set({ gameMode: mode }),

  _lastHeavyTick: 0, // throttle expensive checks to ~1/sec

  tick: (delta) => {
    const state = get()
    if (state.gameOver) return

    const newClock = state.globalClock + delta
    const now = Date.now()

    let dayPhase = 'MORNING'
    if (newClock > 120) dayPhase = 'AFTERNOON'
    if (newClock > 300) dayPhase = 'CRUNCH_TIME'
    if (newClock > 360) dayPhase = 'OVERTIME'

    let burnoutDelta = delta * 0.0008 * getChaosMultiplier(newClock, state.gameMode)

    // Active meeting timer (runs every frame — lightweight)
    let activeMeeting = state.activeMeeting
    if (activeMeeting) {
      activeMeeting = { ...activeMeeting, timer: activeMeeting.timer - delta * (activeMeeting.speedMultiplier || 1) }
      if (activeMeeting.timer <= 0) {
        burnoutDelta += 0.05
        activeMeeting = null
      }
    }

    // Heavy checks: email/task/meeting expiry — throttle to ~1/sec
    const doHeavy = (now - state._lastHeavyTick) > 1000
    let updatedEmails = state.emails
    let updatedTasks = state.tasks
    let updatedMeetings = state.meetings
    let activePopups = state.osPopups
    let activeSlack = state.slackMessages

    if (doHeavy) {
      const chaos = getChaosMultiplier(newClock, state.gameMode)

      // Expire emails
      let expiredEmails = 0
      updatedEmails = state.emails.filter(e => {
        if (e.read && (now - e.createdAt) / 1000 > 60) return false // prune old read emails
        return true
      }).map(e => {
        if (!e.read && (now - e.createdAt) / 1000 > e.expiresIn) { expiredEmails++; return { ...e, read: true } }
        return e
      })
      burnoutDelta += expiredEmails * 0.04 * chaos

      // Expire tasks
      updatedTasks = state.tasks.map(t => {
        if (t.status === 'backlog') {
          if ((now - t.createdAt) / 1000 > t.deadline) return { ...t, status: 'done', expired: true }
        }
        return t
      })
      // Prune old done tasks (keep last 20)
      const doneTasks = updatedTasks.filter(t => t.status === 'done')
      if (doneTasks.length > 20) {
        const keepIds = new Set(doneTasks.slice(-20).map(t => t.id))
        updatedTasks = updatedTasks.filter(t => t.status !== 'done' || keepIds.has(t.id))
      }
      const newExpired = updatedTasks.filter(t => t.expired && !state.tasks.find(st => st.id === t.id && st.expired)).length
      burnoutDelta += newExpired * 0.03 * chaos

      // Expire meetings
      updatedMeetings = state.meetings.filter(m => {
        if (m.dismissed && (now - m.createdAt) / 1000 > 60) return false // prune old
        return true
      }).map(m => {
        if (!m.dismissed && (now - m.createdAt) / 1000 > m.startsIn + 15) { burnoutDelta += 0.06; return { ...m, dismissed: true } }
        return m
      })

      // Prune popups and slack
      activePopups = state.osPopups.filter(p => (now - p.createdAt) < 10000)
      activeSlack = state.slackMessages.filter(s => (now - s.createdAt) < 20000)
    }

    const newBurnout = Math.min(1.0, state.burnout + burnoutDelta)
    if (newBurnout >= 1.0) {
      set({ gameOver: true, burnout: 1.0, globalClock: newClock })
      return
    }

    const updates = { globalClock: newClock, dayPhase, burnout: newBurnout, activeMeeting }
    if (doHeavy) {
      updates.emails = updatedEmails
      updates.tasks = updatedTasks
      updates.meetings = updatedMeetings
      updates.osPopups = activePopups
      updates.slackMessages = activeSlack
      updates._lastHeavyTick = now
      // Cap notification history at 50
      if (state.notificationHistory.length > 50) {
        updates.notificationHistory = state.notificationHistory.slice(-50)
      }
    }
    set(updates)
  },

  spawnTask: async () => {
    try {
      spawnCounter++
      const useGemini = spawnCounter % 4 === 0
      const task = await generateTask(useGemini)
      if (!task || !task.id) return // safety check
      const now = Date.now()
      set(state => ({
        tasks: [...state.tasks, task],
        notifications: [...state.notifications, { id: now, text: `New ticket: ${task.id}${task.aiGenerated ? ' 🤖' : ''}`, type: 'task' }],
        notificationHistory: [...state.notificationHistory, { id: now, icon: '📋', text: `New ticket: ${task.id} — "${task.title}"`, type: 'task', app: 'jira', createdAt: now }],
        osPopups: [...state.osPopups, {
          id: now, icon: '📋', title: 'ShadowJira™',
          text: `New ticket assigned: ${task.id}\n"${task.title}"`,
          type: 'task', createdAt: now,
        }],
      }))
    } catch (e) {
      console.warn('spawnTask error:', e)
    }
  },

  startPuzzle: (taskId) => {
    const state = get()
    const task = state.tasks.find(t => t.id === taskId)
    if (!task || task.status === 'done') return
    if (task.dependency) {
      const depTask = state.tasks.find(t => t.title === task.dependency && t.status === 'done')
      if (!depTask) {
        set(s => ({ notifications: [...s.notifications, { id: Date.now(), text: `BLOCKED: Requires "${task.dependency}"`, type: 'error' }] }))
        return
      }
    }
    const puzzle = generatePuzzle()
    set({ activePuzzle: { puzzle, taskId }, puzzleInput: '', puzzleState: {} })
  },

  setPuzzleInput: (input) => set({ puzzleInput: input }),
  setPuzzleState: (updater) => set(s => ({ puzzleState: typeof updater === 'function' ? updater(s.puzzleState) : updater })),

  submitPuzzle: () => {
    const state = get()
    if (!state.activePuzzle) return false
    const { puzzle, taskId } = state.activePuzzle
    const userAnswer = state.puzzleInput.trim().toLowerCase()
    const correctAnswer = String(puzzle.answer || '').toLowerCase()

    let correct = false
    if (puzzle.type === 'text_input') {
      correct = userAnswer === correctAnswer
    } else if (puzzle.type === 'pattern_match') {
      correct = state.puzzleState.selected === puzzle.correct
    } else if (puzzle.type === 'logic_grid') {
      correct = state.puzzleState.selected === puzzle.correct
    } else if (puzzle.type === 'node_connection') {
      const clicked = state.puzzleState.clickedOrder || []
      correct = JSON.stringify(clicked) === JSON.stringify(puzzle.correctOrder)
    } else if (puzzle.type === 'sorting') {
      const order = state.puzzleState.sortedItems || puzzle.items || []
      correct = JSON.stringify(order.map(i => i.label)) === JSON.stringify(puzzle.correctOrder)
    } else if (puzzle.type === 'neural_network') {
      const wires = state.puzzleState.wires || []
      const correctWires = puzzle.correctWires
      correct = correctWires.every(cw => wires.some(w => w[0] === cw[0] && w[1] === cw[1])) && wires.length === correctWires.length
    } else if (puzzle.type === 'pathfinding') {
      const path = state.puzzleState.path || []
      if (path.length > 0) {
        const grid = puzzle.grid
        const lastCell = path[path.length - 1]
        const reachedEnd = grid[lastCell[0]]?.[lastCell[1]] === 3
        correct = reachedEnd && path.length <= puzzle.optimalLength + 2
      }
    }

    if (correct) {
      const task = state.tasks.find(t => t.id === taskId)
      if (task) {
        const now = Date.now()
        const timeSinceLast = (now - state.lastCompletionTime) / 1000
        const isCombo = timeSinceLast < 30 && state.lastCompletionTime > 0
        const newCombo = isCombo ? state.combo + 1 : 1
        const newMultiplier = Math.min(5, 1 + (newCombo - 1) * 0.5) // 1x, 1.5x, 2x, 2.5x... up to 5x
        const basePoints = task.points + puzzle.points
        const totalPoints = Math.round(basePoints * newMultiplier)

        const newXp = state.xp + totalPoints
        const xpForNextLevel = state.level * 50
        const newLevel = newXp >= xpForNextLevel ? state.level + 1 : state.level
        const adjustedXp = newXp >= xpForNextLevel ? newXp - xpForNextLevel : newXp

        // Check achievements
        const newCount = state.completedCount + 1
        const newAchievements = [...state.achievements]
        let achievementPopup = null
        const ACHIEVEMENT_DEFS = [
          { id: 'first_task', check: () => newCount >= 1, title: '🎯 First Blood', desc: 'Completed your first task' },
          { id: 'combo_3', check: () => newCombo >= 3, title: '🔥 On Fire!', desc: '3x combo streak' },
          { id: 'combo_5', check: () => newCombo >= 5, title: '⚡ Unstoppable!', desc: '5x combo streak' },
          { id: 'tasks_5', check: () => newCount >= 5, title: '📋 Ticket Machine', desc: 'Completed 5 tasks' },
          { id: 'tasks_10', check: () => newCount >= 10, title: '🏆 Sprint Champion', desc: 'Completed 10 tasks' },
          { id: 'tasks_25', check: () => newCount >= 25, title: '💎 Code Warrior', desc: 'Completed 25 tasks' },
          { id: 'score_100', check: () => (state.score + totalPoints) >= 100, title: '💯 Century Club', desc: 'Scored 100+ points' },
          { id: 'score_500', check: () => (state.score + totalPoints) >= 500, title: '🌟 Point Hoarder', desc: 'Scored 500+ points' },
          { id: 'level_3', check: () => newLevel >= 3, title: '📈 Rising Star', desc: 'Reached level 3' },
          { id: 'level_5', check: () => newLevel >= 5, title: '🚀 Senior Intern', desc: 'Reached level 5' },
        ]
        for (const ach of ACHIEVEMENT_DEFS) {
          if (!newAchievements.includes(ach.id) && ach.check()) {
            newAchievements.push(ach.id)
            achievementPopup = { title: ach.title, desc: ach.desc, time: now }
          }
        }

        const comboText = newMultiplier > 1 ? ` (${newMultiplier}x COMBO!)` : ''
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: 'done' } : t),
          score: s.score + totalPoints,
          completedCount: newCount,
          burnout: Math.max(0, s.burnout - 0.04),
          combo: newCombo,
          comboMultiplier: newMultiplier,
          lastCompletionTime: now,
          xp: adjustedXp,
          level: newLevel,
          achievements: newAchievements,
          achievementPopup,
          notifications: [...s.notifications, { id: now, text: `+${totalPoints} pts${comboText} — ${taskId} done!`, type: 'success' }],
          notificationHistory: [...s.notificationHistory, { id: now, icon: '✅', text: `+${totalPoints} pts${comboText} — ${taskId} completed!`, type: 'success', app: 'jira', createdAt: now }],
          activePuzzle: null, puzzleInput: '', puzzleState: {},
        }))
      }
      return true
    }
    return false
  },

  cancelPuzzle: () => set(s => ({
    activePuzzle: null, puzzleInput: '', puzzleState: {},
    score: Math.max(0, s.score - 5),
  })),

  completeTask: (taskId) => { get().startPuzzle(taskId) },

  moveToInProgress: (taskId) => {
    set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: 'in_progress' } : t) }))
  },

  spawnEmail: () => {
    const email = generateEmail()
    const now = Date.now()
    set(s => ({
      emails: [...s.emails, email],
      notifications: [...s.notifications, { id: now, text: `📧 ${email.from}: ${email.subject}`, type: 'email' }],
      notificationHistory: [...s.notificationHistory, { id: now, icon: '📧', text: `${email.from}: ${email.subject}`, type: 'email', app: 'email', createdAt: now }],
      osPopups: [...s.osPopups, {
        id: now, icon: '📧', title: 'QuickOutlook™',
        text: `From: ${email.from}\n${email.subject}`,
        type: 'email', createdAt: now,
      }],
    }))
  },

  spawnMeeting: () => {
    const meeting = generateMeeting()
    const now = Date.now()
    set(s => ({
      meetings: [...s.meetings, meeting],
      notifications: [...s.notifications, { id: now, text: `📅 Meeting: ${meeting.title} in ${meeting.startsIn}s`, type: 'meeting' }],
      notificationHistory: [...s.notificationHistory, { id: now, icon: '📅', text: `Meeting: ${meeting.title} — ${meeting.organizer} (${meeting.room})`, type: 'meeting', app: null, createdAt: now }],
      osPopups: [...s.osPopups, {
        id: now, icon: '📅', title: 'Meeting Reminder',
        text: `"${meeting.title}"\nOrganizer: ${meeting.organizer}\n${meeting.room} — ${meeting.duration}`,
        type: 'meeting', createdAt: now,
      }],
    }))
  },

  // --- Interactive Meeting System ---
  startMeeting: (meetingId) => {
    const state = get()
    const meeting = state.meetings.find(m => m.id === meetingId)
    if (!meeting) return
    const dialogues = shuffleArray(MEETING_DIALOGUES).slice(0, 3 + Math.floor(Math.random() * 2))
    set({
      activeMeeting: {
        meeting,
        dialogues,
        currentDialogue: 0,
        timer: 30, // 30 second meeting
        totalTime: 30,
        speedMultiplier: 1.0,
      },
      meetings: state.meetings.map(m => m.id === meetingId ? { ...m, dismissed: true } : m),
      activeWindow: 'meeting',
    })
  },

  meetingChoice: (choiceIdx) => {
    const state = get()
    if (!state.activeMeeting) return
    const dialogue = state.activeMeeting.dialogues[state.activeMeeting.currentDialogue]
    if (!dialogue) return
    const choice = dialogue.choices[choiceIdx]
    if (!choice) return
    const effect = choice.effect
    const nextDialogue = state.activeMeeting.currentDialogue + 1
    const meetingDone = nextDialogue >= state.activeMeeting.dialogues.length

    if (meetingDone) {
      const now = Date.now()
      set(s => ({
        score: s.score + effect.score,
        burnout: Math.max(0, Math.min(1, s.burnout + effect.burnout)),
        activeMeeting: null,
        notifications: [...s.notifications, { id: now, text: `Meeting ended! ${effect.score > 0 ? '+' : ''}${effect.score} pts`, type: effect.score >= 0 ? 'success' : 'error' }],
        notificationHistory: [...s.notificationHistory, { id: now, icon: '📅', text: `Meeting ended (${choice.type})`, type: 'meeting', app: null, createdAt: now }],
      }))
    } else {
      set(s => ({
        score: s.score + effect.score,
        burnout: Math.max(0, Math.min(1, s.burnout + effect.burnout)),
        activeMeeting: {
          ...s.activeMeeting,
          currentDialogue: nextDialogue,
          speedMultiplier: s.activeMeeting.speedMultiplier * effect.meetingSpeed,
        },
      }))
    }
  },

  endMeetingEarly: () => {
    const now = Date.now()
    set(s => ({
      activeMeeting: null,
      burnout: Math.max(0, s.burnout - 0.02),
      score: Math.max(0, s.score - 3),
      notifications: [...s.notifications, { id: now, text: 'Left meeting early (-3 pts)', type: 'error' }],
    }))
  },

  // --- Slack Interruptions ---
  spawnSlack: () => {
    const template = SLACK_MESSAGES[Math.floor(Math.random() * SLACK_MESSAGES.length)]
    const now = Date.now()
    set(s => ({
      slackMessages: [...s.slackMessages, { id: now, ...template, createdAt: now }],
      notificationHistory: [...s.notificationHistory, { id: now, icon: '💬', text: `Slack: ${template.from} — ${template.text.slice(0, 40)}...`, type: 'email', app: null, createdAt: now }],
    }))
  },

  respondSlack: (slackId) => {
    set(s => ({
      slackMessages: s.slackMessages.filter(m => m.id !== slackId),
      score: s.score + 2,
      notifications: [...s.notifications, { id: Date.now(), text: 'Slack responded (+2 pts)', type: 'success' }],
    }))
  },

  ignoreSlack: (slackId) => {
    set(s => ({
      slackMessages: s.slackMessages.filter(m => m.id !== slackId),
      burnout: Math.min(1, s.burnout + 0.01),
    }))
  },

  // --- Realism Events ---
  triggerEvent: () => {
    const event = REALISM_EVENTS[Math.floor(Math.random() * REALISM_EVENTS.length)]
    const now = Date.now()
    set(s => {
      let updates = {
        activeEvent: { ...event, id: now },
        notifications: [...s.notifications, { id: now, text: event.title, type: event.type === 'praise' ? 'success' : 'task' }],
        notificationHistory: [...s.notificationHistory, { id: now, icon: '⚡', text: `Event: ${event.title}`, type: 'task', app: null, createdAt: now }],
      }

      // Handle effects
      if (event.effect === 'reopen_task') {
        const doneTasks = s.tasks.filter(t => t.status === 'done' && !t.expired)
        if (doneTasks.length > 0) {
          const reopened = doneTasks[Math.floor(Math.random() * doneTasks.length)]
          updates.tasks = s.tasks.map(t => t.id === reopened.id ? { ...t, status: 'backlog', createdAt: Date.now(), deadline: 45 + Math.random() * 30 } : t)
        }
      } else if (event.effect === 'burnout_spike') {
        updates.burnout = Math.min(1, s.burnout + 0.05)
      } else if (event.effect === 'burnout_relief') {
        updates.burnout = Math.max(0, s.burnout - 0.08)
        updates.score = s.score + 10
      } else if (event.effect === 'boss_alert') {
        updates.bossAlert = { deadline: 5, startTime: Date.now() }
        updates.activeEvent = null // dismiss the event dialog, boss alert takes over
      }

      return updates
    })
  },

  dismissEvent: () => set({ activeEvent: null }),

  triggerBossAlert: () => {
    set(s => ({
      bossAlert: { deadline: 5, startTime: Date.now() },
      notifications: [...s.notifications, { id: Date.now(), text: '🚨 BOSS IS COMING! Close non-work apps!', type: 'error' }],
    }))
  },

  resolveBossAlert: (survived) => {
    const now = Date.now()
    if (survived) {
      set(s => ({
        bossAlert: null,
        score: s.score + 15,
        burnout: Math.max(0, s.burnout - 0.03),
        notifications: [...s.notifications, { id: now, text: '✅ Boss walked by! +15 pts', type: 'success' }],
      }))
    } else {
      set(s => ({
        bossAlert: null,
        score: Math.max(0, s.score - 20),
        burnout: Math.min(1, s.burnout + 0.08),
        notifications: [...s.notifications, { id: now, text: '😱 Boss caught you slacking! -20 pts', type: 'error' }],
      }))
    }
  },

  dismissAchievement: () => set({ achievementPopup: null }),

  takeCoffeeBreak: () => {
    set(s => ({
      activeEvent: null,
      burnout: Math.max(0, s.burnout - 0.1),
      notifications: [...s.notifications, { id: Date.now(), text: '☕ Coffee break! Burnout reduced.', type: 'success' }],
    }))
  },

  dismissMeeting: (meetingId) => {
    set(s => ({
      meetings: s.meetings.map(m => m.id === meetingId ? { ...m, dismissed: true } : m),
      burnout: Math.max(0, s.burnout - 0.01),
    }))
  },

  dismissEmail: (emailId) => {
    set(s => ({
      emails: s.emails.map(e => e.id === emailId ? { ...e, read: true } : e),
      burnout: Math.max(0, s.burnout - 0.01),
    }))
  },

  dismissOsPopup: (popupId) => {
    set(s => ({ osPopups: s.osPopups.filter(p => p.id !== popupId) }))
  },

  setActiveWindow: (w) => set({ activeWindow: w }),
  setBootComplete: (v) => set({ bootComplete: v }),
  clearNotification: (id) => set(s => ({
    notifications: s.notifications.filter(n => n.id !== id),
  })),
  clearHistory: () => set({ notificationHistory: [] }),

  reset: () => {
    taskIdCounter = 0
    spawnCounter = 0
    resetPool()
    set({
      score: 0, burnout: 0, globalClock: 0, dayPhase: 'MORNING',
      tasks: [], completedCount: 0, emails: [], meetings: [],
      activeMeeting: null, activePuzzle: null, puzzleInput: '', puzzleState: {},
      slackMessages: [], activeEvent: null,
      activeWindow: null, notifications: [], notificationHistory: [], osPopups: [],
      bootComplete: false, gameOver: false, _lastHeavyTick: 0,
      combo: 0, comboMultiplier: 1, lastCompletionTime: 0,
      xp: 0, level: 1,
      bossAlert: null,
      achievements: [], achievementPopup: null,
    })
  },
}))
