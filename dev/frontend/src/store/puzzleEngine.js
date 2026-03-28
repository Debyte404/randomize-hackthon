// ═══════════════════════════════════════════════════════════════════
// PUZZLE ENGINE — 6 Interactive Puzzle Types for NexusOS
// ═══════════════════════════════════════════════════════════════════

// ─── 1. Neural Network Wiring ────────────────────────────────────
// Player must connect the right input→hidden→output nodes
const generateNeuralNetworkPuzzle = () => {
  const configs = [
    { inputs: ['X1=1','X2=0'], hiddenCount: 2, target: 1, correctWires: [[0,0],[1,1]], hint: 'Each input maps to one hidden node' },
    { inputs: ['X1=1','X2=1'], hiddenCount: 2, target: 0, correctWires: [[0,1],[1,0]], hint: 'Cross-wire: input 1→hidden 2, input 2→hidden 1' },
    { inputs: ['A=1','B=0','C=1'], hiddenCount: 2, target: 1, correctWires: [[0,0],[2,1]], hint: 'Only active inputs need wiring' },
    { inputs: ['X=0','Y=1'], hiddenCount: 3, target: 2, correctWires: [[1,2]], hint: 'Y connects to the third hidden node' },
  ]
  const cfg = configs[Math.floor(Math.random() * configs.length)]
  return {
    type: 'neural_network',
    prompt: 'WIRE THE NEURAL NETWORK',
    description: `Connect inputs to hidden nodes so output = ${cfg.target}`,
    inputs: cfg.inputs,
    hiddenCount: cfg.hiddenCount,
    target: cfg.target,
    correctWires: cfg.correctWires, // [[inputIdx, hiddenIdx], ...]
    points: 8,
    hint: cfg.hint,
  }
}

// ─── 2. Pattern Matching ─────────────────────────────────────────
// Fix corrupted data by picking the correct pattern
const generatePatternMatchPuzzle = () => {
  const patterns = [
    {
      corrupted: '██░█░\n░█░██\n██░█░',
      options: [
        '10101\n01011\n10101',
        '10101\n01010\n10101',
        '11001\n01010\n10101',
        '10101\n01010\n10110',
      ],
      correct: 1,
      hint: 'Look for an alternating checkerboard'
    },
    {
      corrupted: '▓▓░░\n░░▓▓\n▓▓░░',
      options: [
        'AABB\nBBAA\nAABB',
        'ABAB\nBABA\nABAB',
        'AABB\nBBAA\nABBA',
        'AABB\nAABB\nAABB',
      ],
      correct: 0,
      hint: 'Pairs alternate by row'
    },
    {
      corrupted: '→↓←\n↓←→\n←→↓',
      options: [
        'RDL\nDLR\nLRD',
        'RDL\nLRD\nDLR',
        'RLD\nDLR\nLRD',
        'RDL\nDLR\nRLD',
      ],
      correct: 0,
      hint: 'Each symbol shifts one position right per row'
    },
  ]
  const p = patterns[Math.floor(Math.random() * patterns.length)]
  return {
    type: 'pattern_match',
    prompt: 'FIX THE CORRUPTED DATA',
    description: 'Select the correct restored pattern',
    corrupted: p.corrupted,
    options: p.options,
    correct: p.correct,
    points: 6,
    hint: p.hint,
  }
}

// ─── 3. Node Connection ──────────────────────────────────────────
// Restore a broken system by clicking nodes in correct order
const generateNodeConnectionPuzzle = () => {
  const systems = [
    { nodes: ['DNS','Load Balancer','Web Server','Database','Cache'], correctOrder: [0,1,4,2,3], hint: 'Request flow: DNS→LB→Cache→Web→DB' },
    { nodes: ['Client','Auth','API Gateway','Service','Database'], correctOrder: [0,1,2,3,4], hint: 'Follow the auth pipeline in order' },
    { nodes: ['Git Push','CI Build','Tests','Staging','Production'], correctOrder: [0,1,2,3,4], hint: 'Standard deployment pipeline' },
    { nodes: ['Input','Validate','Transform','Store','Respond'], correctOrder: [0,1,2,3,4], hint: 'Data processing pipeline' },
  ]
  const s = systems[Math.floor(Math.random() * systems.length)]
  return {
    type: 'node_connection',
    prompt: 'RESTORE THE SYSTEM',
    description: 'Click nodes in the correct order to restore the pipeline',
    nodes: s.nodes,
    correctOrder: s.correctOrder,
    points: 7,
    hint: s.hint,
  }
}

