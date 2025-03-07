/**
 * Class to handle UI interactions and displays
 */
export class UI {
  constructor(options) {
    this.simulation = options.simulation;
    this.stats = options.stats;
    this.playPauseButton = options.playPauseButton;
    this.scenarioSelect = options.scenarioSelect;
    this.statsContent = options.statsContent;
    
    this.statsUpdateTimer = 0;
    this.statsUpdateInterval = 1; // Update stats every second
  }
  
  /**
   * Initialize the UI and set up event listeners
   */
  init() {
    this.setupEventListeners();
    this.populateScenarioDropdown();
    this.updateStats();
  }
  
  /**
   * Set up UI event listeners
   */
  setupEventListeners() {
    // Play/Pause button
    this.playPauseButton.addEventListener('click', () => {
      const isRunning = this.simulation.toggleRunning();
      this.playPauseButton.textContent = isRunning ? 'Pause' : 'Play';
    });
    
    // Scenario selection
    this.scenarioSelect.addEventListener('change', (event) => {
      const scenarioId = event.target.value;
      this.simulation.changeScenario(scenarioId);
    });
  }
  
  /**
   * Populate the scenario dropdown with available scenarios
   */
  populateScenarioDropdown() {
    // Clear existing options
    this.scenarioSelect.innerHTML = '';
    
    // Get scenario list from simulation
    const scenarios = this.simulation.scenarioManager.getScenarioList();
    
    // Add each scenario to the dropdown
    scenarios.forEach(scenario => {
      const option = document.createElement('option');
      option.value = scenario.id;
      option.textContent = scenario.name;
      this.scenarioSelect.appendChild(option);
    });
    
    // Select the current scenario
    const currentScenario = this.simulation.scenarioManager.getCurrentScenario();
    this.scenarioSelect.value = currentScenario.id;
  }
  
  /**
   * Update the stats panel with current simulation stats
   */
  updateStats() {
    const stats = this.simulation.getStats();
    const occupancyRate = stats.totalSpaces > 0 ? 
      ((stats.occupiedSpaces / stats.totalSpaces) * 100).toFixed(1) : '0';
    
    this.statsContent.innerHTML = `
      <div class="stat-row">
        <div class="stat-label">Occupancy Rate:</div>
        <div class="stat-value">${occupancyRate}%</div>
      </div>
      <div class="stat-row">
        <div class="stat-label">Spaces:</div>
        <div class="stat-value">${stats.occupiedSpaces} / ${stats.totalSpaces}</div>
      </div>
      <div class="stat-row">
        <div class="stat-label">Total Vehicles:</div>
        <div class="stat-value">${stats.totalVehicles}</div>
      </div>
      <div class="stat-row">
        <div class="stat-label">Moving Vehicles:</div>
        <div class="stat-value">${stats.movingVehicles}</div>
      </div>
      <div class="stat-row">
        <div class="stat-label">Parked Vehicles:</div>
        <div class="stat-value">${stats.parkedVehicles}</div>
      </div>
      <div class="stat-row">
        <div class="stat-label">Waiting Vehicles:</div>
        <div class="stat-value">${stats.waitingVehicles}</div>
      </div>
      <div class="stat-row">
        <div class="stat-label">Avg. Wait Time:</div>
        <div class="stat-value">${stats.averageWaitTime.toFixed(1)}s</div>
      </div>
    `;
  }
}