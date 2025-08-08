import { GameEngine } from './engine.js';
import { TopDownScene } from './topdown.js';
import { PlatformerMinigame } from './minigames/platformer.js';
import { CollectorMinigame } from './minigames/collector.js';

const canvas = document.getElementById('game');
const engine = new GameEngine(canvas);

let topDownScene;

function createMinigame(type, { onSuccess, onExit, timeLimit }) {
  let mg;
  if (type === 'platformer') {
    mg = new PlatformerMinigame(engine, {
      onSuccess: () => { onSuccess?.(); engine.sceneManager.setScene(topDownScene); },
      onExit: () => { onExit?.(); engine.sceneManager.setScene(topDownScene); },
      timeLimit
    });
  } else {
    mg = new CollectorMinigame(engine, {
      onSuccess: () => { onSuccess?.(); engine.sceneManager.setScene(topDownScene); },
      onExit: () => { onExit?.(); engine.sceneManager.setScene(topDownScene); },
      timeLimit
    });
  }
  return mg;
}

function start() {
  topDownScene = new TopDownScene(engine, createMinigame);
  engine.sceneManager.setScene(topDownScene);
  engine.start();
}

start();