// ─── 4. Sorting Challenge ────────────────────────────────────────
// Sort items by priority/deadline
const generateSortingPuzzle = () => {
  const challenges = [
    {
      items: [
        { label: '🔴 CRITICAL: Server down', priority: 1 },
        { label: '🟡 MEDIUM: UI alignment', priority: 3 },
        { label: '🔴 HIGH: Data leak fix', priority: 2 },
        { label: '🟢 LOW: Update readme', priority: 4 },
      ],
      sortBy: 'priority',
      hint: 'Critical first, then High, Medium, Low'
    },
    {
      items: [
        { label: '⏱ Deploy hotfix (5m left)', priority: 1 },
        { label: '⏱ Review PR (2h left)', priority: 3 },
        { label: '⏱ Fix login (15m left)', priority: 2 },
        { label: '⏱ Update docs (1d left)', priority: 4 },
      ],
      sortBy: 'deadline',
      hint: 'Shortest deadline first'
    },
    {
      items: [
        { label: 'Setup DB schema', priority: 1 },
        { label: 'Create API endpoints', priority: 2 },
        { label: 'Build frontend UI', priority: 3 },
        { label: 'Write integration tests', priority: 4 },
        { label: 'Deploy to production', priority: 5 },
      ],
      sortBy: 'dependency',
      hint: 'What needs to be done before what?'
    },
  ]
  const c = challenges[Math.floor(Math.random() * challenges.length)]
  // Shuffle items
  const shuffled = [...c.items].sort(() => Math.random() - 0.5)
  return {
    type: 'sorting',
    prompt: 'PRIORITIZE THESE TICKETS',
    description: `Sort by ${c.sortBy} (drag or click to reorder)`,
    items: shuffled,
    correctOrder: c.items.map(i => i.label),
    points: 6,
    hint: c.hint,
  }
}

// ─── 5. Logic Grid ───────────────────────────────────────────────
// Resolve dependency chains
const generateLogicGridPuzzle = () => {
  const grids = [
    {
      question: 'Task A depends on B.\nTask B depends on C.\nTask C has no dependencies.\nWhich task should be done FIRST?',
      options: ['Task A', 'Task B', 'Task C'],
      correct: 2,
      hint: 'Start with the one that has no blockers'
    },
    {
      question: 'Deploy needs Tests ✓.\nTests need Build ✓.\nBuild needs Code Review.\nCode Review needs PR.\nWhat should happen NEXT?',
      options: ['Deploy', 'Run Tests', 'Submit PR', 'Code Review'],
      correct: 2,
      hint: 'What hasn\'t been done yet?'
    },
    {
      question: 'Server A talks to B and C.\nB talks to D.\nC talks to D.\nD is the database.\nIf D goes down, how many services are affected?',
      options: ['1', '2', '3', '4'],
      correct: 3,
      hint: 'Count ALL services that depend on D (directly or indirectly)'
    },
    {
      question: 'Sprint has 5 tasks.\n2 are blocked by external team.\n1 is blocked by a blocked task.\n1 is in review.\nHow many can you work on RIGHT NOW?',
      options: ['0', '1', '2', '3'],
      correct: 1,
      hint: 'Only unblocked, non-review tasks'
    },
  ]
  const g = grids[Math.floor(Math.random() * grids.length)]
  return {
    type: 'logic_grid',
    prompt: 'RESOLVE DEPENDENCIES',
    description: 'Analyze the dependency chain and answer correctly',
    question: g.question,
    options: g.options,
    correct: g.correct,
    points: 7,
    hint: g.hint,
  }
}

