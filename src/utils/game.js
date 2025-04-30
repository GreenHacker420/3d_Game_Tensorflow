import { 
  Engine, 
  HDRCubeTexture, 
  Scene, 
  UniversalCamera, 
  HemisphericLight,
  Vector3,
  Color3,
  StandardMaterial,
  Texture,
  AssetsManager,
  Mesh,
  ActionManager
 } from "babylonjs"
import GUI from 'babylonjs-gui';
import moonlitGolfHDRUrl from './moonlit_golf_2k.hdr?url';


export default class Game{

  constructor(canvas){
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color3.FromHexString("#888888");
    
    // Initialize keyboard input
    this.scene.actionManager = new BABYLON.ActionManager(this.scene);
    
    this.createScene();
    this.runEngineLoop();  
    this.boxMinSize = 3;
    this.boxMaxSize = 8;
    this.moveSpeed = 0.5;
    this.lastHandPosition = null;
    this.isScalingMode = false;
    this.initialFingerSpread = 0;
    this.initialScale = this.boxMinSize;
  }

  createScene(){
    this.camera = new UniversalCamera("UniversalCamera", new Vector3(-90, -10, -10), this.scene);
    this.camera.rotation.x = -3;
    this.camera.setTarget(Vector3.Zero());
    this.camera.attachControl(this.canvas, true);
    this.camera.keysLeft= [65];
    this.camera.keysRight=[68];
    this.camera.keysUp = [87];
    this.camera.keysDown = [83];

    //add light
    this.addLighting();
    // Skybox
    this.generateSkybox();
    
    this.generateMeshes();
    // this.generateModels();
    return this.scene;
  }
  runEngineLoop(){
    this.engine.runRenderLoop(() => {
      // Just render the scene - movement is handled by moveBox method
      this.scene.render();
    });
  }
  getGameInstance(){
    return this.canvas;
  }

  addLighting(){
    var light = new HemisphericLight("hemiLight", new Vector3(-1, 1, 0), this.scene);
    light.diffuse = new Color3(1, 0, 0);
  }

  generateSkybox(){
    this.skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:300.0}, this.scene);
    // skybox.checkCollisions = true;
    this.skybox.ellipsoid = new Vector3(3,3,3);
    
    this.skyboxMaterial = new StandardMaterial("skyBox", this.scene);
    this.skyboxMaterial.backFaceCulling = false;
    this.skyboxMaterial.reflectionTexture = new HDRCubeTexture(moonlitGolfHDRUrl, this.scene, 512, false, true, false, true);
    this.skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    this.skyboxMaterial.disableLighting = true;

    this.skybox.material = this.skyboxMaterial;			
  }

  generateModels(){
    this.assetsLoader = new AssetsManager(this.scene);
    this.planeModel = this.assetsLoader.addMeshTask("ship", "", "models/", "ship.obj");

    this.assetsLoader.onFinish = (tasks) => {
      console.log(this.scene.meshes.length);
      this.runEngineLoop();
      console.log('assets loaded');
    }
    this.assetsLoader.load();
  }

  generateMeshes(){
    this.box1 = new Mesh.CreateBox("Box1", 5, this.scene);
    
    const coralMaterial = new StandardMaterial("coral_mat", this.scene);
    coralMaterial.diffuseColor = new Color3.FromHexString("#FF7F50");
    this.box1.material = coralMaterial;

    // Set initial position to center of scene
    this.box1.position.x = 0;
    this.box1.position.y = 0;
    this.box1.position.z = 0;

    this.scene.gravity = new Vector3(0, -9.81, 0);
    this.scene.collisionsEnabled = true;
  }

  moveBox(handState) {
    if (!handState || !handState.isTracking || !this.box1) return;

    // Initialize last position if not set
    if (!this.lastHandPosition && handState.isTracking) {
      this.lastHandPosition = { ...handState.position };
      return;
    }

    // Handle scaling mode
    if (handState.isPinched) {
      if (!this.isScalingMode) {
        // Enter scaling mode
        this.isScalingMode = true;
        this.initialFingerSpread = handState.fingerSpread;
        this.initialScale = this.box1.scaling.x;
      } else {
        // Update scale
        const scaleDelta = (handState.fingerSpread - this.initialFingerSpread) / 100;
        const newScale = Math.max(
          this.boxMinSize,
          Math.min(this.boxMaxSize, this.initialScale + scaleDelta)
        );
        
        this.box1.scaling.x = newScale;
        this.box1.scaling.y = newScale;
        this.box1.scaling.z = newScale;
      }
    } else {
      // Exit scaling mode
      if (this.isScalingMode) {
        this.isScalingMode = false;
        this.lastHandPosition = { ...handState.position };
      }
      
      // Handle movement only when not in scaling mode
      if (!this.isScalingMode) {
        // Get canvas dimensions
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        // Map webcam coordinates (640x480) to scene coordinates
        // Adjust these values based on your scene's coordinate system
        const sceneWidth = 100; // Total width of scene from -50 to 50
        const sceneHeight = 80; // Total height of scene from -40 to 40

        // Calculate mapped coordinates
        const mappedX = ((handState.position.x / 640) * sceneWidth) - (sceneWidth / 2);
        const mappedY = ((1 - handState.position.y / 480) * sceneHeight) - (sceneHeight / 2);

        // Calculate box boundaries (considering box size)
        const boxSize = this.box1.scaling.x * 5; // 5 is the original box size
        const boundaryOffset = boxSize / 2;

        // Apply boundaries
        const targetX = Math.max(
          -(sceneWidth/2) + boundaryOffset,
          Math.min(sceneWidth/2 - boundaryOffset, mappedX)
        );
        
        const targetY = Math.max(
          -(sceneHeight/2) + boundaryOffset,
          Math.min(sceneHeight/2 - boundaryOffset, mappedY)
        );

        // Smooth movement using lerp (linear interpolation)
        const lerpFactor = 0.1; // Adjust this value to change movement smoothness (0-1)
        this.box1.position.x += (targetX - this.box1.position.x) * lerpFactor;
        this.box1.position.y += (targetY - this.box1.position.y) * lerpFactor;
      }
    }

    // Update last position
    this.lastHandPosition = { ...handState.position };
  }
}
