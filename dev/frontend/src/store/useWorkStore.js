import { create } from 'zustand'

// ─── Puzzle Generators (Visual-heavy, fun-first) ─────────────────
const PUZZLE_TYPES = [
  // Type 1: Complete the code (easy, familiar)
  () => {
    const snippets = [
      { code: 'function add(a, b) {\n  return a ___ b;\n}', answer: '+', hint: 'Addition operator' },
      { code: 'const arr = [1,2,3];\narr._____(4);', answer: 'push', hint: 'Add to end of array' },
      { code: 'for (let i = 0; i < arr.___; i++)', answer: 'length', hint: 'Array size property' },
      { code: 'JSON._____(data)', answer: 'stringify', hint: 'Object to JSON string' },
      { code: 'const doubled = arr.___(x => x * 2)', answer: 'map', hint: 'Transform each element' },
    ]
    const s = snippets[Math.floor(Math.random() * snippets.length)]
    return { type: 'code_complete', prompt: 'COMPLETE THE CODE', code: s.code, answer: s.answer, hint: s.hint, points: 5 }
  },

  // Type 2: Emoji Sequence — "What comes next?"
  () => {
    const sequences = [
      { seq: '🔴 🟡 🔴 🟡 🔴 ?', answer: '🟡', hint: 'Alternating pattern', display: 'emoji' },
      { seq: '⬆️ ➡️ ⬇️ ⬅️ ⬆️ ?', answer: '➡️', hint: 'Clockwise rotation', display: 'emoji' },
      { seq: '🌑 🌓 🌕 🌗 🌑 ?', answer: '🌓', hint: 'Moon phases cycle', display: 'emoji' },
      { seq: '1️⃣ 2️⃣ 3️⃣ 5️⃣ 8️⃣ ?', answer: '13', hint: 'Fibonacci sequence', display: 'emoji' },
      { seq: '😀 😃 😄 😆 😅 ?', answer: '🤣', hint: 'Escalating laughter', display: 'emoji' },
      { seq: '🟥 🟧 🟨 🟩 🟦 ?', answer: '🟪', hint: 'Rainbow order', display: 'emoji' },
    ]
    const s = sequences[Math.floor(Math.random() * sequences.length)]
    return { type: 'sequence', prompt: 'WHAT COMES NEXT?', code: s.seq, answer: s.answer, hint: s.hint, points: 4 }
  },

  // Type 3: Spot the Difference (ASCII art)
  () => {
    const diffs = [
      { left: '[ O O ]\n[  ^  ]\n[ \\_/ ]', right: '[ O O ]\n[  ^  ]\n[ \\_\\ ]', answer: 'mouth', hint: 'Look at the bottom row' },
      { left: 'A B C D\n1 2 3 4', right: 'A B C D\n1 2 4 4', answer: '3', hint: 'Check the numbers', display: 'diff' },
      { left: '##  ##\n ##  \n##  ##', right: '##  ##\n ##  \n##  # ', answer: 'last', hint: 'Bottom-right corner', display: 'diff' },
      { left: '->->->->\n->->->->\n->->->->', right: '->->->->\n->-<->->\n->->->->', answer: 'arrow', hint: 'One arrow is reversed', display: 'diff' },
    ]
    const d = diffs[Math.floor(Math.random() * diffs.length)]
    return { type: 'spot_diff', prompt: 'SPOT THE DIFFERENCE', code: `LEFT:\n${d.left}\n\nRIGHT:\n${d.right}\n\nWhat changed?`, answer: d.answer, hint: d.hint, points: 6 }
  },

  // Type 4: Color Code Matching
  () => {
    const colors = [
      { name: 'The color of a STOP sign', answer: 'red', hint: 'Think traffic' },
      { name: 'The color of the sky on a clear day', answer: 'blue', hint: 'Look up!' },
      { name: 'CSS color: #FF0000', answer: 'red', hint: 'Full red channel' },
      { name: 'CSS color: #00FF00', answer: 'green', hint: 'Full green channel' },
      { name: 'CSS color: #FFFFFF', answer: 'white', hint: 'All channels max' },
      { name: 'CSS color: #000000', answer: 'black', hint: 'All channels zero' },
      { name: 'Mix of RED + BLUE light', answer: 'purple', hint: 'Additive color mixing' },
      { name: 'The NexusCorp logo color (teal)', answer: 'teal', hint: 'Our corporate identity' },
    ]
    const c = colors[Math.floor(Math.random() * colors.length)]
    return { type: 'color', prompt: 'NAME THAT COLOR', code: c.name, answer: c.answer, hint: c.hint, points: 3 }
  },

  // Type 5: Unscramble the Word (dev terms)
  () => {
    const words = [
      { scrambled: 'TBUNOG', answer: 'bug', hint: '3-letter word: what testers find' },
      { scrambled: 'CEUDONMITTAN', answer: 'documentation', hint: 'What nobody writes' },
      { scrambled: 'EUSRIMOAPNFDRTEWN', answer: 'frontend', hint: 'The part users see' },
      { scrambled: 'ABCKDEN', answer: 'backend', hint: 'Server-side code' },
      { scrambled: 'STPUEDDA', answer: 'updated', hint: 'Past tense: made current' },
      { scrambled: 'TSEINTG', answer: 'testing', hint: 'QA does this' },
      { scrambled: 'EPYLOD', answer: 'deploy', hint: 'Ship to production' },
      { scrambled: 'ACMIHBGEN', answer: 'branching', hint: 'Git workflow concept' },
    ]
    const w = words[Math.floor(Math.random() * words.length)]
    return { type: 'unscramble', prompt: 'UNSCRAMBLE THE WORD', code: `Letters: ${w.scrambled}`, answer: w.answer, hint: w.hint, points: 4 }
  },

  // Type 6: Corporate Trivia (fun, on-theme)
  () => {
    const trivia = [
      { q: 'What does "LGTM" mean in code review?', answer: 'looks good to me', hint: 'Approval acronym' },
      { q: 'What does CSS stand for?', answer: 'cascading style sheets', hint: 'Web styling language' },
      { q: 'What key do you press to save? (just the letter)', answer: 's', hint: 'Ctrl + ?' },
      { q: 'In Git, what command creates a new branch?', answer: 'checkout', hint: 'git _____ -b name' },
      { q: 'What does API stand for?', answer: 'application programming interface', hint: 'How services communicate' },
      { q: 'What year was JavaScript created?', answer: '1995', hint: '90s kid' },
      { q: 'How many bits in a byte?', answer: '8', hint: 'Two nibbles' },
      { q: 'What HTTP status code means "Not Found"?', answer: '404', hint: 'The famous error page' },
    ]
    const t = trivia[Math.floor(Math.random() * trivia.length)]
    return { type: 'trivia', prompt: 'CORPORATE TRIVIA', code: t.q, answer: t.answer, hint: t.hint, points: 5 }
  },

  // Type 7: Pattern Fill (visual ASCII)
  () => {
    const patterns = [
      { code: 'X O X\nO X O\nX O ?', answer: 'x', hint: 'Checkerboard pattern' },
      { code: '▲ ▼ ▲\n▼ ▲ ▼\n▲ ▼ ?', answer: '▲', hint: 'Alternating triangles' },
      { code: '1 1\n2 1\n1 2 1 1\nWhat describes "1 2 1 1"?', answer: '3', hint: 'Count-and-say: three 1s', display: 'pattern' },
    ]
    const p = patterns[Math.floor(Math.random() * patterns.length)]
    return { type: 'pattern', prompt: 'FILL THE PATTERN', code: p.code, answer: p.answer, hint: p.hint, points: 4 }
  },
]

