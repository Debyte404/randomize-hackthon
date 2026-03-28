export class DialogueSystem {
  constructor(onUpdate) {
    this.currentSequence = null;
    this.currentLineIndex = 0;
    this.isWaiting = false;
    this.delayTimer = 0;
    this.onUpdate = onUpdate;
    this.onComplete = null;

    // Typewriter state
    this.fullText = '';
    this.displayedChars = 0;
    this.typewriterTimer = 0;
    this.typewriterSpeed = 35; // ms per character
    this.isTyping = false;

    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE' || e.code === 'Space') {
        if (this.isTyping) {
          // Skip typewriter
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

  play(sequence, onComplete) {
    this.currentSequence = sequence;
    this.currentLineIndex = 0;
    this.onComplete = onComplete || null;
    this.showCurrentLine();
  }

  showCurrentLine() {
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
      this.fullText = line.text;
      this.displayedChars = 0;
      this.typewriterTimer = 0;
      this.isTyping = true;
      this.isWaiting = false;
      this.emitCurrent(false);
    }
  }

  emitCurrent(canAdvance) {
    if (!this.currentSequence) return;
    this.onUpdate({
      active: true,
      npcName: this.currentSequence.npcName,
      text: this.fullText.slice(0, this.displayedChars),
      canAdvance,
    });
  }

  advance() {
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

  update(delta) {
    if (this.delayTimer > 0) {
      this.delayTimer -= delta * 1000;
      if (this.delayTimer <= 0) {
        this.delayTimer = 0;
        this.typewriterTimer = 0;
        this.displayedChars = 0;
        this.isTyping = true;
        this.isWaiting = false;
      }
    }

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
