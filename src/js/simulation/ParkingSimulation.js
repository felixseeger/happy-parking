import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Vehicle } from './Vehicle';
import { ParkingLot } from './ParkingLot';

export class ParkingSimulation {
  constructor(options) {
    // DOM container for the simulation
    this.container = options.container;
    
    // Scenario manager for different simulation scenarios
    this.scenarioManager = options.scenarioManager;
    
    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // Simulation components
    this.parkingLot = null;
    this.vehicles = [];
    
    // Simulation state
    this.running = true;
    this.elapsedTime = 0;
    this.clock = new THREE.Clock();
    
    // Simulation stats (to be displayed in UI)
    this.stats = {
      occupiedSpaces: 0,
      totalSpaces: 0,
      totalVehicles: 0,
      movingVehicles: 0,
      parkedVehicles: 0,
      waitingVehicles: 0,
      averageWaitTime: 0
    };
    
    this.boundingBox = new THREE.Box3();
  }
  
  init() {
    this.setupThreeJs();
    this.loadCurrentScenario();
    this.setupEventListeners();
  }
  
  setupThreeJs() {
    // Create the scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xA8DEF0); // Light blue sky color
    
    // Set up lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 200, 100);
    directionalLight.castShadow = true;
    
    // Set up shadow properties for better quality
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);
    
    // Create the camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 50, 80);
    this.camera.lookAt(0, 0, 0);
    
    // Create the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    
    // Add orbit controls for camera
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.rotateSpeed = 0.7;
    
    // Limit controls to prevent disorienting views
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below the ground
    this.controls.minDistance = 10;
    this.controls.maxDistance = 150;
  }
  
  loadCurrentScenario() {
    // Clear existing scene elements
    this.vehicles.forEach(vehicle => this.scene.remove(vehicle.mesh));
    if (this.parkingLot) this.scene.remove(this.parkingLot.mesh);
    
    this.vehicles = [];
    
    // Get current scenario from manager
    const scenario = this.scenarioManager.getCurrentScenario();
    
    // Create parking lot based on scenario
    this.parkingLot = new ParkingLot({
      rows: scenario.parkingLot.rows,
      columns: scenario.parkingLot.columns,
      spaceWidth: scenario.parkingLot.spaceWidth,
      spaceLength: scenario.parkingLot.spaceLength,
      aisleWidth: scenario.parkingLot.aisleWidth
    });
    
    this.scene.add(this.parkingLot.mesh);
    
    // Create initial vehicles
    scenario.initialVehicles.forEach(vehicleData => {
      const vehicle = new Vehicle({
        type: vehicleData.type,
        position: new THREE.Vector3(vehicleData.x, 0, vehicleData.z),
        rotation: vehicleData.rotation,
        color: vehicleData.color
      });
      
      this.vehicles.push(vehicle);
      this.scene.add(vehicle.mesh);
    });
    
    // Update simulation stats
    this.stats.totalSpaces = this.parkingLot.getTotalSpaces();
    this.stats.totalVehicles = this.vehicles.length;
    
    // Update camera position to encompass the scene
    this.updateCameraToFitScene();
  }
  
  updateCameraToFitScene() {
    // Compute bounding box of the entire scene
    this.boundingBox.setFromObject(this.parkingLot.mesh);
    
    // Get the center and size of the bounding box
    const center = new THREE.Vector3();
    this.boundingBox.getCenter(center);
    
    const size = new THREE.Vector3();
    this.boundingBox.getSize(size);
    
    // Position camera to show the entire scene
    const maxDim = Math.max(size.x, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2) / 1.5);
    
    // Set camera position
    this.camera.position.set(center.x, cameraDistance, center.z + cameraDistance / 2);
    this.camera.lookAt(center);
    this.controls.target.copy(center);
  }
  
  update() {
    const deltaTime = this.clock.getDelta();
    this.elapsedTime += deltaTime;
    
    // Update vehicles
    this.vehicles.forEach(vehicle => vehicle.update(deltaTime, this.parkingLot));
    
    // Update controls
    this.controls.update();
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
    
    // Update simulation statistics
    this.updateStats();
  }
  
  updateStats() {
    // Calculate current stats
    let parked = 0;
    let moving = 0;
    let waiting = 0;
    let totalWaitTime = 0;
    
    this.vehicles.forEach(vehicle => {
      if (vehicle.isParked()) {
        parked++;
      } else if (vehicle.isMoving()) {
        moving++;
      } else {
        waiting++;
      }
      
      totalWaitTime += vehicle.getWaitTime();
    });
    
    // Update stats object
    this.stats.occupiedSpaces = parked;
    this.stats.movingVehicles = moving;
    this.stats.parkedVehicles = parked;
    this.stats.waitingVehicles = waiting;
    this.stats.averageWaitTime = this.vehicles.length > 0 ? 
      totalWaitTime / this.vehicles.length : 0;
  }
  
  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }
  
  toggleRunning() {
    this.running = !this.running;
    return this.running;
  }
  
  isRunning() {
    return this.running;
  }
  
  getStats() {
    return this.stats;
  }
  
  changeScenario(scenarioId) {
    this.scenarioManager.setCurrentScenario(scenarioId);
    this.loadCurrentScenario();
  }
}