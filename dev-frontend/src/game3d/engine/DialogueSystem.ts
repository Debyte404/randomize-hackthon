export interface DialogueLine {
  text: string;
  delay: number; // ms delay before showing this line
}

export interface DialogueSequence {
  npcName: string;
  lines: DialogueLine[];
}

type DialogueCallback = (state: {
  active: boolean;
  npcName: string;
  text: string;
  canAdvance: boolean;
}) => void;

export class DialogueSystem {
  private currentSequence: DialogueSequence | null = null;
  private currentLineIndex = 0;
  private isWaiting = false;
  private delayTimer = 0;
  private onUpdate: DialogueCallback;
  private onComplete: (() => void) | null = null;

  // Typewriter state
  private fullText = '';
  private displayedChars = 0;
  private typewriterTimer = 0;
  private typewriterSpeed = 35; // ms per character
  private isTyping = false;

  constructor(onUpdate: DialogueCallback) {
    this.onUpdate = onUpdate;

    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE' || e.code === 'Space') {
        if (this.isTyping) {
          // Skip typewriter — show full text immediately
          this.displayedChars = this.fullText.length;
          this.isTyping = false;
          this.isWaiting = true;
          this.emitCurrent(true);
        } else if (this.isWaiting) {
          this.advance();
        }
      }
    });
    document.addEventListener('click', () => {
      if (this.isTyping) {
        this.displayedChars = this.fullText.length;
        this.isTyping = false;
        this.isWaiting = true;
        this.emitCurrent(true);
      } else if (this.isWaiting) {
        this.advance();
      }
    });
  }

  play(sequence: DialogueSequence, onComplete?: () => void) {
    this.currentSequence = sequence;
    this.currentLineIndex = 0;
    this.onComplete = onComplete || null;
    this.showCurrentLine();
  }

  private showCurrentLine() {
    if (!this.currentSequence) return;

    const line = this.currentSequence.lines[this.currentLineIndex];
    if (line.delay > 0) {
      this.isWaiting = false;
      this.isTyping = false;
      this.delayTimer = line.delay;
      this.fullText = line.text;
      this.displayedChars = 0;
      this.onUpdate({
        active: true,
        npcName: this.currentSequence.npcName,
        text: '',
        canAdvance: false,
      });
    } else {
      // Start typewriter
      this.fullText = line.text;
      this.displayedChars = 0;
      this.typewriterTimer = 0;
      this.isTyping = true;
      this.isWaiting = false;
      this.emitCurrent(false);
    }
  }

  private emitCurrent(canAdvance: boolean) {
    if (!this.currentSequence) return;
    this.onUpdate({
      active: true,
      npcName: this.currentSequence.npcName,
      text: this.fullText.slice(0, this.displayedChars),
      canAdvance,
    });
  }

  private advance() {
    if (!this.currentSequence) return;
    this.currentLineIndex++;

    if (this.currentLineIndex >= this.currentSequence.lines.length) {
      this.currentSequence = null;
      this.isWaiting = false;
      this.isTyping = false;
      this.onUpdate({ active: false, npcName: '', text: '', canAdvance: false });
      this.onComplete?.();
      return;
    }

    this.showCurrentLine();
  }

  update(delta: number) {
    // Delay timer (for lines with delay > 0)
    if (this.delayTimer > 0) {
      this.delayTimer -= delta * 1000;
      if (this.delayTimer <= 0) {
        this.delayTimer = 0;
        // Now start typewriter for this line
        this.typewriterTimer = 0;
        this.displayedChars = 0;
        this.isTyping = true;
        this.isWaiting = false;
      }
    }

    // Typewriter effect
    if (this.isTyping && this.displayedChars < this.fullText.length) {
      this.typewriterTimer += delta * 1000;
      while (this.typewriterTimer >= this.typewriterSpeed && this.displayedChars < this.fullText.length) {
        this.typewriterTimer -= this.typewriterSpeed;
        this.displayedChars++;
      }
      this.emitCurrent(false);

      if (this.displayedChars >= this.fullText.length) {
        this.isTyping = false;
        this.isWaiting = true;
        this.emitCurrent(true);
      }
    }
  }

  get isActive() {
    return this.currentSequence !== null;
  }
}