const generatePuzzle = () => {
  const gen = PUZZLE_TYPES[Math.floor(Math.random() * PUZZLE_TYPES.length)]
  return gen()
}

// ─── Task templates ─────────────────────────────────────────────
const TASK_TEMPLATES = [
  { title: 'Fix login button alignment', priority: 'HIGH', points: 15, dep: null },
  { title: 'Update user onboarding flow', priority: 'MEDIUM', points: 10, dep: null },
  { title: 'Refactor legacy auth module', priority: 'CRITICAL', points: 25, dep: 'Fix login button alignment' },
  { title: 'Add dark mode toggle', priority: 'LOW', points: 5, dep: null },
  { title: 'Migrate DB to PostgreSQL', priority: 'CRITICAL', points: 30, dep: null },
  { title: 'Write unit tests for API', priority: 'MEDIUM', points: 12, dep: null },
  { title: 'Optimize image compression', priority: 'LOW', points: 8, dep: null },
  { title: 'Deploy hotfix to staging', priority: 'HIGH', points: 20, dep: 'Migrate DB to PostgreSQL' },
  { title: 'Update privacy policy page', priority: 'LOW', points: 5, dep: null },
  { title: 'Implement SSO integration', priority: 'HIGH', points: 22, dep: 'Refactor legacy auth module' },
  { title: 'Fix memory leak in dashboard', priority: 'CRITICAL', points: 28, dep: null },
  { title: 'Add export to CSV feature', priority: 'MEDIUM', points: 10, dep: null },
  { title: 'Review PR #4921', priority: 'MEDIUM', points: 8, dep: null },
  { title: 'Sync CRM data pipeline', priority: 'HIGH', points: 18, dep: null },
  { title: 'Patch XSS vulnerability', priority: 'CRITICAL', points: 35, dep: null },
]

