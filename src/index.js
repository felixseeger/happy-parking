import './styles/main.css';
import { ParkingSimulation } from './js/simulation/ParkingSimulation';
import { UI } from './js/ui/UI';
import { ScenarioManager } from './js/simulation/ScenarioManager';
import Stats from 'stats.js';

// Initialize performance stats
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

// Move stats to top right corner
stats.dom.style.position = 'absolute';
stats.dom.style.top = '10px';
stats.dom.style.right = '10px';
stats.dom.style.left = 'auto';

// Initialize the scenario manager
const scenarioManager = new ScenarioManager();

// Initialize the simulation
const simulation = new ParkingSimulation({
  container: document.getElementById('simulation-container'),
  scenarioManager: scenarioManager
});

// Initialize the UI
const ui = new UI({
  simulation: simulation,
  stats: stats,
  playPauseButton: document.getElementById('play-pause'),
  scenarioSelect: document.getElementById('scenario-select'),
  statsContent: document.getElementById('stats-content')
});

// Start everything
ui.init();
simulation.init();

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  stats.begin();
  
  if (simulation.isRunning()) {
    simulation.update();
    ui.updateStats();
  }
  
  stats.end();
}

// Start the animation loop
animate();