// ─── 6. Pathfinding ──────────────────────────────────────────────
// Navigate through a grid to find optimal deployment route
const generatePathfindingPuzzle = () => {
  // 5x5 grid, 0=open, 1=wall, 2=start, 3=end
  const mazes = [
    {
      grid: [
        [2,0,1,0,0],
        [0,0,1,0,1],
        [1,0,0,0,1],
        [1,1,1,0,0],
        [0,0,0,0,3],
      ],
      optimalLength: 8,
      hint: 'Go down, then right — avoid the walls'
    },
    {
      grid: [
        [2,0,0,1,0],
        [1,1,0,1,0],
        [0,0,0,0,0],
        [0,1,1,1,0],
        [0,0,0,0,3],
      ],
      optimalLength: 8,
      hint: 'Find the gap in the middle row'
    },
    {
      grid: [
        [0,0,0,0,2],
        [0,1,1,0,0],
        [0,1,0,0,1],
        [0,0,0,1,1],
        [3,0,0,0,0],
      ],
      optimalLength: 8,
      hint: 'Go left and down through the openings'
    },
  ]
  const m = mazes[Math.floor(Math.random() * mazes.length)]
  return {
    type: 'pathfinding',
    prompt: 'DEPLOY THE PACKAGE',
    description: `Navigate from START to END. Find a path in ≤${m.optimalLength + 2} steps.`,
    grid: m.grid,
    optimalLength: m.optimalLength,
    points: 8,
    hint: m.hint,
  }
}

// ─── Also keep some quick text-based puzzles for variety ─────────
const generateQuickTextPuzzle = () => {
  const puzzles = [
    { prompt: 'COMPLETE THE CODE', code: 'const doubled = arr.___(x => x * 2)', answer: 'map', hint: 'Transform each element', points: 4 },
    { prompt: 'COMPLETE THE CODE', code: 'arr._____(x => x > 5)', answer: 'filter', hint: 'Keep matching elements', points: 4 },
    { prompt: 'WHAT COMES NEXT?', code: '🔴 🟡 🔴 🟡 🔴 ?', answer: '🟡', hint: 'Alternating pattern', points: 3 },
    { prompt: 'NAME THAT COLOR', code: 'CSS: #FF0000', answer: 'red', hint: 'Full red channel', points: 3 },
    { prompt: 'NAME THAT COLOR', code: 'CSS: #00FF00', answer: 'green', hint: 'Full green channel', points: 3 },
    { prompt: 'CORPORATE TRIVIA', code: 'What HTTP status means "Not Found"?', answer: '404', hint: 'The famous error page', points: 4 },
    { prompt: 'CORPORATE TRIVIA', code: 'What does LGTM mean?', answer: 'looks good to me', hint: 'Code review approval', points: 4 },
    { prompt: 'UNSCRAMBLE', code: 'Letters: EPYLOD', answer: 'deploy', hint: 'Ship to production', points: 4 },
    { prompt: 'WHAT COMES NEXT?', code: '🌑 🌓 🌕 🌗 🌑 ?', answer: '🌓', hint: 'Moon phase cycle', points: 3 },
    { prompt: 'COMPLETE THE CODE', code: 'JSON._____(data)', answer: 'stringify', hint: 'Object to string', points: 4 },
  ]
  const p = puzzles[Math.floor(Math.random() * puzzles.length)]
  return { type: 'text_input', ...p }
}

// ─── Master Generator ────────────────────────────────────────────
const VISUAL_GENERATORS = [
  generateNeuralNetworkPuzzle,
  generatePatternMatchPuzzle,
  generateNodeConnectionPuzzle,
  generateSortingPuzzle,
  generateLogicGridPuzzle,
  generatePathfindingPuzzle,
]

