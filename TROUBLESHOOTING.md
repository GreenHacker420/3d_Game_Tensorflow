# Troubleshooting Guide

## Common Issues and Solutions

### 🎥 Webcam Issues

#### Problem: "Hand Detection: Error" or webcam not working
**Solutions:**
1. **Check browser permissions**: Ensure webcam access is allowed
2. **Close other applications**: Make sure no other app is using the webcam
3. **Refresh the page**: Sometimes a simple refresh resolves permission issues
4. **Try a different browser**: Chrome/Edge work best for WebGL and webcam support

#### Problem: Poor hand detection accuracy
**Solutions:**
1. **Improve lighting**: Ensure good, even lighting on your hands
2. **Clear background**: Avoid busy backgrounds behind your hands
3. **Proper distance**: Keep your hand about arm's length from the camera
4. **Hand visibility**: Keep your entire hand visible in the webcam frame

### 🎮 3D Scene Issues

#### Problem: "3D Scene: Error" or black screen
**Solutions:**
1. **Check WebGL support**: Visit `chrome://gpu/` to verify WebGL is enabled
2. **Update graphics drivers**: Ensure your graphics drivers are up to date
3. **Disable browser extensions**: Some extensions can interfere with WebGL
4. **Try hardware acceleration**: Enable hardware acceleration in browser settings

#### Problem: Low performance or choppy movement
**Solutions:**
1. **Close other tabs**: Free up browser resources
2. **Check FPS in HUD**: Target is 60fps, anything below 30fps indicates issues
3. **Reduce browser zoom**: Try 100% zoom level
4. **Check system resources**: Close other resource-intensive applications

### 🔧 Application Issues

#### Problem: Multiple initialization messages in console
**Solution:** This is normal during development with hot module replacement (HMR). It doesn't affect functionality.

#### Problem: Hand detection starts but cube doesn't move
**Solutions:**
1. **Check gesture recognition**: Make sure you're making clear gestures
2. **Verify hand tracking**: Look for green dots on your hand in the webcam view
3. **Check confidence levels**: Gestures need >60% confidence to register

#### Problem: Application won't load
**Solutions:**
1. **Check console errors**: Open browser dev tools (F12) and check for errors
2. **Clear browser cache**: Hard refresh with Ctrl+Shift+R
3. **Verify dependencies**: Run `yarn install` to ensure all packages are installed

### 📊 Performance Monitoring

#### Understanding the HUD:
- **FPS**: Should be 50-60 for smooth operation
- **Latency**: Should be <30ms for responsive interaction
- **Hand Tracking**: Shows current gesture and confidence level
- **Cube Info**: Displays cube position and scale

#### Performance Targets:
- **Excellent**: 60 FPS, <20ms latency
- **Good**: 45-60 FPS, 20-30ms latency  
- **Fair**: 30-45 FPS, 30-50ms latency
- **Poor**: <30 FPS, >50ms latency

### 🌐 Browser Compatibility

#### Recommended Browsers:
1. **Chrome/Chromium**: Best performance and compatibility
2. **Microsoft Edge**: Excellent support, similar to Chrome
3. **Firefox**: Good support, slightly lower performance
4. **Safari**: Basic support, limited WebGL features

#### Required Features:
- WebGL 2.0 support
- MediaDevices API (for webcam)
- ES6+ JavaScript support
- Hardware acceleration enabled

### 🛠️ Development Issues

#### Problem: Hot reload not working
**Solution:** Restart the development server with `yarn dev`

#### Problem: TypeScript errors (if using TypeScript)
**Solution:** The project is JavaScript-based. Ensure you're not mixing TypeScript files.

#### Problem: Import/export errors
**Solution:** Check file extensions (.js vs .jsx) and ensure proper import paths

### 📱 Mobile/Touch Devices

#### Limitations:
- Webcam access may be limited on mobile browsers
- Performance may be reduced on lower-end devices
- Touch gestures are not supported (hand gestures only)

#### Recommendations:
- Use desktop/laptop for best experience
- Ensure good lighting for mobile webcam
- Close other apps to free up resources

### 🔍 Debug Information

#### Useful Console Commands:
```javascript
// Check WebGL support
console.log(!!window.WebGLRenderingContext);

// Check webcam support  
console.log(!!navigator.mediaDevices?.getUserMedia);

// Check current performance
console.log(performance.now());
```

#### Browser Developer Tools:
1. **Console Tab**: Check for JavaScript errors
2. **Network Tab**: Verify all resources load correctly
3. **Performance Tab**: Analyze rendering performance
4. **Application Tab**: Check for storage/permission issues

### 📞 Getting Help

If you're still experiencing issues:

1. **Check the browser console** for specific error messages
2. **Note your browser version** and operating system
3. **Describe the specific steps** that lead to the problem
4. **Include performance metrics** from the HUD if available

### 🔄 Reset Instructions

To completely reset the application:
1. Refresh the page (F5)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Restart the development server (`yarn dev`)
4. Check webcam permissions in browser settings
