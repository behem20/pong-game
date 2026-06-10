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

        this.pad2 = this.add.rectangle(this.dw - PAD_MARGIN - PAD_W / 2, this.dh / 2, PAD_W, PAD_H, this.C2);
        this.physics.add.existing(this.pad2);
        this.pad2.body.setImmovable(true);
        this.pad2.body.setCollideWorldBounds(true);

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

        this.keys = this.input.keyboard.addKeys({
            w: 'W', s: 'S',
            up: 'UP', down: 'DOWN',
        });

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
            this.freezeGfx1   = null;
            this.freezeGfx2   = null;
            this.hitCountText = this.add.text(this.dw / 2, 14, 'hits: 0', {
                fontSize: '13px', color: '#ffffff'
            }).setOrigin(0.5, 0).setAlpha(0.35).setDepth(6);
        }

        this._launchBall();
    }

    _launchBall() {
        const progress = Math.max(this.score1, this.score2) / this.WIN_SCORE;
        this.ballSpeed = 456 + progress * 280;
        this.padSpeed  = 480 + progress * 250;
        this.ball.clearTint();
        this.trailPositions = [];
        this.trailGfx.clear();

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
        this.ballSpeed = Math.min(this.ballSpeed * 1.05, 900);
        const norm = (ball.y - pad.y) / (pad.height / 2);
        const rad = Phaser.Math.DegToRad(norm * 45);
        const dir = ball.x < this.dw / 2 ? 1 : -1;
        ball.body.velocity.x = Math.cos(rad) * this.ballSpeed * dir;
        ball.body.velocity.y = Math.sin(rad) * this.ballSpeed;

        const isP1 = pad === this.pad1;
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
                this.ballSpeed = Math.min(this.ballSpeed * 1.4, 1200);
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
        }
        this.winText.setText(`Игрок ${winner} победил!`).setVisible(true);
        this.add.text(this.dw / 2, this.dh / 2 + 65, 'Возврат в меню через 3 сек...', {
            fontSize: '18px', color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0.5).setDepth(10);
        this.time.delayedCall(3500, () => this.scene.start('StartScene'));
    }

    update() {
        if (this.gameOver) return;

        const SPEED = this.padSpeed || 480;
        const freeze1 = (this.mode === 'features' && this.time.now < this.freezeUntil1) ? 0.85 : 1;
        const freeze2 = (this.mode === 'features' && this.time.now < this.freezeUntil2) ? 0.85 : 1;
        this.pad1.body.setVelocityY(
            this.keys.w.isDown ? -SPEED * freeze1 : this.keys.s.isDown ? SPEED * freeze1 : 0
        );
        this.pad2.body.setVelocityY(
            this.keys.up.isDown ? -SPEED * freeze2 : this.keys.down.isDown ? SPEED * freeze2 : 0
        );

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
        }

        // Хвост мяча — только когда летит
        const ballSpeed = Math.hypot(this.ball.body.velocity.x, this.ball.body.velocity.y);
        if (ballSpeed > 20) {
            this.trailPositions.unshift({ x: this.ball.x, y: this.ball.y });
            if (this.trailPositions.length > 14) this.trailPositions.pop();
        } else {
            this.trailPositions = [];
        }
        this.trailGfx.clear();
        const br = this.ball.width / 2;
        this.trailPositions.forEach((pos, i) => {
            const t = 1 - i / this.trailPositions.length;
            this.trailGfx.fillStyle(0xffffff, t * 0.45);
            this.trailGfx.fillCircle(pos.x, pos.y, br * t * 0.9);
        });

        // Отскок от верха/низа
        const r = this.ball.height / 2;
        if (this.ball.y <= r) {
            this.ball.y = r + 1;
            this.ball.body.velocity.y = Math.abs(this.ball.body.velocity.y);
            this._burst(this.ball.x, r, 0xccddff, 7);
        } else if (this.ball.y >= this.dh - r) {
            this.ball.y = this.dh - r - 1;
            this.ball.body.velocity.y = -Math.abs(this.ball.body.velocity.y);
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
        const TYPES = { speed: 0x00ccff, size: 0xff8800, freeze: 0x99eeff };
        const type  = Phaser.Utils.Array.GetRandom(['speed', 'size', 'freeze']);
        const color = TYPES[type];

        const x = Phaser.Math.Between(this.dw * 0.15, this.dw * 0.85);
        const y = Phaser.Math.Between(80, this.dh - 80);

        const glow = this.add.circle(x, y, 22, color, 0.25).setDepth(3);
        const dot  = this.add.circle(x, y, 11, color, 1).setDepth(3);
        const ring = this.add.circle(x, y, 16, 0x000000, 0).setDepth(3)
            .setStrokeStyle(2, color, 0.8);

        [glow, dot, ring].forEach(o => o.setScale(0));

        this.tweens.add({
            targets: [glow, dot, ring],
            scale: 1,
            duration: 700,
            ease: 'Back.Out',
            onComplete: () => {
                if (!this.pickup) return;
                this.tweens.add({
                    targets: [glow, dot, ring],
                    scale: 1.25,
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.InOut',
                });
            },
        });

        this.pickup = { x, y, type, color, radius: 18, expiresAt: this.time.now + 10000, glow, dot, ring };
    }

    _collectPickup() {
        const { x, y, type, color } = this.pickup;
        this._burst(x, y, color, 16);
        this._destroyPickup();
        this.nextPickupAt = this.hitCount + 2;

        if (type === 'speed') {
            const who = this.lastHitter;
            if (who === 1) this.boostUntil1 = this.time.now + 7000;
            else           this.boostUntil2 = this.time.now + 7000;
            this._applyBoostGlow(who);
        } else if (type === 'size') {
            const who = this.lastHitter;
            if (who === 1) this.sizeUntil1 = this.time.now + 7000;
            else           this.sizeUntil2 = this.time.now + 7000;
            this._applySizeBoost(who);
        } else if (type === 'freeze') {
            // замораживаем соперника
            const opponent = this.lastHitter === 1 ? 2 : 1;
            if (opponent === 1) { this.freezeUntil1 = this.time.now + 7000; this._applyFreezeEffect(1); }
            else                { this.freezeUntil2 = this.time.now + 7000; this._applyFreezeEffect(2); }
        }
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
        const pw = pad.width, ph = pad.height;
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
        const pw = pad.width, ph = pad.height;
        const px = pad.x,     py = pad.y;
        const pulse = 0.5 + 0.5 * Math.sin(now / 180);

        // Ледяной слой поверх ракетки
        gfx.fillStyle(0x99eeff, 0.28 + 0.18 * pulse);
        gfx.fillRect(px - pw / 2, py - ph / 2, pw, ph);

        // Морозный контур
        gfx.lineStyle(2, 0xffffff, 0.45 + 0.35 * pulse);
        gfx.strokeRect(px - pw / 2 - 3, py - ph / 2 - 3, pw + 6, ph + 6);

        // Кристаллики льда
        const N = 5;
        for (let i = 0; i < N; i++) {
            const oy    = py - ph / 2 + (i + 0.5) * (ph / N);
            const phase = ((now / 350 + i * 0.41) % 1.0);
            gfx.fillStyle(0xffffff, phase * 0.65);
            gfx.fillCircle(px, oy, 2);
        }
    }

    _applySizeBoost(padN) {
        this._clearSizeBoost(padN); // сброс если уже активен
        const pad = padN === 1 ? this.pad1 : this.pad2;
        const newH = Math.round(this.PAD_H * 1.6);
        pad.setSize(this.PAD_W, newH);
        pad.body.setSize(this.PAD_W, newH, true);
        // Короткий "вспышка роста"
        this.tweens.add({
            targets: pad, scaleY: 1.12, duration: 140,
            yoyo: true, ease: 'Sine.Out',
        });
    }

    _clearSizeBoost(padN) {
        const key = padN === 1 ? 'sizeUntil1' : 'sizeUntil2';
        if (this[key] === 0) return;
        const pad = padN === 1 ? this.pad1 : this.pad2;
        pad.setSize(this.PAD_W, this.PAD_H);
        pad.body.setSize(this.PAD_W, this.PAD_H, true);
        this[key] = 0;
    }

    _destroyPickup() {
        this.tweens.killTweensOf(this.pickup.glow);
        this.tweens.killTweensOf(this.pickup.dot);
        this.tweens.killTweensOf(this.pickup.ring);
        this.pickup.glow.destroy();
        this.pickup.dot.destroy();
        this.pickup.ring.destroy();
        this.pickup = null;
    }
}
