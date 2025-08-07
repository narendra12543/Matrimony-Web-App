import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { SocketProvider } from "./contexts/Chat/SocketContext";
import { AuthProvider } from "./contexts/Chat/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Add global error handlers (debug white screen)
window.onerror = function (message, source, lineno, colno, error) {
  console.error("Global error caught:", message, error);
};
window.addEventListener("unhandledrejection", function (event) {
  console.error("Unhandled promise rejection:", event.reason);
});

// Dynamic polyfills (iOS safe)
(async () => {
  if (!window.Buffer) {
    const { Buffer } = await import("buffer");
    window.Buffer = Buffer;
  }

  if (!window.ReadableStream) {
    const { Readable } = await import("readable-stream");
    window.ReadableStream = Readable;
  }
  if (!window.WritableStream) {
    const { Writable } = await import("readable-stream");
    window.WritableStream = Writable;
  }
  if (!window.DuplexStream) {
    const { Duplex } = await import("readable-stream");
    window.DuplexStream = Duplex;
  }
})();

// WebRTC compatibility
if (!window.RTCPeerConnection) {
  window.RTCPeerConnection =
    window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
}

// getUserMedia fallback
if (!navigator.mediaDevices) {
  navigator.mediaDevices = {};
}
if (!navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia = function (constraints) {
    const getUserMedia =
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;
    if (!getUserMedia) {
      return Promise.reject(
        new Error("getUserMedia is not implemented in this browser")
      );
    }
    return new Promise(function (resolve, reject) {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  };
}

// Safari AudioContext
if (!window.AudioContext && window.webkitAudioContext) {
  window.AudioContext = window.webkitAudioContext;
}

// Safari viewport fix (iOS)
if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
  const viewport = document.querySelector("meta[name=viewport]");
  if (!viewport) {
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content =
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover";
    document.head.appendChild(meta);
  }

  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };

  window.addEventListener("resize", setVH);
  window.addEventListener("orientationchange", setVH);
  setVH();

  document.addEventListener(
    "touchstart",
    function () {
      if (window.AudioContext && !window.audioContextInitialized) {
        window.audioContextInitialized = true;
        new AudioContext();
      }
    },
    { once: true }
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
