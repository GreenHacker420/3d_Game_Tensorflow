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
  Mesh
 } from "babylonjs"
import GUI from 'babylonjs-gui';


export default class Game{

  constructor(canvas){
    this.canvas = canvas;
    this.engine = new Engine(this.canvas, true);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color3.FromHexString("#888888");
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
      if (this.back){
        if (this.box1.position.x >= -50){
          this.box1.position.x -= 1;
        }
      }
      else{
        if (this.box1.position.x <= 50){
          this.box1.position.x += 1;
        }
      }
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
    this.skyboxMaterial.reflectionTexture = new HDRCubeTexture('src/utils/moonlit_golf_2k.hdr', this.scene, 512, false, true, false, true);
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

    this.box1.position.x = 5;
    this.box1.position.y = -15;

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
        // Calculate movement delta
        const deltaX = handState.position.x - this.lastHandPosition.x;
        const deltaY = handState.position.y - this.lastHandPosition.y;

        // Update box position with constraints
        const newX = this.box1.position.x + (deltaX * this.moveSpeed);
        const newY = this.box1.position.y - (deltaY * this.moveSpeed); // Invert Y for natural movement

        this.box1.position.x = Math.max(-50, Math.min(50, newX));
        this.box1.position.y = Math.max(-25, Math.min(-5, newY));
      }
    }

    // Update last position
    this.lastHandPosition = { ...handState.position };
  }
}
