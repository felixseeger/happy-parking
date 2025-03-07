import * as THREE from 'three';

/**
 * Class representing a vehicle in the simulation
 */
export class Vehicle {
  constructor(options) {
    this.type = options.type || 'car'; // 'car' or 'truck'
    this.position = options.position || new THREE.Vector3(0, 0, 0);
    this.rotation = options.rotation || 0;
    this.color = options.color || 0xff0000;
    
    // Vehicle state
    this.state = 'moving'; // 'moving', 'parked', 'waiting'
    this.targetSpace = null;
    this.waitTime = 0;
    
    // Movement
    this.speed = 0;
    this.maxSpeed = this.type === 'car' ? 5 : 3; // Cars are faster than trucks
    this.acceleration = 2;
    this.turnSpeed = Math.PI / 4;
    this.direction = new THREE.Vector3(0, 0, 1);
    
    // Create the mesh
    this.mesh = this.createVehicleMesh();
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
  }
  
  /**
   * Create the 3D mesh for this vehicle based on its type
   * @return {THREE.Group} Vehicle mesh
   */
  createVehicleMesh() {
    const group = new THREE.Group();
    
    // Different dimensions based on vehicle type
    const dimensions = this.type === 'car' 
      ? { width: 2, length: 4, height: 1.5 }
      : { width: 2.5, length: 6, height: 2.5 };
    
    // Create main body
    const bodyGeometry = new THREE.BoxGeometry(
      dimensions.width, 
      dimensions.height, 
      dimensions.length
    );
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: this.color,
      roughness: 0.7,
      metalness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Add cabin for cars
    if (this.type === 'car') {
      const cabinGeometry = new THREE.BoxGeometry(1.8, 0.8, 2);
      const cabinMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x222222,
        roughness: 0.5,
        metalness: 0.7,
        transparent: true,
        opacity: 0.7
      });
      const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
      cabin.position.set(0, 0.5, 0);
      cabin.castShadow = true;
      group.add(cabin);
    }
    
    // Add wheels (simplified as cylinders)
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    // Position for wheels depends on vehicle type
    const wheelPositions = this.type === 'car' 
      ? [
        [-0.9, -0.7, -1.2], // front-left
        [0.9, -0.7, -1.2],  // front-right
        [-0.9, -0.7, 1.2],  // back-left
        [0.9, -0.7, 1.2],   // back-right
      ]
      : [
        [-1.1, -1.2, -2],   // front-left
        [1.1, -1.2, -2],    // front-right
        [-1.1, -1.2, 0],    // middle-left
        [1.1, -1.2, 0],     // middle-right
        [-1.1, -1.2, 2],    // back-left
        [1.1, -1.2, 2],     // back-right
      ];
      
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.rotation.z = Math.PI / 2; // Rotate to correct orientation
      wheel.castShadow = true;
      group.add(wheel);
    });
    
    // Add lights (red for back, white for front)
    const lightGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.1);
    const frontLightMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      emissive: 0xffffcc,
      emissiveIntensity: 0.5
    });
    const backLightMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    
    // Front lights
    const frontLeftLight = new THREE.Mesh(lightGeometry, frontLightMaterial);
    frontLeftLight.position.set(-0.8, 0, -dimensions.length/2 - 0.05);
    group.add(frontLeftLight);
    
    const frontRightLight = new THREE.Mesh(lightGeometry, frontLightMaterial);
    frontRightLight.position.set(0.8, 0, -dimensions.length/2 - 0.05);
    group.add(frontRightLight);
    
    // Back lights
    const backLeftLight = new THREE.Mesh(lightGeometry, backLightMaterial);
    backLeftLight.position.set(-0.8, 0, dimensions.length/2 + 0.05);
    group.add(backLeftLight);
    
    const backRightLight = new THREE.Mesh(lightGeometry, backLightMaterial);
    backRightLight.position.set(0.8, 0, dimensions.length/2 + 0.05);
    group.add(backRightLight);
    
    return group;
  }
  
  /**
   * Update the vehicle state and position
   * @param {number} deltaTime - Time since last update in seconds
   * @param {ParkingLot} parkingLot - Reference to the parking lot
   */
  update(deltaTime, parkingLot) {
    switch (this.state) {
      case 'moving':
        this.updateMoving(deltaTime, parkingLot);
        break;
      case 'waiting':
        this.waitTime += deltaTime;
        // Try to find a parking space if waiting
        if (this.waitTime > 2) { // Wait 2 seconds before trying again
          this.findParkingSpace(parkingLot);
          this.waitTime = 0;
        }
        break;
      case 'parked':
        // Randomly decide if vehicle should leave
        if (Math.random() < 0.001) { // 0.1% chance per frame
          this.leaveParking(parkingLot);
        }
        break;
    }
  }
  
  /**
   * Update the vehicle when it's in the moving state
   * @param {number} deltaTime - Time since last update in seconds
   * @param {ParkingLot} parkingLot - Reference to the parking lot
   */
  updateMoving(deltaTime, parkingLot) {
    // If no target, try to find a parking space
    if (!this.targetSpace) {
      this.findParkingSpace(parkingLot);
      return;
    }
    
    // Calculate direction to target
    const targetPos = this.targetSpace.position.clone();
    const dirToTarget = targetPos.sub(this.mesh.position).normalize();
    
    // Calculate angle to target
    const currentDirection = new THREE.Vector3(0, 0, 1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0), 
      this.mesh.rotation.y
    );
    let angleDiff = Math.atan2(
      dirToTarget.x * currentDirection.z - dirToTarget.z * currentDirection.x,
      dirToTarget.x * currentDirection.x + dirToTarget.z * currentDirection.z
    );
    
    // Turn toward target
    const turnAmount = Math.min(
      Math.abs(angleDiff), 
      this.turnSpeed * deltaTime
    ) * Math.sign(angleDiff);
    this.mesh.rotation.y += turnAmount;
    
    // Accelerate/decelerate based on distance to target
    const distanceToTarget = this.mesh.position.distanceTo(targetPos);
    
    if (distanceToTarget < 1) {
      // We've reached the target
      this.speed = 0;
      this.state = 'parked';
      
      // Snap to exact position and rotation
      this.mesh.position.copy(this.targetSpace.position);
      this.mesh.rotation.y = this.targetSpace.rotation;
      
      // Mark space as occupied
      parkingLot.setSpaceOccupied(this.targetSpace, true);
    } else if (distanceToTarget < 5) {
      // Slow down as we approach
      this.speed = Math.max(this.speed - this.acceleration * deltaTime, 0.5);
    } else {
      // Accelerate to max speed
      this.speed = Math.min(this.speed + this.acceleration * deltaTime, this.maxSpeed);
    }
    
    // Update position based on speed
    const moveDirection = new THREE.Vector3(0, 0, -1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0), 
      this.mesh.rotation.y
    );
    this.mesh.position.add(moveDirection.multiplyScalar(this.speed * deltaTime));
  }
  
  /**
   * Find a parking space in the lot
   * @param {ParkingLot} parkingLot - Reference to the parking lot
   */
  findParkingSpace(parkingLot) {
    const space = parkingLot.findAvailableSpace(this.mesh.position);
    
    if (space) {
      this.targetSpace = space;
      this.state = 'moving';
    } else {
      this.state = 'waiting';
    }
  }
  
  /**
   * Leave the current parking space
   * @param {ParkingLot} parkingLot - Reference to the parking lot
   */
  leaveParking(parkingLot) {
    if (this.targetSpace) {
      // Mark space as unoccupied
      parkingLot.setSpaceOccupied(this.targetSpace, false);
      
      // Set target to exit position
      this.targetSpace = {
        position: new THREE.Vector3(-50, 0, 0),
        rotation: 0
      };
      
      this.state = 'moving';
    }
  }
  
  /**
   * Check if the vehicle is currently parked
   * @return {boolean} Whether the vehicle is parked
   */
  isParked() {
    return this.state === 'parked';
  }
  
  /**
   * Check if the vehicle is currently moving
   * @return {boolean} Whether the vehicle is moving
   */
  isMoving() {
    return this.state === 'moving';
  }
  
  /**
   * Get the current wait time
   * @return {number} Wait time in seconds
   */
  getWaitTime() {
    return this.state === 'waiting' ? this.waitTime : 0;
  }
}