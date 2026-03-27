import type { DialogueSequence } from '../engine/DialogueSystem';

export const DIALOGUE: Record<string, DialogueSequence> = {
  receptionist: {
    npcName: 'RECEPTIONIST',
    lines: [
      { text: 'Name?', delay: 500 },
      { text: '...', delay: 800 },
      { text: 'Ah yes. Conference room B.', delay: 0 },
      { text: 'Down the hall, second left.', delay: 0 },
      { text: "Don't be nervous.", delay: 1000 },
      { text: "Or do. It won't matter.", delay: 0 },
    ],
  },
  interviewer: {
    npcName: 'INTERVIEWER',
    lines: [
      { text: 'So... tell me about yourself.', delay: 0 },
    ],
  },
  interviewResult: {
    npcName: 'INTERVIEWER',
    lines: [
      { text: 'Perfect. You start Monday.', delay: 0 },
    ],
  },
  interviewer2: {
    npcName: 'INTERVIEWER 2',
    lines: [
      { text: "Welcome to Nexus. You'll love it here.", delay: 0 },
    ],
  },
  coworkerPrinter: {
    npcName: 'COWORKER',
    lines: [
      { text: 'Oh. New intern?', delay: 400 },
      { text: 'Good luck.', delay: 600 },
      { text: 'The last one cried on day two.', delay: 0 },
      { text: 'Day one was orientation.', delay: 0 },
    ],
  },
  coworkerDesk: {
    npcName: 'COWORKER',
    lines: [
      { text: "Don't touch my stapler.", delay: 0 },
    ],
  },
  narratorScene5: {
    npcName: '',
    lines: [
      { text: 'And so you sat down.', delay: 1200 },
      { text: 'Ready to make a difference.', delay: 1000 },
      { text: 'Ready to change the world.', delay: 1000 },
      { text: 'Ready to... read your first Jira ticket.', delay: 2000 },
    ],
  },
};

export const INTERVIEW_CHOICES = [
  "A) \"I'm passionate about synergy and disrupting paradigms\"",
  'B) "I just need the experience honestly"',
  'C) "..."',
];