export const generatePuzzle = () => {
  // 60% visual puzzles, 40% quick text puzzles for variety
  if (Math.random() < 0.6) {
    const gen = VISUAL_GENERATORS[Math.floor(Math.random() * VISUAL_GENERATORS.length)]
    return gen()
  }
  return generateQuickTextPuzzle()
}

// ═══════════════════════════════════════════════════════════════════
// 100 UNIQUE OFFLINE TASK TEMPLATES
// ═══════════════════════════════════════════════════════════════════
export const OFFLINE_TASKS = [
  // ─── Frontend Tasks (1-25) ─────────────────────────────────────
  { title: 'Fix login button alignment on mobile', priority: 'HIGH', points: 15 },
  { title: 'Add loading spinner to dashboard', priority: 'LOW', points: 8 },
  { title: 'Implement dark mode toggle', priority: 'MEDIUM', points: 12 },
  { title: 'Fix z-index stacking on modal overlay', priority: 'HIGH', points: 18 },
  { title: 'Add keyboard shortcuts to editor', priority: 'LOW', points: 10 },
  { title: 'Fix CSS grid overflow on small screens', priority: 'MEDIUM', points: 14 },
  { title: 'Implement drag-and-drop file upload', priority: 'HIGH', points: 20 },
  { title: 'Add tooltip component to design system', priority: 'LOW', points: 8 },
  { title: 'Fix infinite scroll memory leak', priority: 'CRITICAL', points: 28 },
  { title: 'Add breadcrumb navigation to settings', priority: 'LOW', points: 6 },
  { title: 'Implement search autocomplete dropdown', priority: 'MEDIUM', points: 15 },
  { title: 'Fix date picker timezone issues', priority: 'HIGH', points: 22 },
  { title: 'Add skeleton loading states', priority: 'LOW', points: 9 },
  { title: 'Implement responsive sidebar collapse', priority: 'MEDIUM', points: 12 },
  { title: 'Fix tab focus trap in modal dialogs', priority: 'HIGH', points: 16 },
  { title: 'Add progress bar to multi-step form', priority: 'MEDIUM', points: 10 },
  { title: 'Implement lazy loading for images', priority: 'LOW', points: 8 },
  { title: 'Fix SVG icon color inheritance bug', priority: 'LOW', points: 6 },
  { title: 'Add copy-to-clipboard button for codes', priority: 'LOW', points: 5 },
  { title: 'Implement table column sorting', priority: 'MEDIUM', points: 14 },
  { title: 'Fix dropdown menu positioning near edges', priority: 'HIGH', points: 18 },
  { title: 'Add confirmation dialog for destructive actions', priority: 'MEDIUM', points: 10 },
  { title: 'Implement multi-select checkbox filter', priority: 'MEDIUM', points: 12 },
  { title: 'Fix animation jank on page transitions', priority: 'LOW', points: 8 },
  { title: 'Add empty state illustrations', priority: 'LOW', points: 7 },

  // ─── Backend Tasks (26-50) ─────────────────────────────────────
  { title: 'Fix N+1 query in user list endpoint', priority: 'CRITICAL', points: 30 },
  { title: 'Add rate limiting to auth endpoints', priority: 'HIGH', points: 22 },
  { title: 'Implement password reset email flow', priority: 'HIGH', points: 20 },
  { title: 'Add pagination to search results API', priority: 'MEDIUM', points: 14 },
  { title: 'Fix race condition in order processing', priority: 'CRITICAL', points: 35 },
  { title: 'Implement webhook retry mechanism', priority: 'HIGH', points: 18 },
  { title: 'Add input validation to user profile API', priority: 'MEDIUM', points: 10 },
  { title: 'Fix memory leak in WebSocket handler', priority: 'CRITICAL', points: 32 },
  { title: 'Implement audit log for admin actions', priority: 'MEDIUM', points: 16 },
  { title: 'Add caching layer to product catalog', priority: 'HIGH', points: 20 },
  { title: 'Fix timezone conversion in scheduler', priority: 'HIGH', points: 18 },
  { title: 'Implement batch delete endpoint', priority: 'MEDIUM', points: 12 },
  { title: 'Add health check endpoint', priority: 'LOW', points: 6 },
  { title: 'Fix file upload size limit bypass', priority: 'CRITICAL', points: 28 },
  { title: 'Implement API versioning strategy', priority: 'HIGH', points: 22 },
  { title: 'Add request logging middleware', priority: 'LOW', points: 8 },
  { title: 'Fix SQL injection in search query', priority: 'CRITICAL', points: 40 },
  { title: 'Implement email queue processor', priority: 'MEDIUM', points: 16 },
  { title: 'Add CORS configuration for new domain', priority: 'HIGH', points: 14 },
  { title: 'Fix session expiry not clearing tokens', priority: 'HIGH', points: 20 },
  { title: 'Implement data export to CSV endpoint', priority: 'MEDIUM', points: 12 },
  { title: 'Add database migration for new schema', priority: 'HIGH', points: 18 },
  { title: 'Fix connection pool exhaustion under load', priority: 'CRITICAL', points: 30 },
  { title: 'Implement soft delete for user accounts', priority: 'MEDIUM', points: 14 },
  { title: 'Add Prometheus metrics endpoint', priority: 'LOW', points: 10 },

  // ─── DevOps Tasks (51-70) ──────────────────────────────────────
  { title: 'Fix Docker build failing on ARM chips', priority: 'HIGH', points: 18 },
  { title: 'Update CI pipeline to run lint checks', priority: 'MEDIUM', points: 12 },
  { title: 'Add staging environment deployment', priority: 'HIGH', points: 22 },
  { title: 'Fix Nginx proxy timeout for large uploads', priority: 'HIGH', points: 16 },
  { title: 'Implement blue-green deployment strategy', priority: 'MEDIUM', points: 20 },
  { title: 'Update SSL certificates before expiry', priority: 'CRITICAL', points: 25 },
  { title: 'Fix log rotation filling up disk space', priority: 'HIGH', points: 18 },
  { title: 'Add Terraform config for new AWS region', priority: 'MEDIUM', points: 16 },
  { title: 'Implement database backup automation', priority: 'HIGH', points: 20 },
  { title: 'Fix Kubernetes pod crash loop', priority: 'CRITICAL', points: 30 },
  { title: 'Add monitoring alerts for CPU usage', priority: 'MEDIUM', points: 12 },
  { title: 'Update base Docker image for security patch', priority: 'HIGH', points: 14 },
  { title: 'Implement canary release pipeline', priority: 'MEDIUM', points: 18 },
  { title: 'Fix environment variable leaking in logs', priority: 'CRITICAL', points: 28 },
  { title: 'Add CDN configuration for static assets', priority: 'LOW', points: 10 },
  { title: 'Implement automated rollback on failure', priority: 'HIGH', points: 22 },
  { title: 'Fix DNS propagation delay for new subdomain', priority: 'MEDIUM', points: 12 },
  { title: 'Add Grafana dashboard for API latency', priority: 'LOW', points: 10 },
  { title: 'Implement secrets rotation policy', priority: 'MEDIUM', points: 16 },
  { title: 'Fix GitHub Actions runner out of space', priority: 'HIGH', points: 14 },

  // ─── QA / Testing Tasks (71-85) ────────────────────────────────
  { title: 'Write unit tests for auth module', priority: 'MEDIUM', points: 14 },
  { title: 'Fix flaky E2E test for checkout flow', priority: 'HIGH', points: 18 },
  { title: 'Add integration tests for payment API', priority: 'HIGH', points: 20 },
  { title: 'Write load test script for homepage', priority: 'MEDIUM', points: 12 },
  { title: 'Fix test database seeding script', priority: 'LOW', points: 8 },
  { title: 'Add accessibility audit to CI pipeline', priority: 'MEDIUM', points: 14 },
  { title: 'Write regression tests for user profile', priority: 'MEDIUM', points: 12 },
  { title: 'Fix mock server returning wrong status', priority: 'HIGH', points: 16 },
  { title: 'Add visual regression testing with Percy', priority: 'LOW', points: 10 },
  { title: 'Write smoke tests for production deploy', priority: 'HIGH', points: 18 },
  { title: 'Fix test coverage report not uploading', priority: 'LOW', points: 8 },
  { title: 'Add contract tests for microservices', priority: 'MEDIUM', points: 16 },
  { title: 'Write security scan automation script', priority: 'HIGH', points: 20 },
  { title: 'Fix Cypress tests breaking on CI', priority: 'HIGH', points: 18 },
  { title: 'Add performance benchmark tests', priority: 'MEDIUM', points: 14 },

  // ─── Miscellaneous/Corporate Tasks (86-100) ────────────────────
  { title: 'Update README with setup instructions', priority: 'LOW', points: 5 },
  { title: 'Review and approve PR #4921', priority: 'MEDIUM', points: 10 },
  { title: 'Update privacy policy page content', priority: 'LOW', points: 6 },
  { title: 'Write API documentation for v2 endpoints', priority: 'MEDIUM', points: 14 },
  { title: 'Fix broken links in knowledge base', priority: 'LOW', points: 5 },
  { title: 'Add changelog entry for latest release', priority: 'LOW', points: 4 },
  { title: 'Update third-party dependency licenses', priority: 'MEDIUM', points: 10 },
  { title: 'Respond to customer bug report #7734', priority: 'HIGH', points: 16 },
  { title: 'Create runbook for database failover', priority: 'MEDIUM', points: 14 },
  { title: 'Update Jira board workflow configuration', priority: 'LOW', points: 6 },
  { title: 'Write post-incident report for outage', priority: 'HIGH', points: 18 },
  { title: 'Set up Slack notification for deploys', priority: 'LOW', points: 8 },
  { title: 'Create training doc for new team member', priority: 'MEDIUM', points: 10 },
  { title: 'Migrate wiki pages to Confluence', priority: 'LOW', points: 8 },
  { title: 'Archive completed Q3 sprint tickets', priority: 'LOW', points: 4 },
]

