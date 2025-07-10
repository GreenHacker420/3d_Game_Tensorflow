import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  PhysicsImpostor
} from "@babylonjs/core";
import { InteractiveObject } from './InteractiveObject';
import { GESTURE_TYPES } from './gestureRecognition';

export class ObjectManager {
  constructor(scene) {
    this.scene = scene;
    this.objects = new Map(); // id -> InteractiveObject
    this.selectedObject = null;
    this.nextId = 1;
    
    // Object creation settings
    this.objectSpacing = 15;
    this.maxObjects = 8;
    
    this.initializeDefaultObjects();
  }

  initializeDefaultObjects() {
    // Create default set of interactive objects
    this.createCube(new Vector3(-20, 0, 0), 'Original Cube');
    this.createSphere(new Vector3(20, 0, 0), 'Red Sphere');
    this.createPyramid(new Vector3(0, 0, 20), 'Blue Pyramid');
    this.createCylinder(new Vector3(0, 0, -20), 'Yellow Cylinder');
  }

  createCube(position, name) {
    const mesh = MeshBuilder.CreateBox(`cube_${this.nextId}`, { size: 5 }, this.scene);
    mesh.position = position;
    
    const material = new StandardMaterial(`cube_mat_${this.nextId}`, this.scene);
    material.diffuseColor = Color3.FromHexString("#FF7F50"); // Coral
    mesh.material = material;
    
    const interactiveObject = new InteractiveObject(mesh, this.scene, 'cube', this.nextId);
    this.objects.set(this.nextId, interactiveObject);
    
    this.nextId++;
    return interactiveObject;
  }

  createSphere(position, name) {
    const mesh = MeshBuilder.CreateSphere(`sphere_${this.nextId}`, { diameter: 6 }, this.scene);
    mesh.position = position;
    
    const material = new StandardMaterial(`sphere_mat_${this.nextId}`, this.scene);
    material.diffuseColor = new Color3(0.8, 0.2, 0.2); // Red
    mesh.material = material;
    
    const interactiveObject = new InteractiveObject(mesh, this.scene, 'sphere', this.nextId);
    this.objects.set(this.nextId, interactiveObject);
    
    this.nextId++;
    return interactiveObject;
  }

  createPyramid(position, name) {
    const mesh = MeshBuilder.CreateCylinder(`pyramid_${this.nextId}`, {
      diameterTop: 0,
      diameterBottom: 8,
      height: 8,
      tessellation: 4
    }, this.scene);
    mesh.position = position;
    
    const material = new StandardMaterial(`pyramid_mat_${this.nextId}`, this.scene);
    material.diffuseColor = new Color3(0.2, 0.2, 0.8); // Blue
    mesh.material = material;
    
    const interactiveObject = new InteractiveObject(mesh, this.scene, 'pyramid', this.nextId);
    this.objects.set(this.nextId, interactiveObject);
    
    this.nextId++;
    return interactiveObject;
  }

  createCylinder(position, name) {
    const mesh = MeshBuilder.CreateCylinder(`cylinder_${this.nextId}`, {
      diameter: 6,
      height: 8
    }, this.scene);
    mesh.position = position;
    
    const material = new StandardMaterial(`cylinder_mat_${this.nextId}`, this.scene);
    material.diffuseColor = new Color3(0.8, 0.8, 0.2); // Yellow
    mesh.material = material;
    
    const interactiveObject = new InteractiveObject(mesh, this.scene, 'cylinder', this.nextId);
    this.objects.set(this.nextId, interactiveObject);
    
    this.nextId++;
    return interactiveObject;
  }

  // Handle gesture for all objects or selected object
  handleGesture(gesture, handState, duration) {
    let handled = false;
    
    // If we have a selected object, prioritize it
    if (this.selectedObject) {
      handled = this.selectedObject.handleGesture(gesture, handState, duration);
      if (handled) return true;
    }
    
    // Otherwise, try to handle with the closest object or all objects
    switch (gesture) {
      case GESTURE_TYPES.POINT:
        // Point gesture selects objects
        handled = this.handleSelection(handState, duration);
        break;
        
      case GESTURE_TYPES.OPEN_HAND:
        // Open hand moves selected object or closest object
        handled = this.handleMovement(handState);
        break;
        
      case GESTURE_TYPES.CLOSED_FIST:
        // Fist grabs objects
        handled = this.handleGrab(handState, duration);
        break;
        
      case GESTURE_TYPES.PINCH:
        // Pinch resizes selected object
        handled = this.handleResize(handState);
        break;
        
      case GESTURE_TYPES.VICTORY:
        // Victory triggers special effects on all objects
        handled = this.handleSpecialEffect(handState, duration);
        break;
        
      case GESTURE_TYPES.THUMBS_UP:
        // Thumbs up activates objects
        handled = this.handleActivation(handState, duration);
        break;
        
      case GESTURE_TYPES.ROCK_ON:
        // Rock on transforms objects
        handled = this.handleTransformation(handState, duration);
        break;
        
      case GESTURE_TYPES.OK_SIGN:
        // OK sign resets objects
        handled = this.handleReset(handState, duration);
        break;
    }
    
    return handled;
  }

