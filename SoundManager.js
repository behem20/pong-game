// ─── Note patterns (beat-based) ────────────────────────────────────────────
// Format: [freq, durBeats, beatOffset, volume, oscType]
// At schedule time each beat offset/duration is multiplied by current beatDur (seconds/beat).
// This makes the entire loop tempo-scalable without rewriting note data.

const GAME_BEATS = 8; // one loop = 8 beats

// Converted from old absolute-seconds format (B = 0.5):
//   durBeats = dur_s / 0.5    beatOffset = offset_s / 0.5
const GAME_NOTES = [
    // Bass pulse (one note per beat)
    [131, 0.28, 0,    0.09, 'triangle'],
    [131, 0.24, 1,    0.07, 'triangle'],
    [175, 0.28, 2,    0.09, 'triangle'],
    [131, 0.24, 3,    0.07, 'triangle'],
    [117, 0.28, 4,    0.09, 'triangle'],
    [131, 0.24, 5,    0.07, 'triangle'],
    [175, 0.28, 6,    0.09, 'triangle'],
    [131, 0.24, 7,    0.07, 'triangle'],
    // Melody
    [523, 0.44, 0,    0.07, 'square'],
    [659, 0.40, 1,    0.07, 'square'],
    [784, 0.26, 2,    0.07, 'square'],
    [659, 0.26, 2.52, 0.06, 'square'], // half-beat sub-offset
    [523, 0.36, 3,    0.07, 'square'],
    [440, 0.40, 4,    0.07, 'square'],
    [494, 0.26, 5,    0.06, 'square'],
    [523, 0.26, 5.52, 0.06, 'square'],
    [392, 0.88, 6,    0.07, 'square'],
];

const MENU_BEATS = 8;
const MENU_BEAT  = 0.9; // fixed — menu doesn't speed up with ball

// Converted from M = 0.9:  durBeats = dur_s / 0.9   beatOffset = offset_s / 0.9
const MENU_NOTES = [
    [131, 0.39, 0,    0.05, 'triangle'],
    [175, 0.39, 2,    0.05, 'triangle'],
    [131, 0.39, 4,    0.05, 'triangle'],
    [117, 0.39, 6,    0.05, 'triangle'],
    [523, 0.78, 0,    0.04, 'sine'],
    [659, 0.78, 2,    0.04, 'sine'],
    [784, 0.78, 4,    0.04, 'sine'],
    [698, 0.78, 6,    0.04, 'sine'],
    [1047, 0.12, 0.13, 0.033, 'sine'],
    [1319, 0.12, 0.42, 0.033, 'sine'],
    [1047, 0.12, 2.13, 0.033, 'sine'],
    [1568, 0.12, 2.42, 0.033, 'sine'],
    [1568, 0.12, 4.13, 0.033, 'sine'],
    [1319, 0.12, 4.42, 0.033, 'sine'],
    [1397, 0.12, 6.13, 0.033, 'sine'],
    [1319, 0.12, 6.42, 0.033, 'sine'],
];

// Tempo mapping: ballSpeed → beatDur
// At GAME_BASE_SPEED the music plays at 120 BPM (GAME_BASE_BEAT s/beat).
// Clamped so it never gets unlistenable.
const GAME_BASE_SPEED = 547; // (456 + 0) * 1.2 — initial ball speed
const GAME_BASE_BEAT  = 0.5; // seconds/beat at base speed
const GAME_MIN_BEAT   = 0.22; // floor ≈ 272 BPM — maximum frenzy

// ─── SoundManager ───────────────────────────────────────────────────────────

export default class SoundManager {
    constructor(registry) {
        this.registry      = registry;
        this.ctx           = null;
        this.masterGain    = null;
        this.musicGain     = null; // separate gain so music is quieter than SFX
        this._musicPlaying = false;
        this._musicType    = null;
        this._musicTimer   = null;
        this._beatDur      = GAME_BASE_BEAT;
    }

    get enabled() { return this.registry.get('soundOn') ?? true; }

