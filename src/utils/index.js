const fingerJoints = {
  thumb: [0,1,2,3,4],
  indexFinger: [0,5,6,7,8],
  middleFinger: [0,9,10,11,12],
  ringFinger: [0,13,14,15,16],
  pinky: [0,17,18,19,20]
}
const fingers = [ 'thumb', 'indexFinger', 'middleFinger', 'ringFinger', 'pinky'];

//maximum close hand distance between joints start to determine as close hand with 
//formula: abs(x1-x2) + abs(y1-y2)
const maxCloseHandDistance = 10;
export const drawHand = (predictions, ctx) => {
  let handState = {
    isPinched: false,
    position: { x: 0, y: 0 },
    fingerSpread: 0,
    isTracking: false
  };

  if (predictions.length > 0) {
    const landmarks = predictions[0].landmarks;
    handState.isTracking = true;
    
    // Draw hand points and connections
    for (let i = 0; i < landmarks.length; i++) {
      const x = landmarks[i][0];
      const y = landmarks[i][1];
      
      // Draw points
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 3 * Math.PI);
      ctx.fillStyle = '#00FF00';
      ctx.fill();
    }

    // Draw finger connections
    for (const finger of Object.keys(fingerJoints)) {
      const points = fingerJoints[finger];
      for (let i = 0; i < points.length - 1; i++) {
        const firstPoint = landmarks[points[i]];
        const secondPoint = landmarks[points[i + 1]];
        
        // Draw lines
        ctx.beginPath();
        ctx.moveTo(firstPoint[0], firstPoint[1]);
        ctx.lineTo(secondPoint[0], secondPoint[1]);
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    
    // Calculate hand position (using index finger base as reference)
    handState.position = {
      x: landmarks[5][0], // Index finger base
      y: landmarks[5][1]
    };

    // Check for pinch (distance between thumb tip and index tip)
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const pinchDistance = Math.sqrt(
      Math.pow(thumbTip[0] - indexTip[0], 2) + 
      Math.pow(thumbTip[1] - indexTip[1], 2)
    );
    
    handState.isPinched = pinchDistance < 30; // Adjust threshold as needed
    
    // Calculate finger spread only when pinched
    if (handState.isPinched) {
      const thumbBase = landmarks[2];
      const pinkyBase = landmarks[17];
      handState.fingerSpread = Math.sqrt(
        Math.pow(thumbBase[0] - pinkyBase[0], 2) + 
        Math.pow(thumbBase[1] - pinkyBase[1], 2)
      );
    }
  }

  return handState;
}
