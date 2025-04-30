import React, { useRef, useEffect, useState } from 'react'
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import Webcam from 'react-webcam';
import { drawHand } from './utils';
import Game from './utils/game';

import './App.css'

function App() {
  const webcamRef = useRef();
  const canvasRef = useRef();
  const gameCanvasRef = useRef();
  const gameRef = useRef();
  const [isLoading, setIsLoading] = useState(false);

  const initializeHandpose = async () => {

    setIsLoading(true);


    const net = await handpose.load();
    setIsLoading(false);
    setInterval(() => {
      detect(net);
    }, 50)
  }
  const detect = async (net) => {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      canvasRef.current.width = webcamRef.current.video.videoWidth;
      canvasRef.current.height = webcamRef.current.video.videoHeight;
      
      const hand = await net.estimateHands(webcamRef.current.video);
      const handState = drawHand(hand, canvasRef.current.getContext('2d'));
      
      gameRef.current.moveBox(handState);
    }
  }
  useEffect(() => {
    gameCanvasRef.current.width = window.innerWidth / 2;
    gameCanvasRef.current.height = window.innerHeight - 100;

    gameRef.current = new Game(gameCanvasRef.current);
    initializeHandpose();
  }, [])
  return (
    <>
      <div className="App">
        <div className="webcam-ai__container">
          {isLoading && <h1 style={{zIndex: 10, color: '#fff'}}>Initializing AI Model...</h1>}
          <Webcam ref={webcamRef} className="webcam"/>
          <canvas className="webcam-ai__canvas" ref={canvasRef}/>
        </div>
        <div className="game">
          <canvas className="game__canvas" ref={gameCanvasRef}/>
        </div>
      </div>
      <footer className="footer">
        <div className="instructions">
          <h2>Hand Controls</h2>
          <ul>
            <li><span className="emoji">👆</span> Move Hand: Control box position</li>
            <li><span className="emoji">🤏</span> Pinch: Enter resize mode</li>
            <li><span className="emoji">✋</span> While Pinched: Move hand apart/together to resize</li>
            <li><span className="emoji">👋</span> Release Pinch: Return to movement mode</li>
          </ul>
        </div>
      </footer>
    </>
  )
}

export default App