// ─── Meeting Dialogue System ─────────────────────────────────────
export const MEETING_TEMPLATES = [
  { title: 'Sprint Retrospective', organizer: 'Chad B. (PM)', duration: '60 min', room: 'Conf Room C' },
  { title: 'All-Hands Meeting', organizer: 'Brad (CTO)', duration: '90 min', room: 'Auditorium' },
  { title: 'Code Review Session', organizer: 'Sarah (Lead Dev)', duration: '30 min', room: 'Zoom Link' },
  { title: '1:1 with Manager', organizer: 'Mike (Mgr)', duration: '30 min', room: 'His Office' },
  { title: 'Incident Postmortem', organizer: 'DevOps Bot', duration: '45 min', room: 'War Room' },
  { title: 'Mandatory Fun Hour', organizer: 'Karen M. (HR)', duration: '60 min', room: 'Break Room' },
  { title: 'Budget Planning Q4', organizer: 'Dave (Finance)', duration: '120 min', room: 'Board Room' },
  { title: 'Product Demo to Client', organizer: 'Sales Team', duration: '45 min', room: 'Showroom A' },
]

export const MEETING_DIALOGUES = [
  {
    speaker: 'Chad (PM)',
    text: '"So let\'s circle back on the velocity metrics and align our synergies..."',
    choices: [
      { label: '📊 "We should focus on blockers first"', type: 'productive', effect: { score: 5, burnout: -0.01, meetingSpeed: 1.5 } },
      { label: '🤝 "Absolutely, let\'s leverage our core competencies"', type: 'corporate', effect: { score: 0, burnout: 0, meetingSpeed: 1.0 } },
      { label: '🚪 "I have another meeting, sorry"', type: 'escape', effect: { score: -2, burnout: -0.02, meetingSpeed: 3.0 } },
      { label: '😤 "This could have been an email"', type: 'honest', effect: { score: -5, burnout: 0.02, meetingSpeed: 2.0 } },
      { label: '🔇 *Stay silent*', type: 'silent', effect: { score: 0, burnout: 0.01, meetingSpeed: 0.8 } },
    ]
  },
  {
    speaker: 'Brad (CTO)',
    text: '"We need to disrupt the paradigm and move fast. What\'s the team\'s bandwidth?"',
    choices: [
      { label: '📋 "Here\'s our capacity breakdown..."', type: 'productive', effect: { score: 8, burnout: -0.01, meetingSpeed: 1.5 } },
      { label: '🚀 "We\'re optimizing our throughput pipeline"', type: 'corporate', effect: { score: 2, burnout: 0, meetingSpeed: 1.0 } },
      { label: '🚪 "Got a deploy to monitor, BRB"', type: 'escape', effect: { score: -3, burnout: -0.02, meetingSpeed: 3.0 } },
      { label: '😬 "We\'re drowning, Brad"', type: 'honest', effect: { score: -8, burnout: 0.03, meetingSpeed: 2.0 } },
      { label: '🔇 *Nod thoughtfully*', type: 'silent', effect: { score: 0, burnout: 0.01, meetingSpeed: 0.8 } },
    ]
  },
  {
    speaker: 'Karen (HR)',
    text: '"Before we proceed, let\'s do a quick team-building icebreaker! 🎉"',
    choices: [
      { label: '🎯 "How about we use this time productively?"', type: 'productive', effect: { score: 3, burnout: -0.01, meetingSpeed: 1.5 } },
      { label: '😊 "Great idea! I love team bonding!"', type: 'corporate', effect: { score: 1, burnout: 0, meetingSpeed: 1.0 } },
      { label: '🚪 "WiFi issues, dropping..."', type: 'escape', effect: { score: -2, burnout: -0.02, meetingSpeed: 3.0 } },
      { label: '😑 "Can we not?"', type: 'honest', effect: { score: -6, burnout: 0.02, meetingSpeed: 1.5 } },
      { label: '🔇 *Camera off, mic muted*', type: 'silent', effect: { score: 0, burnout: 0.01, meetingSpeed: 0.8 } },
    ]
  },
  {
    speaker: 'Sarah (Lead)',
    text: '"The PR has 47 comments. Let\'s go through them one by one..."',
    choices: [
      { label: '✅ "Let me summarize the key blockers"', type: 'productive', effect: { score: 6, burnout: -0.01, meetingSpeed: 1.8 } },
      { label: '📝 "I\'ll take an action item on that"', type: 'corporate', effect: { score: 1, burnout: 0, meetingSpeed: 1.0 } },
      { label: '🚪 "Can we async this?"', type: 'escape', effect: { score: -1, burnout: -0.01, meetingSpeed: 2.5 } },
      { label: '🤦 "47 comments on a 3-line change?"', type: 'honest', effect: { score: -4, burnout: 0.02, meetingSpeed: 1.5 } },
      { label: '🔇 *Type in Slack instead*', type: 'silent', effect: { score: 0, burnout: 0.01, meetingSpeed: 0.8 } },
    ]
  },
  {
    speaker: 'Dave (Finance)',
    text: '"We need to discuss the budget implications of the new microservices architecture..."',
    choices: [
      { label: '💰 "Here\'s a cost-benefit analysis"', type: 'productive', effect: { score: 7, burnout: -0.01, meetingSpeed: 1.5 } },
      { label: '📈 "It\'s an investment in scalability"', type: 'corporate', effect: { score: 1, burnout: 0, meetingSpeed: 1.0 } },
      { label: '🚪 "I\'m not the right person for this"', type: 'escape', effect: { score: -2, burnout: -0.02, meetingSpeed: 3.0 } },
      { label: '💸 "You approved $0 for infrastructure"', type: 'honest', effect: { score: -5, burnout: 0.02, meetingSpeed: 2.0 } },
      { label: '🔇 *Zone out*', type: 'silent', effect: { score: 0, burnout: 0.01, meetingSpeed: 0.8 } },
    ]
  },
]

