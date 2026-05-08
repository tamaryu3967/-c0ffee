export class AudioManager {
    constructor(audioContext) {
        this.ctx = audioContext;
        this.masterGain = null;
        this._grindNodes = null;
        this._pourNodes = null;

        if (this.ctx) {
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);
        }
    }

    setVolume(v) {
        if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, v));
    }

    // --- Grinding sound: band-pass filtered white noise ---
    startGrind() {
        if (!this.ctx || this._grindNodes) return;

        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.8;

        // LFO for "grinding" texture
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = 12;
        lfoGain.gain.value = 300;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        const gainNode = this.ctx.createGain();
        gainNode.gain.value = 0.35;

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        lfo.start();
        source.start();

        this._grindNodes = { source, filter, lfo, lfoGain, gainNode };
    }

    stopGrind() {
        if (!this._grindNodes) return;
        const { source, lfo } = this._grindNodes;
        try { source.stop(); lfo.stop(); } catch (_) {}
        this._grindNodes = null;
    }

    // --- Pouring sound: low-pass filtered white noise ---
    startPour() {
        if (!this.ctx || this._pourNodes) return;

        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        filter.Q.value = 1.2;

        const gainNode = this.ctx.createGain();
        gainNode.gain.value = 0;

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        source.start();

        // Fade in
        gainNode.gain.setTargetAtTime(0.28, this.ctx.currentTime, 0.15);

        this._pourNodes = { source, filter, gainNode };
    }

    stopPour() {
        if (!this._pourNodes) return;
        const { source, gainNode } = this._pourNodes;
        gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        setTimeout(() => {
            try { source.stop(); } catch (_) {}
            this._pourNodes = null;
        }, 400);
    }

    // --- Chime: pleasant tone based on score ---
    playChime(score) {
        if (!this.ctx) return;
        // Frequencies for 1-3 stars (pentatonic-ish)
        const sequences = {
            1: [392],          // G4
            2: [392, 523],     // G4, C5
            3: [523, 659, 784] // C5, E5, G5
        };
        const notes = sequences[score] || sequences[1];

        notes.forEach((freq, i) => {
            const t = this.ctx.currentTime + i * 0.18;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.65);
        });
    }

    // --- Click: short UI feedback ---
    playClick() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    // --- Screen shake completion sound ---
    playGrindComplete() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        [220, 330, 440].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const start = t + i * 0.07;
            gain.gain.setValueAtTime(0.25, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(start);
            osc.stop(start + 0.35);
        });
    }
}