// ─── Meeting templates ──────────────────────────────────────────
const MEETING_TEMPLATES = [
  { title: 'Sprint Retrospective', organizer: 'Chad B. (PM)', duration: '60 min', room: 'Conf Room C' },
  { title: 'All-Hands Meeting', organizer: 'Brad (CTO)', duration: '90 min', room: 'Auditorium' },
  { title: 'Code Review Session', organizer: 'Sarah (Lead Dev)', duration: '30 min', room: 'Zoom Link' },
  { title: '1:1 with Manager', organizer: 'Mike (Mgr)', duration: '30 min', room: 'His Office' },
  { title: 'Incident Postmortem', organizer: 'DevOps Bot', duration: '45 min', room: 'War Room' },
  { title: 'Mandatory Fun Hour', organizer: 'Karen M. (HR)', duration: '60 min', room: 'Break Room' },
  { title: 'Budget Planning Q4', organizer: 'Dave (Finance)', duration: '120 min', room: 'Board Room' },
  { title: 'Product Demo to Client', organizer: 'Sales Team', duration: '45 min', room: 'Showroom A' },
]

// Email templates
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

let taskIdCounter = 0
const generateTask = () => {
  const template = TASK_TEMPLATES[Math.floor(Math.random() * TASK_TEMPLATES.length)]
  taskIdCounter++
  return {
    id: `TASK-${String(taskIdCounter).padStart(4, '0')}`,
    title: template.title,
    priority: template.priority,
    points: template.points,
    dependency: template.dep,
    status: 'backlog',
    createdAt: Date.now(),
    deadline: 60 + Math.random() * 60, // 60-120 seconds (much more relaxed)
  }
}

