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

  constructor(onUpdate: DialogueCallback) {
    this.onUpdate = onUpdate;

    document.addEventListener('keydown', (e) => {
      if ((e.code === 'KeyE' || e.code === 'Space') && this.isWaiting) {
        this.advance();
      }
    });
    document.addEventListener('click', () => {
      if (this.isWaiting) this.advance();
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
      this.delayTimer = line.delay;
      this.onUpdate({
        active: true,
        npcName: this.currentSequence.npcName,
        text: line.text,
        canAdvance: false,
      });
    } else {
      this.isWaiting = true;
      this.onUpdate({
        active: true,
        npcName: this.currentSequence.npcName,
        text: line.text,
        canAdvance: true,
      });
    }
  }

  private advance() {
    if (!this.currentSequence) return;
    this.currentLineIndex++;

    if (this.currentLineIndex >= this.currentSequence.lines.length) {
      // Sequence done
      this.currentSequence = null;
      this.isWaiting = false;
      this.onUpdate({ active: false, npcName: '', text: '', canAdvance: false });
      this.onComplete?.();
      return;
    }

    this.showCurrentLine();
  }

  update(delta: number) {
    if (this.delayTimer > 0) {
      this.delayTimer -= delta * 1000;
      if (this.delayTimer <= 0) {
        this.delayTimer = 0;
        this.isWaiting = true;
        if (this.currentSequence) {
          this.onUpdate({
            active: true,
            npcName: this.currentSequence.npcName,
            text: this.currentSequence.lines[this.currentLineIndex].text,
            canAdvance: true,
          });
        }
      }
    }
  }

  get isActive() {
    return this.currentSequence !== null;
  }
}
