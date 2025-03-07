import * as THREE from 'three';

/**
 * Class representing a parking lot with spaces and aisles
 */
export class ParkingLot {
  constructor(options) {
    this.rows = options.rows || 3;
    this.columns = options.columns || 5;
    this.spaceWidth = options.spaceWidth || 3;
    this.spaceLength = options.spaceLength || 6;
    this.aisleWidth = options.aisleWidth || 8;
    
    this.spaces = [];
    this.mesh = new THREE.Group();
    
    this.totalWidth = this.columns * this.spaceWidth;
    this.totalLength = (this.rows * this.spaceLength * 2) + this.aisleWidth;
    
    this.createParkingLot();
  }
  
  createParkingLot() {
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(
      this.totalWidth + 10, 
      this.totalLength + 10
    );
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.receiveShadow = true;
    this.mesh.add(ground);
    
    // Create parking spaces
    this.createParkingSpaces();
    
    // Create lane markings
    this.createLaneMarkings();
  }
  
  createParkingSpaces() {
    const spaceGeometry = new THREE.PlaneGeometry(
      this.spaceWidth * 0.9, 
      this.spaceLength * 0.9
    );
    const spaceMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x666666,
      roughness: 0.7,
      metalness: 0.3
    });
    
    // Create spaces on both sides of the aisle
    for (let side = 0; side < 2; side++) {
      // Calculate z offset based on which side of the aisle we're on
      const zOffset = side === 0 
        ? -this.aisleWidth / 2 - this.spaceLength / 2 
        : this.aisleWidth / 2 + this.spaceLength / 2;
      
      // Direction vehicles face in this row
      const facingDirection = side === 0 ? Math.PI : 0;
      
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.columns; col++) {
          // Create individual parking space
          const space = new THREE.Mesh(spaceGeometry, spaceMaterial);
          space.rotation.x = -Math.PI / 2; // Rotate to be horizontal
          
          const xPos = (col * this.spaceWidth) - (this.totalWidth / 2) + (this.spaceWidth / 2);
          const zPos = zOffset + (row * this.spaceLength * (side === 0 ? -1 : 1));
          
          space.position.set(xPos, 0.01, zPos); // Slightly above ground to prevent z-fighting
          space.receiveShadow = true;
          
          this.mesh.add(space);
          
          // Store information about this space
          this.spaces.push({
            row,
            col,
            side,
            position: new THREE.Vector3(xPos, 0, zPos),
            rotation: facingDirection,
            occupied: false,
            mesh: space
          });
        }
      }
    }
  }
  
  createLaneMarkings() {
    // Create center line
    const centerLineGeometry = new THREE.PlaneGeometry(
      this.totalWidth + 5, 
      0.15
    );
    const linesMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFFF,
      roughness: 0.5
    });
    
    const centerLine = new THREE.Mesh(centerLineGeometry, linesMaterial);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = 0.02; // Slightly above ground
    this.mesh.add(centerLine);
    
    // Create parking space dividers
    const dividerGeometry = new THREE.PlaneGeometry(
      0.1, 
      this.spaceLength * 0.8
    );
    
    // Add dividers on both sides of the aisle
    for (let side = 0; side < 2; side++) {
      const zOffset = side === 0 
        ? -this.aisleWidth / 2 - this.spaceLength / 2 
        : this.aisleWidth / 2 + this.spaceLength / 2;
      
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col <= this.columns; col++) {
          const divider = new THREE.Mesh(dividerGeometry, linesMaterial);
          divider.rotation.x = -Math.PI / 2;
          
          const xPos = (col * this.spaceWidth) - (this.totalWidth / 2);
          const zPos = zOffset + (row * this.spaceLength * (side === 0 ? -1 : 1));
          
          divider.position.set(xPos, 0.025, zPos);
          this.mesh.add(divider);
        }
      }
    }
    
    // Add entrance/exit
    const entranceGeometry = new THREE.PlaneGeometry(8, 0.5);
    const entranceMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 }); // Yellow
    const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.rotation.x = -Math.PI / 2;
    entrance.position.set(-this.totalWidth / 2 - 4, 0.03, 0);
    this.mesh.add(entrance);
  }
  
  /**
   * Get the total number of parking spaces
   * @return {number} Total spaces
   */
  getTotalSpaces() {
    return this.spaces.length;
  }
  
  /**
   * Find the closest available parking space to a given position
   * @param {THREE.Vector3} position - Position to find closest space to
   * @return {Object|null} Space object or null if none available
   */
  findAvailableSpace(position) {
    let closestSpace = null;
    let closestDistance = Infinity;
    
    for (const space of this.spaces) {
      if (!space.occupied) {
        const distance = position.distanceTo(space.position);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSpace = space;
        }
      }
    }
    
    return closestSpace;
  }
  
  /**
   * Mark a space as occupied or unoccupied
   * @param {Object} space - Space object to update
   * @param {boolean} isOccupied - Whether space is occupied
   */
  setSpaceOccupied(space, isOccupied) {
    if (space && this.spaces.includes(space)) {
      space.occupied = isOccupied;
      
      // Visual feedback
      space.mesh.material.color.set(isOccupied ? 0x555555 : 0x666666);
    }
  }
}