// iOS Compatibility Test Utility
// This script helps identify and debug iOS-specific issues

export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const getIOSVersion = () => {
  if (!isIOS()) return null;
  
  const userAgent = navigator.userAgent;
  const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
  
  if (match) {
    const major = parseInt(match[1]);
    const minor = parseInt(match[2]);
    const patch = match[3] ? parseInt(match[3]) : 0;
    return { major, minor, patch, version: `${major}.${minor}.${patch}` };
  }
  
  return null;
};

export const testWebRTCSupport = async () => {
  const results = {
    mediaDevices: false,
    getUserMedia: false,
    RTCPeerConnection: false,
    audioContext: false,
    videoSupport: false,
    audioSupport: false
  };
  
  try {
    // Test mediaDevices
    results.mediaDevices = !!(navigator.mediaDevices);
    
    // Test getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      results.getUserMedia = true;
      
      // Test audio support
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        results.audioSupport = true;
        audioStream.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.warn('Audio not supported:', e.message);
      }
      
      // Test video support
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        results.videoSupport = true;
        videoStream.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.warn('Video not supported:', e.message);
      }
    }
    
    // Test RTCPeerConnection
    results.RTCPeerConnection = !!(window.RTCPeerConnection || window.webkitRTCPeerConnection);
    
    // Test AudioContext
    results.audioContext = !!(window.AudioContext || window.webkitAudioContext);
    
  } catch (error) {
    console.error('WebRTC test failed:', error);
  }
  
  return results;
};

export const testSocketIOSupport = () => {
  const results = {
    websocket: false,
    polling: false,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine
  };
  
  // Test WebSocket support
  results.websocket = !!(window.WebSocket || window.MozWebSocket);
  
  // Test polling (XMLHttpRequest)
  results.polling = !!(window.XMLHttpRequest);
  
  return results;
};

export const testCSSSupport = () => {
  const results = {
    flexbox: false,
    grid: false,
    backdropFilter: false,
    webkitBackdropFilter: false,
    safeArea: false,
    viewportUnits: false
  };
  
  // Test Flexbox
  const flexTest = document.createElement('div');
  flexTest.style.display = 'flex';
  results.flexbox = flexTest.style.display === 'flex';
  
  // Test Grid
  const gridTest = document.createElement('div');
  gridTest.style.display = 'grid';
  results.grid = gridTest.style.display === 'grid';
  
  // Test Backdrop Filter
  const backdropTest = document.createElement('div');
  backdropTest.style.backdropFilter = 'blur(10px)';
  results.backdropFilter = backdropTest.style.backdropFilter !== '';
  
  // Test WebKit Backdrop Filter
  backdropTest.style.webkitBackdropFilter = 'blur(10px)';
  results.webkitBackdropFilter = backdropTest.style.webkitBackdropFilter !== '';
  
  // Test Safe Area
  results.safeArea = CSS.supports('padding-top', 'env(safe-area-inset-top)');
  
  // Test Viewport Units
  results.viewportUnits = CSS.supports('height', '100vh');
  
  return results;
};

export const testPerformance = () => {
  const results = {
    deviceMemory: navigator.deviceMemory || 'unknown',
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    } : 'unknown',
    screen: {
      width: screen.width,
      height: screen.height,
      pixelRatio: window.devicePixelRatio
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
  
  return results;
};

export const runComprehensiveTest = async () => {
  console.log('🔍 Starting iOS Compatibility Test...');
  
  const testResults = {
    isIOS: isIOS(),
    iosVersion: getIOSVersion(),
    webRTC: await testWebRTCSupport(),
    socketIO: testSocketIOSupport(),
    css: testCSSSupport(),
    performance: testPerformance(),
    timestamp: new Date().toISOString()
  };
  
  console.log('📊 iOS Compatibility Test Results:', testResults);
  
  // Generate recommendations
  const recommendations = [];
  
  if (testResults.isIOS) {
    console.log('📱 iOS Device Detected');
    
    if (testResults.iosVersion) {
      console.log(`📱 iOS Version: ${testResults.iosVersion.version}`);
      
      if (testResults.iosVersion.major < 12) {
        recommendations.push('⚠️ iOS version below 12 may have limited WebRTC support');
      }
    }
    
    if (!testResults.webRTC.getUserMedia) {
      recommendations.push('❌ getUserMedia not supported - video calls will not work');
    }
    
    if (!testResults.webRTC.videoSupport) {
      recommendations.push('⚠️ Video capture not supported - only voice calls available');
    }
    
    if (!testResults.webRTC.audioSupport) {
      recommendations.push('❌ Audio capture not supported - calls will not work');
    }
    
    if (!testResults.socketIO.websocket) {
      recommendations.push('⚠️ WebSocket not supported - real-time features may not work');
    }
    
    if (!testResults.css.flexbox) {
      recommendations.push('⚠️ Flexbox not supported - layout may be broken');
    }
    
    if (!testResults.css.safeArea) {
      recommendations.push('⚠️ Safe area not supported - UI may overlap with system UI');
    }
  } else {
    console.log('🖥️ Non-iOS Device Detected');
  }
  
  if (recommendations.length > 0) {
    console.log('💡 Recommendations:');
    recommendations.forEach(rec => console.log(rec));
  } else {
    console.log('✅ All compatibility checks passed!');
  }
  
  return {
    results: testResults,
    recommendations
  };
};

export const testVideoCallCompatibility = async () => {
  console.log('🎥 Testing Video Call Compatibility...');
  
  const results = await testWebRTCSupport();
  
  if (results.videoSupport && results.audioSupport) {
    console.log('✅ Video calls should work properly');
    return true;
  } else if (results.audioSupport) {
    console.log('⚠️ Only voice calls supported');
    return 'voice-only';
  } else {
    console.log('❌ No media support - calls will not work');
    return false;
  }
};

export const testSocketConnection = (socket) => {
  return new Promise((resolve) => {
    if (!socket) {
      resolve({ connected: false, error: 'No socket provided' });
      return;
    }
    
    const timeout = setTimeout(() => {
      resolve({ connected: false, error: 'Connection timeout' });
    }, 5000);
    
    socket.on('connect', () => {
      clearTimeout(timeout);
      resolve({ connected: true, transport: socket.io.engine.transport.name });
    });
    
    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      resolve({ connected: false, error: error.message });
    });
    
    // If already connected
    if (socket.connected) {
      clearTimeout(timeout);
      resolve({ connected: true, transport: socket.io.engine.transport.name });
    }
  });
};

// Auto-run test on load if in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    runComprehensiveTest();
  }, 1000);
}

export default {
  isIOS,
  getIOSVersion,
  testWebRTCSupport,
  testSocketIOSupport,
  testCSSSupport,
  testPerformance,
  runComprehensiveTest,
  testVideoCallCompatibility,
  testSocketConnection
}; 