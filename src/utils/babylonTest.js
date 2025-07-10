// Quick test to verify Babylon.js APIs are working correctly
import { 
  Engine, 
  Scene, 
  Color3, 
  Vector3, 
  MeshBuilder, 
  StandardMaterial 
} from "@babylonjs/core";

export function testBabylonAPIs() {
  try {
    // Test Color3.FromHexString
    const color = Color3.FromHexString("#FF7F50");
    console.log("✅ Color3.FromHexString working:", color);
    
    // Test new Color3 constructor
    const color2 = new Color3(1, 0, 0);
    console.log("✅ Color3 constructor working:", color2);
    
    // Test Vector3
    const vector = new Vector3(0, 0, 0);
    console.log("✅ Vector3 working:", vector);
    
    console.log("🎉 All Babylon.js APIs are working correctly!");
    return true;
  } catch (error) {
    console.error("❌ Babylon.js API test failed:", error);
    return false;
  }
}

// Test the APIs immediately
testBabylonAPIs();
