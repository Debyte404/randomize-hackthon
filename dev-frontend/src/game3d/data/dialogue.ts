import type { DialogueSequence } from '../engine/DialogueSystem';

export const DIALOGUE: Record<string, DialogueSequence> = {
  receptionist: {
    npcName: 'GREETING UNIT',
    lines: [
      { text: 'Name?', delay: 500 },
      { text: '...processing...', delay: 800 },
      { text: 'Ah yes. The new candidate.', delay: 0 },
      { text: 'Take the East Elevators to your right.', delay: 0 },
      { text: "Don't fall into the void.", delay: 1000 },
      { text: "It reflects poorly on your KPI.", delay: 0 },
    ],
  },
  interviewer: {
    npcName: 'INTERVIEWER',
    lines: [
      { text: '*shuffles papers*', delay: 800 },
      { text: '*glances at laptop screen*', delay: 600 },
      { text: 'So...', delay: 500 },
      { text: '...tell me about yourself.', delay: 0 },
    ],
  },
  interviewResult: {
    npcName: 'INTERVIEWER',
    lines: [
      { text: '*scribbles notes furiously*', delay: 800 },
      { text: 'Interesting. Very interesting.', delay: 600 },
      { text: '*whispers something to colleague*', delay: 700 },
      { text: 'Well...', delay: 500 },
      { text: "You start Monday.", delay: 0 },
    ],
  },
  interviewer2: {
    npcName: 'INTERVIEWER 2',
    lines: [
      { text: '*leans forward*', delay: 500 },
      { text: "Welcome to Nexus Corp.", delay: 0 },
      { text: "You'll love it here.", delay: 600 },
      { text: "Everyone does.", delay: 800 },
      { text: "*smiles in a way that doesn't reach their eyes*", delay: 0 },
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
