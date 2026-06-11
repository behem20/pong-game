import GameScene from "./GameScene.js";
import StartScene from "./StartScene.js";

console.log('start proj');

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    backgroundColor: "rgb(0, 0, 0)",
    physics: {
        default: "arcade",
        arcade: {
            debug: 0
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE, // подстраиваемся под размер экрана
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
        StartScene,
        GameScene
    ],

}

// Создаём новую игру
window.game = new Phaser.Game(config);