  handleSelection(handState, duration) {
    if (duration < 800) return false; // Require hold
    
    const closestObject = this.getClosestObject(handState.position);
    if (closestObject && closestObject.canHandleGesture(GESTURE_TYPES.POINT)) {
      // Deselect current selection
      if (this.selectedObject) {
        this.selectedObject.isSelected = false;
        this.selectedObject.removeSelectionEffect();
      }
      
      // Select new object
      this.selectedObject = closestObject;
      closestObject.select();
      return true;
    }
    return false;
  }

  handleMovement(handState) {
    const targetObject = this.selectedObject || this.getClosestObject(handState.position);
    if (targetObject && targetObject.canHandleGesture(GESTURE_TYPES.OPEN_HAND)) {
      return targetObject.handleOpenHand(handState);
    }
    return false;
  }

  handleGrab(handState, duration) {
    const targetObject = this.selectedObject || this.getClosestObject(handState.position);
    if (targetObject && targetObject.canHandleGesture(GESTURE_TYPES.CLOSED_FIST)) {
      return targetObject.handleClosedFist(handState, duration);
    }
    return false;
  }

  handleResize(handState) {
    const targetObject = this.selectedObject;
    if (targetObject && targetObject.canHandleGesture(GESTURE_TYPES.PINCH)) {
      return targetObject.handlePinch(handState);
    }
    return false;
  }

  handleSpecialEffect(handState, duration) {
    if (duration < 1200) return false;
    
    let handled = false;
    this.objects.forEach(obj => {
      if (obj.canHandleGesture(GESTURE_TYPES.VICTORY)) {
        obj.performSpecialEffect();
        handled = true;
      }
    });
    return handled;
  }

  handleActivation(handState, duration) {
    if (duration < 1000) return false;
    
    const targetObject = this.selectedObject || this.getClosestObject(handState.position);
    if (targetObject && targetObject.canHandleGesture(GESTURE_TYPES.THUMBS_UP)) {
      return targetObject.handleThumbsUp(handState, duration);
    }
    return false;
  }

  handleTransformation(handState, duration) {
    if (duration < 1500) return false;
    
    const targetObject = this.selectedObject || this.getClosestObject(handState.position);
    if (targetObject && targetObject.canHandleGesture(GESTURE_TYPES.ROCK_ON)) {
      return targetObject.handleRockOn(handState, duration);
    }
    return false;
  }

  handleReset(handState, duration) {
    if (duration < 2000) return false;
    
    // Reset all objects
    let handled = false;
    this.objects.forEach(obj => {
      if (obj.canHandleGesture(GESTURE_TYPES.OK_SIGN)) {
        obj.reset();
        handled = true;
      }
    });
    
    // Clear selection
    this.selectedObject = null;
    return handled;
  }

  getClosestObject(handPosition) {
    if (!handPosition || this.objects.size === 0) return null;
    
    let closestObject = null;
    let closestDistance = Infinity;
    
    // Map hand position to 3D space
    const handX = ((handPosition.x / 640) * 100) - 50;
    const handY = ((1 - handPosition.y / 480) * 80) - 40;
    
    this.objects.forEach(obj => {
      const objPos = obj.mesh.position;
      const distance = Math.sqrt(
        Math.pow(objPos.x - handX, 2) + 
        Math.pow(objPos.y - handY, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestObject = obj;
      }
    });
    
    return closestDistance < 30 ? closestObject : null; // Within 30 units
  }

  // Get all object statuses for UI
  getAllObjectStatuses() {
    const statuses = [];
    this.objects.forEach(obj => {
      statuses.push(obj.getStatus());
    });
    return statuses;
  }

  getSelectedObjectStatus() {
    return this.selectedObject ? this.selectedObject.getStatus() : null;
  }

  // Object management
  removeObject(id) {
    const obj = this.objects.get(id);
    if (obj) {
      if (obj === this.selectedObject) {
        this.selectedObject = null;
      }
      obj.dispose();
      obj.mesh.dispose();
      this.objects.delete(id);
    }
  }

  clearAllObjects() {
    this.objects.forEach(obj => {
      obj.dispose();
      obj.mesh.dispose();
    });
    this.objects.clear();
    this.selectedObject = null;
  }

  // Get gesture compatibility info
  getGestureCompatibility(gesture) {
    const compatible = [];
    this.objects.forEach(obj => {
      if (obj.canHandleGesture(gesture)) {
        compatible.push({
          id: obj.id,
          type: obj.type,
          isSelected: obj.isSelected
        });
      }
    });
    return compatible;
  }

  dispose() {
    this.clearAllObjects();
  }
}
