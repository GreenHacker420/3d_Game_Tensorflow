import {
  Vector3,
  PhysicsImpostor,
  CannonJSPlugin,
  AmmoJSPlugin,
  HavokPlugin
} from "@babylonjs/core";

// Import physics engines (these need to be loaded separately)
// import * as CANNON from 'cannon';
// import Ammo from 'ammojs-typed';

export class PhysicsManager {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = {
      engine: 'cannon', // 'cannon', 'ammo', 'havok'
      gravity: new Vector3(0, -9.81, 0),
      enableDebug: false,
      ...options
    };
    
    this.physicsEngine = null;
    this.physicsObjects = new Map();
    this.collisionCallbacks = new Map();
    this.forceFields = [];
    
    this.initializePhysics();
  }

  async initializePhysics() {
    try {
      switch (this.options.engine) {
        case 'cannon':
          await this.initializeCannon();
          break;
        case 'ammo':
          await this.initializeAmmo();
          break;
        case 'havok':
          await this.initializeHavok();
          break;
        default:
          console.warn('Unknown physics engine, falling back to Cannon');
          await this.initializeCannon();
      }
      
      console.log(`✅ Physics engine (${this.options.engine}) initialized successfully`);
      
      if (this.options.enableDebug) {
        this.enableDebugMode();
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize physics engine:', error);
      this.physicsEngine = null;
    }
  }

  async initializeCannon() {
    // For now, we'll use a simplified approach without external CANNON import
    // In a real implementation, you would import CANNON.js
    try {
      // const cannonPlugin = new CannonJSPlugin(true, 10, CANNON);
      // this.scene.enablePhysics(this.options.gravity, cannonPlugin);
      
      // Fallback: Use Babylon's built-in physics without external engine
      this.scene.enablePhysics(this.options.gravity, null);
      this.physicsEngine = 'cannon-fallback';
    } catch (error) {
      console.warn('Cannon.js not available, using fallback physics');
      this.scene.enablePhysics(this.options.gravity, null);
      this.physicsEngine = 'fallback';
    }
  }

  async initializeAmmo() {
    try {
      // const ammoPlugin = new AmmoJSPlugin(true, Ammo);
      // this.scene.enablePhysics(this.options.gravity, ammoPlugin);
      
      // Fallback for now
      this.scene.enablePhysics(this.options.gravity, null);
      this.physicsEngine = 'ammo-fallback';
    } catch (error) {
      console.warn('Ammo.js not available, using fallback physics');
      this.scene.enablePhysics(this.options.gravity, null);
      this.physicsEngine = 'fallback';
    }
  }

  async initializeHavok() {
    try {
      // Havok is a premium physics engine
      // const havokPlugin = new HavokPlugin();
      // this.scene.enablePhysics(this.options.gravity, havokPlugin);
      
      // Fallback for now
      this.scene.enablePhysics(this.options.gravity, null);
      this.physicsEngine = 'havok-fallback';
    } catch (error) {
      console.warn('Havok not available, using fallback physics');
      this.scene.enablePhysics(this.options.gravity, null);
      this.physicsEngine = 'fallback';
    }
  }

  // Add physics to a mesh
  addPhysicsToMesh(mesh, options = {}) {
    if (!this.scene.isPhysicsEnabled()) {
      console.warn('Physics not enabled, cannot add physics to mesh');
      return null;
    }

    const defaultOptions = {
      mass: 1,
      restitution: 0.7,
      friction: 0.5,
      impostor: PhysicsImpostor.BoxImpostor
    };

    const physicsOptions = { ...defaultOptions, ...options };

    try {
      // Create physics impostor
      mesh.physicsImpostor = new PhysicsImpostor(
        mesh,
        physicsOptions.impostor,
        {
          mass: physicsOptions.mass,
          restitution: physicsOptions.restitution,
          friction: physicsOptions.friction
        },
        this.scene
      );

      // Store reference
      this.physicsObjects.set(mesh.id, {
        mesh,
        impostor: mesh.physicsImpostor,
        options: physicsOptions
      });

      // Set up collision detection
      if (physicsOptions.onCollision) {
        this.setupCollisionDetection(mesh, physicsOptions.onCollision);
      }

      return mesh.physicsImpostor;
    } catch (error) {
      console.error('Failed to add physics to mesh:', error);
      return null;
    }
  }

  // Apply force to a mesh
  applyForce(mesh, force, contactPoint = null) {
    if (!mesh.physicsImpostor) {
      console.warn('Mesh has no physics impostor');
      return;
    }

    try {
      if (contactPoint) {
        mesh.physicsImpostor.applyImpulse(force, contactPoint);
      } else {
        mesh.physicsImpostor.applyImpulse(force, mesh.getAbsolutePosition());
      }
    } catch (error) {
      console.error('Failed to apply force:', error);
    }
  }

  // Apply gesture-based force
  applyGestureForce(mesh, gesture, handPosition, strength = 1.0) {
    if (!mesh.physicsImpostor) return;

    const forceMultiplier = 10 * strength;
    let force = new Vector3(0, 0, 0);

    switch (gesture) {
      case 'pinch':
        // Pull object towards hand
        const direction = handPosition.subtract(mesh.getAbsolutePosition()).normalize();
        force = direction.scale(forceMultiplier * 0.5);
        break;
        
      case 'open_hand':
        // Push object away from hand
        const pushDirection = mesh.getAbsolutePosition().subtract(handPosition).normalize();
        force = pushDirection.scale(forceMultiplier);
        break;
        
      case 'closed_fist':
        // Apply downward force
        force = new Vector3(0, -forceMultiplier * 2, 0);
        break;
        
      case 'thumbs_up':
        // Apply upward force
        force = new Vector3(0, forceMultiplier * 2, 0);
        break;
        
      case 'victory':
        // Apply random force for fun
        force = new Vector3(
          (Math.random() - 0.5) * forceMultiplier,
          Math.random() * forceMultiplier,
          (Math.random() - 0.5) * forceMultiplier
        );
        break;
        
      default:
        return;
    }

    this.applyForce(mesh, force);
  }

  // Set up collision detection
  setupCollisionDetection(mesh, callback) {
    if (!mesh.physicsImpostor) return;

    mesh.physicsImpostor.registerOnPhysicsCollide(null, (main, collided) => {
      const collisionInfo = {
        mainMesh: main.object,
        collidedMesh: collided.object,
        point: main.object.getAbsolutePosition(),
        impulse: main.object.physicsImpostor.getLinearVelocity().length()
      };
      
      callback(collisionInfo);
    });

    this.collisionCallbacks.set(mesh.id, callback);
  }

  // Create force field
  createForceField(position, radius, strength, type = 'attract') {
    const forceField = {
      id: Date.now(),
      position: position.clone(),
      radius,
      strength,
      type, // 'attract', 'repel', 'vortex'
      active: true
    };

    this.forceFields.push(forceField);
    return forceField;
  }

  // Update force fields (call this in render loop)
  updateForceFields() {
    if (!this.scene.isPhysicsEnabled()) return;

    this.forceFields.forEach(field => {
      if (!field.active) return;

      this.physicsObjects.forEach(({ mesh }) => {
        if (!mesh.physicsImpostor) return;

        const distance = Vector3.Distance(mesh.getAbsolutePosition(), field.position);
        if (distance > field.radius) return;

        const direction = field.position.subtract(mesh.getAbsolutePosition()).normalize();
        const falloff = 1 - (distance / field.radius);
        const force = direction.scale(field.strength * falloff);

        switch (field.type) {
          case 'attract':
            this.applyForce(mesh, force);
            break;
          case 'repel':
            this.applyForce(mesh, force.negate());
            break;
          case 'vortex':
            const tangent = Vector3.Cross(direction, Vector3.Up()).normalize();
            this.applyForce(mesh, tangent.scale(field.strength * falloff));
            break;
        }
      });
    });
  }

  // Enable debug visualization
  enableDebugMode() {
    if (this.scene.isPhysicsEnabled() && this.scene.getPhysicsEngine()) {
      try {
        // Enable physics debug rendering if available
        this.scene.debugLayer.show({
          embedMode: true,
          overlay: true
        });
      } catch (error) {
        console.warn('Physics debug mode not available:', error);
      }
    }
  }

  // Clean up physics object
  removePhysics(mesh) {
    if (mesh.physicsImpostor) {
      mesh.physicsImpostor.dispose();
      mesh.physicsImpostor = null;
    }

    this.physicsObjects.delete(mesh.id);
    this.collisionCallbacks.delete(mesh.id);
  }

  // Clean up all physics
  dispose() {
    this.physicsObjects.forEach(({ mesh }) => {
      this.removePhysics(mesh);
    });

    this.physicsObjects.clear();
    this.collisionCallbacks.clear();
    this.forceFields = [];

    if (this.scene.isPhysicsEnabled()) {
      this.scene.disablePhysicsEngine();
    }
  }

  // Get physics info
  getPhysicsInfo() {
    return {
      engine: this.physicsEngine,
      enabled: this.scene.isPhysicsEnabled(),
      objectCount: this.physicsObjects.size,
      forceFieldCount: this.forceFields.length,
      gravity: this.options.gravity
    };
  }
}

// Utility functions
export const createPhysicsPresets = () => ({
  LIGHT: { mass: 0.5, restitution: 0.8, friction: 0.3 },
  NORMAL: { mass: 1.0, restitution: 0.7, friction: 0.5 },
  HEAVY: { mass: 2.0, restitution: 0.4, friction: 0.8 },
  BOUNCY: { mass: 0.8, restitution: 0.9, friction: 0.2 },
  STICKY: { mass: 1.2, restitution: 0.2, friction: 0.9 }
});

export const getImpostorForShape = (shape) => {
  const impostors = {
    'box': PhysicsImpostor.BoxImpostor,
    'sphere': PhysicsImpostor.SphereImpostor,
    'cylinder': PhysicsImpostor.CylinderImpostor,
    'plane': PhysicsImpostor.PlaneImpostor,
    'mesh': PhysicsImpostor.MeshImpostor
  };
  
  return impostors[shape] || PhysicsImpostor.BoxImpostor;
};
