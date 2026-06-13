import SoundManager from './SoundManager.js';

const DEFAULT_UNLOCKED = ['ball', 'ball2', 'ball3', 'field_default', 'trail_1'];

const SHOP_BALLS = [
    { key: 'ball',   name: 'Пинг-понг', price: 0  },
    { key: 'ball2',  name: 'Звезда',    price: 0  },
    { key: 'ball3',  name: 'Огонь',     price: 0  },
    { key: 'ball4',  name: 'Снежинка',  price: 10 },
    { key: 'ball5',  name: 'Монета',    price: 20 },
    { key: 'ball6',  name: 'Сердце',    price: 15 },
    { key: 'ball7',  name: 'Бомба',     price: 25 },
    { key: 'ball8',  name: 'Футбол',    price: 18 },
    { key: 'ball9',  name: 'Баскет',    price: 12 },
    { key: 'ball10', name: 'Кристалл',  price: 22 },
];

const SHOP_FIELDS = [
    { key: 'field_default', name: 'Стандарт', price: 0,  bg: 0x080808, c1: 0x4488ff, c2: 0xff4444 },
    { key: 'field_night',   name: 'Ночь',     price: 8,  bg: 0x020208, c1: 0x2266dd, c2: 0xaa22ff },
    { key: 'field_sunset',  name: 'Закат',    price: 12, bg: 0x0a0408, c1: 0xff8800, c2: 0xff3366 },
    { key: 'field_neon',    name: 'Неон',     price: 15, bg: 0x050510, c1: 0x00ffcc, c2: 0xff00aa },
    { key: 'field_sky',     name: 'Небо',     price: 10, bg: 0x1e4a8c, c1: 0xffffff, c2: 0xffdd22 },
    { key: 'field_mint',    name: 'Мята',     price: 14, bg: 0x0d4030, c1: 0xffee44, c2: 0xff3366 },
    { key: 'field_coral',   name: 'Коралл',   price: 16, bg: 0x4a2010, c1: 0x44ddff, c2: 0xeeff44 },
    { key: 'field_violet',  name: 'Фиолет',   price: 18, bg: 0x2a0a55, c1: 0x44ffcc, c2: 0xffdd22 },
];

// Хвосты — name можно менять, ключи trail_1..trail_4 совпадают с TRAIL_PRESETS в GameScene
const SHOP_TRAILS = [
    { key: 'trail_1', name: 'Обычный',   price: 0  },
    { key: 'trail_2', name: 'Вьющийся',  price: 15 },
    { key: 'trail_3', name: 'Большой',   price: 20 },
    { key: 'trail_4', name: 'Длинный',   price: 25 },
];