    _ctx() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.enabled ? 1 : 0;
            this.masterGain.connect(this.ctx.destination);
            // Music routes through a separate gain (0.38) so SFX stays louder
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.38;
            this.musicGain.connect(this.masterGain);
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
    }

    syncVolume() {
        if (!this.masterGain) return;
        this.masterGain.gain.setTargetAtTime(this.enabled ? 1 : 0, this.ctx.currentTime, 0.08);
    }

    // Called from GameScene.update() — updates tempo for next loop boundary
    setGameTempo(ballSpeed) {
        this._beatDur = Math.max(GAME_MIN_BEAT,
            Math.min(GAME_BASE_BEAT, GAME_BASE_BEAT * GAME_BASE_SPEED / ballSpeed));
    }

    _note(freq, dur, type, vol, delay = 0) {
        const ctx  = this._ctx();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(this.masterGain);
        osc.type = type;
        osc.frequency.value = freq;
        const t = ctx.currentTime + delay;
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.9);
        osc.start(t); osc.stop(t + dur);
    }

    // ── Sound effects ───────────────────────────────────────────────────────

    hitPad(padN) { this._note(padN === 1 ? 480 : 360, 0.07, 'square', 0.22); }
    hitWall()    { this._note(220, 0.055, 'square', 0.13); }
    hover()      { this._note(900, 0.035, 'sine', 0.07); }

    padMove(padN) {
        const ctx = this._ctx();
        const key = `_padMoveT${padN}`;
        if (ctx.currentTime - (this[key] || 0) < 0.16) return;
        this[key] = ctx.currentTime;
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(this.masterGain);
        osc.type = 'sine';
        const f0 = padN === 1 ? 360 : 290;
        osc.frequency.setValueAtTime(f0, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(f0 * 0.72, ctx.currentTime + 0.11);
        gain.gain.setValueAtTime(0.055, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11);
        osc.start(); osc.stop(ctx.currentTime + 0.11);
    }

    scored() {
        [523, 659, 784].forEach((f, i) => this._note(f, 0.13, 'triangle', 0.18, i * 0.07));
    }

    win() {
        [523, 659, 784, 1047].forEach((f, i) => this._note(f, 0.22, 'triangle', 0.22, i * 0.1));
        this._note(1047, 0.55, 'triangle', 0.26, 0.44);
    }

    pickup(type) {
        const m = {
            speed:    [[880, 0.08], [1047, 0.08], [1320, 0.12]],
            size:     [[440, 0.08], [554,  0.08], [659,  0.12]],
            freeze:   [[330, 0.13], [294,  0.09], [262,  0.16]],
            fireball: [[330, 0.06], [660,  0.06], [990,  0.06], [1320, 0.09]],
        };
        (m[type] || [[440, 0.1]]).forEach(([f, d], i) =>
            this._note(f, d, 'triangle', 0.18, i * 0.06));
    }

    fireballLaunch() {
        const ctx  = this._ctx();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(this.masterGain);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.24, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        osc.start(); osc.stop(ctx.currentTime + 0.5);
    }

    fireballImpact() {
        [80, 105, 135, 165].forEach((f, i) => {
            const ctx  = this._ctx();
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(this.masterGain);
            osc.type = 'sawtooth';
            osc.frequency.value = f;
            const t = ctx.currentTime + i * 0.015;
            gain.gain.setValueAtTime(0.19, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
            osc.start(t); osc.stop(t + 0.6);
        });
    }

    // ── Music ───────────────────────────────────────────────────────────────

    startMusic(type = 'game') {
        if (this._musicPlaying && this._musicType === type) return;
        this.stopMusic();
        this._musicPlaying = true;
        this._musicType    = type;
        const ctx     = this._ctx();
        const beatDur = type === 'menu' ? MENU_BEAT : this._beatDur;
        this._scheduleLoop(ctx.currentTime + 0.05, type, beatDur);
    }

    stopMusic() {
        this._musicPlaying = false;
        clearTimeout(this._musicTimer);
    }

    _scheduleLoop(loopStart, type, beatDur) {
        if (!this._musicPlaying) return;
        const ctx   = this._ctx();
        const notes = type === 'menu' ? MENU_NOTES : GAME_NOTES;
        const beats = type === 'menu' ? MENU_BEATS  : GAME_BEATS;

        notes.forEach(([f, dBeats, tBeats, v, w]) => {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(this.musicGain);
            osc.type = w;
            osc.frequency.value = f;
            const at  = loopStart + tBeats * beatDur;
            const dur = dBeats   * beatDur;
            gain.gain.setValueAtTime(v, at);
            gain.gain.exponentialRampToValueAtTime(0.0001, at + dur * 0.9);
            osc.start(at);
            osc.stop(at + dur);
        });

        const loopDur     = beats * beatDur;
        // Next loop picks up whatever _beatDur is at that moment (updated by setGameTempo)
        const nextBeatDur = type === 'menu' ? MENU_BEAT : this._beatDur;
        const ms = (loopStart + loopDur - ctx.currentTime - 0.08) * 1000;
        this._musicTimer = setTimeout(
            () => this._scheduleLoop(loopStart + loopDur, type, nextBeatDur),
            Math.max(0, ms)
        );
    }
}
