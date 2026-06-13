import SoundManager from './SoundManager.js';

// ── Пресеты хвоста — крутите поля и переименовывайте key/name в StartScene ──
const TRAIL_PRESETS = {
    trail_1: { lifespan: 220, scaleStart: 0.80, scaleEnd: 0.0, alphaStart: 0.55, alphaEnd: 0.0, speed: 0, frequency: 12, blendMode: 'ADD' },
    trail_2: { lifespan: 380, scaleStart: 0.65, scaleEnd: 0.0, alphaStart: 0.85, alphaEnd: 0.0, speed: 126, frequency: 18, blendMode: 'ADD' },
    trail_3: { lifespan: 140, scaleStart: 1.30, scaleEnd: 0.0, alphaStart: 0.90, alphaEnd: 0.0, speed: 14, frequency: 7, blendMode: 'ADD' },
    trail_4: { lifespan: 680, scaleStart: 0.9, scaleEnd: 0.0, alphaStart: 0.15, alphaEnd: 0.0, speed: 0, frequency: 7,quantity:5, blendMode: 'ADD' },
};
// ─────────────────────────────────────────────────────────────────────────────

function _drawBallAt(gfx, r, key) {
    const x = r, y = r;
    switch (key) {
        case 'ball': {
            gfx.fillStyle(0xf4f4f4, 1); gfx.fillCircle(x, y, r);
            gfx.lineStyle(r * 0.1, 0xdddddd, 1);
            gfx.beginPath(); gfx.arc(x, y + r * 0.2, r * 0.72, Math.PI * 1.12, Math.PI * 1.88, false); gfx.strokePath();
            gfx.fillStyle(0xffffff, 1); gfx.fillCircle(x - r * 0.28, y - r * 0.28, r * 0.36);
            break;
        }
        case 'ball2': {
            // Звезда — яркое золото
            const pts = [], pts2 = [];
            for (let i = 0; i < 10; i++) {
                const a = (i * Math.PI / 5) - Math.PI / 2;
                const rd = i % 2 === 0 ? r * 0.94 : r * 0.42;
                pts.push({ x: x + Math.cos(a) * rd, y: y + Math.sin(a) * rd });
                pts2.push({ x: x + Math.cos(a) * rd * 0.78, y: y + Math.sin(a) * rd * 0.78 });
            }
            gfx.fillStyle(0xffcc22, 1); gfx.fillPoints(pts, true);
            gfx.fillStyle(0xfff066, 1); gfx.fillPoints(pts2, true);
            gfx.lineStyle(2, 0xffffff, 0.9); gfx.strokePoints(pts, true);
            gfx.fillStyle(0xffffff, 0.95); gfx.fillCircle(x - r * 0.18, y - r * 0.3, r * 0.2);
            break;
        }
        case 'ball3': {
            // Огонь — светло-оранжевый
            const sp = (ox, oy) => ({ x: x + ox * r, y: y + oy * r });
            const outer = [sp(0, -0.94), sp(0.6, -0.22), sp(0.82, 0.36), sp(0.44, 0.9), sp(0, 0.96), sp(-0.44, 0.9), sp(-0.82, 0.36), sp(-0.6, -0.22)];
            const sca = (pts, s, dy) => pts.map(p => ({ x: x + (p.x - x) * s, y: y + (p.y - y) * s + dy }));
            gfx.fillStyle(0xff5522, 1); gfx.fillPoints(outer, true);
            gfx.fillStyle(0xffaa33, 1); gfx.fillPoints(sca(outer, 0.68, r * 0.08), true);
            gfx.fillStyle(0xffee88, 1); gfx.fillPoints(sca(outer, 0.36, r * 0.14), true);
            break;
        }
        case 'ball4': {
            // Снежинка — яркий голубой
            gfx.lineStyle(r * 0.16, 0xbbddff, 1);
            for (let i = 0; i < 6; i++) {
                const a = i * Math.PI / 3;
                gfx.lineBetween(x, y, x + Math.cos(a) * r * 0.94, y + Math.sin(a) * r * 0.94);
            }
            gfx.lineStyle(r * 0.1, 0xbbddff, 0.9);
            for (let i = 0; i < 6; i++) {
                const a = i * Math.PI / 3;
                const mx = x + Math.cos(a) * r * 0.56, my = y + Math.sin(a) * r * 0.56;
                const pa = a + Math.PI / 2, bl = r * 0.24;
                gfx.lineBetween(mx + Math.cos(pa) * bl, my + Math.sin(pa) * bl,
                    mx - Math.cos(pa) * bl, my - Math.sin(pa) * bl);
            }
            gfx.fillStyle(0xeef8ff, 1); gfx.fillCircle(x, y, r * 0.22);
            gfx.fillStyle(0xffffff, 1); gfx.fillCircle(x - r * 0.06, y - r * 0.06, r * 0.1);
            break;
        }
        case 'ball5': {
            // Монета — светлое золото
            gfx.fillStyle(0xddbb44, 1); gfx.fillCircle(x, y, r);
            gfx.fillStyle(0xffcc55, 1); gfx.fillCircle(x, y, r * 0.88);
            gfx.fillStyle(0xffee99, 1); gfx.fillCircle(x, y, r * 0.72);
            const ps = [];
            for (let i = 0; i < 10; i++) {
                const a = (i * Math.PI / 5) - Math.PI / 2;
                ps.push({ x: x + Math.cos(a) * (i % 2 === 0 ? r * 0.42 : r * 0.2), y: y + Math.sin(a) * (i % 2 === 0 ? r * 0.42 : r * 0.2) });
            }
            gfx.fillStyle(0xcc9922, 0.7); gfx.fillPoints(ps, true);
            gfx.fillStyle(0xffffff, 0.7); gfx.fillCircle(x - r * 0.3, y - r * 0.3, r * 0.24);
            break;
        }
        case 'ball6': {
            // Сердце — параметрическая кривая (x=16sin³t, y=13cos-5cos2-2cos3-cos4)
            const hpts = [], hpts2 = [];
            const hs = r / 17;
            for (let i = 0; i < 48; i++) {
                const t = (i / 48) * Math.PI * 2;
                const hx = 16 * Math.pow(Math.sin(t), 3);
                const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
                hpts.push({ x: x + hx * hs, y: y - (hy + 2.5) * hs });
                hpts2.push({ x: x + hx * hs * 0.58, y: y - (hy + 2.5) * hs * 0.58 - r * 0.06 });
            }
            gfx.fillStyle(0xff3366, 1); gfx.fillPoints(hpts, true);
            gfx.fillStyle(0xff88bb, 0.6); gfx.fillPoints(hpts2, true);
            gfx.fillStyle(0xffffff, 0.9); gfx.fillCircle(x - r * 0.28, y - r * 0.38, r * 0.14);
            break;
        }
        case 'ball7': {
            // Бомба — светло-серая
            gfx.fillStyle(0x555555, 1); gfx.fillCircle(x, y + r * 0.06, r * 0.84);
            gfx.fillStyle(0x888888, 0.65); gfx.fillCircle(x - r * 0.26, y - r * 0.14, r * 0.3);
            gfx.lineStyle(r * 0.12, 0x998866, 1);
            gfx.lineBetween(x - r * 0.02, y - r * 0.76, x + r * 0.24, y - r * 0.86);
            gfx.fillStyle(0xffee44, 1); gfx.fillCircle(x + r * 0.3, y - r * 0.84, r * 0.15);
            gfx.fillStyle(0xff9900, 0.9); gfx.fillCircle(x + r * 0.28, y - r * 0.82, r * 0.09);
            gfx.lineStyle(2, 0x777777, 0.9); gfx.strokeCircle(x, y + r * 0.06, r * 0.84);
            gfx.fillStyle(0xffffff, 0.65); gfx.fillCircle(x - r * 0.3, y - r * 0.22, r * 0.22);
            break;
        }
        case 'ball8': {
            // Футбольный мяч
            gfx.fillStyle(0xffffff, 1); gfx.fillCircle(x, y, r);
            gfx.fillStyle(0x333333, 1);
            const penta = (cx, cy, pr, rot) => {
                const p = [];
                for (let i = 0; i < 5; i++) {
                    const a = rot + (i * 2 * Math.PI / 5);
                    p.push({ x: cx + Math.cos(a) * pr, y: cy + Math.sin(a) * pr });
                }
                return p;
            };
            gfx.fillPoints(penta(x, y, r * 0.32, -Math.PI / 2), true);
            for (let i = 0; i < 5; i++) {
                const a = -Math.PI / 2 + (i * 2 * Math.PI / 5);
                gfx.fillPoints(penta(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.25, a + Math.PI), true);
            }
            gfx.lineStyle(1, 0xdddddd, 0.6); gfx.strokeCircle(x, y, r);
            gfx.fillStyle(0xffffff, 0.7); gfx.fillCircle(x - r * 0.3, y - r * 0.32, r * 0.26);
            break;
        }
        case 'ball9': {
            // Баскет — яркий оранжевый
            gfx.fillStyle(0xff6633, 1); gfx.fillCircle(x, y, r);
            gfx.fillStyle(0xff9955, 0.55); gfx.fillCircle(x - r * 0.1, y - r * 0.1, r * 0.8);
            gfx.lineStyle(r * 0.08, 0x442200, 1);
            gfx.lineBetween(x - r, y, x + r, y);
            gfx.beginPath(); gfx.arc(x - r * 0.38, y, r * 0.6, -1.1, 1.1, false); gfx.strokePath();
            gfx.beginPath(); gfx.arc(x + r * 0.38, y, r * 0.6, Math.PI - 1.1, Math.PI + 1.1, false); gfx.strokePath();
            gfx.lineStyle(1.5, 0x442200, 0.8); gfx.strokeCircle(x, y, r);
            gfx.fillStyle(0xffffff, 0.6); gfx.fillCircle(x - r * 0.3, y - r * 0.3, r * 0.28);
            break;
        }
        case 'ball10': {
            // Кристалл — светлый аквамарин
            const crown = [
                { x: x, y: y - r * 0.94 },
                { x: x + r * 0.54, y: y - r * 0.28 },
                { x: x + r * 0.3, y: y + r * 0.08 },
                { x: x - r * 0.3, y: y + r * 0.08 },
                { x: x - r * 0.54, y: y - r * 0.28 },
            ];
            const pavilion = [
                { x: x + r * 0.3, y: y + r * 0.08 },
                { x: x + r * 0.62, y: y + r * 0.14 },
                { x: x, y: y + r * 0.94 },
                { x: x - r * 0.62, y: y + r * 0.14 },
                { x: x - r * 0.3, y: y + r * 0.08 },
            ];
            gfx.fillStyle(0x33ddaa, 1); gfx.fillPoints(pavilion, true);
            gfx.fillStyle(0x66ffdd, 1); gfx.fillPoints(crown, true);
            const facet = [
                { x: x, y: y - r * 0.88 },
                { x: x + r * 0.3, y: y - r * 0.3 },
                { x: x, y: y + r * 0.06 },
                { x: x - r * 0.3, y: y - r * 0.3 },
            ];
            gfx.fillStyle(0xaaffee, 0.7); gfx.fillPoints(facet, true);
            gfx.lineStyle(2, 0xaaffee, 1); gfx.strokePoints(crown, true);
            gfx.lineStyle(1, 0x22cc99, 0.8); gfx.strokePoints(pavilion, true);
            gfx.fillStyle(0xffffff, 0.85); gfx.fillCircle(x + r * 0.08, y - r * 0.52, r * 0.14);
            break;
        }
    }
}