const generateEmail = () => {
  const template = EMAIL_TEMPLATES[Math.floor(Math.random() * EMAIL_TEMPLATES.length)]
  return {
    id: `EMAIL-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    ...template,
    read: false,
    urgent: Math.random() > 0.75, // less frequent urgency
    createdAt: Date.now(),
    expiresIn: 30, // 30 seconds (doubled from 15)
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

// ─── Chaos phases (fun → hectic → nightmare) ────────────────────
// Minutes: 0-2 = chill, 2-4 = normal, 4-5 = crunch, 5+ = chaos
const getChaosMultiplier = (clock) => {
  if (clock < 120) return 0.4     // First 2 min: very relaxed
  if (clock < 240) return 0.7     // 2-4 min: warming up
  if (clock < 300) return 1.0     // 4-5 min: normal
  if (clock < 360) return 1.5     // 5-6 min: crunch time
  return 2.0                       // 6+ min: chaos
}

export const useWorkStore = create((set, get) => ({
  // Core metrics
  score: 0,
  burnout: 0,
  globalClock: 0,
  dayPhase: 'MORNING',

  // Task system
  tasks: [],
  completedCount: 0,

  // Email system
  emails: [],

  // Meeting system
  meetings: [],

  // Puzzle system
  activePuzzle: null,
  puzzleInput: '',

  // UI state
  activeWindow: null, // start with no window open — see desktop first
  notifications: [],
  osPopups: [],
  bootComplete: false,
  gameOver: false,

  // --- Actions ---
  tick: (delta) => {
    const state = get()
    if (state.gameOver) return

    const newClock = state.globalClock + delta
    const chaos = getChaosMultiplier(newClock)

    let dayPhase = 'MORNING'
    if (newClock > 120) dayPhase = 'AFTERNOON'
    if (newClock > 300) dayPhase = 'CRUNCH_TIME'
    if (newClock > 360) dayPhase = 'OVERTIME'

    // MUCH slower passive burnout, scaled by chaos
    let burnoutDelta = delta * 0.0008 * chaos

    const now = Date.now()
    let expiredEmails = 0
    const updatedEmails = state.emails.map(e => {
      if (!e.read && (now - e.createdAt) / 1000 > e.expiresIn) {
        expiredEmails++
        return { ...e, read: true }
      }
      return e
    })
    burnoutDelta += expiredEmails * 0.04 * chaos // halved penalty

    const updatedTasks = state.tasks.map(t => {
      if (t.status === 'backlog') {
        const elapsed = (now - t.createdAt) / 1000
        if (elapsed > t.deadline) {
          return { ...t, status: 'done', expired: true }
        }
      }
      return t
    })
    const newExpired = updatedTasks.filter(t => t.expired && !state.tasks.find(st => st.id === t.id && st.expired)).length
    burnoutDelta += newExpired * 0.03 * chaos // reduced from 0.05

    // Missed meetings
    const updatedMeetings = state.meetings.map(m => {
      if (!m.dismissed && (now - m.createdAt) / 1000 > m.startsIn + 15) {
        burnoutDelta += 0.06
        return { ...m, dismissed: true }
      }
      return m
    })

    const newBurnout = Math.min(1.0, state.burnout + burnoutDelta)

    if (newBurnout >= 1.0) {
      set({ gameOver: true, burnout: 1.0, globalClock: newClock })
      return
    }

    const activePopups = state.osPopups.filter(p => (now - p.createdAt) < 10000)

    set({
      globalClock: newClock,
      dayPhase,
      burnout: newBurnout,
      emails: updatedEmails,
      tasks: updatedTasks,
      meetings: updatedMeetings,
      osPopups: activePopups,
    })
  },

  spawnTask: () => {
    const task = generateTask()
    const now = Date.now()
    set(state => ({
      tasks: [...state.tasks, task],
      notifications: [...state.notifications, { id: now, text: `New ticket: ${task.id}`, type: 'task' }],
      osPopups: [...state.osPopups, {
        id: now, icon: '📋', title: 'ShadowJira™',
        text: `New ticket assigned: ${task.id}\n"${task.title}"`,
        type: 'task', createdAt: now,
      }],
    }))
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
    set({ activePuzzle: { puzzle, taskId }, puzzleInput: '' })
  },

  setPuzzleInput: (input) => set({ puzzleInput: input }),

  submitPuzzle: () => {
    const state = get()
    if (!state.activePuzzle) return false
    const { puzzle, taskId } = state.activePuzzle
    const userAnswer = state.puzzleInput.trim().toLowerCase()
    const correctAnswer = puzzle.answer.toLowerCase()
    if (userAnswer === correctAnswer) {
      const task = state.tasks.find(t => t.id === taskId)
      if (task) {
        const totalPoints = task.points + puzzle.points
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: 'done' } : t),
          score: s.score + totalPoints,
          completedCount: s.completedCount + 1,
          burnout: Math.max(0, s.burnout - 0.04), // bigger burnout relief
          notifications: [...s.notifications, { id: Date.now(), text: `+${totalPoints} pts — ${taskId} done!`, type: 'success' }],
          activePuzzle: null, puzzleInput: '',
        }))
      }
      return true
    }
    return false
  },

  cancelPuzzle: () => set({ activePuzzle: null, puzzleInput: '' }),

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
      osPopups: [...s.osPopups, {
        id: now, icon: '📅', title: 'Meeting Reminder',
        text: `"${meeting.title}"\nOrganizer: ${meeting.organizer}\n${meeting.room} — ${meeting.duration}`,
        type: 'meeting', createdAt: now,
      }],
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

  reset: () => {
    taskIdCounter = 0
    set({
      score: 0, burnout: 0, globalClock: 0, dayPhase: 'MORNING',
      tasks: [], completedCount: 0, emails: [], meetings: [],
      activePuzzle: null, puzzleInput: '',
      activeWindow: null, notifications: [], osPopups: [],
      bootComplete: false, gameOver: false,
    })
  },
}))
