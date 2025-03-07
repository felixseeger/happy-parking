/**
 * Class that manages different simulation scenarios
 */
export class ScenarioManager {
  constructor() {
    // Define available scenarios
    this.scenarios = {
      'default': {
        id: 'default',
        name: 'Default Scenario',
        description: 'A standard parking lot with moderate traffic',
        parkingLot: {
          rows: 4,
          columns: 10,
          spaceWidth: 3,
          spaceLength: 6,
          aisleWidth: 8
        },
        initialVehicles: [
          { type: 'car', x: -20, z: 10, rotation: 0, color: 0xff0000 },
          { type: 'car', x: -18, z: 20, rotation: Math.PI / 4, color: 0x0000ff },
          { type: 'truck', x: -15, z: 0, rotation: -Math.PI / 6, color: 0x00ff00 }
        ],
        vehicleSpawnRate: 0.1, // Vehicles per second
        vehicleLeaveRate: 0.05 // Vehicles per second
      },
      'rush-hour': {
        id: 'rush-hour',
        name: 'Rush Hour',
        description: 'High traffic during peak hours',
        parkingLot: {
          rows: 5,
          columns: 12,
          spaceWidth: 3,
          spaceLength: 6,
          aisleWidth: 8
        },
        initialVehicles: [
          { type: 'car', x: -25, z: 15, rotation: 0, color: 0xff0000 },
          { type: 'car', x: -22, z: 25, rotation: Math.PI / 4, color: 0x0000ff },
          { type: 'car', x: -20, z: 5, rotation: -Math.PI / 6, color: 0x00ff00 },
          { type: 'car', x: -18, z: 10, rotation: Math.PI / 3, color: 0xffff00 },
          { type: 'truck', x: -15, z: 0, rotation: -Math.PI / 4, color: 0xff00ff }
        ],
        vehicleSpawnRate: 0.3, // Vehicles per second
        vehicleLeaveRate: 0.1 // Vehicles per second
      },
      'weekend': {
        id: 'weekend',
        name: 'Weekend',
        description: 'Relaxed weekend parking scenario',
        parkingLot: {
          rows: 3,
          columns: 8,
          spaceWidth: 3,
          spaceLength: 6,
          aisleWidth: 8
        },
        initialVehicles: [
          { type: 'car', x: -15, z: 10, rotation: 0, color: 0xff0000 },
          { type: 'car', x: -12, z: 15, rotation: Math.PI / 4, color: 0x0000ff }
        ],
        vehicleSpawnRate: 0.05, // Vehicles per second
        vehicleLeaveRate: 0.03 // Vehicles per second
      }
    };
    
    // Set default scenario
    this.currentScenarioId = 'default';
  }
  
  /**
   * Get a list of all available scenarios
   * @return {Array} Array of scenario objects with id, name, and description
   */
  getScenarioList() {
    return Object.values(this.scenarios).map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description
    }));
  }
  
  /**
   * Get the current scenario object
   * @return {Object} Current scenario configuration
   */
  getCurrentScenario() {
    return this.scenarios[this.currentScenarioId];
  }
  
  /**
   * Set the current scenario by ID
   * @param {string} scenarioId - ID of the scenario to set as current
   * @return {boolean} Success of the operation
   */
  setCurrentScenario(scenarioId) {
    if (this.scenarios[scenarioId]) {
      this.currentScenarioId = scenarioId;
      return true;
    }
    return false;
  }
  
  /**
   * Get scenario by ID
   * @param {string} scenarioId - ID of the scenario to retrieve
   * @return {Object|null} Scenario configuration or null if not found
   */
  getScenario(scenarioId) {
    return this.scenarios[scenarioId] || null;
  }
}