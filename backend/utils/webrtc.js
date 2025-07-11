// WebRTC utilities

import crypto from 'crypto';


  class WebRTCUtils {
  constructor() {
    // Enhanced ICE servers configuration with fallbacks
    this.iceServers = [
      // Google STUN servers
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      
      // Fallback STUN servers
      { urls: 'stun:stun.voipbuster.com' },
      { urls: 'stun:stun.services.mozilla.com' },
      
      // Add your TURN server configuration here
      // Example configuration:
      /*
      {
        urls: [
          'turn:your-turn-server.com:3478?transport=udp',
          'turn:your-turn-server.com:3478?transport=tcp'
        ],
        username: 'your_username',
        credential: 'your_password',
        credentialType: 'password'
      }
      */
    ];
    
    // Default configuration
    this.defaultConfig = {
      iceTransportPolicy: 'all', // Use relay if needed
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceCandidatePoolSize: 10
    };
  }

  // Generate unique room ID
  generateRoomId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Generate unique session ID
  generateSessionId() {
    return crypto.randomBytes(8).toString('hex');
  }

  // Get ICE servers configuration
  getIceServers() {
    return this.iceServers;
  }

  // Validate WebRTC offer/answer
  validateSDP(sdp) {
    if (!sdp || typeof sdp !== 'string') {
      return false;
    }
    
    // Basic SDP validation
    const requiredLines = ['v=', 'o=', 's=', 't=', 'm='];
    return requiredLines.every(line => sdp.includes(line));
  }

  // Extract media information from SDP
  parseSDP(sdp) {
    const mediaInfo = {
      hasVideo: false,
      hasAudio: false,
      codecs: {
        video: [],
        audio: []
      }
    };

    const lines = sdp.split('\n');
    let currentMedia = null;

    for (const line of lines) {
      if (line.startsWith('m=video')) {
        currentMedia = 'video';
        mediaInfo.hasVideo = true;
      } else if (line.startsWith('m=audio')) {
        currentMedia = 'audio';
        mediaInfo.hasAudio = true;
      } else if (line.startsWith('a=rtpmap:') && currentMedia) {
        const codec = line.split(' ')[1];
        if (codec) {
          mediaInfo.codecs[currentMedia].push(codec);
        }
      }
    }

    return mediaInfo;
  }

  // Create WebRTC configuration
  createRTCConfiguration() {
    return {
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all'
    };
  }

  // Generate connection quality metrics
  generateQualityMetrics(stats) {
    const metrics = {
      audio: {
        packetsLost: 0,
        jitter: 0,
        roundTripTime: 0
      },
      video: {
        packetsLost: 0,
        jitter: 0,
        frameRate: 0,
        resolution: { width: 0, height: 0 }
      },
      bandwidth: {
        available: 0,
        used: 0
      }
    };

    // Parse WebRTC stats to extract quality metrics
    if (stats && stats.length > 0) {
      stats.forEach(stat => {
        if (stat.type === 'inbound-rtp' && stat.mediaType === 'audio') {
          metrics.audio.packetsLost = stat.packetsLost || 0;
          metrics.audio.jitter = stat.jitter || 0;
        } else if (stat.type === 'inbound-rtp' && stat.mediaType === 'video') {
          metrics.video.packetsLost = stat.packetsLost || 0;
          metrics.video.jitter = stat.jitter || 0;
          metrics.video.frameRate = stat.framesPerSecond || 0;
        } else if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
          metrics.audio.roundTripTime = stat.currentRoundTripTime || 0;
        }
      });
    }

    return metrics;
  }

  // Determine call quality based on metrics
  determineCallQuality(metrics) {
    const { audio, video } = metrics;
    
    // Audio quality assessment
    let audioQuality = 'high';
    if (audio.packetsLost > 10 || audio.jitter > 0.1) {
      audioQuality = 'low';
    } else if (audio.packetsLost > 5 || audio.jitter > 0.05) {
      audioQuality = 'medium';
    }

    // Video quality assessment
    let videoQuality = 'high';
    if (video.packetsLost > 20 || video.frameRate < 15) {
      videoQuality = 'low';
    } else if (video.packetsLost > 10 || video.frameRate < 25) {
      videoQuality = 'medium';
    }

    return {
      audioQuality,
      videoQuality,
      overallQuality: audioQuality === 'high' && videoQuality === 'high' ? 'high' : 'medium'
    };
  }

  // Validate user permissions for call
  validateCallPermissions(callerId, receiverId, userPermissions) {
    // Check if users can call each other
    const canCall = userPermissions.some(permission => 
      (permission.from === callerId && permission.to === receiverId) ||
      (permission.from === receiverId && permission.to === callerId)
    );

    return {
      canCall,
      reason: canCall ? 'permitted' : 'no_permission'
    };
  }

  // Generate call constraints based on quality settings
  generateMediaConstraints(quality = 'medium') {
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    };

    switch (quality) {
      case 'low':
        constraints.video = {
          width: { ideal: 320, max: 640 },
          height: { ideal: 240, max: 480 },
          frameRate: { ideal: 15, max: 30 }
        };
        break;
      case 'medium':
        constraints.video = {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 25, max: 30 }
        };
        break;
      case 'high':
      case 'hd':
        constraints.video = {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        };
        break;
    }

    return constraints;
  }

  // Create screen sharing constraints
  generateScreenShareConstraints() {
    return {
      video: {
        mediaSource: 'screen',
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
        frameRate: { ideal: 30, max: 30 }
      },
      audio: false
    };
  }

  // Validate device capabilities
  async validateDeviceCapabilities() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const capabilities = {
        hasCamera: false,
        hasMicrophone: false,
        hasSpeakers: false,
        cameraCount: 0,
        microphoneCount: 0
      };

      devices.forEach(device => {
        if (device.kind === 'videoinput') {
          capabilities.hasCamera = true;
          capabilities.cameraCount++;
        } else if (device.kind === 'audioinput') {
          capabilities.hasMicrophone = true;
          capabilities.microphoneCount++;
        }
      });

      return capabilities;
    } catch (error) {
      console.error('Error checking device capabilities:', error);
      return {
        hasCamera: false,
        hasMicrophone: false,
        hasSpeakers: false,
        cameraCount: 0,
        microphoneCount: 0
      };
    }
  }

  // Generate network information
  generateNetworkInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    };
  }
}

export default new WebRTCUtils();
