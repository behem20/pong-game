import SoundManager from './SoundManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create(data) {
        this.mode = (data && data.mode) || 'classic';
        this.dw = this.scale.width;
        this.dh = this.scale.height;

        this.score1 = 0;
        this.score2 = 0;
        this.WIN_SCORE = 7;
        this.gameOver = false;

        this.C1 = 0x4488ff; // синий — игрок 1
        this.C2 = 0xff4444; // красный — игрок 2

        // Фон: тёмный + цветные половины
        this.add.rectangle(this.dw / 2, this.dh / 2, this.dw, this.dh, 0x080808);
        this.add.rectangle(this.dw * 0.25, this.dh / 2, this.dw / 2, this.dh, this.C1).setAlpha(0.2);
        this.add.rectangle(this.dw * 0.75, this.dh / 2, this.dw / 2, this.dh, this.C2).setAlpha(0.2);

        // Пунктирная центральная линия
        const lineGfx = this.add.graphics();
        lineGfx.lineStyle(2, 0xffffff, 0.1);
        for (let y = 0; y < this.dh; y += 24) {
            lineGfx.lineBetween(this.dw / 2, y, this.dw / 2, y + 12);
        }

        // Ракетки
        this.PAD_W = 14; this.PAD_H = 180;
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

        // Хвост мяча (под мячом)
        this.trailGfx = this.add.graphics();
        this.trailPositions = [];

        // Мяч
        this.ball = this.physics.add.image(this.dw / 2, this.dh / 2, 'ball');

        // Коллайдеры
        this.physics.add.collider(this.ball, this.pad1, this._onHit, null, this);
        this.physics.add.collider(this.ball, this.pad2, this._onHit, null, this);

        // Счёт (цвета совпадают с игроками)
        this.s1Text = this.add.text(this.dw * 0.25, 40, '0', {
            fontSize: '56px', color: '#6699ff', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.75);
        this.s2Text = this.add.text(this.dw * 0.75, 40, '0', {
            fontSize: '56px', color: '#ff6655', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.75);

        // Подсказки управления
        this.add.text(PAD_MARGIN + PAD_W / 2, this.dh - 10, 'W / S', {
            fontSize: '13px', color: '#6699ff'
        }).setOrigin(0.5, 1).setAlpha(0.4);
        this.add.text(this.dw - PAD_MARGIN - PAD_W / 2, this.dh - 10, '↑ / ↓', {
            fontSize: '13px', color: '#ff6655'
        }).setOrigin(0.5, 1).setAlpha(0.4);

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
        });
        this.keys.space.on('down', this._togglePause, this);

        // Прозрачная область на весь экран для клика-паузы (depth 0 = под всем)
        this.add.rectangle(this.dw / 2, this.dh / 2, this.dw, this.dh, 0x000000, 0)
            .setDepth(0).setInteractive()
            .on('pointerdown', () => { if (!this.paused && !this.gameOver) this._togglePause(); });

        if (this.mode === 'features') {
            this.hitCount     = 0;
            this.nextPickupAt = 2;
            this.pickup       = null;
            this.lastHitter   = 1;
            this.boostUntil1  = 0;
            this.boostUntil2  = 0;
            this.boostGlow1   = null;
            this.boostGlow2   = null;
            this.sizeUntil1   = 0;
            this.sizeUntil2   = 0;
            this.freezeUntil1 = 0;
            this.freezeUntil2 = 0;
            this.freezeGfx1    = null;
            this.freezeGfx2    = null;
            this.fireballMode  = false;
            this.fireballOwner = 0;
            this.hitCountText = this.add.text(this.dw / 2, 14, 'hits: 0', {
                fontSize: '13px', color: '#ffffff'
            }).setOrigin(0.5, 0).setAlpha(0.35).setDepth(6);
        }

        // Sound
        if (!this.registry.get('snd')) this.registry.set('snd', new SoundManager(this.registry));
        this.snd = this.registry.get('snd');
        this.snd.startMusic('game');
        this.events.on('shutdown', () => this.snd.stopMusic());

        this._buildStatusUI();
        this._launchBall();
    }

    _launchBall() {
        const progress = Math.max(this.score1, this.score2) / this.WIN_SCORE;
        this.ballSpeed    = (456 + progress * 280) * 1.2;
        this.padSpeed     = (480 + progress * 250) * 1.1;
        this.padSpeedRatio = this.padSpeed / this.ballSpeed;
        this.ball.clearTint();
        this.trailPositions = [];
        this.trailGfx.clear();
        this.trailLength    = 14;
        this.trailThickness = 0.9;
        this.fireballMode   = false;

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

        // дребезжание: вправо → обратно → влево → обратно → settle → старт
        const d = 85;
        this.tweens.add({ targets: this.ball, x: sx + 32, duration: d, delay: 250, ease: 'Sine.Out' });
        this.tweens.add({ targets: this.ball, x: sx - 6,  duration: d, delay: 250 + d, ease: 'Sine.InOut' });
        this.tweens.add({ targets: this.ball, x: sx - 28, duration: d, delay: 250 + d * 2 + 120, ease: 'Sine.Out' });
        this.tweens.add({ targets: this.ball, x: sx + 4,  duration: d, delay: 250 + d * 3 + 120, ease: 'Sine.InOut' });
        this.tweens.add({
            targets: this.ball,
            x: sx,
            duration: 130,
            delay: 250 + d * 4 + 120,
            ease: 'Back.Out',
            onComplete: () => {
                if (this._spinTween) { this._spinTween.stop(); this._spinTween = null; }
                if (this.gameOver) return;
                this.ball.body.enable = true;
                this.ball.body.reset(sx, sy);
                this.ball.setAngularVelocity(350); // body.reset() обнуляет angularVelocity
                const angle = Phaser.Math.Between(-25, 25);
                const dir = Math.random() > 0.5 ? 1 : -1;
                const rad = Phaser.Math.DegToRad(angle);
                this.ball.setVelocity(
                    Math.cos(rad) * this.ballSpeed * dir,
                    Math.sin(rad) * this.ballSpeed
                );
            }
        });
    }

    _onHit(ball, pad) {
        if (this.fireballMode) {
            const isOpponent = (this.fireballOwner === 1 && pad === this.pad2) ||
                               (this.fireballOwner === 2 && pad === this.pad1);
            if (isOpponent) {
                this.snd.fireballImpact();
                this._burst(pad.x, pad.y, 0xff2200, 66);
                this._burst(pad.x, pad.y, 0xffcc00, 36);
                this._burst(pad.x, pad.y, 0xffffff, 20);
                this.cameras.main.shake(600, 0.045);
                this.fireballMode = false;
                this.ball.clearTint();
                this._point(this.fireballOwner);
                return;
            }
            this.fireballMode = false;
            this.ball.clearTint();
        }

        this.ballSpeed = this.ballSpeed * 1.05;
        const norm = (ball.y - pad.y) / (pad.displayHeight / 2);
        const rad = Phaser.Math.DegToRad(norm * 45);
        const dir = ball.x < this.dw / 2 ? 1 : -1;
        ball.body.velocity.x = Math.cos(rad) * this.ballSpeed * dir;
        ball.body.velocity.y = Math.sin(rad) * this.ballSpeed;

        const isP1 = pad === this.pad1;
        this.snd.hitPad(isP1 ? 1 : 2);
        ball.setTint(isP1 ? 0xaabbff : 0xff9999);
        this._burst(ball.x, ball.y, isP1 ? this.C1 : this.C2, 10);
        this.cameras.main.shake(55, 0.004);

        if (this.mode === 'features') {
            // Применяем буст скорости если активен у этого игрока
            const now = this.time.now;
            const boosted = (isP1 && now < this.boostUntil1) || (!isP1 && now < this.boostUntil2);
            if (boosted) {
                ball.body.velocity.x *= 1.4;
                ball.body.velocity.y *= 1.4;
                this.ballSpeed = this.ballSpeed * 1.4;
                this._burst(ball.x, ball.y, 0x00ccff, 7);
            }

            this.lastHitter = isP1 ? 1 : 2;
            this.hitCount++;
            this.hitCountText.setText(`hits: ${this.hitCount}`);
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

        this.trailLength    = Phaser.Math.Between(6, 22);
        this.trailThickness = Phaser.Math.FloatBetween(0.45, 1.35);
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
        const goalColor  = scorer === 1 ? this.C1 : this.C2;
        const r = (goalColor >> 16) & 0xff;
        const g = (goalColor >> 8)  & 0xff;
        const b =  goalColor        & 0xff;

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
        if (this.mode === 'features') {
            if (this.pickup) { this._burst(this.pickup.x, this.pickup.y, 0x888800, 6); this._destroyPickup(); }
            this.hitCount = 0;
            this.nextPickupAt = 2;
            this.hitCountText.setText('hits: 0');
            this.boostUntil1 = 0;
            this.boostUntil2 = 0;
            this._clearBoostGlow(1);
            this._clearBoostGlow(2);
            this._clearSizeBoost(1);
            this._clearSizeBoost(2);
            this.freezeUntil1 = 0; this.freezeUntil2 = 0;
            this._clearFreezeEffect(1); this._clearFreezeEffect(2);
            this.fireballMode = false;
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
        if (this.mode === 'features') {
            this._clearBoostGlow(1); this._clearBoostGlow(2);
            this._clearSizeBoost(1); this._clearSizeBoost(2);
            this._clearFreezeEffect(1); this._clearFreezeEffect(2);
            this.fireballMode = false;
        }
        this.snd.win();
        this.winText.setText(`Игрок ${winner} победил!`).setVisible(true);

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
        this.pad1.body.setVelocityY(
            this.keys.w.isDown ? -SPEED * freeze1 : this.keys.s.isDown ? SPEED * freeze1 : 0
        );
        this.pad2.body.setVelocityY(
            this.keys.up.isDown ? -SPEED * freeze2 : this.keys.down.isDown ? SPEED * freeze2 : 0
        );
        if (this.pad1.body.velocity.y !== 0) this.snd.padMove(1);
        if (this.pad2.body.velocity.y !== 0) this.snd.padMove(2);

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

        // Хвост мяча — только когда летит
        const ballSpeed = Math.hypot(this.ball.body.velocity.x, this.ball.body.velocity.y);
        const tLen = this.trailLength || 14;
        if (ballSpeed > 20) {
            this.trailPositions.unshift({ x: this.ball.x, y: this.ball.y });
            if (this.trailPositions.length > tLen) this.trailPositions.pop();
        } else {
            this.trailPositions = [];
        }
        this.trailGfx.clear();
        const br = this.ball.width / 2;
        const tThick = this.trailThickness || 0.9;
        const isFire = this.fireballMode;
        this.trailPositions.forEach((pos, i) => {
            const t = 1 - i / this.trailPositions.length;
            if (isFire) {
                const fc = i < 5 ? 0xffee00 : i < 12 ? 0xff6600 : 0xff1100;
                this.trailGfx.fillStyle(fc, t * 0.85);
                this.trailGfx.fillCircle(pos.x, pos.y, br * t * (tThick + 0.5));
            } else {
                this.trailGfx.fillStyle(0xffffff, t * 0.45);
                this.trailGfx.fillCircle(pos.x, pos.y, br * t * tThick);
            }
        });

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

        // Гол
        if (this.ball.x < 0) this._point(2);
        else if (this.ball.x > this.dw) this._point(1);
    }

    _spawnPickup() {
        const TYPES = { speed: 0x00ccff, size: 0xff8800, freeze: 0x99eeff, fireball: 0xff4400 };
        const type  = Phaser.Utils.Array.GetRandom([
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
            else           this.boostUntil2 = this.time.now + 7000;
            this._applyBoostGlow(who);
        } else if (type === 'size') {
            this._applySizeBoost(this.lastHitter);
        } else if (type === 'freeze') {
            const opponent = this.lastHitter === 1 ? 2 : 1;
            if (opponent === 1) { this.freezeUntil1 = this.time.now + 7000; this._applyFreezeEffect(1); }
            else                { this.freezeUntil2 = this.time.now + 7000; this._applyFreezeEffect(2); }
        } else if (type === 'fireball') {
            this.snd.fireballLaunch();
            this.fireballMode  = true;
            this.fireballOwner = this.lastHitter;
            const fireSpeed   = this.ballSpeed * 3.5;
            const targetPad   = this.lastHitter === 1 ? this.pad2 : this.pad1;
            const dx = targetPad.x - this.ball.x;
            const dy = targetPad.y - this.ball.y;
            const angle = Math.atan2(dy, dx);
            this.ball.body.velocity.x = Math.cos(angle) * fireSpeed;
            this.ball.body.velocity.y = Math.sin(angle) * fireSpeed;
            this.ballSpeed   = fireSpeed;
            this.trailLength = 24;
            this.ball.setTint(0xff6600);
            this.cameras.main.shake(120, 0.009);
        }
    }

    _buildStatusUI() {
        if (this.mode !== 'features') return;

        const TYPES  = ['speed', 'size', 'freeze'];
        // Более насыщенные цвета: бирюзовый / золотой / небесно-синий
        const COLORS = { speed: 0x00ffcc, size: 0xffcc00, freeze: 0x55aaff };

        const makeGroup = (cx) => {
            const group = {};
            TYPES.forEach((type, i) => {
                const color   = COLORS[type];
                const y       = 82 + i * 26;
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
        upd(p1.speed,  this.boostUntil1);
        upd(p1.size,   this.sizeUntil1);
        upd(p1.freeze, this.freezeUntil1);
        upd(p2.speed,  this.boostUntil2);
        upd(p2.size,   this.sizeUntil2);
        upd(p2.freeze, this.freezeUntil2);
    }

    _applyBoostGlow(padN) {
        this._clearBoostGlow(padN);
        const gfx = this.add.graphics().setDepth(2);
        if (padN === 1) this.boostGlow1 = gfx;
        else            this.boostGlow2 = gfx;
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
        const px = pad.x,     py = pad.y;
        const pulse = 0.5 + 0.5 * Math.sin(now / 150);

        // Пульсирующий ореол цвета ракетки
        gfx.fillStyle(color, 0.07 + 0.13 * pulse);
        gfx.fillRect(px - pw / 2 - 14, py - ph / 2 - 8, pw + 28, ph + 16);
        gfx.fillStyle(color, 0.15 + 0.2 * pulse);
        gfx.fillRect(px - pw / 2 - 5, py - ph / 2 - 3, pw + 10, ph + 6);

        // Стримеры скорости в сторону соперника
        const N = 6;
        for (let i = 0; i < N; i++) {
            const oy     = py - ph / 2 + (i + 0.5) * (ph / N);
            const phase  = ((now / 220 + i * 0.31) % 1.0);
            const startX = dir > 0 ? px + pw / 2 : px - pw / 2;
            const len    = (18 + 50 * phase) * Math.abs(dir);
            const alpha  = (1 - phase) * (0.35 + 0.3 * pulse);
            gfx.lineStyle(1.5, color, alpha);
            gfx.lineBetween(startX, oy, startX + dir * len, oy);
        }
    }

    _applyFreezeEffect(padN) {
        this._clearFreezeEffect(padN);
        const gfx = this.add.graphics().setDepth(2);
        if (padN === 1) this.freezeGfx1 = gfx;
        else            this.freezeGfx2 = gfx;
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
        const dir   = px < this.dw / 2 ? 1 : -1;

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
            const fy    = py - ph / 2 + (i + 0.5) * (ph / NS);
            const phase = ((now / 480 + i * 0.21) % 1.0);
            const len   = 6 + 22 * phase;
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
            const fy    = py - ph / 2 + (i + 0.5) * (ph / NC);
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
        else            this.sizeUntil2 = this.time.now + 7000;
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
            speed:    'СКОРОСТЬ!',
            size:     'РАСШИРЕНИЕ!',
            freeze:   'ЗАМОРОЗКА!',
            fireball: 'ОГОНЬ!',
        };
        const colorHex = '#' + color.toString(16).padStart(6, '0');
        const isFire = type === 'fireball';

        const txt = this.add.text(x, y, LABELS[type] || '', {
            fontSize:        isFire ? '52px' : '42px',
            color:           colorHex,
            fontStyle:       'bold',
            stroke:          '#000000',
            strokeThickness: 5,
        }).setOrigin(0.5).setDepth(15).setScale(0.2).setAlpha(0);

        // Collect player label (small, below)
        const who = this.lastHitter === 1 ? 'Игрок 1' : 'Игрок 2';
        const sub = this.add.text(x, y + (isFire ? 34 : 28), who, {
            fontSize: '16px',
            color:    colorHex,
            stroke:   '#000000',
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
                    y:       `-=${isFire ? 130 : 100}`,
                    alpha:   0,
                    duration: 950,
                    delay:    250,
                    ease:    'Sine.In',
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
                    { x:  5, y: -14 }, { x:  1, y: -2 }, { x:  9, y: -2 },
                    { x: -5, y:  14 }, { x: -1, y:  2 }, { x: -9, y:  2 },
                ], true);
                // Bright core
                gfx.fillStyle(0xffffff, 0.6);
                gfx.fillPoints([
                    { x:  3, y: -9 }, { x:  1, y: -1 }, { x:  5, y: -1 },
                    { x: -3, y:  9 }, { x: -1, y:  1 }, { x: -5, y:  1 },
                ], true);
                break;
            }
            case 'size': {
                // Double-ended arrow
                gfx.fillStyle(color, 1);
                gfx.fillTriangle(-9, -4,  9, -4,  0, -16); // up head
                gfx.fillTriangle(-9,  4,  9,  4,  0,  16); // down head
                gfx.fillRect(-3.5, -4, 7, 8);               // shaft
                gfx.fillStyle(0xffffff, 0.4);
                gfx.fillTriangle(-4, -4, 4, -4, 0, -10);
                gfx.fillTriangle(-4,  4, 4,  4, 0,  10);
                break;
            }
            case 'freeze': {
                // Snowflake: 6 arms + crossbars
                gfx.lineStyle(2.5, color, 1);
                for (let i = 0; i < 6; i++) {
                    const a  = (i / 6) * Math.PI * 2 - Math.PI / 2;
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
                    { x:  0, y: -16 }, { x:  4, y: -4 },
                    { x: 16, y:  0  }, { x:  4, y:  4 },
                    { x:  0, y:  16 }, { x: -4, y:  4 },
                    { x:-16, y:  0  }, { x: -4, y: -4 },
                ], true);
                // Inner star (yellow hot core)
                gfx.fillStyle(0xffee00, 0.9);
                gfx.fillPoints([
                    { x:  0, y: -9 }, { x:  2, y: -2 },
                    { x:  9, y:  0 }, { x:  2, y:  2 },
                    { x:  0, y:  9 }, { x: -2, y:  2 },
                    { x: -9, y:  0 }, { x: -2, y: -2 },
                ], true);
                // White hot center
                gfx.fillStyle(0xffffff, 0.8);
                gfx.fillCircle(0, 0, 3);
                break;
            }
        }
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

        // Клик на фон вне панели — продолжить
        const bg = this.add.rectangle(cx, cy, this.dw, this.dh, 0x000000, 0.65)
            .setDepth(20).setInteractive()
            .on('pointerdown', () => this._togglePause());

        // Панель поглощает клики внутри (не закрывает)
        const panel = this.add.rectangle(cx, cy + 30, 320, 310, 0x111111, 0.95)
            .setStrokeStyle(2, 0x444444).setDepth(21).setInteractive();

        const title = this.add.text(cx, cy - 85, 'ПАУЗА', {
            fontSize: '44px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(22);

        const soundOn = this.registry.get('soundOn') ?? true;
        this.soundBtn = this.add.text(cx, cy - 5, soundOn ? 'Звук: ВКЛ' : 'Звук: ВЫКЛ', {
            fontSize: '20px', color: '#ffffff',
            backgroundColor: '#333344',
            padding: { x: 18, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(22);

        this.soundBtn.on('pointerover', () => { this.soundBtn.setStyle({ color: '#ffdd00' }); this.snd.hover(); });
        this.soundBtn.on('pointerout',  () => this.soundBtn.setStyle({ color: '#ffffff' }));
        this.soundBtn.on('pointerdown', () => {
            const cur = this.registry.get('soundOn') ?? true;
            this.registry.set('soundOn', !cur);
            this.soundBtn.setText(!cur ? 'Звук: ВКЛ' : 'Звук: ВЫКЛ');
            this.snd.syncVolume();
        });

        const resumeBtn = this.add.text(cx, cy + 65, 'ПРОДОЛЖИТЬ', {
            fontSize: '20px', color: '#44ff88', fontStyle: 'bold',
            backgroundColor: '#003322',
            padding: { x: 18, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(22);

        resumeBtn.on('pointerover', () => { resumeBtn.setStyle({ color: '#aaffcc' }); this.snd.hover(); });
        resumeBtn.on('pointerout',  () => resumeBtn.setStyle({ color: '#44ff88' }));
        resumeBtn.on('pointerdown', () => this._togglePause());

        const menuBtn = this.add.text(cx, cy + 110, 'В МЕНЮ', {
            fontSize: '15px', color: '#888888',
            backgroundColor: '#222222',
            padding: { x: 14, y: 7 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(22);

        menuBtn.on('pointerover', () => { menuBtn.setStyle({ color: '#ff7777' }); this.snd.hover(); });
        menuBtn.on('pointerout',  () => menuBtn.setStyle({ color: '#888888' }));
        menuBtn.on('pointerdown', () => this.scene.start('StartScene'));

        const hint = this.add.text(cx, cy + 150, 'ПРОБЕЛ или клик вне панели', {
            fontSize: '12px', color: '#555555'
        }).setOrigin(0.5).setDepth(22);

        this.pauseElements = [bg, panel, title, this.soundBtn, resumeBtn, menuBtn, hint];
    }
}
