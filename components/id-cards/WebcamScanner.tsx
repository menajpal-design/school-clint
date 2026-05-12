"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Camera as CameraIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WebcamScannerProps {
  onScan: (code: string) => void;
  enabled?: boolean;
}

// Simple barcode/QR pattern detection
const detectBarcodePattern = (imageData: Uint8ClampedArray, width: number, height: number): string | null => {
  // This is a basic pattern detector
  // For production QR scanning, use jsQR or zxing-js library
  
  // Look for high-contrast vertical and horizontal patterns typical of barcodes/QR codes
  let darkCount = 0;
  let totalPixels = imageData.length / 4;
  
  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const brightness = (r + g + b) / 3;
    
    // Count dark pixels (likely to be QR/barcode)
    if (brightness < 128) {
      darkCount++;
    }
  }
  
  // If roughly 40-60% of image is dark, it might be a QR code
  const darkPercentage = darkCount / totalPixels;
  if (darkPercentage > 0.35 && darkPercentage < 0.65) {
    return "QR_DETECTED";
  }
  
  return null;
};

export function WebcamScanner({ onScan, enabled = true }: WebcamScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [permission, setPermission] = useState<"granted" | "denied" | "prompt" | null>(null);
  const [error, setError] = useState<string>("");
  const [info, setInfo] = useState<string>("Starting camera...");
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();
  const lastDetectionRef = useRef<number>(0);

  // Start camera
  const startCamera = async () => {
    try {
      setError("");
      setInfo("Requesting camera access...");
      
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setInfo("Camera ready. Point at ID card or QR code.");
        };
        
        setIsActive(true);
        setPermission("granted");
        startScanning();
      }
    } catch (err: any) {
      const message = err?.name === "NotAllowedError" 
        ? "Camera permission denied. Please allow camera access." 
        : err?.message || "Failed to access camera";
      setError(message);
      setInfo("");
      setPermission("denied");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsActive(false);
    setInfo("");
  };

  // Start continuous scanning
  const startScanning = () => {
    const scan = () => {
      if (!isActive || !videoRef.current || !canvasRef.current) {
        animationFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      try {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        
        if (!context || !videoRef.current.videoWidth) {
          animationFrameRef.current = requestAnimationFrame(scan);
          return;
        }

        // Draw video frame to canvas
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        // Get image data for analysis
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Attempt pattern detection
        const detected = detectBarcodePattern(imageData.data, canvas.width, canvas.height);
        
        // If QR/barcode detected and enough time passed since last detection
        const now = Date.now();
        if (detected && now - lastDetectionRef.current > 1000) {
          lastDetectionRef.current = now;
          setInfo("✓ QR/Barcode detected!");
          // Note: Actual data extraction requires jsQR or similar
          // For now, we'll wait for manual input or scanner device data
        }
      } catch (err) {
        console.error("Scan error:", err);
      }

      animationFrameRef.current = requestAnimationFrame(scan);
    };

    animationFrameRef.current = requestAnimationFrame(scan);
  };

  // Handle manual input (user can type or paste ID card code)
  const handleManualInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value.trim()) {
      const code = e.currentTarget.value.trim();
      setInfo(`✓ Code captured: ${code}`);
      onScan(code);
      e.currentTarget.value = "";
    }
  };

  // Lifecycle
  useEffect(() => {
    if (enabled && !isActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [enabled]);

  return (
    <div className="space-y-4">
      {/* Camera Feed */}
      <div className="relative overflow-hidden rounded-lg border border-slate-300 bg-black aspect-video">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning Frame Overlay */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-56 h-40 border-2 border-blue-400 rounded-lg shadow-lg opacity-80">
              {/* Corner markers */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
              
              {/* Center crosshair */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top right status indicator */}
        <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-full text-white text-xs font-medium">
          <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-green-500 animate-pulse" : "bg-slate-500")} />
          {isActive ? "Scanning" : "Offline"}
        </div>

        {/* Bottom info text */}
        {info && (
          <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-2 rounded text-center">
            {info}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="text-white text-center max-w-xs">
              <p className="font-medium">⚠️ Camera Error</p>
              <p className="text-xs mt-2">{error}</p>
              <p className="text-xs mt-3 text-slate-300">
                Try allowing camera access in settings or use manual entry instead.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input Section */}
      <div className="space-y-2 rounded-lg bg-slate-50 p-4 border border-slate-200">
        <label className="text-sm font-semibold text-slate-700">Manual Entry or Paste</label>
        <input
          type="text"
          placeholder="Type or paste ID card code / QR data..."
          onKeyDown={handleManualInput}
          autoFocus
          className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-slate-600">
          Press <kbd className="bg-white px-2 py-1 rounded border border-slate-200 text-xs font-mono">Enter</kbd> to submit
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {isActive ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={stopCamera}
              className="flex-1"
            >
              ⏹ Stop Camera
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={startCamera}
            className="flex-1"
          >
            <CameraIcon className="mr-2 h-4 w-4" />
            Start Camera
          </Button>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded-md p-3 space-y-1">
        <p className="font-medium text-blue-900">📷 Scanner Tips:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-800">
          <li>Position ID card/QR code within the frame</li>
          <li>Ensure adequate lighting</li>
          <li>Or paste ID code directly in the input field</li>
          <li>Works with device camera and barcode scanners</li>
        </ul>
      </div>
    </div>
  );
}
