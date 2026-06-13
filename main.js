import GameScene from "./GameScene.js";
import StartScene from "./StartScene.js";

console.log('start proj');

const GAME_H = 800;

// На мобильном window.innerWidth/innerHeight зависят от ориентации при загрузке —
// если страница открыта в портрете, ar < 1 и игра получается квадратной.
// Решение: на тачскрин-устройстве берём физические размеры экрана и сами
// выбираем ландшафтное соотношение (большая сторона / меньшая сторона).
const _isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
let GAME_W;
if (_isMobile) {
    const lW = Math.max(window.screen.width, window.screen.height);
    const lH = Math.min(window.screen.width, window.screen.height);
    GAME_W = Math.round(GAME_H * Math.max(1.0, lW / lH));
} else {
    const _ar = Math.max(1.0, Math.min(2.2, window.innerWidth / Math.max(window.innerHeight, 1)));
    GAME_W = Math.round(GAME_H * _ar);
}

const config = {
    type: Phaser.AUTO,
    width: GAME_W,
    height: GAME_H,
    backgroundColor: "rgb(0, 0, 0)",
    physics: {
        default: "arcade",
        arcade: {
            debug: 0
        }
    },
    parent: 'game',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game',
        width: GAME_W,
        height: GAME_H,
    },
    plugins: {
        global: [{
            key: 'rexVirtualJoystick',
            plugin: window.rexvirtualjoystickplugin,
            start: true,
        }]
    },
    scene: [
        StartScene,
        GameScene
    ],
}

// Создаём новую игру
window.game = new Phaser.Game(config);