const FIELD_CONFIGS = {
    field_default: { bg: 0x080808, c1: 0x4488ff, c2: 0xff4444 },
    field_neon: { bg: 0x050510, c1: 0x00ffcc, c2: 0xff00aa },
    field_night: { bg: 0x020208, c1: 0x2266dd, c2: 0xaa22ff },
    field_sunset: { bg: 0x0a0408, c1: 0xff8800, c2: 0xff3366 },
    field_sky: { bg: 0x1e4a8c, c1: 0xffffff, c2: 0xffdd22 },
    field_mint: { bg: 0x0d4030, c1: 0xffee44, c2: 0xff3366 },
    field_coral: { bg: 0x4a2010, c1: 0x44ddff, c2: 0xeeff44 },
    field_violet: { bg: 0x2a0a55, c1: 0x44ffcc, c2: 0xffdd22 },
};

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        ['ball', 'ball2', 'ball3', 'ball4', 'ball5'].forEach(k => {
            if (!this.textures.exists(k)) this.load.image(k, `assets/${k}.png`);
        });
        if (!this.textures.exists('player')) this.load.image('player', 'assets/player.png');
    }

    create(data) {
        this.mode = (data && data.mode) || 'classic';
        this.speed = (data && data.speed) || 'fast';
        this._ballKey = this.registry.get('ballKey') || 'ball';
        this.dw = this.scale.width;
        this.dh = this.scale.height;

        this.score1 = (data && data.score1 != null) ? data.score1 : 0;
        this.score2 = (data && data.score2 != null) ? data.score2 : 0;
        this.WIN_SCORE = 7;
        this.gameOver = false;
        this._vsBot = !!(data && data.botDiff);
        this._botDiff = (data && data.botDiff) || null;
        this._accelOn = data.accel !== false;

        const _fConf = FIELD_CONFIGS[(data && data.field)] || FIELD_CONFIGS.field_default;
        this.C1 = _fConf.c1;
        this.C2 = _fConf.c2;

        // Генерируем / обновляем текстуры всех мячей (PNG переопределяется векторным)
        ['ball', 'ball2', 'ball3', 'ball4', 'ball5', 'ball6', 'ball7', 'ball8', 'ball9', 'ball10'].forEach(k => {
            if (this.textures.exists(k)) this.textures.remove(k);
            const g = this.add.graphics();
            _drawBallAt(g, 34, k);
            g.generateTexture(k, 68, 68);
            g.destroy();
        });

        this._trailOn = data.trail !== false;

        // Фон: тёмный + цветные половины
        this.add.rectangle(this.dw / 2, this.dh / 2, this.dw, this.dh, _fConf.bg);
        this.add.rectangle(this.dw * 0.25, this.dh / 2, this.dw / 2, this.dh, this.C1).setAlpha(0.2);
        this.add.rectangle(this.dw * 0.75, this.dh / 2, this.dw / 2, this.dh, this.C2).setAlpha(0.2);

        // Пунктирная центральная линия
        const lineGfx = this.add.graphics();
        lineGfx.lineStyle(2, 0xffffff, 0.1);
        for (let y = 0; y < this.dh; y += 24) {
            lineGfx.lineBetween(this.dw / 2, y, this.dw / 2, y + 12);
        }

        // Ракетки
        this.PAD_W = 14; this.PAD_H = 225;
        const PAD_W = this.PAD_W, PAD_H = this.PAD_H, PAD_MARGIN = 24;

        this.pad1 = this.add.rectangle(PAD_MARGIN + PAD_W / 2, this.dh / 2, PAD_W, PAD_H, this.C1);
        this.physics.add.existing(this.pad1);
        this.pad1.body.setImmovable(true);
        this.pad1.body.setCollideWorldBounds(true);
        this.pad1.body.syncBounds = true;

        this.pad2 = this.add.rectangle(this.dw - PAD_MARGIN - PAD_W / 2, this.dh / 2, PAD_W, PAD_H, this.C2);
        this.physics.add.existing(this.pad2);
        this.pad2.body.setImmovable(true);
        this.pad2.body.setCollideWorldBounds(true);
        this.pad2.body.syncBounds = true;

        // Хвост: берём пресет по ключу из стартового экрана (fallback → trail_1)
        this._TRAIL = TRAIL_PRESETS[data.trailKey] || TRAIL_PRESETS['trail_1'];

        const _tr = this._TRAIL;
        // Эмиттер всегда в (0,0) — частицы рождаются в мировых координатах через explode()
        console.log(_tr.speed);
        
        this._trailEmt = this.add.particles(0, 0, this._ballKey, {
            speed: _tr.speed.min != null ? { min: _tr.speed.min, max: _tr.speed.max } : _tr.speed,
            scale: { start: _tr.scaleStart, end: _tr.scaleEnd },
            alpha: { start: _tr.alphaStart, end: _tr.alphaEnd },
            lifespan: _tr.lifespan,
            blendMode: _tr.blendMode,
            emitting: false,
        }).setDepth(1);
        this._trailLastEmit = -9999;

        // Graphics только для файрбол-следа
        this.trailGfx = this.add.graphics().setDepth(3);
        this.trailPositions = [];

        // Мяч
        this.ball = this.physics.add.image(this.dw / 2, this.dh / 2, this._ballKey).setDepth(2);

        // Коллайдеры
        this.physics.add.collider(this.ball, this.pad1, this._onHit, null, this);
        this.physics.add.collider(this.ball, this.pad2, this._onHit, null, this);

        // Счёт (цвета совпадают с игроками)
        const _c1hex = '#' + this.C1.toString(16).padStart(6, '0');
        const _c2hex = '#' + this.C2.toString(16).padStart(6, '0');
        this.s1Text = this.add.text(this.dw * 0.25, 58, String(this.score1), {
            fontSize: '108px', color: _c1hex, fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.75);
        this.s2Text = this.add.text(this.dw * 0.75, 58, String(this.score2), {
            fontSize: '108px', color: _c2hex, fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.75);
        // Подсказки управления — смещены от края, чтобы не обрезались
        this.add.text(this.dw * 0.12, this.dh - 12, 'W / S', {
            fontSize: '38px', color: '#6699ff'
        }).setOrigin(0.5, 1).setAlpha(0.4);
        if (!this._vsBot) {
            this.add.text(this.dw * 0.88, this.dh - 12, '↑ / ↓', {
                fontSize: '38px', color: '#ff6655'
            }).setOrigin(0.5, 1).setAlpha(0.4);
        }

        // Победный текст (скрыт)
        this.winText = this.add.text(this.dw / 2, this.dh / 2, '', {
            fontSize: '42px', color: '#ffdd00', fontStyle: 'bold',
            backgroundColor: '#00000099',
            padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setVisible(false).setDepth(10);

        this.paused = false;
        this.pauseElements = null;
        this.soundBtn = null;

        this.keys = this.input.keyboard.addKeys({
            w: 'W', s: 'S',
            up: 'UP', down: 'DOWN',
            space: 'SPACE',
            esc: 'ESC',
        });
        this.keys.space.on('down', this._togglePause, this);
        this.keys.esc.on('down', this._togglePause, this);

        // Кнопка паузы — два прямоугольника (Graphics) + невидимая hit-зона
        const PAX = this.dw / 2, PAY = 12;
        const BW = 11, BH = 42, BGAP = 14;
        const pauseGfx = this.add.graphics().setDepth(8).setAlpha(0.30);
        pauseGfx.fillStyle(0xffffff, 1);
        pauseGfx.fillRoundedRect(PAX - BGAP / 2 - BW, PAY, BW, BH, 4);
        pauseGfx.fillRoundedRect(PAX + BGAP / 2, PAY, BW, BH, 4);

        const pauseHit = this.add.rectangle(PAX, PAY + BH / 2, BW * 2 + BGAP + 28, BH + 22, 0x000000, 0)
            .setDepth(8).setInteractive({ useHandCursor: true });
        pauseHit.on('pointerdown', () => { if (!this.gameOver) this._togglePause(); });
        pauseHit.on('pointerover', () => pauseGfx.setAlpha(0.85));
        pauseHit.on('pointerout', () => pauseGfx.setAlpha(0.30));

        // Touch — ракетка бежит за пальцем
        this.input.addPointer(2);

        {
            // Маленький индикатор точки касания (вместо джойстика)
            this._touchDot1 = this.add.circle(0, 0, 20, this.C1, 0.35)
                .setStrokeStyle(2, this.C1, 0.8).setDepth(5).setVisible(false);
            this._touchDot2 = this.add.circle(0, 0, 20, this.C2, 0.35)
                .setStrokeStyle(2, this.C2, 0.8).setDepth(5).setVisible(false);

            // ptr = touch.identifier, y = текущая Y пальца в игровых координатах
            this._t1 = { ptr: null, y: 0 };
            this._t2 = { ptr: null, y: 0 };

            const canvas = this.sys.game.canvas;

            const toGame = (touch) => {
                const r = canvas.getBoundingClientRect();
                return {
                    x: (touch.clientX - r.left) * (this.dw / r.width),
                    y: (touch.clientY - r.top)  * (this.dh / r.height),
                };
            };

            const onStart = (e) => {
                if (this.paused || this.gameOver) return;
                e.preventDefault();
                for (const t of e.changedTouches) {
                    const p = toGame(t);
                    if (p.x < this.dw / 2) {
                        if (this._t1.ptr === null) {
                            this._t1.ptr = t.identifier; this._t1.y = p.y;
                            this._touchDot1.setPosition(p.x, p.y).setVisible(true);
                        }
                    } else {
                        if (this._t2.ptr === null) {
                            this._t2.ptr = t.identifier; this._t2.y = p.y;
                            this._touchDot2.setPosition(p.x, p.y).setVisible(true);
                        }
                    }
                }
            };

            const onMove = (e) => {
                e.preventDefault();
                for (const t of e.changedTouches) {
                    const p = toGame(t);
                    if (this._t1.ptr === t.identifier) {
                        this._t1.y = p.y;
                        this._touchDot1.setY(p.y);
                    }
                    if (this._t2.ptr === t.identifier) {
                        this._t2.y = p.y;
                        this._touchDot2.setY(p.y);
                    }
                }
            };

            const onEnd = (e) => {
                for (const t of e.changedTouches) {
                    if (this._t1.ptr === t.identifier) {
                        this._t1.ptr = null;
                        this._touchDot1.setVisible(false);
                    }
                    if (this._t2.ptr === t.identifier) {
                        this._t2.ptr = null;
                        this._touchDot2.setVisible(false);
                    }
                }
            };

            canvas.addEventListener('touchstart', onStart, { passive: false });
            canvas.addEventListener('touchmove',  onMove,  { passive: false });
            canvas.addEventListener('touchend',   onEnd);
            canvas.addEventListener('touchcancel', onEnd);

            this._joyCleanup = () => {
                canvas.removeEventListener('touchstart', onStart);
                canvas.removeEventListener('touchmove',  onMove);
                canvas.removeEventListener('touchend',   onEnd);
                canvas.removeEventListener('touchcancel', onEnd);
            };

            // Полноэкранный guard — при выходе из FS блокируем игру
            this._fsBlocked = false;
            const _onFSChange = () => {
                const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
                if (!isFS && !this._fsBlocked && !this.gameOver) {
                    this._fsBlocked = true;
                    if (!this.paused) this.physics.pause();
                    this._showGameFSPrompt();
                }
            };
            document.addEventListener('fullscreenchange', _onFSChange);
            document.addEventListener('webkitfullscreenchange', _onFSChange);
            this.events.once('shutdown', () => {
                document.removeEventListener('fullscreenchange', _onFSChange);
                document.removeEventListener('webkitfullscreenchange', _onFSChange);
            });
        }

        if (this.mode === 'features') {
            this.hitCount = 0;
            this.nextPickupAt = 2;
            this.pickup = null;
            this.lastHitter = 1;
            this.boostUntil1 = 0;
            this.boostUntil2 = 0;
            this.boostGlow1 = null;
            this.boostGlow2 = null;
            this.sizeUntil1 = 0;
            this.sizeUntil2 = 0;
            this.freezeUntil1 = 0;
            this.freezeUntil2 = 0;
            this.freezeGfx1 = null;
            this.freezeGfx2 = null;
            this.fireballMode = false;
            this.fireballOwner = 0;
            this.hitCountText = this.add.text(this.dw / 2, this.dh - 14, 'удары: 0', {
                fontSize: '30px', color: '#ffffff'
            }).setOrigin(0.5, 1).setAlpha(0.35).setDepth(6);
        }

        // Sound
        if (!this.registry.get('snd')) this.registry.set('snd', new SoundManager(this.registry));
        this.snd = this.registry.get('snd');
        this.snd.startMusic('game');
        this.events.on('shutdown', () => {
            this.snd.stopMusic();
            if (this._joyCleanup) { this._joyCleanup(); this._joyCleanup = null; }
            if (this.coin) this._destroyCoin();
        });

        this._buildStatusUI();

        // Coin system (all modes)
        this._coinHitCount = 0;
        this._nextCoinAt = Phaser.Math.Between(4, 8);
        this.coin = null;
        this._loadCoins();
        this._buildCoinHUD();

        if (this._vsBot) {
            const _bp = {
                easy: { speedMul: 0.38, errorRange: 90, interval: 800 },
                medium: { speedMul: 0.62, errorRange: 30, interval: 300 },
                hard: { speedMul: 0.88, errorRange: 7, interval: 100 },
            };
            this._botParams = _bp[this._botDiff] || _bp.medium;
            this._botTargetY = this.dh / 2;
            this._botNextUpdate = 0;
            this._botErrorOffset = 0;
        }

        this._launchBall();
    }

    _launchBall() {
        const progress = Math.max(this.score1, this.score2) / this.WIN_SCORE;
        const SMUL = { calm: 0.62, fast: 1.0, veryfast: 1.5 };
        const sm = SMUL[this.speed] || 1.0;
        this.ballSpeed = (456 + progress * 280) * 1.2 * sm;
        this.padSpeed = (480 + progress * 250) * 1.21 * sm;
        this.padSpeedRatio = this.padSpeed / this.ballSpeed;
        this.ball.clearTint();
        this.trailPositions = [];
        this.trailGfx.clear();
        this.trailPositions = [];
        this._trailEmt.setParticleTint(0xffffff);
        this._trailLastEmit = -9999;
        this._lastHitTime = 0;
        this.fireballMode = false;

        const sx = this.dw / 2;
        const sy = Phaser.Math.Between(this.dh * 0.3, this.dh * 0.7);
        this.ball.setPosition(sx, sy);
        this.ball.setVelocity(0, 0);
        this.ball.body.enable = false; // физика выключена пока дребезжит

        // визуальный спин пока body отключено
        if (this._spinTween) this._spinTween.stop();
        this._spinTween = this.tweens.add({
            targets: this.ball, angle: '+=360',
            duration: 1000, repeat: -1, ease: 'Linear',
        });

        // дребезжание: вправо → обратно → влево → обратно → settle → пауза → старт
        const W = 500; // начальная пауза перед дребезжанием
        const d = 85;
        this.tweens.add({ targets: this.ball, x: sx + 32, duration: d, delay: W, ease: 'Sine.Out' });
        this.tweens.add({ targets: this.ball, x: sx - 6, duration: d, delay: W + d, ease: 'Sine.InOut' });
        this.tweens.add({ targets: this.ball, x: sx - 28, duration: d, delay: W + d * 2 + 120, ease: 'Sine.Out' });
        this.tweens.add({ targets: this.ball, x: sx + 4, duration: d, delay: W + d * 3 + 120, ease: 'Sine.InOut' });
        this.tweens.add({
            targets: this.ball,
            x: sx,
            duration: 130,
            delay: W + d * 4 + 120,
            ease: 'Back.Out',
            onComplete: () => {
                if (this._spinTween) { this._spinTween.stop(); this._spinTween = null; }
                if (this.gameOver) return;
                // пауза после дребезжания — мяч замирает перед вылетом
                this.time.delayedCall(480, () => {
                    if (this.gameOver) return;
                    this.ball.body.enable = true;
                    this.ball.body.reset(sx, sy);
                    this.ball.setAngularVelocity(350);
                    const angle = Phaser.Math.Between(-25, 25);
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    const rad = Phaser.Math.DegToRad(angle);
                    this.ball.setVelocity(
                        Math.cos(rad) * this.ballSpeed * dir,
                        Math.sin(rad) * this.ballSpeed
                    );
                });
            }
        });
    }

    _onHit(ball, pad) {
        if (this.fireballMode) {
            const isOpponent = (this.fireballOwner === 1 && pad === this.pad2) ||
                (this.fireballOwner === 2 && pad === this.pad1);
            if (isOpponent) {
                this.snd.fireballImpact();
                // первая волна — на ракетке
                this._burst(pad.x, pad.y, 0xff2200, 80);
                this._burst(pad.x, pad.y, 0xffcc00, 44);
                this._burst(pad.x, pad.y, 0xffffff, 28);
                // осколки по всему полю
                this._burst(this.dw / 2, this.dh / 2, 0xff4400, 20);
                this._burst(pad.x, this.dh * 0.2, 0xffaa00, 12);
                this._burst(pad.x, this.dh * 0.8, 0xffaa00, 12);
                // вспышки: резкая белая → оранжевая → затухание
                this.cameras.main.flash(60, 255, 255, 255, true);
                this.time.delayedCall(80, () => this.cameras.main.flash(120, 255, 140, 0, true));
                this.time.delayedCall(220, () => this.cameras.main.flash(180, 255, 60, 0, true));
                // двойной шейк: удар + затухающее эхо
                this.cameras.main.shake(200, 0.055);
                this.time.delayedCall(260, () => this.cameras.main.shake(350, 0.022));
                this.fireballMode = false; this._fireTarget = null;
                this.ball.clearTint();
                this._point(this.fireballOwner);
                return;
            }
            this.fireballMode = false; this._fireTarget = null;
            this.ball.clearTint();
        }

        const now = this.time.now;
        const onCooldown = now - (this._lastHitTime || 0) < 200;
        if (!onCooldown) {
            this._lastHitTime = now;
            if (this._accelOn) this.ballSpeed = this.ballSpeed * 1.05;
        }

        // Физика — всегда (мяч должен отскочить даже на кулдауне)
        const norm = (ball.y - pad.y) / (pad.displayHeight / 2);
        const rad = Phaser.Math.DegToRad(norm * 45);
        const dir = ball.x < this.dw / 2 ? 1 : -1;
        ball.body.velocity.x = Math.cos(rad) * this.ballSpeed * dir;
        ball.body.velocity.y = Math.sin(rad) * this.ballSpeed;

        const isP1 = pad === this.pad1;

        // lastHitter обновляется всегда (нужно для точного прицела файрбола)
        if (this.mode === 'features') this.lastHitter = isP1 ? 1 : 2;

        if (onCooldown) return;

        this.snd.hitPad(isP1 ? 1 : 2);
        this._burst(ball.x, ball.y, isP1 ? this.C1 : this.C2, 10);
        this.cameras.main.shake(55, 0.004);

        if (this.mode === 'features') {
            // Применяем буст скорости если активен у этого игрока
            const boosted = (isP1 && now < this.boostUntil1) || (!isP1 && now < this.boostUntil2);
            if (boosted) {
                ball.body.velocity.x *= 1.4;
                ball.body.velocity.y *= 1.4;
                this.ballSpeed = this.ballSpeed * 1.4;
                this._burst(ball.x, ball.y, 0x00ccff, 7);
            }

            this.hitCount++;
            this.hitCountText.setText(`удары: ${this.hitCount}`);
            if (!this.pickup && this.hitCount >= this.nextPickupAt) {
                this._spawnPickup();
            }
        }

        ball.setAngularVelocity(700);
        this.tweens.killTweensOf(ball.body);
        this.tweens.add({
            targets: ball.body,
            angularVelocity: 350,
            duration: 1800,
            ease: 'Sine.Out',
        });


        // Coin spawn tracking (all modes)
        this._coinHitCount++;
        if (!this.coin && this._coinHitCount >= this._nextCoinAt) {
            this._spawnCoin();
        }
    }

    _burst(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.8;
            const dist = Phaser.Math.Between(25, 80);
            const p = this.add.circle(x, y, Phaser.Math.Between(3, 7), color).setDepth(5);
            this.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(200, 420),
                ease: 'Power2',
                onComplete: () => p.destroy(),
            });
        }
    }

    _point(scorer) {
        if (this.gameOver) return;
        scorer === 1 ? this.score1++ : this.score2++;
        this.s1Text.setText(this.score1);
        this.s2Text.setText(this.score2);
        this.snd.scored();

        // Визуальный отклик гола
        const scoredText = scorer === 1 ? this.s1Text : this.s2Text;
        const goalColor = scorer === 1 ? this.C1 : this.C2;
        const r = (goalColor >> 16) & 0xff;
        const g = (goalColor >> 8) & 0xff;
        const b = goalColor & 0xff;

        this.tweens.killTweensOf(scoredText);
        scoredText.setTint(goalColor);
        scoredText.setScale(1);
        this.tweens.add({
            targets: scoredText, scaleX: 1.7, scaleY: 1.7,
            duration: 170, ease: 'Back.Out',
            onComplete: () => {
                this.tweens.add({
                    targets: scoredText, scaleX: 1, scaleY: 1,
                    duration: 420, ease: 'Sine.InOut',
                });
                this.time.delayedCall(480, () => { scoredText.clearTint(); });
            },
        });
        this.cameras.main.flash(200, r, g, b, false);
        this.cameras.main.shake(130, 0.008);
        this._burst(this.dw / 2, this.dh / 2, goalColor, 18);

        if (this.score1 >= this.WIN_SCORE || this.score2 >= this.WIN_SCORE) {
            this._endGame(scorer);
            return;
        }

        this.ball.setVelocity(0, 0);
        this.ball.setPosition(this.dw / 2, this.dh / 2);
        this.trailPositions = [];
        this.trailGfx.clear();
        if (this.coin) { this._burst(this.coin.x, this.coin.y, 0xaa8800, 5); this._destroyCoin(); }
        this._coinHitCount = 0;
        this._nextCoinAt = Phaser.Math.Between(4, 8);
        if (this.mode === 'features') {
            if (this.pickup) { this._burst(this.pickup.x, this.pickup.y, 0x888800, 6); this._destroyPickup(); }
            this.hitCount = 0;
            this.nextPickupAt = 2;
            this.hitCountText.setText('удары: 0');
            this.boostUntil1 = 0;
            this.boostUntil2 = 0;
            this._clearBoostGlow(1);
            this._clearBoostGlow(2);
            this._clearSizeBoost(1);
            this._clearSizeBoost(2);
            this.freezeUntil1 = 0; this.freezeUntil2 = 0;
            this._clearFreezeEffect(1); this._clearFreezeEffect(2);
            this.fireballMode = false; this._fireTarget = null;
        }
        this._launchBall();
    }

    _endGame(winner) {
        this.gameOver = true;
        this.ball.setVelocity(0, 0);
        this.ball.setAngularVelocity(0);
        this.trailPositions = [];
        this.trailGfx.clear();
        if (this.pickup) { this._destroyPickup(); }
        if (this.coin) { this._destroyCoin(); }
        if (this.mode === 'features') {
            this._clearBoostGlow(1); this._clearBoostGlow(2);
            this._clearSizeBoost(1); this._clearSizeBoost(2);
            this._clearFreezeEffect(1); this._clearFreezeEffect(2);
            this.fireballMode = false; this._fireTarget = null;
        }
        this.snd.win();
        this.winText.setText(
            this._vsBot && winner === 2 ? 'БОТ ПОБЕДИЛ!' : `Игрок ${winner} победил!`
        ).setVisible(true);

        let countdown = 3;
        const ctdText = this.add.text(this.dw / 2, this.dh / 2 + 65, `Возврат через ${countdown}...`, {
            fontSize: '18px', color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0.5).setDepth(10);
        this.time.addEvent({
            delay: 1000, repeat: 2,
            callback: () => {
                countdown--;
                ctdText.setText(countdown > 0 ? `Возврат через ${countdown}...` : 'Возврат...');
                if (countdown <= 0) this.time.delayedCall(500, () => this.scene.start('StartScene'));
            }
        });
    }

    update() {
        if (this.gameOver || this.paused) return;

        this.snd.setGameTempo(this.ballSpeed || 547);

        const SPEED = this.ballSpeed * (this.padSpeedRatio || 1);
        const freeze1 = (this.mode === 'features' && this.time.now < this.freezeUntil1) ? 0.6 : 1;
        const freeze2 = (this.mode === 'features' && this.time.now < this.freezeUntil2) ? 0.6 : 1;

        // Keyboard
        let vy1 = this.keys.w.isDown ? -SPEED * freeze1 : this.keys.s.isDown ? SPEED * freeze1 : 0;
        let vy2 = this._vsBot
            ? this._getBotVelocity(SPEED, freeze2)
            : (this.keys.up.isDown ? -SPEED * freeze2 : this.keys.down.isDown ? SPEED * freeze2 : 0);

        // Touch — ракетка бежит к Y-позиции пальца
        if (this._t1 && this._t1.ptr !== null) {
            const halfH = this.pad1.height / 2;
            const target1 = Phaser.Math.Clamp(this._t1.y, halfH, this.dh - halfH);
            vy1 = Phaser.Math.Clamp((target1 - this.pad1.y) * 14, -SPEED * freeze1, SPEED * freeze1);
        }
        if (!this._vsBot && this._t2 && this._t2.ptr !== null) {
            const halfH = this.pad2.height / 2;
            const target2 = Phaser.Math.Clamp(this._t2.y, halfH, this.dh - halfH);
            vy2 = Phaser.Math.Clamp((target2 - this.pad2.y) * 14, -SPEED * freeze2, SPEED * freeze2);
        }

        this.pad1.body.setVelocityY(vy1);
        this.pad2.body.setVelocityY(vy2);
        if (this.pad1.body.velocity.y !== 0) this.snd.padMove(1);
        if (this.pad2.body.velocity.y !== 0) this.snd.padMove(2);

        // Файрбол — хоминг: плавно доворачиваем мяч к цели каждый кадр
        if (this.fireballMode && this._fireTarget) {
            const dx = this._fireTarget.x - this.ball.x;
            const dy = this._fireTarget.y - this.ball.y;
            const len = Math.hypot(dx, dy) || 1;
            const spd = Math.hypot(this.ball.body.velocity.x, this.ball.body.velocity.y);
            const tx = (dx / len) * spd;
            const ty = (dy / len) * spd;
            this.ball.body.velocity.x += (tx - this.ball.body.velocity.x) * 0.14;
            this.ball.body.velocity.y += (ty - this.ball.body.velocity.y) * 0.14;
        }

        // Буст / размер / заморозка: рисуем glow, убираем по истечении
        if (this.mode === 'features') {
            const now = this.time.now;
            if (this.boostGlow1) {
                if (now < this.boostUntil1) this._drawBoostGlow(this.boostGlow1, this.pad1, this.C1, 1, now);
                else { this._clearBoostGlow(1); }
            }
            if (this.boostGlow2) {
                if (now < this.boostUntil2) this._drawBoostGlow(this.boostGlow2, this.pad2, this.C2, -1, now);
                else { this._clearBoostGlow(2); }
            }
            if (this.sizeUntil1 > 0 && now >= this.sizeUntil1) this._clearSizeBoost(1);
            if (this.sizeUntil2 > 0 && now >= this.sizeUntil2) this._clearSizeBoost(2);
            if (this.freezeGfx1) {
                if (now < this.freezeUntil1) this._drawFreezeEffect(this.freezeGfx1, this.pad1, now);
                else { this._clearFreezeEffect(1); }
            }
            if (this.freezeGfx2) {
                if (now < this.freezeUntil2) this._drawFreezeEffect(this.freezeGfx2, this.pad2, now);
                else { this._clearFreezeEffect(2); }
            }
            if (this.freezeUntil1 > 0 && now >= this.freezeUntil1) this.freezeUntil1 = 0;
            if (this.freezeUntil2 > 0 && now >= this.freezeUntil2) this.freezeUntil2 = 0;
            this._updateStatusUI(now);
        }

        // Хвост мяча
        const ballSpeed = Math.hypot(this.ball.body.velocity.x, this.ball.body.velocity.y);
        const moving = ballSpeed > 20;

        if (this._trailOn) {
            if (this.fireballMode) {
                // Файрбол — кастомный Graphics-след
                this._trailEmt.stop();
                if (moving) {
                    this.trailPositions.unshift({ x: this.ball.x, y: this.ball.y });
                    if (this.trailPositions.length > 24) this.trailPositions.pop();
                } else {
                    this.trailPositions = [];
                }
                this.trailGfx.clear();
                const br = this.ball.width / 2;
                this.trailPositions.forEach((pos, i) => {
                    const t = 1 - i / this.trailPositions.length;
                    const fc = i < 5 ? 0xffee00 : i < 12 ? 0xff6600 : 0xff1100;
                    this.trailGfx.fillStyle(fc, t * 0.85);
                    this.trailGfx.fillCircle(pos.x, pos.y, br * t * 1.5);
                });
            } else {
                // Обычный хвост — партиклы через explode (мировые координаты)
                this.trailGfx.clear();
                this.trailPositions = [];
                if (moving) {
                    const now = this.time.now;
                    if (now - this._trailLastEmit >= this._TRAIL.frequency) {
                        this._trailEmt.explode(this._TRAIL.quantity, this.ball.x, this.ball.y);
                        this._trailLastEmit = now;
                    }
                }
            }
        } else {
            this._trailEmt.stop();
            this.trailGfx.clear();
            this.trailPositions = [];
        }

        // Отскок от верха/низа
        const r = this.ball.height / 2;
        if (this.ball.y <= r) {
            this.ball.y = r + 1;
            this.ball.body.velocity.y = Math.abs(this.ball.body.velocity.y);
            this.snd.hitWall();
            this._burst(this.ball.x, r, 0xccddff, 7);
        } else if (this.ball.y >= this.dh - r) {
            this.ball.y = this.dh - r - 1;
            this.ball.body.velocity.y = -Math.abs(this.ball.body.velocity.y);
            this.snd.hitWall();
            this._burst(this.ball.x, this.dh - r, 0xccddff, 7);
        }

        // Пикап (фич мод)
        if (this.pickup) {
            if (this.time.now > this.pickup.expiresAt) {
                this._burst(this.pickup.x, this.pickup.y, 0x555500, 6);
                this._destroyPickup();
                this.nextPickupAt = this.hitCount + 2;
            } else {
                const dist = Phaser.Math.Distance.Between(
                    this.ball.x, this.ball.y, this.pickup.x, this.pickup.y
                );
                if (dist < this.pickup.radius + this.ball.width / 2) {
                    this._collectPickup();
                }
            }
        }

        // Монета
        if (this.coin) {
            if (this.time.now > this.coin.expiresAt) {
                this._destroyCoin();
                this._nextCoinAt = this._coinHitCount + Phaser.Math.Between(3, 7);
            } else {
                const coinDist = Phaser.Math.Distance.Between(
                    this.ball.x, this.ball.y, this.coin.x, this.coin.y
                );
                if (coinDist < this.coin.radius + this.ball.width / 2) {
                    this._collectCoin();
                    this._nextCoinAt = this._coinHitCount + Phaser.Math.Between(5, 10);
                }
            }
        }

        // Гол
        if (this.ball.x < 0) this._point(2);
        else if (this.ball.x > this.dw) this._point(1);
    }

    _spawnPickup() {
        const TYPES = { speed: 0x00ccff, size: 0xff8800, freeze: 0x99eeff, fireball: 0xff4400 };
        const type = Phaser.Utils.Array.GetRandom([
            'speed', 'size', 'freeze', 'speed', 'size', 'freeze', 'fireball'

            // 'fireball', 'fireball', 'fireball', 'fireball', 'fireball', 'fireball', 'fireball'
        ]);
        const color = TYPES[type];

        const x = Phaser.Math.Between(this.dw * 0.15, this.dw * 0.85);
        const y = Phaser.Math.Between(80, this.dh - 80);

        const glow = this.add.circle(x, y, 50, color, 0.25).setDepth(3);
        const ring = this.add.circle(x, y, 36, 0x000000, 0).setDepth(3)
            .setStrokeStyle(2, color, 0.8);
        const icon = this.add.graphics().setPosition(x, y).setDepth(4);
        this._drawPickupIcon(icon, type, color);

        [glow, ring, icon].forEach(o => o.setScale(0));

        this.tweens.add({
            targets: [glow, ring, icon],
            scale: 1,
            duration: 700,
            ease: 'Back.Out',
            onComplete: () => {
                if (!this.pickup) return;
                this.tweens.add({
                    targets: [glow, ring, icon],
                    scale: 1.25,
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.InOut',
                });
            },
        });

        this.pickup = { x, y, type, color, radius: 41, expiresAt: this.time.now + 10000, glow, icon, ring };
    }

    _collectPickup() {
        const { x, y, type, color } = this.pickup;
        this._burst(x, y, color, 16);
        this.snd.pickup(type);
        this._showPickupLabel(x, y, type, color);
        this._destroyPickup();
        this.nextPickupAt = this.hitCount + 2;

        if (type === 'speed') {
            const who = this.lastHitter;
            if (who === 1) this.boostUntil1 = this.time.now + 7000;
            else this.boostUntil2 = this.time.now + 7000;
            this._applyBoostGlow(who);
        } else if (type === 'size') {
            this._applySizeBoost(this.lastHitter);
        } else if (type === 'freeze') {
            const opponent = this.lastHitter === 1 ? 2 : 1;
            if (opponent === 1) { this.freezeUntil1 = this.time.now + 7000; this._applyFreezeEffect(1); }
            else { this.freezeUntil2 = this.time.now + 7000; this._applyFreezeEffect(2); }
        } else if (type === 'fireball') {
            this.snd.fireballLaunch();
            this.fireballMode = true;
            this.fireballOwner = this.lastHitter;
            const fireSpeed = this.ballSpeed * 3.5;
            this._fireTarget = this.lastHitter === 1 ? this.pad2 : this.pad1;
            const dx = this._fireTarget.x - this.ball.x;
            const dy = this._fireTarget.y - this.ball.y;
            const len = Math.hypot(dx, dy) || 1;
            this.ball.body.velocity.x = (dx / len) * fireSpeed;
            this.ball.body.velocity.y = (dy / len) * fireSpeed;
            this.ballSpeed = fireSpeed;
            this.trailLength = 24;
            this.ball.setTint(0xff6600);
            this.cameras.main.shake(120, 0.009);
        }
    }

    _buildStatusUI() {
        if (this.mode !== 'features') return;

        const TYPES = ['speed', 'size', 'freeze'];
        // Более насыщенные цвета: бирюзовый / золотой / небесно-синий
        const COLORS = { speed: 0x00ffcc, size: 0xffcc00, freeze: 0x55aaff };

        const makeGroup = (cx) => {
            const group = {};
            TYPES.forEach((type, i) => {
                const color = COLORS[type];
                const y = 82 + i * 26;
                const barMaxW = 70;
                const barLeft = cx - 20; // left edge — bar spans cx-20 … cx+50

                const bg = this.add.rectangle(cx, y, 108, 16, 0x111111, 0.5)
                    .setStrokeStyle(1, color, 0.25).setDepth(8).setVisible(false);
                const barBg = this.add.rectangle(cx + 15, y, barMaxW, 5, 0x1a1a1a, 0.85)
                    .setDepth(9).setVisible(false);
                const barFill = this.add.rectangle(barLeft, y, barMaxW, 5, color, 0.9)
                    .setOrigin(0, 0.5).setDepth(9).setVisible(false);
                const icon = this.add.graphics().setDepth(9).setVisible(false);
                this._drawPickupIcon(icon, type, color);
                icon.setScale(0.40).setPosition(cx - 43, y);

                group[type] = { bg, barBg, barFill, icon };
            });
            return group;
        };

        this._statusUI = {
            p1: makeGroup(this.dw * 0.25),
            p2: makeGroup(this.dw * 0.75),
        };
    }

    _updateStatusUI(now) {
        if (!this._statusUI) return;
        const DUR = 7000;

        const upd = (slot, untilTime) => {
            if (untilTime <= 0 || now >= untilTime) {
                if (slot.bg.visible)
                    [slot.bg, slot.barBg, slot.barFill, slot.icon].forEach(o => o.setVisible(false));
                return;
            }
            if (!slot.bg.visible)
                [slot.bg, slot.barBg, slot.barFill, slot.icon].forEach(o => o.setVisible(true));

            slot.barFill.scaleX = Math.max(0, (untilTime - now) / DUR);
        };

        const { p1, p2 } = this._statusUI;
        upd(p1.speed, this.boostUntil1);
        upd(p1.size, this.sizeUntil1);
        upd(p1.freeze, this.freezeUntil1);
        upd(p2.speed, this.boostUntil2);
        upd(p2.size, this.sizeUntil2);
        upd(p2.freeze, this.freezeUntil2);
    }

    _applyBoostGlow(padN) {
        this._clearBoostGlow(padN);
        const gfx = this.add.graphics().setDepth(2);
        if (padN === 1) this.boostGlow1 = gfx;
        else this.boostGlow2 = gfx;
    }

    _clearBoostGlow(padN) {
        const key = padN === 1 ? 'boostGlow1' : 'boostGlow2';
        if (this[key]) {
            this[key].destroy();
            this[key] = null;
        }
    }

    _drawBoostGlow(gfx, pad, color, dir, now) {
        gfx.clear();
        const pw = pad.displayWidth, ph = pad.displayHeight;
        const px = pad.x, py = pad.y;
        const pulse = 0.5 + 0.5 * Math.sin(now / 150);

        // Пульсирующий ореол цвета ракетки
        gfx.fillStyle(color, 0.07 + 0.13 * pulse);
        gfx.fillRect(px - pw / 2 - 14, py - ph / 2 - 8, pw + 28, ph + 16);
        gfx.fillStyle(color, 0.15 + 0.2 * pulse);
        gfx.fillRect(px - pw / 2 - 5, py - ph / 2 - 3, pw + 10, ph + 6);

        // Стримеры скорости в сторону соперника
        const N = 6;
        for (let i = 0; i < N; i++) {
            const oy = py - ph / 2 + (i + 0.5) * (ph / N);
            const phase = ((now / 220 + i * 0.31) % 1.0);
            const startX = dir > 0 ? px + pw / 2 : px - pw / 2;
            const len = (18 + 50 * phase) * Math.abs(dir);
            const alpha = (1 - phase) * (0.35 + 0.3 * pulse);
            gfx.lineStyle(1.5, color, alpha);
            gfx.lineBetween(startX, oy, startX + dir * len, oy);
        }
    }

    _applyFreezeEffect(padN) {
        this._clearFreezeEffect(padN);
        const gfx = this.add.graphics().setDepth(2);
        if (padN === 1) this.freezeGfx1 = gfx;
        else this.freezeGfx2 = gfx;
    }

    _clearFreezeEffect(padN) {
        const key = padN === 1 ? 'freezeGfx1' : 'freezeGfx2';
        if (this[key]) { this[key].destroy(); this[key] = null; }
    }

    _drawFreezeEffect(gfx, pad, now) {
        gfx.clear();
        const pw = pad.displayWidth, ph = pad.displayHeight;
        const px = pad.x, py = pad.y;
        const pulse = 0.5 + 0.5 * Math.sin(now / 180);
        const fastP = 0.5 + 0.5 * Math.sin(now / 90);
        const dir = px < this.dw / 2 ? 1 : -1;

        // Широкий внешний ореол
        gfx.fillStyle(0x4499ff, 0.05 + 0.07 * pulse);
        gfx.fillRect(px - pw / 2 - 22, py - ph / 2 - 14, pw + 44, ph + 28);

        // Средний ореол
        gfx.fillStyle(0x77ccff, 0.09 + 0.09 * pulse);
        gfx.fillRect(px - pw / 2 - 10, py - ph / 2 - 6, pw + 20, ph + 12);

        // Основной ледяной слой
        gfx.fillStyle(0x99eeff, 0.35 + 0.2 * pulse);
        gfx.fillRect(px - pw / 2, py - ph / 2, pw, ph);

        // Блик льда (яркая половина)
        gfx.fillStyle(0xffffff, 0.18 + 0.12 * fastP);
        gfx.fillRect(px - pw / 2 + 2, py - ph / 2 + 3, pw / 2, ph - 6);

        // Толстая светящаяся граница
        gfx.lineStyle(4, 0x88ccff, 0.55 + 0.3 * pulse);
        gfx.strokeRect(px - pw / 2 - 5, py - ph / 2 - 5, pw + 10, ph + 10);

        // Чёткая внутренняя граница
        gfx.lineStyle(2, 0xffffff, 0.6 + 0.3 * pulse);
        gfx.strokeRect(px - pw / 2 - 1, py - ph / 2 - 1, pw + 2, ph + 2);

        // Анимированные ледяные шипы в сторону
        const sideX = dir > 0 ? px + pw / 2 : px - pw / 2;
        const NS = 7;
        for (let i = 0; i < NS; i++) {
            const fy = py - ph / 2 + (i + 0.5) * (ph / NS);
            const phase = ((now / 480 + i * 0.21) % 1.0);
            const len = 6 + 22 * phase;
            const alpha = (1 - phase) * (0.55 + 0.3 * pulse);
            gfx.lineStyle(2, 0xaaddff, alpha);
            gfx.lineBetween(sideX, fy, sideX + dir * len, fy);
            gfx.lineStyle(1.2, 0xffffff, alpha * 0.8);
            gfx.lineBetween(sideX + dir * len, fy, sideX + dir * (len + 4), fy - 3);
            gfx.lineBetween(sideX + dir * len, fy, sideX + dir * (len + 4), fy + 3);
        }

        // Плавающие кристаллы внутри ракетки
        const NC = 6;
        for (let i = 0; i < NC; i++) {
            const fy = py - ph / 2 + (i + 0.5) * (ph / NC);
            const phase = ((now / 300 + i * 0.37) % 1.0);
            gfx.fillStyle(0xffffff, phase * 0.8);
            gfx.fillCircle(px + (i % 2 === 0 ? -2 : 2), fy, 2.5);
        }
    }

    _applySizeBoost(padN) {
        this._clearSizeBoost(padN);
        const pad = padN === 1 ? this.pad1 : this.pad2;
        this.tweens.killTweensOf(pad);
        pad.setScale(1, 1.6);
        // Таймер ставится ПОСЛЕ _clearSizeBoost — иначе тот его обнулит
        if (padN === 1) this.sizeUntil1 = this.time.now + 7000;
        else this.sizeUntil2 = this.time.now + 7000;
    }

    _clearSizeBoost(padN) {
        const key = padN === 1 ? 'sizeUntil1' : 'sizeUntil2';
        if (this[key] === 0) return;
        const pad = padN === 1 ? this.pad1 : this.pad2;
        this.tweens.killTweensOf(pad);
        pad.setScale(1, 1);
        this[key] = 0;
    }

    _showPickupLabel(x, y, type, color) {
        const LABELS = {
            speed: 'СКОРОСТЬ!',
            size: 'РАСШИРЕНИЕ!',
            freeze: 'ЗАМОРОЗКА!',
            fireball: 'ОГОНЬ!',
        };
        const colorHex = '#' + color.toString(16).padStart(6, '0');
        const isFire = type === 'fireball';

        const txt = this.add.text(x, y, LABELS[type] || '', {
            fontSize: isFire ? '52px' : '42px',
            color: colorHex,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5,
        }).setOrigin(0.5).setDepth(15).setScale(0.2).setAlpha(0);

        // Collect player label (small, below)
        const who = this.lastHitter === 1 ? 'Игрок 1' : 'Игрок 2';
        const sub = this.add.text(x, y + (isFire ? 34 : 28), who, {
            fontSize: '16px',
            color: colorHex,
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(15).setAlpha(0);

        // Pop in
        this.tweens.add({
            targets: txt,
            alpha: 1, scale: 1.1,
            duration: 190,
            ease: 'Back.Out',
            onComplete: () => {
                // Slight settle
                this.tweens.add({
                    targets: txt,
                    scale: 1.0,
                    duration: 100,
                    ease: 'Sine.Out',
                });
                // Float up + fade
                this.tweens.add({
                    targets: [txt, sub],
                    y: `-=${isFire ? 130 : 100}`,
                    alpha: 0,
                    duration: 950,
                    delay: 250,
                    ease: 'Sine.In',
                    onComplete: () => { txt.destroy(); sub.destroy(); },
                });
            },
        });

        this.tweens.add({
            targets: sub,
            alpha: 0.85,
            duration: 200,
            delay: 80,
        });
    }

    _destroyPickup() {
        this.tweens.killTweensOf(this.pickup.glow);
        this.tweens.killTweensOf(this.pickup.icon);
        this.tweens.killTweensOf(this.pickup.ring);
        this.pickup.glow.destroy();
        this.pickup.icon.destroy();
        this.pickup.ring.destroy();
        this.pickup = null;
    }

    _drawPickupIcon(gfx, type, color) {
        switch (type) {
            case 'speed': {
                // Lightning bolt
                gfx.fillStyle(color, 1);
                gfx.fillPoints([
                    { x: 5, y: -14 }, { x: 1, y: -2 }, { x: 9, y: -2 },
                    { x: -5, y: 14 }, { x: -1, y: 2 }, { x: -9, y: 2 },
                ], true);
                // Bright core
                gfx.fillStyle(0xffffff, 0.6);
                gfx.fillPoints([
                    { x: 3, y: -9 }, { x: 1, y: -1 }, { x: 5, y: -1 },
                    { x: -3, y: 9 }, { x: -1, y: 1 }, { x: -5, y: 1 },
                ], true);
                break;
            }
            case 'size': {
                // Double-ended arrow
                gfx.fillStyle(color, 1);
                gfx.fillTriangle(-9, -4, 9, -4, 0, -16); // up head
                gfx.fillTriangle(-9, 4, 9, 4, 0, 16); // down head
                gfx.fillRect(-3.5, -4, 7, 8);               // shaft
                gfx.fillStyle(0xffffff, 0.4);
                gfx.fillTriangle(-4, -4, 4, -4, 0, -10);
                gfx.fillTriangle(-4, 4, 4, 4, 0, 10);
                break;
            }
            case 'freeze': {
                // Snowflake: 6 arms + crossbars
                gfx.lineStyle(2.5, color, 1);
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                    const ex = Math.cos(a) * 13;
                    const ey = Math.sin(a) * 13;
                    gfx.lineBetween(0, 0, ex, ey);
                    // Crossbar at 55% of arm
                    const mx = Math.cos(a) * 8;
                    const my = Math.sin(a) * 8;
                    const tx = Math.cos(a + Math.PI / 2) * 4;
                    const ty = Math.sin(a + Math.PI / 2) * 4;
                    gfx.lineBetween(mx - tx, my - ty, mx + tx, my + ty);
                }
                gfx.fillStyle(color, 1);
                gfx.fillCircle(0, 0, 3);
                gfx.fillStyle(0xffffff, 0.7);
                gfx.fillCircle(0, 0, 1.5);
                break;
            }
            case 'fireball': {
                // 4-pointed star (outer — hot orange)
                gfx.fillStyle(color, 1);
                gfx.fillPoints([
                    { x: 0, y: -16 }, { x: 4, y: -4 },
                    { x: 16, y: 0 }, { x: 4, y: 4 },
                    { x: 0, y: 16 }, { x: -4, y: 4 },
                    { x: -16, y: 0 }, { x: -4, y: -4 },
                ], true);
                // Inner star (yellow hot core)
                gfx.fillStyle(0xffee00, 0.9);
                gfx.fillPoints([
                    { x: 0, y: -9 }, { x: 2, y: -2 },
                    { x: 9, y: 0 }, { x: 2, y: 2 },
                    { x: 0, y: 9 }, { x: -2, y: 2 },
                    { x: -9, y: 0 }, { x: -2, y: -2 },
                ], true);
                // White hot center
                gfx.fillStyle(0xffffff, 0.8);
                gfx.fillCircle(0, 0, 3);
                break;
            }
        }
    }

    // ── Bot AI ───────────────────────────────────────────────────────────────

    _getBotVelocity(speed, freezeMul) {
        const now = this.time.now;
        const { speedMul, errorRange, interval } = this._botParams;

        if (now >= this._botNextUpdate) {
            this._botNextUpdate = now + interval;
            this._botErrorOffset = Phaser.Math.Between(-errorRange, errorRange);

            if (this.ball.body.velocity.x > 50) {
                // Мяч летит к боту — выбрать цель
                this._botTargetY = (this._botDiff === 'hard' ? this._predictBallY() : this.ball.y)
                    + this._botErrorOffset;
            } else {
                // Мяч уходит — вернуться к центру
                this._botTargetY = this.dh / 2;
            }
            const ph2 = this.pad2.displayHeight / 2;
            this._botTargetY = Phaser.Math.Clamp(this._botTargetY, ph2, this.dh - ph2);
        }

        const delta = this._botTargetY - this.pad2.y;
        if (Math.abs(delta) < 2) return 0;
        const maxV = speed * speedMul * freezeMul;
        return Phaser.Math.Clamp(delta * 5, -maxV, maxV);
    }

    _predictBallY() {
        if (this.ball.body.velocity.x <= 0) return this.ball.y;
        let bx = this.ball.x, by = this.ball.y;
        let vx = this.ball.body.velocity.x, vy = this.ball.body.velocity.y;
        const targetX = this.pad2.x - this.PAD_W / 2;
        const br = this.ball.height / 2;
        const dt = 1 / 60;
        let steps = 0;
        while (bx < targetX && steps < 400) {
            bx += vx * dt; by += vy * dt; steps++;
            if (by <= br) { by = br + 1; vy = Math.abs(vy); }
            if (by >= this.dh - br) { by = this.dh - br - 1; vy = -Math.abs(vy); }
        }
        return by;
    }

    // ─────────────────────────────────────────────────────────────────────────

    _loadCoins() {
        let balance = 0;
        try { balance = parseInt(localStorage.getItem('pongCoins') || '0', 10) || 0; } catch (e) { }
        this._coinBalance = balance;
        this.registry.set('coins', balance);
    }

    _saveCoins() {
        try { localStorage.setItem('pongCoins', String(this._coinBalance)); } catch (e) { }
        this.registry.set('coins', this._coinBalance);
    }

    _buildCoinHUD() {
        const x = this.dw - 22, y = 28;
        const gfx = this.add.graphics().setDepth(8);
        gfx.fillStyle(0x886600, 1);
        gfx.fillCircle(x, y, 13);
        gfx.fillStyle(0xffcc00, 1);
        gfx.fillCircle(x, y, 11);
        gfx.fillStyle(0xffe066, 1);
        gfx.fillCircle(x - 3, y - 3, 5);
        gfx.fillStyle(0xaa7700, 0.9);
        gfx.fillTriangle(x, y - 5, x + 4, y + 1, x - 4, y + 1);
        gfx.fillTriangle(x - 3, y + 1, x + 3, y + 1, x, y + 6);
        this._coinHudGfx = gfx;
        this._coinText = this.add.text(x - 18, y, String(this._coinBalance), {
            fontSize: '26px', color: '#ffdd00', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(1, 0.5).setDepth(8);
    }

    _showGameFSPrompt() {
        const cx = this.dw / 2, cy = this.dh / 2;
        const D = 90;
        const els = [];
        els.push(this.add.rectangle(cx, cy, this.dw, this.dh, 0x000000, 0.97).setDepth(D).setInteractive());
        els.push(this.add.text(cx, cy - 90, '⛶', { fontSize: '72px', color: '#4488ff' }).setOrigin(0.5).setDepth(D + 1));
        els.push(this.add.text(cx, cy - 10, 'ПОЛНЫЙ ЭКРАН', { fontSize: '44px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(D + 1));
        els.push(this.add.text(cx, cy + 46, 'Игра поставлена на паузу.\nВернитесь в полный экран.', { fontSize: '24px', color: '#888888', align: 'center' }).setOrigin(0.5).setDepth(D + 1));
        const btn = this.add.text(cx, cy + 128, 'ВКЛЮЧИТЬ ПОЛНЫЙ ЭКРАН', {
            fontSize: '32px', color: '#ffdd44', backgroundColor: '#1a1100', padding: { x: 22, y: 12 }
        }).setOrigin(0.5).setDepth(D + 1).setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setStyle({ color: '#ffffff' }));
        btn.on('pointerout',  () => btn.setStyle({ color: '#ffdd44' }));
        btn.on('pointerdown', async () => {
            try {
                const el = document.documentElement;
                const req = el.requestFullscreen || el.webkitRequestFullscreen;
                if (req) await req.call(el, { navigationUI: 'hide' });
            } catch (e) {}
        });
        els.push(btn);
        const onFSChange = () => {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                els.forEach(e => e.destroy());
                this._fsBlocked = false;
                if (!this.paused) this.physics.resume();
                document.removeEventListener('fullscreenchange', onFSChange);
                document.removeEventListener('webkitfullscreenchange', onFSChange);
            }
        };
        document.addEventListener('fullscreenchange', onFSChange);
        document.addEventListener('webkitfullscreenchange', onFSChange);
        this.events.once('shutdown', () => {
            document.removeEventListener('fullscreenchange', onFSChange);
            document.removeEventListener('webkitfullscreenchange', onFSChange);
        });
    }

    _spawnCoin() {
        if (this.coin) return;
        const x = Phaser.Math.Between(this.dw * 0.2, this.dw * 0.8);
        const y = Phaser.Math.Between(80, this.dh - 80);
        const glow = this.add.circle(x, y, 26, 0xffcc00, 0.22).setDepth(3);
        const icon = this.add.graphics().setPosition(x, y).setDepth(4);
        this._drawCoinIcon(icon);
        [glow, icon].forEach(o => o.setScale(0));
        this.tweens.add({
            targets: [glow, icon], scale: 1, duration: 600, ease: 'Back.Out',
            onComplete: () => {
                if (!this.coin) return;
                this.tweens.add({ targets: [glow, icon], scale: 1.18, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
            },
        });
        this.coin = { x, y, radius: 26, gfx: icon, glow, expiresAt: this.time.now + 12000 };
    }

    _drawCoinIcon(gfx) {
        gfx.fillStyle(0x886600, 1);
        gfx.fillCircle(0, 0, 14);
        gfx.fillStyle(0xffcc00, 1);
        gfx.fillCircle(0, 0, 12);
        gfx.fillStyle(0xffe066, 1);
        gfx.fillCircle(-3, -3, 6);
        gfx.fillStyle(0xaa7700, 0.9);
        gfx.fillTriangle(0, -6, 5, 1, -5, 1);
        gfx.fillTriangle(-4, 1, 4, 1, 0, 6);
    }

    _collectCoin() {
        const { x, y } = this.coin;
        this._burst(x, y, 0xffcc00, 14);
        this._destroyCoin();
        this._coinBalance++;
        this._saveCoins();
        this._coinText.setText(String(this._coinBalance));
        this.snd.hover();
        this.cameras.main.flash(80, 255, 220, 0, false);
        this.tweens.add({
            targets: this._coinText, scaleX: 1.7, scaleY: 1.7, duration: 130, ease: 'Back.Out',
            onComplete: () => this.tweens.add({ targets: this._coinText, scaleX: 1, scaleY: 1, duration: 220, ease: 'Sine.Out' }),
        });
        const lbl = this.add.text(x, y, '+1 ¢', {
            fontSize: '40px', color: '#ffdd00', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(15);
        this.tweens.add({
            targets: lbl, y: y - 90, alpha: 0, duration: 950, delay: 100, ease: 'Sine.In',
            onComplete: () => lbl.destroy(),
        });
    }

    _destroyCoin() {
        if (!this.coin) return;
        this.tweens.killTweensOf(this.coin.gfx);
        this.tweens.killTweensOf(this.coin.glow);
        this.coin.gfx.destroy();
        this.coin.glow.destroy();
        this.coin = null;
    }

    _togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        if (this.paused) {
            this.physics.world.pause();
            this.tweens.pauseAll();
            if (!this.pauseElements) {
                this._buildPauseOverlay();
            } else {
                this.pauseElements.forEach(e => e.setVisible(true));
                const soundOn = this.registry.get('soundOn') ?? true;
                this.soundBtn.setText(soundOn ? 'Звук: ВКЛ' : 'Звук: ВЫКЛ');
            }
        } else {
            this.physics.world.resume();
            this.tweens.resumeAll();
            this.pauseElements.forEach(e => e.setVisible(false));
        }
    }

    _buildPauseOverlay() {
        const cx = this.dw / 2, cy = this.dh / 2;

        const bg = this.add.rectangle(cx, cy, this.dw, this.dh, 0x000000, 0.68)
            .setDepth(20).setInteractive()
            .on('pointerdown', () => this._togglePause());

        const panel = this.add.rectangle(cx, cy + 10, 500, 460, 0x111122, 0.96)
            .setStrokeStyle(2, 0x334466).setDepth(21).setInteractive();

        const title = this.add.text(cx, cy - 170, 'ПАУЗА', {
            fontSize: '72px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(22);

        const soundOn = this.registry.get('soundOn') ?? true;
        this.soundBtn = this.add.text(cx, cy - 48, soundOn ? 'Звук: ВКЛ' : 'Звук: ВЫКЛ', {
            fontSize: '40px', color: '#ffffff',
            backgroundColor: '#2a2a44',
            padding: { x: 28, y: 14 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(22);

        this.soundBtn.on('pointerover', () => { this.soundBtn.setStyle({ color: '#ffdd00' }); this.snd.hover(); });
        this.soundBtn.on('pointerout', () => this.soundBtn.setStyle({ color: '#ffffff' }));
        this.soundBtn.on('pointerdown', () => {
            const cur = this.registry.get('soundOn') ?? true;
            this.registry.set('soundOn', !cur);
            this.soundBtn.setText(!cur ? 'Звук: ВКЛ' : 'Звук: ВЫКЛ');
            this.snd.syncVolume();
        });

        const resumeBtn = this.add.text(cx, cy + 80, 'ПРОДОЛЖИТЬ', {
            fontSize: '46px', color: '#44ff88', fontStyle: 'bold',
            backgroundColor: '#003322',
            padding: { x: 32, y: 16 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(22);

        resumeBtn.on('pointerover', () => { resumeBtn.setStyle({ color: '#aaffcc' }); this.snd.hover(); });
        resumeBtn.on('pointerout', () => resumeBtn.setStyle({ color: '#44ff88' }));
        resumeBtn.on('pointerdown', () => this._togglePause());

        const menuBtn = this.add.text(cx, cy + 186, 'В МЕНЮ', {
            fontSize: '34px', color: '#888888',
            backgroundColor: '#1e1e1e',
            padding: { x: 26, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(22);

        menuBtn.on('pointerover', () => { menuBtn.setStyle({ color: '#ff8888' }); this.snd.hover(); });
        menuBtn.on('pointerout', () => menuBtn.setStyle({ color: '#888888' }));
        menuBtn.on('pointerdown', () => this.scene.start('StartScene'));

        this.pauseElements = [bg, panel, title, this.soundBtn, resumeBtn, menuBtn];
    }
}