export default class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
    }

    preload() {
        this.load.image('player', 'assets/player.png');
        this.load.image('ball',   'assets/ball.png');
        this.load.image('ball2',  'assets/ball2.png');
        this.load.image('ball3',  'assets/ball3.png');
        this.load.image('ball4',  'assets/ball4.png');
        this.load.image('ball5',  'assets/ball5.png');
    }

    create() {
        this.dw = this.scale.width;
        this.dh = this.scale.height;
        const cx = this.dw / 2, cy = this.dh / 2;

        const C1 = 0x4488ff;
        const C2 = 0xff4444;
        this.C1 = C1; this.C2 = C2;

        // Фон
        this.add.rectangle(cx, cy, this.dw, this.dh, 0x080808);
        this.add.rectangle(this.dw * 0.25, cy, this.dw / 2, this.dh, C1).setAlpha(0.1);
        this.add.rectangle(this.dw * 0.75, cy, this.dw / 2, this.dh, C2).setAlpha(0.1);

        const lineGfx = this.add.graphics();
        lineGfx.lineStyle(2, 0xffffff, 0.1);
        for (let y = 0; y < this.dh; y += 24) {
            lineGfx.lineBetween(cx, y, cx, y + 12);
        }

        // Параметры ракеток
        this.PAD_W = 14;
        this.PAD_H = 180;
        const PAD_MARGIN = 24;
        this.P1X = PAD_MARGIN + this.PAD_W / 2;
        this.P2X = this.dw - PAD_MARGIN - this.PAD_W / 2;

        // Хвосты
        this.trailGfx = this.add.graphics();
        this.ballTrail = [];
        this.pad1TrailGfx = this.add.graphics();
        this.pad2TrailGfx = this.add.graphics();
        this.pad1Trail = [];
        this.pad2Trail = [];
        this._padTick = 0;

        // Визуальные объекты
        this.aiPad1 = this.add.rectangle(this.P1X, cy, this.PAD_W, this.PAD_H, C1);
        this.aiPad2 = this.add.rectangle(this.P2X, cy, this.PAD_W, this.PAD_H, C2);
        this.aiBall = this.add.image(cx, cy, 'ball');

        // Состояние мяча
        this.p1y = cy;
        this.p2y = cy;
        this.BALL_SPEED = 684;
        this.BALL_MAX   = 950;
        this.AI_SPEED   = 780;
        this._aim1 = 0;
        this._aim2 = 0;
        this._resetBall(cx, cy);

        // Затемнение за меню
        this.add.rectangle(cx, cy + 6, 540, 790, 0x000000).setAlpha(0.72).setDepth(5);

        // Заголовок
        this.add.text(cx, cy - 272, 'PONG', {
            fontSize: '120px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6);

        this._botDiff = null;
        this._selectedField = (() => { try { return localStorage.getItem('pongField') || 'field_default'; } catch(e) { return 'field_default'; } })();
        this._selectedTrail = (() => { try { return localStorage.getItem('pongTrail') || 'trail_1'; } catch(e) { return 'trail_1'; } })();

        // Кнопки выбора мода
        this._makeButton(cx, cy - 148, 'КЛАССИКА', 0x1d6b0a, 0x4caf50, 0,
            () => { this._botDiff = null; this._showSpeedPanel(cx, cy, 'classic'); });

        this._makeButton(cx, cy + 2, 'С ФИЧАМИ', 0x0a1a4a, 0x4488ff, 80,
            () => { this._botDiff = null; this._showSpeedPanel(cx, cy, 'features'); });

        this._makeButton(cx, cy + 152, 'ПРОТИВ БОТА', 0x14082a, 0x9944ff, 160,
            () => this._showBotPanel(cx, cy));

        // Подсказка управления — внизу экрана
        this.add.text(cx, this.dh - 14, 'W / S  —  Игрок 1     ↑ / ↓  —  Игрок 2', {
            fontSize: '26px', color: '#333333'
        }).setOrigin(0.5, 1).setDepth(6);

        // Чекбокс ускорения мяча
        this._accelOn = true;
        const AY = cy + 235;
        const boxGfx = this.add.graphics().setDepth(7);
        const checkMark = this.add.text(cx - 129, AY, '✓', {
            fontSize: '20px', color: '#88ff88'
        }).setOrigin(0.5).setDepth(8).setVisible(true);
        const accelLabel = this.add.text(cx - 110, AY, 'ускорение мяча', {
            fontSize: '28px', color: '#666666'
        }).setOrigin(0, 0.5).setDepth(7);

        const _redrawBox = () => {
            boxGfx.clear();
            boxGfx.fillStyle(this._accelOn ? 0x225522 : 0x1a1a1a, 1);
            boxGfx.fillRoundedRect(cx - 146, AY - 13, 26, 26, 4);
            boxGfx.lineStyle(2, this._accelOn ? 0x44aa44 : 0x444444, 1);
            boxGfx.strokeRoundedRect(cx - 146, AY - 13, 26, 26, 4);
        };
        _redrawBox();

        const accelZone = this.add.zone(cx - 20, AY, 320, 44).setDepth(8)
            .setInteractive({ useHandCursor: true });
        accelZone.on('pointerover', () => {
            accelLabel.setStyle({ color: '#aaaaaa' });
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });
        accelZone.on('pointerout', () => accelLabel.setStyle({ color: '#666666' }));
        accelZone.on('pointerdown', () => {
            this._accelOn = !this._accelOn;
            _redrawBox();
            checkMark.setVisible(this._accelOn);
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });

        // Чекбокс хвоста мяча
        this._trailOn = true;
        const TY = cy + 280;
        const trailBoxGfx = this.add.graphics().setDepth(7);
        const trailCheck = this.add.text(cx - 129, TY, '✓', {
            fontSize: '20px', color: '#88ccff'
        }).setOrigin(0.5).setDepth(8).setVisible(true);
        const trailLabel = this.add.text(cx - 110, TY, 'хвост мяча', {
            fontSize: '28px', color: '#666666'
        }).setOrigin(0, 0.5).setDepth(7);

        const _redrawTrailBox = () => {
            trailBoxGfx.clear();
            trailBoxGfx.fillStyle(this._trailOn ? 0x1a2a44 : 0x1a1a1a, 1);
            trailBoxGfx.fillRoundedRect(cx - 146, TY - 13, 26, 26, 4);
            trailBoxGfx.lineStyle(2, this._trailOn ? 0x4488cc : 0x444444, 1);
            trailBoxGfx.strokeRoundedRect(cx - 146, TY - 13, 26, 26, 4);
        };
        _redrawTrailBox();

        const trailZone = this.add.zone(cx - 20, TY, 320, 44).setDepth(8)
            .setInteractive({ useHandCursor: true });
        trailZone.on('pointerover', () => {
            trailLabel.setStyle({ color: '#aaaaaa' });
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });
        trailZone.on('pointerout', () => trailLabel.setStyle({ color: '#666666' }));
        trailZone.on('pointerdown', () => {
            this._trailOn = !this._trailOn;
            _redrawTrailBox();
            trailCheck.setVisible(this._trailOn);
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });

        this._buildSettingsBtn(cx, cy);
        this._buildInfoBtn(cx, cy);
        this._buildShopBtn(cx, cy);
        this._buildCoinDisplay();

        // Звук — инициализируем если ещё нет
        if (!this.registry.get('snd')) this.registry.set('snd', new SoundManager(this.registry));
        const snd = this.registry.get('snd');
        snd.startMusic('menu');
        this.events.on('shutdown', () => snd.stopMusic());

        // Полноэкранный режим обязателен на мобильных
        const _isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (_isMobile) {
            const _onFSExit = () => {
                if (!document.fullscreenElement && !document.webkitFullscreenElement && !this._fsPromptActive) {
                    this._showFullscreenPrompt(cx, cy);
                }
            };
            document.addEventListener('fullscreenchange', _onFSExit);
            document.addEventListener('webkitfullscreenchange', _onFSExit);
            this.events.once('shutdown', () => {
                document.removeEventListener('fullscreenchange', _onFSExit);
                document.removeEventListener('webkitfullscreenchange', _onFSExit);
            });
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                this._showFullscreenPrompt(cx, cy);
            }
        }
    }

    _showFullscreenPrompt(cx, cy) {
        this._fsPromptActive = true;
        const D = 60;
        const els = [];

        // Непрозрачный блокирующий фон
        els.push(
            this.add.rectangle(cx, cy, this.dw, this.dh, 0x000000, 0.97)
                .setDepth(D).setInteractive()
        );

        const iconTxt = this.add.text(cx, cy - 110, '⛶', {
            fontSize: '80px', color: '#4488ff'
        }).setOrigin(0.5).setDepth(D + 1);

        const titleTxt = this.add.text(cx, cy - 22, 'ПОЛНЫЙ ЭКРАН', {
            fontSize: '44px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(D + 1);

        const descTxt = this.add.text(cx, cy + 36, 'Для игры требуется\nполноэкранный режим', {
            fontSize: '26px', color: '#888888', align: 'center'
        }).setOrigin(0.5).setDepth(D + 1);

        const btn = this.add.text(cx, cy + 128, 'ВКЛЮЧИТЬ ПОЛНЫЙ ЭКРАН', {
            fontSize: '34px', color: '#ffdd44',
            backgroundColor: '#1a1100',
            padding: { x: 24, y: 14 }
        }).setOrigin(0.5).setDepth(D + 1).setInteractive({ useHandCursor: true });

        const errTxt = this.add.text(cx, cy + 210, '', {
            fontSize: '22px', color: '#ff6666', align: 'center'
        }).setOrigin(0.5).setDepth(D + 1);

        els.push(iconTxt, titleTxt, descTxt, btn, errTxt);

        const tryFS = async () => {
            errTxt.setText('');
            try {
                const el = document.documentElement;
                const req = el.requestFullscreen || el.webkitRequestFullscreen;
                if (req) {
                    await req.call(el, { navigationUI: 'hide' });
                } else {
                    errTxt.setText('Браузер не поддерживает полный экран.\nДобавьте сайт на главный экран.');
                }
            } catch (e) {
                errTxt.setText('Разрешите полный экран и нажмите снова.');
            }
        };

        btn.on('pointerover', () => btn.setStyle({ color: '#ffffff' }));
        btn.on('pointerout',  () => btn.setStyle({ color: '#ffdd44' }));
        btn.on('pointerdown', tryFS);

        const onFSChange = () => {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                els.forEach(e => e.destroy());
                this._fsPromptActive = false;
                document.removeEventListener('fullscreenchange', onFSChange);
                document.removeEventListener('webkitfullscreenchange', onFSChange);
            }
        };
        document.addEventListener('fullscreenchange', onFSChange);
        document.addEventListener('webkitfullscreenchange', onFSChange);
        this.events.once('shutdown', () => {
            this._fsPromptActive = false;
            document.removeEventListener('fullscreenchange', onFSChange);
            document.removeEventListener('webkitfullscreenchange', onFSChange);
        });
    }

    _makeButton(x, y, label, fillColor, strokeColor, delay, onClick) {
        const BW = 340, BH = 100;
        // bg и txt — чисто визуальные, не интерактивные
        const bg = this.add.rectangle(x, y, BW, BH, fillColor)
            .setStrokeStyle(3, strokeColor).setDepth(6);
        const txt = this.add.text(x, y, label, {
            fontSize: '52px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(7);
        // Zone — прозрачный слой поверх, принимает все события
        const zone = this.add.zone(x, y, BW + 10, BH + 10)
            .setDepth(8).setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            bg.setScale(1.1); txt.setScale(1.1);
            bg.setStrokeStyle(5, strokeColor);
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });
        zone.on('pointerout', () => {
            bg.setScale(1); txt.setScale(1);
            bg.setStrokeStyle(3, strokeColor);
        });
        zone.on('pointerdown', () => {
            const snd = this.registry.get('snd'); if (snd) snd.hover();
            bg.setScale(0.93); txt.setScale(0.93);
            this.time.delayedCall(110, () => onClick());
        });

        bg.setScale(0); txt.setScale(0); zone.setScale(0);
        this.tweens.add({ targets: [bg, txt, zone], scale: 1, duration: 500, ease: 'Back.Out', delay });
    }

    _showSpeedPanel(cx, cy, mode) {
        if (this.speedPanelOpen) return;
        this.speedPanelOpen = true;

        const elems = [];

        const backdrop = this.add.rectangle(cx, cy, this.dw, this.dh, 0x000000, 0.78)
            .setDepth(10).setInteractive();
        elems.push(backdrop);

        const panel = this.add.rectangle(cx, cy + 24, 520, 630, 0x080d18, 0.97)
            .setStrokeStyle(2, 0x1e3566).setDepth(11).setInteractive();
        elems.push(panel);

        const modeLabel = mode === 'classic' ? 'КЛАССИКА' : 'С ФИЧАМИ';
        const title = this.add.text(cx, cy - 272, 'ВЫБЕРИ СКОРОСТЬ', {
            fontSize: '54px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(12);
        elems.push(title);

        const sub = this.add.text(cx, cy - 208, modeLabel, {
            fontSize: '38px', color: '#446688'
        }).setOrigin(0.5).setDepth(12);
        elems.push(sub);

        const speeds = [
            { label: 'СПОКОЙНАЯ',     key: 'calm',     fill: 0x0a2a0a, stroke: 0x3a9a3a, desc: 'расслабленный темп' },
            { label: 'БЫСТРАЯ',       key: 'fast',      fill: 0x0a1840, stroke: 0x4488ff, desc: 'стандартная игра'   },
            { label: 'ОЧЕНЬ БЫСТРАЯ', key: 'veryfast',  fill: 0x2a0800, stroke: 0xff6600, desc: 'для опытных'        },
        ];

        speeds.forEach((s, i) => {
            const by = cy - 104 + i * 126;
            const BW = 440, BH = 100;
            const bg = this.add.rectangle(cx, by, BW, BH, s.fill)
                .setStrokeStyle(2.5, s.stroke).setDepth(12);
            const lbl = this.add.text(cx, by - 16, s.label, {
                fontSize: '52px', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(13);
            const desc = this.add.text(cx, by + 34, s.desc, {
                fontSize: '30px', color: '#556677'
            }).setOrigin(0.5).setDepth(13);
            const zone = this.add.zone(cx, by, BW + 10, BH + 10).setDepth(14)
                .setInteractive({ useHandCursor: true });

            zone.on('pointerover', () => {
                bg.setScale(1.05); lbl.setScale(1.05); desc.setScale(1.05);
                const snd = this.registry.get('snd'); if (snd) snd.hover();
            });
            zone.on('pointerout', () => { bg.setScale(1); lbl.setScale(1); desc.setScale(1); });
            zone.on('pointerdown', () => {
                const snd = this.registry.get('snd'); if (snd) snd.hover();
                bg.setScale(0.94); lbl.setScale(0.94); desc.setScale(0.94);
                this.time.delayedCall(110, () => {
                    elems.forEach(e => e.destroy());
                    this.speedPanelOpen = false;
                    this.scene.start('GameScene', { mode, speed: s.key, botDiff: this._botDiff, accel: this._accelOn, trail: this._trailOn, field: this._selectedField, trailKey: this._selectedTrail });
                });
            });

            elems.push(bg, lbl, desc, zone);
            bg.setScale(0); lbl.setScale(0); desc.setScale(0); zone.setScale(0);
            this.tweens.add({ targets: [bg, lbl, desc, zone], scale: 1, duration: 300, ease: 'Back.Out', delay: i * 65 });
        });

        const backBtn = this.add.text(cx, cy + 276, '← НАЗАД', {
            fontSize: '40px', color: '#445566',
            backgroundColor: '#0d131e',
            padding: { x: 20, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(12);
        backBtn.on('pointerover', () => {
            backBtn.setStyle({ color: '#aabbcc' });
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });
        backBtn.on('pointerout',  () => backBtn.setStyle({ color: '#445566' }));
        backBtn.on('pointerdown', () => {
            elems.forEach(e => e.destroy());
            this.speedPanelOpen = false;
            if (this._botDiff !== null) this._showBotPanel(cx, cy);
        });
        elems.push(backBtn);
    }

    _showBotPanel(cx, cy) {
        if (this.botPanelOpen) return;
        this.botPanelOpen = true;

        const elems = [];

        const backdrop = this.add.rectangle(cx, cy, this.dw, this.dh, 0x000000, 0.78)
            .setDepth(10).setInteractive();
        elems.push(backdrop);

        const panel = this.add.rectangle(cx, cy + 14, 520, 580, 0x080d18, 0.97)
            .setStrokeStyle(2, 0x6622aa).setDepth(11).setInteractive();
        elems.push(panel);

        const title = this.add.text(cx, cy - 262, 'ПРОТИВ БОТА', {
            fontSize: '54px', color: '#cc88ff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(12);
        elems.push(title);

        const sub = this.add.text(cx, cy - 200, 'Выбери сложность', {
            fontSize: '36px', color: '#554466'
        }).setOrigin(0.5).setDepth(12);
        elems.push(sub);

        const diffs = [
            { label: 'СЛАБЫЙ',   key: 'easy',   fill: 0x0a2a0a, stroke: 0x3a9a3a, desc: 'почти не двигается' },
            { label: 'СРЕДНИЙ',  key: 'medium',  fill: 0x0a1840, stroke: 0x4488ff, desc: 'стандартный соперник' },
            { label: 'СИЛЬНЫЙ',  key: 'hard',    fill: 0x2a0828, stroke: 0xcc44ff, desc: 'предсказывает траекторию' },
        ];

        diffs.forEach((d, i) => {
            const by = cy - 96 + i * 124;
            const BW = 440, BH = 96;
            const bg = this.add.rectangle(cx, by, BW, BH, d.fill)
                .setStrokeStyle(2.5, d.stroke).setDepth(12);
            const lbl = this.add.text(cx, by - 14, d.label, {
                fontSize: '50px', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(13);
            const desc = this.add.text(cx, by + 32, d.desc, {
                fontSize: '28px', color: '#556677'
            }).setOrigin(0.5).setDepth(13);
            const zone = this.add.zone(cx, by, BW + 10, BH + 10).setDepth(14)
                .setInteractive({ useHandCursor: true });

            zone.on('pointerover', () => {
                bg.setScale(1.05); lbl.setScale(1.05); desc.setScale(1.05);
                const snd = this.registry.get('snd'); if (snd) snd.hover();
            });
            zone.on('pointerout', () => { bg.setScale(1); lbl.setScale(1); desc.setScale(1); });
            zone.on('pointerdown', () => {
                const snd = this.registry.get('snd'); if (snd) snd.hover();
                bg.setScale(0.94); lbl.setScale(0.94); desc.setScale(0.94);
                this._botDiff = d.key;
                this.time.delayedCall(110, () => {
                    elems.forEach(e => e.destroy());
                    this.botPanelOpen = false;
                    this._showSpeedPanel(cx, cy, 'features');
                });
            });

            elems.push(bg, lbl, desc, zone);
            bg.setScale(0); lbl.setScale(0); desc.setScale(0); zone.setScale(0);
            this.tweens.add({ targets: [bg, lbl, desc, zone], scale: 1, duration: 300, ease: 'Back.Out', delay: i * 65 });
        });

        const backBtn = this.add.text(cx, cy + 268, '← НАЗАД', {
            fontSize: '40px', color: '#445566',
            backgroundColor: '#0d131e',
            padding: { x: 20, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(12);
        backBtn.on('pointerover', () => {
            backBtn.setStyle({ color: '#aabbcc' });
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });
        backBtn.on('pointerout',  () => backBtn.setStyle({ color: '#445566' }));
        backBtn.on('pointerdown', () => {
            elems.forEach(e => e.destroy());
            this.botPanelOpen = false;
            this._botDiff = null;
        });
        elems.push(backBtn);
    }

    _showBallPanel(cx, cy, mode, speed) {
        if (this.ballPanelOpen) return;
        this.ballPanelOpen = true;

        const BALLS = ['ball', 'ball2', 'ball3', 'ball4', 'ball5'];
        let selected = this.registry.get('ballKey') || 'ball';
        const elems  = [];

        const backdrop = this.add.rectangle(cx, cy, this.dw, this.dh, 0x000000, 0.78)
            .setDepth(13).setInteractive();
        elems.push(backdrop);

        const panel = this.add.rectangle(cx, cy + 14, 760, 470, 0x080d18, 0.97)
            .setStrokeStyle(2, 0x1e3566).setDepth(14).setInteractive();
        elems.push(panel);

        const title = this.add.text(cx, cy - 200, 'ВЫБЕРИ МЯЧ', {
            fontSize: '54px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(15);
        elems.push(title);

        const BSIZE    = 106;
        const SPACING  = 140;
        const startX   = cx - SPACING * 2;
        const ballY    = cy + 4;

        const selGfx = this.add.graphics().setDepth(14);
        elems.push(selGfx);

        const drawSel = (bx) => {
            selGfx.clear();
            selGfx.fillStyle(0x4499ff, 0.12);
            selGfx.fillCircle(bx, ballY, BSIZE / 2 + 14);
            selGfx.lineStyle(3, 0x66aaff, 1);
            selGfx.strokeCircle(bx, ballY, BSIZE / 2 + 14);
        };
        drawSel(startX + BALLS.indexOf(selected) * SPACING);

        BALLS.forEach((key, i) => {
            const bx = startX + i * SPACING;
            const img = this.add.image(bx, ballY, key)
                .setDisplaySize(BSIZE, BSIZE)
                .setInteractive({ useHandCursor: true })
                .setDepth(15);
            img.on('pointerover', () => { const s = this.registry.get('snd'); if (s) s.hover(); });
            img.on('pointerdown', () => {
                selected = key;
                drawSel(bx);
                const s = this.registry.get('snd'); if (s) s.hover();
            });
            elems.push(img);
        });

        const startBtn = this.add.text(cx, cy + 146, 'ИГРАТЬ →', {
            fontSize: '62px', color: '#ffffff', fontStyle: 'bold',
            backgroundColor: '#0a2a6a',
            padding: { x: 36, y: 18 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(15);
        startBtn.on('pointerover', () => {
            startBtn.setStyle({ color: '#ffdd00' });
            const s = this.registry.get('snd'); if (s) s.hover();
        });
        startBtn.on('pointerout', () => startBtn.setStyle({ color: '#ffffff' }));
        startBtn.on('pointerdown', () => {
            this.registry.set('ballKey', selected);
            elems.forEach(e => e.destroy());
            this.ballPanelOpen = false;
            this.scene.start('GameScene', { mode, speed, botDiff: this._botDiff, accel: this._accelOn, field: this._selectedField, trailKey: this._selectedTrail });
        });
        elems.push(startBtn);

        const backBtn = this.add.text(cx, cy + 218, '← НАЗАД', {
            fontSize: '38px', color: '#445566',
            backgroundColor: '#0d131e',
            padding: { x: 20, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(15);
        backBtn.on('pointerover', () => {
            backBtn.setStyle({ color: '#aabbcc' });
            const s = this.registry.get('snd'); if (s) s.hover();
        });
        backBtn.on('pointerout', () => backBtn.setStyle({ color: '#445566' }));
        backBtn.on('pointerdown', () => {
            elems.forEach(e => e.destroy());
            this.ballPanelOpen = false;
            this._showSpeedPanel(cx, cy, mode);
        });
        elems.push(backBtn);
    }

    _buildSettingsBtn(cx, cy) {
        const lbl = this.add.text(cx - 232, cy + 338, 'НАСТРОЙКИ', {
            fontSize: '32px', color: '#666666',
            backgroundColor: '#111111',
            padding: { x: 14, y: 9 }
        }).setOrigin(0.5).setDepth(6);
        const zone = this.add.zone(cx - 232, cy + 338, 262, 68).setDepth(7)
            .setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            lbl.setStyle({ color: '#ffffff' }); lbl.setScale(1.08);
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });
        zone.on('pointerout', () => { lbl.setStyle({ color: '#666666' }); lbl.setScale(1); });
        zone.on('pointerdown', () => {
            const snd = this.registry.get('snd'); if (snd) snd.hover();
            lbl.setScale(0.92);
            this.time.delayedCall(110, () => { lbl.setScale(1); this._openSettings(cx, cy); });
        });

        lbl.setScale(0); zone.setScale(0);
        this.tweens.add({ targets: [lbl, zone], scale: 1, duration: 500, ease: 'Back.Out', delay: 200 });
    }

    _openSettings(cx, cy) {
        if (this.settingsOpen) return;
        this.settingsOpen = true;

        const backdrop = this.add.rectangle(cx, cy, this.dw, this.dh, 0x000000, 0.7)
            .setDepth(15).setInteractive()
            .on('pointerdown', () => closePanel());

        const panel = this.add.rectangle(cx, cy, 500, 420, 0x111122, 0.95)
            .setStrokeStyle(2, 0x334477).setDepth(16).setInteractive();

        const title = this.add.text(cx, cy - 166, 'НАСТРОЙКИ', {
            fontSize: '54px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(17);

        const soundOn = this.registry.get('soundOn') ?? true;
        const soundBtn = this.add.text(cx, cy + 8, soundOn ? 'Звук: ВКЛ' : 'Звук: ВЫКЛ', {
            fontSize: '48px', color: '#ffffff',
            backgroundColor: '#333344',
            padding: { x: 28, y: 16 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(17);

        soundBtn.on('pointerover', () => {
            soundBtn.setStyle({ color: '#ffdd00' });
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });
        soundBtn.on('pointerout',  () => soundBtn.setStyle({ color: '#ffffff' }));
        soundBtn.on('pointerdown', () => {
            const cur = this.registry.get('soundOn') ?? true;
            this.registry.set('soundOn', !cur);
            soundBtn.setText(!cur ? 'Звук: ВКЛ' : 'Звук: ВЫКЛ');
            const snd = this.registry.get('snd');
            if (snd) snd.syncVolume();
        });

        const closeBtn = this.add.text(cx, cy + 154, 'ЗАКРЫТЬ', {
            fontSize: '40px', color: '#888888',
            backgroundColor: '#222222',
            padding: { x: 22, y: 14 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(17);

        closeBtn.on('pointerover', () => {
            closeBtn.setStyle({ color: '#ffffff' });
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });
        closeBtn.on('pointerout',  () => closeBtn.setStyle({ color: '#888888' }));
        closeBtn.on('pointerdown', () => closePanel());

        const elements = [backdrop, panel, title, soundBtn, closeBtn];

        const closePanel = () => {
            if (!this.settingsOpen) return;
            this.settingsOpen = false;
            elements.forEach(e => e.destroy());
        };
    }

    _buildInfoBtn(cx, cy) {
        const lbl = this.add.text(cx + 232, cy + 338, 'ПРАВИЛА', {
            fontSize: '32px', color: '#666666',
            backgroundColor: '#111111',
            padding: { x: 14, y: 9 }
        }).setOrigin(0.5).setDepth(6);
        const zone = this.add.zone(cx + 232, cy + 338, 218, 68).setDepth(7)
            .setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            lbl.setStyle({ color: '#ffffff' }); lbl.setScale(1.08);
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });
        zone.on('pointerout', () => { lbl.setStyle({ color: '#666666' }); lbl.setScale(1); });
        zone.on('pointerdown', () => {
            const snd = this.registry.get('snd'); if (snd) snd.hover();
            lbl.setScale(0.92);
            this.time.delayedCall(110, () => { lbl.setScale(1); this._openInfo(cx, cy); });
        });

        lbl.setScale(0); zone.setScale(0);
        this.tweens.add({ targets: [lbl, zone], scale: 1, duration: 500, ease: 'Back.Out', delay: 300 });
    }

    _openInfo(cx, cy) {
        if (this.infoOpen) return;
        this.infoOpen = true;

        const PW = 820, PH = 740;
        const TL = cx - PW / 2 + 36;
        const elems = [];

        const backdrop = this.add.rectangle(cx, cy, this.dw, this.dh, 0x000000, 0.84)
            .setDepth(15).setInteractive().on('pointerdown', () => close());
        const panel = this.add.rectangle(cx, cy - 10, PW, PH, 0x080d18, 0.97)
            .setStrokeStyle(2, 0x1e3566).setDepth(16).setInteractive();
        elems.push(backdrop, panel);

        const D = 17;
        const t = (x, y, str, style) => {
            const obj = this.add.text(x, y, str, style).setDepth(D);
            elems.push(obj);
            return obj;
        };

        t(cx, cy - 348, 'КАК ИГРАТЬ', {
            fontSize: '50px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        t(cx, cy - 290, 'Игрок 1: W / S     |     Игрок 2: ↑ / ↓     |     Пауза: Пробел', {
            fontSize: '24px', color: '#3d4f60'
        }).setOrigin(0.5, 0);

        t(TL, cy - 252, 'КЛАССИЧЕСКИЙ МОД', {
            fontSize: '30px', color: '#4caf50', fontStyle: 'bold'
        });
        t(TL + 14, cy - 214, 'Первый до 7 очков побеждает.', {
            fontSize: '26px', color: '#6b8899'
        });
        t(TL + 14, cy - 182, 'Скорость мяча увеличивается после каждого удара.', {
            fontSize: '26px', color: '#6b8899'
        });

        t(TL, cy - 138, 'МОД С ФИЧАМИ', {
            fontSize: '30px', color: '#4488ff', fontStyle: 'bold'
        });
        t(TL + 14, cy - 100, 'Те же правила, но на поле появляются паверапы.', {
            fontSize: '26px', color: '#6b8899'
        });
        t(TL + 14, cy - 66, 'Мяч должен коснуться паверапа, чтобы активировать.', {
            fontSize: '26px', color: '#6b8899'
        });

        const line = this.add.graphics().setDepth(D);
        line.lineStyle(1, 0x1e3566, 0.8);
        line.lineBetween(TL, cy - 24, cx + PW / 2 - 36, cy - 24);
        elems.push(line);

        t(cx, cy - 6, 'ПАВЕРАПЫ', {
            fontSize: '30px', color: '#99aabb', fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        const MID = cx + 20;
        const PU = [
            { x: TL,  y: cy + 34,  sym: '⚡', label: 'СКОРОСТЬ',   desc: 'ракетка быстрее на 7 сек',    col: '#00ffcc' },
            { x: MID, y: cy + 34,  sym: '↕',  label: 'РАСШИРЕНИЕ', desc: 'ракетка длиннее на 7 сек',    col: '#ffcc00' },
            { x: TL,  y: cy + 116, sym: '❄',  label: 'ЗАМОРОЗКА',  desc: 'соперник замедлен на 7 сек',  col: '#55aaff' },
            { x: MID, y: cy + 116, sym: '🔥', label: 'ОГОНЬ',      desc: 'сразу очко (редкий бонус)',   col: '#ff7722' },
        ];
        PU.forEach(p => {
            t(p.x, p.y, p.sym + '  ' + p.label, {
                fontSize: '28px', color: p.col, fontStyle: 'bold'
            });
            t(p.x + 14, p.y + 34, p.desc, {
                fontSize: '22px', color: '#485a6a'
            });
        });

        t(cx, cy + 210, 'Активные эффекты видны под счётом каждого игрока.', {
            fontSize: '22px', color: '#2e3d4a'
        }).setOrigin(0.5, 0);

        const closeBtn = this.add.text(cx, cy + 300, 'ЗАКРЫТЬ', {
            fontSize: '40px', color: '#667788',
            backgroundColor: '#0d1420',
            padding: { x: 24, y: 14 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(D);
        closeBtn.on('pointerover', () => {
            closeBtn.setStyle({ color: '#ffffff' });
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });
        closeBtn.on('pointerout',  () => closeBtn.setStyle({ color: '#667788' }));
        closeBtn.on('pointerdown', () => close());
        elems.push(closeBtn);

        const close = () => {
            if (!this.infoOpen) return;
            this.infoOpen = false;
            elems.forEach(e => e.destroy());
        };
    }

    _drawBallGfx(gfx, r, key) {
        const x = 0, y = 0;
        switch (key) {
            case 'ball': {
                gfx.fillStyle(0xf4f4f4, 1); gfx.fillCircle(x, y, r);
                gfx.lineStyle(r * 0.1, 0xdddddd, 1);
                gfx.beginPath(); gfx.arc(x, y + r*0.2, r*0.72, Math.PI*1.12, Math.PI*1.88, false); gfx.strokePath();
                gfx.fillStyle(0xffffff, 1); gfx.fillCircle(x - r*0.28, y - r*0.28, r*0.36);
                break;
            }
            case 'ball2': {
                // Звезда — яркое золото
                const pts = [], pts2 = [];
                for (let i = 0; i < 10; i++) {
                    const a = (i * Math.PI / 5) - Math.PI / 2;
                    const rd = i % 2 === 0 ? r * 0.94 : r * 0.42;
                    pts.push({ x: x + Math.cos(a)*rd, y: y + Math.sin(a)*rd });
                    pts2.push({ x: x + Math.cos(a)*rd*0.78, y: y + Math.sin(a)*rd*0.78 });
                }
                gfx.fillStyle(0xffcc22, 1); gfx.fillPoints(pts, true);
                gfx.fillStyle(0xfff066, 1); gfx.fillPoints(pts2, true);
                gfx.lineStyle(2, 0xffffff, 0.9); gfx.strokePoints(pts, true);
                gfx.fillStyle(0xffffff, 0.95); gfx.fillCircle(x - r*0.18, y - r*0.3, r*0.2);
                break;
            }
            case 'ball3': {
                // Огонь — светло-оранжевый
                const sp = (ox, oy) => ({ x: x + ox*r, y: y + oy*r });
                const outer = [sp(0,-0.94), sp(0.6,-0.22), sp(0.82,0.36), sp(0.44,0.9), sp(0,0.96), sp(-0.44,0.9), sp(-0.82,0.36), sp(-0.6,-0.22)];
                const sca = (pts, s, dy) => pts.map(p => ({ x: x + (p.x-x)*s, y: y + (p.y-y)*s + dy }));
                gfx.fillStyle(0xff5522, 1); gfx.fillPoints(outer, true);
                gfx.fillStyle(0xffaa33, 1); gfx.fillPoints(sca(outer, 0.68, r*0.08), true);
                gfx.fillStyle(0xffee88, 1); gfx.fillPoints(sca(outer, 0.36, r*0.14), true);
                break;
            }
            case 'ball4': {
                // Снежинка — яркий голубой
                gfx.lineStyle(r * 0.16, 0xbbddff, 1);
                for (let i = 0; i < 6; i++) {
                    const a = i * Math.PI / 3;
                    gfx.lineBetween(x, y, x + Math.cos(a)*r*0.94, y + Math.sin(a)*r*0.94);
                }
                gfx.lineStyle(r * 0.1, 0xbbddff, 0.9);
                for (let i = 0; i < 6; i++) {
                    const a = i * Math.PI / 3;
                    const mx = x + Math.cos(a)*r*0.56, my = y + Math.sin(a)*r*0.56;
                    const pa = a + Math.PI / 2, bl = r * 0.24;
                    gfx.lineBetween(mx + Math.cos(pa)*bl, my + Math.sin(pa)*bl,
                                    mx - Math.cos(pa)*bl, my - Math.sin(pa)*bl);
                }
                gfx.fillStyle(0xeef8ff, 1); gfx.fillCircle(x, y, r*0.22);
                gfx.fillStyle(0xffffff, 1); gfx.fillCircle(x - r*0.06, y - r*0.06, r*0.1);
                break;
            }
            case 'ball5': {
                // Монета — светлое золото
                gfx.fillStyle(0xddbb44, 1); gfx.fillCircle(x, y, r);
                gfx.fillStyle(0xffcc55, 1); gfx.fillCircle(x, y, r*0.88);
                gfx.fillStyle(0xffee99, 1); gfx.fillCircle(x, y, r*0.72);
                const ps = [];
                for (let i = 0; i < 10; i++) {
                    const a = (i * Math.PI / 5) - Math.PI / 2;
                    ps.push({ x: x + Math.cos(a)*(i%2===0 ? r*0.42 : r*0.2), y: y + Math.sin(a)*(i%2===0 ? r*0.42 : r*0.2) });
                }
                gfx.fillStyle(0xcc9922, 0.7); gfx.fillPoints(ps, true);
                gfx.fillStyle(0xffffff, 0.7); gfx.fillCircle(x - r*0.3, y - r*0.3, r*0.24);
                break;
            }
            case 'ball6': {
                // Сердце — параметрическая кривая (x=16sin³t, y=13cos-5cos2-2cos3-cos4)
                const hpts = [], hpts2 = [];
                const hs = r / 17;
                for (let i = 0; i < 48; i++) {
                    const t = (i / 48) * Math.PI * 2;
                    const hx = 16 * Math.pow(Math.sin(t), 3);
                    const hy = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
                    hpts.push({ x: x + hx * hs, y: y - (hy + 2.5) * hs });
                    hpts2.push({ x: x + hx * hs * 0.58, y: y - (hy + 2.5) * hs * 0.58 - r*0.06 });
                }
                gfx.fillStyle(0xff3366, 1); gfx.fillPoints(hpts, true);
                gfx.fillStyle(0xff88bb, 0.6); gfx.fillPoints(hpts2, true);
                gfx.fillStyle(0xffffff, 0.9); gfx.fillCircle(x - r*0.28, y - r*0.38, r*0.14);
                break;
            }
            case 'ball7': {
                // Бомба — светло-серая
                gfx.fillStyle(0x555555, 1); gfx.fillCircle(x, y + r*0.06, r*0.84);
                gfx.fillStyle(0x888888, 0.65); gfx.fillCircle(x - r*0.26, y - r*0.14, r*0.3);
                gfx.lineStyle(r * 0.12, 0x998866, 1);
                gfx.lineBetween(x - r*0.02, y - r*0.76, x + r*0.24, y - r*0.86);
                gfx.fillStyle(0xffee44, 1); gfx.fillCircle(x + r*0.3, y - r*0.84, r*0.15);
                gfx.fillStyle(0xff9900, 0.9); gfx.fillCircle(x + r*0.28, y - r*0.82, r*0.09);
                gfx.lineStyle(2, 0x777777, 0.9); gfx.strokeCircle(x, y + r*0.06, r*0.84);
                gfx.fillStyle(0xffffff, 0.65); gfx.fillCircle(x - r*0.3, y - r*0.22, r*0.22);
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
                        p.push({ x: cx + Math.cos(a)*pr, y: cy + Math.sin(a)*pr });
                    }
                    return p;
                };
                gfx.fillPoints(penta(x, y, r*0.32, -Math.PI/2), true);
                for (let i = 0; i < 5; i++) {
                    const a = -Math.PI/2 + (i * 2 * Math.PI / 5);
                    gfx.fillPoints(penta(x + Math.cos(a)*r*0.62, y + Math.sin(a)*r*0.62, r*0.25, a + Math.PI), true);
                }
                gfx.lineStyle(1, 0xdddddd, 0.6); gfx.strokeCircle(x, y, r);
                gfx.fillStyle(0xffffff, 0.7); gfx.fillCircle(x - r*0.3, y - r*0.32, r*0.26);
                break;
            }
            case 'ball9': {
                // Баскет — яркий оранжевый
                gfx.fillStyle(0xff6633, 1); gfx.fillCircle(x, y, r);
                gfx.fillStyle(0xff9955, 0.55); gfx.fillCircle(x - r*0.1, y - r*0.1, r*0.8);
                gfx.lineStyle(r * 0.08, 0x442200, 1);
                gfx.lineBetween(x - r, y, x + r, y);
                gfx.beginPath(); gfx.arc(x - r*0.38, y, r*0.6, -1.1, 1.1, false); gfx.strokePath();
                gfx.beginPath(); gfx.arc(x + r*0.38, y, r*0.6, Math.PI - 1.1, Math.PI + 1.1, false); gfx.strokePath();
                gfx.lineStyle(1.5, 0x442200, 0.8); gfx.strokeCircle(x, y, r);
                gfx.fillStyle(0xffffff, 0.6); gfx.fillCircle(x - r*0.3, y - r*0.3, r*0.28);
                break;
            }
            case 'ball10': {
                // Кристалл — светлый аквамарин
                const crown = [
                    { x: x,           y: y - r*0.94 },
                    { x: x + r*0.54,  y: y - r*0.28 },
                    { x: x + r*0.3,   y: y + r*0.08 },
                    { x: x - r*0.3,   y: y + r*0.08 },
                    { x: x - r*0.54,  y: y - r*0.28 },
                ];
                const pavilion = [
                    { x: x + r*0.3,   y: y + r*0.08 },
                    { x: x + r*0.62,  y: y + r*0.14 },
                    { x: x,           y: y + r*0.94 },
                    { x: x - r*0.62,  y: y + r*0.14 },
                    { x: x - r*0.3,   y: y + r*0.08 },
                ];
                gfx.fillStyle(0x33ddaa, 1); gfx.fillPoints(pavilion, true);
                gfx.fillStyle(0x66ffdd, 1); gfx.fillPoints(crown, true);
                const facet = [
                    { x: x,           y: y - r*0.88 },
                    { x: x + r*0.3,   y: y - r*0.3  },
                    { x: x,           y: y + r*0.06  },
                    { x: x - r*0.3,   y: y - r*0.3  },
                ];
                gfx.fillStyle(0xaaffee, 0.7); gfx.fillPoints(facet, true);
                gfx.lineStyle(2, 0xaaffee, 1); gfx.strokePoints(crown, true);
                gfx.lineStyle(1, 0x22cc99, 0.8); gfx.strokePoints(pavilion, true);
                gfx.fillStyle(0xffffff, 0.85); gfx.fillCircle(x + r*0.08, y - r*0.52, r*0.14);
                break;
            }
        }
    }

    _buildShopBtn(cx, cy) {
        const lbl = this.add.text(cx, cy + 338, 'МАГАЗИН', {
            fontSize: '32px', color: '#ddaa00',
            backgroundColor: '#1a1100',
            padding: { x: 14, y: 9 }
        }).setOrigin(0.5).setDepth(6);
        const zone = this.add.zone(cx, cy + 338, 232, 68).setDepth(7)
            .setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => {
            lbl.setStyle({ color: '#ffdd44' }); lbl.setScale(1.08);
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });
        zone.on('pointerout', () => { lbl.setStyle({ color: '#ddaa00' }); lbl.setScale(1); });
        zone.on('pointerdown', () => {
            const snd = this.registry.get('snd'); if (snd) snd.hover();
            lbl.setScale(0.92);
            this.time.delayedCall(110, () => { lbl.setScale(1); this._openShop(cx, cy); });
        });
        lbl.setScale(0); zone.setScale(0);
        this.tweens.add({ targets: [lbl, zone], scale: 1, duration: 500, ease: 'Back.Out', delay: 250 });
    }

    _openShop(cx, cy) {
        if (this.shopOpen) return;
        this.shopOpen = true;

        const PW = 840, PH = 680, PY = cy + 8, D = 20;
        const all = [];

        const getCoins    = () => { try { return parseInt(localStorage.getItem('pongCoins') || '0', 10) || 0; } catch(e) { return 0; } };
        const setCoins    = (n) => { try { localStorage.setItem('pongCoins', String(n)); this.registry.set('coins', n); } catch(e) {} };
        const getUnlocked = () => { try { return new Set(JSON.parse(localStorage.getItem('pongUnlocked')) || DEFAULT_UNLOCKED); } catch(e) { return new Set(DEFAULT_UNLOCKED); } };
        const saveUnlocked= (s) => { try { localStorage.setItem('pongUnlocked', JSON.stringify([...s])); } catch(e) {} };

        all.push(
            this.add.rectangle(cx, cy, this.dw, this.dh, 0x000000, 0.88).setDepth(D).setInteractive(),
            this.add.rectangle(cx, PY, PW, PH, 0x080d18).setStrokeStyle(2, 0x8866aa).setDepth(D+1).setInteractive(),
            this.add.text(cx, PY - PH/2 + 38, 'МАГАЗИН', { fontSize:'48px', color:'#ffcc00', fontStyle:'bold' }).setOrigin(0.5).setDepth(D+2)
        );

        // Монеты в шапке (иконка у правого края панели, текст растёт влево)
        const _coinX = cx + PW/2 - 22, _coinY = PY - PH/2 + 38;
        const cGfx = this.add.graphics().setDepth(D+2);
        const cTxt = this.add.text(_coinX - 19, _coinY, '', { fontSize:'28px', color:'#ffdd00', fontStyle:'bold' }).setOrigin(1, 0.5).setDepth(D+2);
        const refreshCoins = () => {
            cGfx.clear();
            cGfx.fillStyle(0xaa7700, 1); cGfx.fillCircle(_coinX, _coinY, 13);
            cGfx.fillStyle(0xffcc00, 1); cGfx.fillCircle(_coinX, _coinY, 11);
            cTxt.setText(String(getCoins()));
        };
        refreshCoins();
        all.push(cGfx, cTxt);

        // Вкладки (3 штуки)
        const TAB_Y = PY - PH/2 + 86;
        const CONTENT_TOP = TAB_Y + 42;
        let curTab = 'balls';
        const tabGroups = { balls: [], fields: [], trails: [] };
        const tabBg = {}, tabTxt = {};

        const switchTab = (key) => {
            if (curTab === key) return;
            curTab = key;
            ['balls', 'fields', 'trails'].forEach(k => {
                const a = k === key;
                tabBg[k].setFillStyle(a ? 0x1a2a50 : 0x0d1020);
                tabBg[k].setStrokeStyle(2, a ? 0x4488ff : 0x334455);
                tabTxt[k].setStyle({ color: a ? '#ffffff' : '#556677' });
                tabGroups[k].forEach(e => e.setVisible(a));
            });
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        };

        [
            { k:'balls',  label:'МЯЧИ',   x: cx - 220 },
            { k:'fields', label:'ПОЛЯ',   x: cx       },
            { k:'trails', label:'ХВОСТЫ', x: cx + 220 },
        ].forEach(({ k, label, x }) => {
            const a = k === 'balls';
            tabBg[k]  = this.add.rectangle(x, TAB_Y, 188, 50, a?0x1a2a50:0x0d1020).setStrokeStyle(2, a?0x4488ff:0x334455).setDepth(D+2);
            tabTxt[k] = this.add.text(x, TAB_Y, label, { fontSize:'27px', color:a?'#ffffff':'#556677' }).setOrigin(0.5).setDepth(D+3);
            const zone = this.add.zone(x, TAB_Y, 198, 60).setDepth(D+4).setInteractive({ useHandCursor:true });
            zone.on('pointerdown', () => switchTab(k));
            all.push(tabBg[k], tabTxt[k], zone);
        });

        // ── Вкладка мячей (2 ряда по 5) ─────────────────────────────────────
        const BSTEP = 148, BSX = cx - BSTEP * 2;
        const BALL_R = 36;
        const BALL_ROWS = [CONTENT_TOP + 88, CONTENT_TOP + 230];
        const ballRefresh = [];

        SHOP_BALLS.forEach((item, i) => {
            const bx   = BSX + (i % 5) * BSTEP;
            const by   = BALL_ROWS[Math.floor(i / 5)];

            // Векторный превью мяча (позиционируем gfx в центр мяча)
            const ballGfx = this.add.graphics().setPosition(bx, by).setDepth(D+3);
            this._drawBallGfx(ballGfx, BALL_R, item.key);

            const selGfx = this.add.graphics().setDepth(D+2);
            const nTxt   = this.add.text(bx, by + BALL_R + 16, item.name, { fontSize:'20px', color:'#99aacc' }).setOrigin(0.5).setDepth(D+3);
            const sTxt   = this.add.text(bx, by + BALL_R + 36, '', { fontSize:'20px', color:'#888' }).setOrigin(0.5).setDepth(D+3);
            const zone   = this.add.zone(bx, by, 130, BALL_R*2 + 60).setDepth(D+4).setInteractive({ useHandCursor:true });

            const refresh = () => {
                const u = getUnlocked();
                const owned = item.price === 0 || u.has(item.key);
                const sel   = (this.registry.get('ballKey') || 'ball') === item.key;
                selGfx.clear();
                if (sel) { selGfx.lineStyle(3, 0xffdd00, 1); selGfx.strokeCircle(bx, by, BALL_R + 6); }
                if (sel)        sTxt.setText('✓ выбран').setStyle({ color:'#ffdd44' });
                else if (owned) sTxt.setText('выбрать').setStyle({ color:'#66cc66' });
                else            sTxt.setText(`${item.price} 🪙`).setStyle({ color:'#ffaa44' });
            };
            refresh();
            ballRefresh.push(refresh);

            zone.on('pointerover', () => ballGfx.setScale(1.15));
            zone.on('pointerout',  () => ballGfx.setScale(1));
            zone.on('pointerdown', () => {
                const snd = this.registry.get('snd'); if (snd) snd.hover();
                const u = getUnlocked();
                const owned = item.price === 0 || u.has(item.key);
                if (owned) {
                    this.registry.set('ballKey', item.key);
                    ballRefresh.forEach(f => f());
                } else if (getCoins() >= item.price) {
                    setCoins(getCoins() - item.price);
                    u.add(item.key); saveUnlocked(u);
                    refreshCoins();
                    this.registry.set('ballKey', item.key);
                    ballRefresh.forEach(f => f());
                } else {
                    this.tweens.add({ targets:[sTxt], x: bx+7, duration:55, yoyo:true, repeat:2,
                        onStart:()=>sTxt.setStyle({color:'#ff4444'}), onComplete:()=>{ sTxt.setX(bx); refresh(); } });
                }
            });
            tabGroups.balls.push(ballGfx, selGfx, nTxt, sTxt, zone);
        });

        // ── Вкладка полей (4 колонки × 2 ряда) ──────────────────────────────
        const FW = 172, FH = 88, FSTEP = 196;
        const FSX = cx - FSTEP * 1.5;
        const FYS = [CONTENT_TOP + 78, CONTENT_TOP + 248];
        const fieldRefresh = [];

        SHOP_FIELDS.forEach((item, i) => {
            const fx = FSX + (i % 4) * FSTEP, fy = FYS[Math.floor(i / 4)];
            const pGfx = this.add.graphics().setDepth(D+3);
            const nTxt = this.add.text(fx, fy + FH/2 + 16, item.name, { fontSize:'19px', color:'#99aacc' }).setOrigin(0.5).setDepth(D+3);
            const sTxt = this.add.text(fx, fy + FH/2 + 35, '', { fontSize:'18px', color:'#888' }).setOrigin(0.5).setDepth(D+3);
            const zone = this.add.zone(fx, fy + 16, FW + 8, FH + 64).setDepth(D+4).setInteractive({ useHandCursor:true });

            const refresh = () => {
                const u = getUnlocked();
                const owned = item.price === 0 || u.has(item.key);
                const sel   = this._selectedField === item.key;
                pGfx.clear();
                pGfx.fillStyle(item.bg, 1);
                pGfx.fillRect(fx - FW/2, fy - FH/2, FW, FH);
                pGfx.fillStyle(item.c1, 0.38);
                pGfx.fillRect(fx - FW/2, fy - FH/2, FW/2, FH);
                pGfx.fillStyle(item.c2, 0.38);
                pGfx.fillRect(fx, fy - FH/2, FW/2, FH);
                if (!owned) { pGfx.fillStyle(0x000000, 0.52); pGfx.fillRect(fx - FW/2, fy - FH/2, FW, FH); }
                pGfx.lineStyle(sel ? 3 : 1, sel ? 0xffdd00 : (owned ? 0x445566 : 0x222233), 1);
                pGfx.strokeRect(fx - FW/2, fy - FH/2, FW, FH);
                if (sel)        sTxt.setText('✓ выбрано').setStyle({ color:'#ffdd44' });
                else if (owned) sTxt.setText('выбрать').setStyle({ color:'#66cc66' });
                else            sTxt.setText(`${item.price} 🪙`).setStyle({ color:'#ffaa44' });
            };
            refresh();
            fieldRefresh.push(refresh);

            zone.on('pointerdown', () => {
                const snd = this.registry.get('snd'); if (snd) snd.hover();
                const u = getUnlocked();
                const owned = item.price === 0 || u.has(item.key);
                if (owned) {
                    this._selectedField = item.key;
                    try { localStorage.setItem('pongField', item.key); } catch(e) {}
                    fieldRefresh.forEach(f => f());
                } else if (getCoins() >= item.price) {
                    setCoins(getCoins() - item.price);
                    u.add(item.key); saveUnlocked(u);
                    refreshCoins();
                    this._selectedField = item.key;
                    try { localStorage.setItem('pongField', item.key); } catch(e) {}
                    fieldRefresh.forEach(f => f());
                } else {
                    this.tweens.add({ targets:[sTxt], x:fx+7, duration:55, yoyo:true, repeat:2,
                        onStart:()=>sTxt.setStyle({color:'#ff4444'}), onComplete:()=>{ sTxt.setX(fx); refresh(); } });
                }
            });
            tabGroups.fields.push(pGfx, nTxt, sTxt, zone);
        });

        // ── Вкладка хвостов (2×2) ────────────────────────────────────────────
        const TW = 280, TH = 130;           // размер ячейки превью
        const TSTEP_X = 310, TSTEP_Y = 218;
        const TSX = cx - TSTEP_X / 2;
        const TYS = [CONTENT_TOP + 84, CONTENT_TOP + 302];
        const trailRefresh = [];

        // Рисует статичный превью-трейл внутри ячейки
        const drawTrailPrev = (gfx, tx, ty, key) => {
            // trail_4 — длинный: используем больше точек и полную ширину ячейки
            const N    = key === 'trail_4' ? 22 : 10;
            const span = key === 'trail_4' ? TW - 20 : TW - 44;
            for (let i = 0; i < N; i++) {
                const age = i / N;
                const px  = tx + TW/2 - 14 - age * span;
                switch (key) {
                    case 'trail_1': // плавный fade, средние кружки
                        gfx.fillStyle(0x88bbff, 0.9 * (1 - age));
                        gfx.fillCircle(px, ty, 7 * (1 - age * 0.65));
                        break;
                    case 'trail_2': // вьющийся — разлетаются вверх-вниз
                        gfx.fillStyle(0xffcc44, 0.95 * (1 - age));
                        gfx.fillCircle(px, ty + (i % 2 === 0 ? 1 : -1) * age * 18, 4 * (1 - age * 0.4));
                        break;
                    case 'trail_3': // большой — крупные, быстро тают
                        gfx.fillStyle(0xff8866, 0.8 * (1 - age));
                        gfx.fillCircle(px, ty, 12 * (1 - age));
                        break;
                    case 'trail_4': // длинный — тонкий равномерный хвост через всю ячейку
                        gfx.fillStyle(0xaaddff, 0.88 * (1 - age));
                        gfx.fillCircle(px, ty, 5 * (1 - age * 0.55));
                        break;
                }
            }
        };

        SHOP_TRAILS.forEach((item, i) => {
            const tx = TSX + (i % 2) * TSTEP_X;
            const ty = TYS[Math.floor(i / 2)];

            const bgGfx  = this.add.graphics().setDepth(D+2);
            const prvGfx = this.add.graphics().setDepth(D+3);
            const selGfx = this.add.graphics().setDepth(D+2);
            const nTxt   = this.add.text(tx, ty + TH/2 + 18, item.name,
                { fontSize:'22px', color:'#99aacc' }).setOrigin(0.5).setDepth(D+3);
            const sTxt   = this.add.text(tx, ty + TH/2 + 40, '',
                { fontSize:'20px', color:'#888' }).setOrigin(0.5).setDepth(D+3);
            const zone   = this.add.zone(tx, ty + 18, TW + 12, TH + 72)
                .setDepth(D+4).setInteractive({ useHandCursor: true });

            const refresh = () => {
                const u = getUnlocked();
                const owned = item.price === 0 || u.has(item.key);
                const sel   = this._selectedTrail === item.key;
                bgGfx.clear();
                bgGfx.fillStyle(sel ? 0x1a2240 : 0x0d1020, 1);
                bgGfx.fillRect(tx - TW/2, ty - TH/2, TW, TH);
                if (!owned) { bgGfx.fillStyle(0x000000, 0.5); bgGfx.fillRect(tx - TW/2, ty - TH/2, TW, TH); }
                bgGfx.lineStyle(sel ? 3 : 1, sel ? 0xffdd00 : (owned ? 0x334466 : 0x222233), 1);
                bgGfx.strokeRect(tx - TW/2, ty - TH/2, TW, TH);
                prvGfx.clear();
                if (owned) drawTrailPrev(prvGfx, tx, ty, item.key);
                if (sel)        sTxt.setText('✓ выбран').setStyle({ color:'#ffdd44' });
                else if (owned) sTxt.setText('выбрать').setStyle({ color:'#66cc66' });
                else            sTxt.setText(`${item.price} 🪙`).setStyle({ color:'#ffaa44' });
            };
            refresh();
            trailRefresh.push(refresh);

            zone.on('pointerover', () => { prvGfx.setScale(1.05); });
            zone.on('pointerout',  () => { prvGfx.setScale(1); });
            zone.on('pointerdown', () => {
                const snd = this.registry.get('snd'); if (snd) snd.hover();
                const u = getUnlocked();
                const owned = item.price === 0 || u.has(item.key);
                if (owned) {
                    this._selectedTrail = item.key;
                    try { localStorage.setItem('pongTrail', item.key); } catch(e) {}
                    trailRefresh.forEach(f => f());
                } else if (getCoins() >= item.price) {
                    setCoins(getCoins() - item.price);
                    u.add(item.key); saveUnlocked(u);
                    refreshCoins();
                    this._selectedTrail = item.key;
                    try { localStorage.setItem('pongTrail', item.key); } catch(e) {}
                    trailRefresh.forEach(f => f());
                } else {
                    this.tweens.add({ targets:[sTxt], x: tx+7, duration:55, yoyo:true, repeat:2,
                        onStart:()=>sTxt.setStyle({color:'#ff4444'}), onComplete:()=>{ sTxt.setX(tx); refresh(); } });
                }
            });
            tabGroups.trails.push(bgGfx, prvGfx, selGfx, nTxt, sTxt, zone);
        });

        tabGroups.fields.forEach(e => e.setVisible(false));
        tabGroups.trails.forEach(e => e.setVisible(false));

        // Кнопка закрыть
        const closeBtn = this.add.text(cx, PY + PH/2 - 36, 'ЗАКРЫТЬ', {
            fontSize:'36px', color:'#667788', backgroundColor:'#0d1420', padding:{ x:22, y:12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor:true }).setDepth(D+2);
        closeBtn.on('pointerover', () => { closeBtn.setStyle({color:'#ffffff'}); const snd=this.registry.get('snd'); if(snd) snd.hover(); });
        closeBtn.on('pointerout',  () => closeBtn.setStyle({color:'#667788'}));
        closeBtn.on('pointerdown', () => close());
        all.push(closeBtn);

        const close = () => {
            if (!this.shopOpen) return;
            this.shopOpen = false;
            all.forEach(e => e.destroy());
            tabGroups.balls.forEach(e => e.destroy());
            tabGroups.fields.forEach(e => e.destroy());
            tabGroups.trails.forEach(e => e.destroy());
        };
    }

    _buildCoinDisplay() {
        let balance = 0;
        try { balance = parseInt(localStorage.getItem('pongCoins') || '0', 10) || 0; } catch(e) {}
        // Icon at right edge; text grows leftward so any number of digits stays on screen
        const bx = this.dw - 22, by = 26;
        const gfx = this.add.graphics().setDepth(8);
        gfx.fillStyle(0x886600, 1);
        gfx.fillCircle(bx, by, 13);
        gfx.fillStyle(0xffcc00, 1);
        gfx.fillCircle(bx, by, 11);
        gfx.fillStyle(0xffe066, 1);
        gfx.fillCircle(bx - 3, by - 3, 5);
        gfx.fillStyle(0xaa7700, 0.9);
        gfx.fillTriangle(bx, by - 5, bx + 4, by + 1, bx - 4, by + 1);
        gfx.fillTriangle(bx - 3, by + 1, bx + 3, by + 1, bx, by + 6);
        this.add.text(bx - 19, by, String(balance), {
            fontSize: '26px', color: '#ffdd00', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(1, 0.5).setDepth(8);
    }

    _resetBall(cx, cy) {
        this.bx = cx;
        this.by = Phaser.Math.Between(cy * 0.6, cy * 1.4);
        const angle = Phaser.Math.Between(-25, 25);
        const dir   = Math.random() > 0.5 ? 1 : -1;
        const rad   = Phaser.Math.DegToRad(angle);
        this.bvx = Math.cos(rad) * this.BALL_SPEED * dir;
        this.bvy = Math.sin(rad) * this.BALL_SPEED;
    }

    _bounce(isLeft) {
        const padY = isLeft ? this.p1y : this.p2y;
        const norm = Phaser.Math.Clamp((this.by - padY) / (this.PAD_H / 2), -1, 1);
        const spd  = Math.min(Math.hypot(this.bvx, this.bvy) * 1.03, this.BALL_MAX);
        const rad  = Phaser.Math.DegToRad(norm * 45);
        this.bvx   = Math.cos(rad) * spd * (isLeft ? 1 : -1);
        this.bvy   = Math.sin(rad) * spd;
        this._aim1 = Phaser.Math.Between(-55, 55);
        this._aim2 = Phaser.Math.Between(-55, 55);
    }

    update(t, dt) {
        const s   = dt / 1000;
        const br  = (this.aiBall.width || 24) / 2;
        const ph2 = this.PAD_H / 2;
        const pw2 = this.PAD_W / 2;

        this.bx += this.bvx * s;
        this.by += this.bvy * s;

        if (this.by <= br)              { this.by = br + 1;          this.bvy =  Math.abs(this.bvy); }
        else if (this.by >= this.dh - br) { this.by = this.dh - br - 1; this.bvy = -Math.abs(this.bvy); }

        if (this.bvx < 0 && this.bx - br <= this.P1X + pw2 && this.bx > this.P1X - pw2) {
            if (Math.abs(this.by - this.p1y) <= ph2 + br) {
                this.bx = this.P1X + pw2 + br + 1;
                this._bounce(true);
            }
        }
        if (this.bvx > 0 && this.bx + br >= this.P2X - pw2 && this.bx < this.P2X + pw2) {
            if (Math.abs(this.by - this.p2y) <= ph2 + br) {
                this.bx = this.P2X - pw2 - br - 1;
                this._bounce(false);
            }
        }

        if (this.bx < -60 || this.bx > this.dw + 60) {
            this._resetBall(this.dw / 2, this.dh / 2);
            this.ballTrail = [];
        }

        const maxMove = this.AI_SPEED * s;
        this.p1y += Phaser.Math.Clamp((this.by + this._aim1) - this.p1y, -maxMove, maxMove);
        this.p2y += Phaser.Math.Clamp((this.by + this._aim2) - this.p2y, -maxMove, maxMove);
        this.p1y = Phaser.Math.Clamp(this.p1y, ph2, this.dh - ph2);
        this.p2y = Phaser.Math.Clamp(this.p2y, ph2, this.dh - ph2);

        this.aiPad1.setPosition(this.P1X, this.p1y);
        this.aiPad2.setPosition(this.P2X, this.p2y);
        this.aiBall.setPosition(this.bx, this.by);
        this.aiBall.angle += 360 * (350 / 1000) * s;

        const spd = Math.hypot(this.bvx, this.bvy);
        if (spd > 20) {
            this.ballTrail.unshift({ x: this.bx, y: this.by });
            if (this.ballTrail.length > 14) this.ballTrail.pop();
        }
        this.trailGfx.clear();
        this.ballTrail.forEach((pos, i) => {
            const t = 1 - i / this.ballTrail.length;
            this.trailGfx.fillStyle(0xffffff, t * 0.45);
            this.trailGfx.fillCircle(pos.x, pos.y, br * t * 0.9);
        });

        this._padTick++;
        if (this._padTick % 2 === 0) {
            this.pad1Trail.unshift(this.p1y);
            if (this.pad1Trail.length > 12) this.pad1Trail.pop();
            this.pad2Trail.unshift(this.p2y);
            if (this.pad2Trail.length > 12) this.pad2Trail.pop();
        }
        const pw = this.PAD_W, ph = this.PAD_H;
        this.pad1TrailGfx.clear();
        this.pad1Trail.forEach((posY, i) => {
            const t = 1 - i / this.pad1Trail.length;
            this.pad1TrailGfx.fillStyle(this.C1, t * 0.3);
            this.pad1TrailGfx.fillRect(this.P1X - pw / 2, posY - ph / 2, pw, ph);
        });
        this.pad2TrailGfx.clear();
        this.pad2Trail.forEach((posY, i) => {
            const t = 1 - i / this.pad2Trail.length;
            this.pad2TrailGfx.fillStyle(this.C2, t * 0.3);
            this.pad2TrailGfx.fillRect(this.P2X - pw / 2, posY - ph / 2, pw, ph);
        });
    }
}
