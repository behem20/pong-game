export default class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
    }

    preload() {
        this.load.image('player', '/assets/player.png');
        this.load.image('ball', '/assets/ball.png');
    }

    create() {
        this.dw = this.scale.width;
        this.dh = this.scale.height;
        const cx = this.dw / 2, cy = this.dh / 2;

        const C1 = 0x4488ff;
        const C2 = 0xff4444;
        this.C1 = C1; this.C2 = C2;

        // Фон как в GameScene
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

        // Хвосты (под ракетками и мячом)
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

        // Состояние мяча (ручная физика)
        this.p1y = cy;
        this.p2y = cy;
        this.BALL_SPEED = 684;
        this.BALL_MAX   = 950;
        this.AI_SPEED   = 780;
        this._aim1 = 0; // смещение прицела ракетки 1
        this._aim2 = 0; // смещение прицела ракетки 2
        this._resetBall(cx, cy);

        // Затемнение за меню
        this.add.rectangle(cx, cy, 300, 260, 0x000000).setAlpha(0.7).setDepth(5);

        // Заголовок
        this.add.text(cx, cy - 100, 'PONG', {
            fontSize: '46px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6);

        // Кнопки выбора мода
        this._makeButton(cx, cy - 22, 'КЛАССИКА', 0x1d6b0a, 0x4caf50, 0,
            () => this.scene.start('GameScene', { mode: 'classic' }));

        this._makeButton(cx, cy + 48, 'С ФИЧАМИ', 0x0a1a4a, 0x4488ff, 80,
            () => this.scene.start('GameScene', { mode: 'features' }));

        // Подсказка управления
        this.add.text(cx, cy + 108, 'Игрок 1: W / S     Игрок 2: ↑ / ↓', {
            fontSize: '14px', color: '#888888'
        }).setOrigin(0.5).setDepth(6);

        this._buildSettingsBtn(cx, cy);
        this._buildInfoBtn(cx, cy);

        // Меню-музыка — только если AudioContext уже существует (после первой игры)
        const snd = this.registry.get('snd');
        if (snd) {
            snd.startMusic('menu');
            this.events.on('shutdown', () => snd.stopMusic());
        }
    }

    _makeButton(x, y, label, fillColor, strokeColor, delay, onClick) {
        const btn = this.add.rectangle(x, y, 230, 55, fillColor)
            .setStrokeStyle(2, strokeColor)
            .setInteractive({ useHandCursor: true })
            .setDepth(6);
        const txt = this.add.text(x, y, label, {
            fontSize: '24px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6);

        btn.on('pointerover', () => {
            btn.setScale(1.07); txt.setScale(1.07);
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });
        btn.on('pointerout',  () => { btn.setScale(1); txt.setScale(1); });
        btn.on('pointerdown', onClick);

        btn.setScale(0); txt.setScale(0);
        this.tweens.add({ targets: [btn, txt], scale: 1, duration: 500, ease: 'Back.Out', delay });
    }

    _buildSettingsBtn(cx, cy) {
        const btn = this.add.text(cx, cy + 152, 'НАСТРОЙКИ', {
            fontSize: '15px', color: '#666666',
            backgroundColor: '#111111',
            padding: { x: 10, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(6);

        btn.on('pointerover', () => {
            btn.setStyle({ color: '#bbbbbb' });
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });
        btn.on('pointerout',  () => btn.setStyle({ color: '#666666' }));
        btn.on('pointerdown', () => this._openSettings(cx, cy));

        btn.setScale(0);
        this.tweens.add({ targets: btn, scale: 1, duration: 500, ease: 'Back.Out', delay: 200 });
    }

    _openSettings(cx, cy) {
        if (this.settingsOpen) return;
        this.settingsOpen = true;

        const backdrop = this.add.rectangle(cx, cy, this.dw, this.dh, 0x000000, 0.7)
            .setDepth(15).setInteractive()
            .on('pointerdown', () => closePanel());

        const panel = this.add.rectangle(cx, cy, 300, 210, 0x111122, 0.95)
            .setStrokeStyle(2, 0x334477).setDepth(16).setInteractive();

        const title = this.add.text(cx, cy - 72, 'НАСТРОЙКИ', {
            fontSize: '22px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(17);

        const soundOn = this.registry.get('soundOn') ?? true;
        const soundBtn = this.add.text(cx, cy + 2, soundOn ? 'Звук: ВКЛ' : 'Звук: ВЫКЛ', {
            fontSize: '20px', color: '#ffffff',
            backgroundColor: '#333344',
            padding: { x: 18, y: 10 }
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

        const stub = this.add.text(cx, cy + 57, '(звук в разработке)', {
            fontSize: '13px', color: '#44445a'
        }).setOrigin(0.5).setDepth(17);

        const closeBtn = this.add.text(cx, cy + 85, 'ЗАКРЫТЬ', {
            fontSize: '15px', color: '#888888',
            backgroundColor: '#222222',
            padding: { x: 14, y: 7 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(17);

        closeBtn.on('pointerover', () => {
            closeBtn.setStyle({ color: '#ffffff' });
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });
        closeBtn.on('pointerout',  () => closeBtn.setStyle({ color: '#888888' }));
        closeBtn.on('pointerdown', () => closePanel());

        const elements = [backdrop, panel, title, soundBtn, stub, closeBtn];

        const closePanel = () => {
            if (!this.settingsOpen) return;
            this.settingsOpen = false;
            elements.forEach(e => e.destroy());
        };
    }

    _buildInfoBtn(cx, cy) {
        const btn = this.add.text(cx, cy + 186, 'ПРАВИЛА', {
            fontSize: '15px', color: '#666666',
            backgroundColor: '#111111',
            padding: { x: 10, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(6);

        btn.on('pointerover', () => {
            btn.setStyle({ color: '#bbbbbb' });
            const snd = this.registry.get('snd'); if (snd) snd.hover();
        });
        btn.on('pointerout',  () => btn.setStyle({ color: '#666666' }));
        btn.on('pointerdown', () => this._openInfo(cx, cy));

        btn.setScale(0);
        this.tweens.add({ targets: btn, scale: 1, duration: 500, ease: 'Back.Out', delay: 300 });
    }

    _openInfo(cx, cy) {
        if (this.infoOpen) return;
        this.infoOpen = true;

        const PW = 570, PH = 470;
        const TL = cx - PW / 2 + 28; // левый край текста
        const elems = [];

        const backdrop = this.add.rectangle(cx, cy, this.dw, this.dh, 0x000000, 0.84)
            .setDepth(15).setInteractive().on('pointerdown', () => close());
        const panel = this.add.rectangle(cx, cy, PW, PH, 0x080d18, 0.97)
            .setStrokeStyle(2, 0x1e3566).setDepth(16).setInteractive();
        elems.push(backdrop, panel);

        const D = 17; // depth для всех элементов панели
        const t = (x, y, str, style) =>
            elems.push(this.add.text(x, y, str, style).setDepth(D)) && elems[elems.length - 1];

        // ── Заголовок
        t(cx, cy - 218, 'КАК ИГРАТЬ', {
            fontSize: '22px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        t(cx, cy - 192, 'Игрок 1: W / S     |     Игрок 2: ↑ / ↓     |     Пауза: Пробел или клик', {
            fontSize: '12px', color: '#3d4f60'
        }).setOrigin(0.5, 0);

        // ── Классика
        t(TL, cy - 164, 'КЛАССИЧЕСКИЙ МОД', {
            fontSize: '14px', color: '#4caf50', fontStyle: 'bold'
        });
        t(TL + 10, cy - 146, 'Первый до 7 очков побеждает.', {
            fontSize: '13px', color: '#6b8899'
        });
        t(TL + 10, cy - 129, 'Скорость мяча увеличивается после каждого удара о ракетку.', {
            fontSize: '13px', color: '#6b8899'
        });

        // ── С фичами
        t(TL, cy - 102, 'МОД С ФИЧАМИ', {
            fontSize: '14px', color: '#4488ff', fontStyle: 'bold'
        });
        t(TL + 10, cy - 84, 'Те же правила, но иногда на поле появляется', {
            fontSize: '13px', color: '#6b8899'
        });
        t(TL + 10, cy - 67, 'случайный паверап. Мяч должен коснуться его, чтобы активировать.', {
            fontSize: '13px', color: '#6b8899'
        });
        t(TL + 10, cy - 50, 'Паверап всегда забирает тот игрок, чьим ударом мяч его подобрал.', {
            fontSize: '13px', color: '#6b8899'
        });

        // ── Разделитель
        const line = this.add.graphics().setDepth(D);
        line.lineStyle(1, 0x1e3566, 0.8);
        line.lineBetween(TL, cy - 25, cx + PW / 2 - 28, cy - 25);
        elems.push(line);

        // ── Паверапы
        t(cx, cy - 12, 'ПАВЕРАПЫ', {
            fontSize: '14px', color: '#99aabb', fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        const MID = cx + 14;
        const PU = [
            { x: TL,  y: cy + 14, sym: '⚡', label: 'СКОРОСТЬ',   desc: 'ракетка быстрее на 7 сек',       col: '#00ffcc' },
            { x: MID, y: cy + 14, sym: '↕',  label: 'РАСШИРЕНИЕ', desc: 'ракетка длиннее на 7 сек',       col: '#ffcc00' },
            { x: TL,  y: cy + 64, sym: '❄',  label: 'ЗАМОРОЗКА',  desc: 'соперник замедлен на 7 сек',     col: '#55aaff' },
            { x: MID, y: cy + 64, sym: '🔥', label: 'ОГОНЬ',      desc: 'сразу очко (редкий бонус)',   col: '#ff7722' },
        ];
        PU.forEach(p => {
            t(p.x, p.y, p.sym + '  ' + p.label, {
                fontSize: '14px', color: p.col, fontStyle: 'bold'
            });
            t(p.x + 10, p.y + 20, p.desc, {
                fontSize: '12px', color: '#485a6a'
            });
        });

        // ── Подсказка статус-бара
        t(cx, cy + 124, 'Активные эффекты видны под счётом каждого игрока в виде иконки и полосы.', {
            fontSize: '12px', color: '#2e3d4a'
        }).setOrigin(0.5, 0);

        // ── Закрыть
        const closeBtn = this.add.text(cx, cy + 208, 'ЗАКРЫТЬ', {
            fontSize: '15px', color: '#667788',
            backgroundColor: '#0d1420',
            padding: { x: 16, y: 8 }
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

        // После удара каждая ракетка выбирает новый случайный прицел
        this._aim1 = Phaser.Math.Between(-55, 55);
        this._aim2 = Phaser.Math.Between(-55, 55);
    }

    update(t, dt) {
        const s   = dt / 1000;
        const br  = (this.aiBall.width || 24) / 2;
        const ph2 = this.PAD_H / 2;
        const pw2 = this.PAD_W / 2;

        // Двигаем мяч
        this.bx += this.bvx * s;
        this.by += this.bvy * s;

        // Отскок стенки верх/низ
        if (this.by <= br)              { this.by = br + 1;          this.bvy =  Math.abs(this.bvy); }
        else if (this.by >= this.dh - br) { this.by = this.dh - br - 1; this.bvy = -Math.abs(this.bvy); }

        // Удар о левую ракетку
        if (this.bvx < 0 && this.bx - br <= this.P1X + pw2 && this.bx > this.P1X - pw2) {
            if (Math.abs(this.by - this.p1y) <= ph2 + br) {
                this.bx = this.P1X + pw2 + br + 1;
                this._bounce(true);
            }
        }
        // Удар о правую ракетку
        if (this.bvx > 0 && this.bx + br >= this.P2X - pw2 && this.bx < this.P2X + pw2) {
            if (Math.abs(this.by - this.p2y) <= ph2 + br) {
                this.bx = this.P2X - pw2 - br - 1;
                this._bounce(false);
            }
        }

        // Сброс если мяч улетел (на всякий случай)
        if (this.bx < -60 || this.bx > this.dw + 60) {
            this._resetBall(this.dw / 2, this.dh / 2);
            this.ballTrail = [];
        }

        // ИИ: движется к мячу со случайным смещением прицела
        const maxMove = this.AI_SPEED * s;
        this.p1y += Phaser.Math.Clamp((this.by + this._aim1) - this.p1y, -maxMove, maxMove);
        this.p2y += Phaser.Math.Clamp((this.by + this._aim2) - this.p2y, -maxMove, maxMove);
        this.p1y = Phaser.Math.Clamp(this.p1y, ph2, this.dh - ph2);
        this.p2y = Phaser.Math.Clamp(this.p2y, ph2, this.dh - ph2);

        // Обновляем позиции объектов
        this.aiPad1.setPosition(this.P1X, this.p1y);
        this.aiPad2.setPosition(this.P2X, this.p2y);
        this.aiBall.setPosition(this.bx, this.by);
        this.aiBall.angle += 360 * (350 / 1000) * s; // ~350°/сек

        // Хвост мяча
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

        // Хвосты ракеток (каждый 2-й кадр)
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
