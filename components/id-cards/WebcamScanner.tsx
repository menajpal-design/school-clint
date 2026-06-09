"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera as CameraIcon, Keyboard, RefreshCw, ShieldAlert, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WebcamScannerProps {
  onScan: (code: string) => void;
  enabled?: boolean;
  autoStart?: boolean;
}

const detectBarcodePattern = (imageData: Uint8ClampedArray): string | null => {
  let darkCount = 0;
  const totalPixels = imageData.length / 4;
  for (let i = 0; i < imageData.length; i += 4) {
    const brightness = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
    if (brightness < 128) darkCount += 1;
  }
  const darkPercentage = darkCount / totalPixels;
  return darkPercentage > 0.35 && darkPercentage < 0.65 ? "QR_DETECTED" : null;
};

const isHttpsReady = () => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return window.isSecureContext || host === "localhost" || host === "127.0.0.1";
};

const getCameraErrorMessage = (err: any) => {
  const name = String(err?.name || "");
  if (name === "NotAllowedError" || name === "PermissionDeniedError") return "Camera permission denied. Click the lock icon beside the address bar, set Camera to Allow, then reload or press Retry Camera.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "No camera found on this device.";
  if (name === "NotReadableError" || name === "TrackStartError") return "Camera is busy or blocked by another app. Close other camera apps and try again.";
  if (name === "OverconstrainedError") return "Requested back camera is not available. Trying normal camera may work.";
  if (!isHttpsReady()) return "Camera needs HTTPS secure connection. Open the site with https://";
  return err?.message || "Failed to access camera.";
};