// ─── Slack Interruptions ─────────────────────────────────────────
export const SLACK_MESSAGES = [
  { from: 'Kevin (Backend)', channel: '#dev', text: 'hey quick question — is the API down or is it just me?', urgent: false },
  { from: 'PM Bot', channel: '#standups', text: '🔴 You missed today\'s standup update. Please post ASAP.', urgent: true },
  { from: 'Sarah (Lead)', channel: 'DM', text: 'Can you review my PR? It\'s blocking the release', urgent: true },
  { from: 'Random Intern', channel: '#general', text: 'does anyone know the WiFi password?', urgent: false },
  { from: 'CI/CD Bot', channel: '#deploys', text: '❌ Build #4481 FAILED — main branch', urgent: true },
  { from: 'Karen (HR)', channel: '#announcements', text: 'REMINDER: Submit your timesheet by EOD!', urgent: false },
  { from: 'Brad (CTO)', channel: 'DM', text: 'Got a minute? Want to discuss something.', urgent: true },
  { from: 'DevOps Bot', channel: '#alerts', text: '⚠️ CPU usage at 94% on prod-server-3', urgent: true },
  { from: 'Chad (PM)', channel: '#team', text: 'Can everyone fill out the team survey? Takes 5 min (it took 45 min)', urgent: false },
  { from: 'Mike (Manager)', channel: 'DM', text: 'Quick sync? Just 5 minutes (will be 30)', urgent: false },
  { from: 'Jira Bot', channel: '#jira', text: 'TASK-0042 was reopened by QA with 12 new comments', urgent: true },
  { from: 'Coffee Bot', channel: '#random', text: '☕ Free coffee in the break room! (decaf only)', urgent: false },
  { from: 'Janet (Legal)', channel: 'DM', text: 'PER MY PREVIOUS EMAIL — please sign the NDA addendum', urgent: true },
  { from: 'Wellness Bot', channel: '#wellness', text: '🧘 Time for your mandatory 2-minute mindfulness break!', urgent: false },
  { from: 'Git Bot', channel: '#dev', text: '🔥 Force push detected on main by unknown user', urgent: true },
]