export function WebcamScanner({ onScan, enabled = true, autoStart = false }: WebcamScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [permission, setPermission] = useState<"granted" | "denied" | "prompt" | "unsupported" | null>(null);
  const [error, setError] = useState<string>("");
  const [info, setInfo] = useState<string>(autoStart ? "Camera is ready to start..." : "Press Start Camera to allow camera access.");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<number>(0);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
    setStarting(false);
    setInfo("Camera stopped. Press Start Camera to scan again.");
  }, []);

  const startScanning = useCallback(() => {
    const scan = () => {
      if (!videoRef.current || !canvasRef.current || !streamRef.current) {
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
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const detected = detectBarcodePattern(imageData.data);
        const now = Date.now();
        if (detected && now - lastDetectionRef.current > 1000) {
          lastDetectionRef.current = now;
          setInfo("QR/Barcode detected. If code is not captured, paste/type it below and press Enter.");
        }
      } catch (err) {
        console.error("Scan error:", err);
      }
      animationFrameRef.current = requestAnimationFrame(scan);
    };
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(scan);
  }, []);

  const checkPermissionState = useCallback(async () => {
    if (typeof navigator === "undefined" || !(navigator as any).permissions?.query) return;
    try {
      const result = await (navigator as any).permissions.query({ name: "camera" as PermissionName });
      setPermission(result.state);
      result.onchange = () => setPermission(result.state);
    } catch {
      // Some browsers do not support querying camera permission.
    }
  }, []);

  const requestStream = async (mode: "environment" | "user") => {
    const constraints: MediaStreamConstraints = {
      video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    };
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (primaryError: any) {
      if (primaryError?.name === "OverconstrainedError" || primaryError?.name === "ConstraintNotSatisfiedError") {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      throw primaryError;
    }
  };

  const startCamera = useCallback(async () => {
    if (!enabled || starting) return;
    try {
      setStarting(true);
      setError("");
      setInfo("Requesting camera access...");
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setPermission("unsupported");
        setError("This browser does not support camera access. Use manual entry below.");
        setInfo("");
        manualInputRef.current?.focus();
        return;
      }
      if (!isHttpsReady()) {
        setPermission("unsupported");
        setError("Camera needs HTTPS secure connection. Open the site with https:// and try again.");
        setInfo("");
        manualInputRef.current?.focus();
        return;
      }
      stopCamera();
      setStarting(true);
      setInfo("Opening camera...");
      const stream = await requestStream(facingMode);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
        setInfo("Camera ready. Point at ID card or QR code.");
        setIsActive(true);
        setPermission("granted");
        startScanning();
      }
    } catch (err: any) {
      const message = getCameraErrorMessage(err);
      setError(message);
      setInfo("");
      setPermission(err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError" ? "denied" : permission || "prompt");
      stopCamera();
      setTimeout(() => manualInputRef.current?.focus(), 100);
    } finally {
      setStarting(false);
    }
  }, [enabled, facingMode, permission, startScanning, starting, stopCamera]);

  const switchCamera = async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    stopCamera();
    setTimeout(() => startCamera(), 50);
  };

  const handleManualSubmit = () => {
    const code = manualInputRef.current?.value.trim() || "";
    if (!code) return;
    setInfo(`Code captured: ${code}`);
    onScan(code);
    if (manualInputRef.current) manualInputRef.current.value = "";
  };

  const handleManualInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleManualSubmit();
  };

  useEffect(() => {
    checkPermissionState();
  }, [checkPermissionState]);

  useEffect(() => {
    if (!enabled) stopCamera();
    if (enabled && autoStart) startCamera();
    return () => stopCamera();
  }, [autoStart, enabled]);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-lg border border-slate-300 bg-black aspect-video">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
        <canvas ref={canvasRef} className="hidden" />

        {!isActive && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75 p-4 text-white">
            <div className="max-w-sm space-y-3 text-center">
              <CameraIcon className="mx-auto h-10 w-10 text-emerald-300" />
              <p className="font-semibold">Camera permission required</p>
              <p className="text-xs text-slate-200">Press Start Camera, then choose Allow from the browser permission popup.</p>
              <Button type="button" onClick={startCamera} disabled={starting || !enabled} className="w-full">
                {starting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CameraIcon className="mr-2 h-4 w-4" />}
                {starting ? "Opening Camera..." : "Start Camera"}
              </Button>
            </div>
          </div>
        )}

        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative h-40 w-56 rounded-lg border-2 border-blue-400 opacity-80 shadow-lg">
              <div className="absolute -top-1 -left-1 h-4 w-4 border-l-2 border-t-2 border-blue-500" />
              <div className="absolute -top-1 -right-1 h-4 w-4 border-r-2 border-t-2 border-blue-500" />
              <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-blue-500" />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-blue-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" style={{ animationDelay: "0.2s" }} />
                  <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm">
          <div className={cn("h-2 w-2 rounded-full", isActive ? "animate-pulse bg-green-500" : permission === "denied" ? "bg-red-500" : "bg-slate-500")} />
          {isActive ? "Scanning" : permission === "denied" ? "Permission denied" : starting ? "Opening" : "Offline"}
        </div>

        {info && <div className="absolute bottom-3 left-3 right-3 rounded bg-black/60 px-3 py-2 text-center text-xs text-white backdrop-blur-sm">{info}</div>}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-white backdrop-blur-sm">
            <div className="max-w-sm space-y-3 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-amber-300" />
              <p className="font-semibold">Camera Error</p>
              <p className="text-xs">{error}</p>
              <div className="rounded-md border border-white/20 bg-white/10 p-3 text-left text-xs text-slate-100">
                <p className="font-semibold">Fix permission:</p>
                <p>Chrome/Android: tap lock icon beside address bar → Site settings → Camera → Allow.</p>
                <p>Desktop Chrome: address bar lock icon → Camera → Allow → reload.</p>
                <p>Then press Retry Camera.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900"><Keyboard className="h-4 w-4" />Manual Entry / Paste Code</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input ref={manualInputRef} type="text" placeholder="Type/paste ID card code or QR data, then press Enter" onKeyDown={handleManualInput} className="min-h-11 flex-1 rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
          <Button type="button" onClick={handleManualSubmit}>Submit</Button>
        </div>
        <p className="text-xs text-emerald-800">Camera blocked হলেও এই manual entry দিয়ে attendance scan কাজ করবে।</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {isActive ? <Button size="sm" variant="outline" onClick={stopCamera} className="flex-1"><VideoOff className="mr-2 h-4 w-4" />Stop Camera</Button> : <Button size="sm" onClick={startCamera} disabled={starting || !enabled} className="flex-1"><RefreshCw className={cn("mr-2 h-4 w-4", starting && "animate-spin")} />Retry Camera</Button>}
        <Button size="sm" variant="outline" onClick={switchCamera} disabled={starting || !enabled} className="flex-1"><CameraIcon className="mr-2 h-4 w-4" />{facingMode === "environment" ? "Use Front" : "Use Back"}</Button>
        <Button size="sm" variant="outline" onClick={() => manualInputRef.current?.focus()} className="flex-1"><ShieldAlert className="mr-2 h-4 w-4" />Use Manual</Button>
      </div>

      <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
        <p className="font-medium text-blue-900">Scanner Tips:</p>
        <ul className="mt-1 list-inside list-disc space-y-1">
          <li>Camera popup শুধু Start Camera চাপার পর আসবে।</li>
          <li>Allow camera permission from browser site settings.</li>
          <li>Use HTTPS and avoid opening inside unsupported in-app browsers.</li>
          <li>Manual entry works with barcode scanner devices and pasted QR data.</li>
        </ul>
      </div>
    </div>
  );
}