// ─── Realism Events ──────────────────────────────────────────────
export const REALISM_EVENTS = [
  { type: 'scope_change', title: '⚠️ SCOPE CHANGE', text: 'Requirements updated. Your current task now has additional requirements.', effect: 'extend_deadline' },
  { type: 'task_reopened', title: '🔄 TASK REOPENED', text: 'QA found issues. A completed task has been moved back to backlog.', effect: 'reopen_task' },
  { type: 'manager_checkin', title: '👔 MANAGER CHECK-IN', text: '"Hey, just checking in. How\'s that ticket going? No pressure." (there is pressure)', effect: 'burnout_spike' },
  { type: 'coffee_break', title: '☕ COFFEE BREAK', text: 'The coffee machine is free! Take a break?', effect: 'offer_break' },
  { type: 'deploy_freeze', title: '🧊 DEPLOY FREEZE', text: 'Production deploy freeze until further notice. Keep working though.', effect: 'increase_deadlines' },
  { type: 'fire_drill', title: '🔥 FIRE DRILL', text: 'Mandatory fire drill in 30 seconds. All work paused.', effect: 'pause_timers' },
  { type: 'internet_lag', title: '🐌 INTERNET ISSUES', text: 'Network latency detected. Everything feels slower...', effect: 'slow_ui' },
  { type: 'praise', title: '🌟 KUDOS!', text: 'Your manager noticed your work! +10 morale boost', effect: 'burnout_relief' },
  { type: 'boss_alert', title: '🚨 BOSS APPROACHING', text: 'Your manager is walking over! Quick — close anything non-work!', effect: 'boss_alert' },
]
