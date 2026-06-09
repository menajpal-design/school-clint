"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera as CameraIcon, Keyboard, QrCode, RefreshCw, ShieldAlert, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WebcamScannerProps {
  onScan: (code: string) => void;
  enabled?: boolean;
  autoStart?: boolean;
}

type FacingMode = "environment" | "user";

const isHttpsReady = () => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return window.isSecureContext || host === "localhost" || host === "127.0.0.1";
};

const getCameraErrorMessage = (err: any) => {
  const name = String(err?.name || err?.originalError?.name || "");
  const message = String(err?.message || err?.originalError?.message || "");
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || /permission|denied/i.test(message)) return "Camera permission denied. Click the lock icon beside the address bar, set Camera to Allow, then reload or press Retry Camera.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "No camera found on this device.";
  if (name === "NotReadableError" || name === "TrackStartError") return "Camera is busy or blocked by another app. Close other camera apps and try again.";
  if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") return "Requested camera is not available. Try Front/Back camera switch.";
  if (!isHttpsReady()) return "Camera needs HTTPS secure connection. Open the site with https://";
  return message || "Failed to access camera.";
};

const getZxingText = (result: any) => {
  if (!result) return "";
  if (typeof result.getText === "function") return String(result.getText() || "");
  return String(result.text || result.rawValue || "");
};

export function WebcamScanner({ onScan, enabled = true, autoStart = false }: WebcamScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const codeReaderRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const lastDetectionRef = useRef<{ value: string; time: number }>({ value: "", time: 0 });

  const [isActive, setIsActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [permission, setPermission] = useState<"granted" | "denied" | "prompt" | "unsupported" | null>(null);
  const [error, setError] = useState<string>("");
  const [info, setInfo] = useState<string>(autoStart ? "Camera is ready to start..." : "Press Start Camera to allow camera access.");
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [zxingReady, setZxingReady] = useState(false);

  const emitScan = useCallback((value: string) => {
    const clean = String(value || "").trim();
    if (!clean) return;
    const now = Date.now();
    if (lastDetectionRef.current.value === clean && now - lastDetectionRef.current.time < 2500) return;
    lastDetectionRef.current = { value: clean, time: now };
    setInfo(`QR/Barcode scanned: ${clean}`);
    onScan(clean);
  }, [onScan]);

  const stopCamera = useCallback(() => {
    try { controlsRef.current?.stop?.(); } catch {}
    controlsRef.current = null;
    try { codeReaderRef.current?.reset?.(); } catch {}
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream | null;
      stream?.getTracks?.().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setStarting(false);
    setInfo("Camera stopped. Press Start Camera to scan again.");
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

  const startZxing = async (mode: FacingMode) => {
    const zxing = await import("@zxing/browser");
    const Reader = (zxing as any).BrowserMultiFormatReader || (zxing as any).BrowserQRCodeReader;
    if (!Reader) throw new Error("ZXing scanner package is not available after build.");
    const reader = new Reader();
    codeReaderRef.current = reader;

    const video = videoRef.current;
    if (!video) throw new Error("Camera video element is not ready.");

    const onResult = (result: any) => {
      const scanned = getZxingText(result);
      if (scanned) emitScan(scanned);
    };

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: mode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    try {
      return await reader.decodeFromConstraints(constraints, video, onResult);
    } catch (primaryError: any) {
      if (primaryError?.name === "OverconstrainedError" || primaryError?.name === "ConstraintNotSatisfiedError") {
        return await reader.decodeFromConstraints({ video: true, audio: false }, video, onResult);
      }
      throw primaryError;
    }
  };

  const startCamera = useCallback(async (mode: FacingMode = facingMode) => {
    if (!enabled || starting) return;
    try {
      setStarting(true);
      setError("");
      setInfo("Loading QR scanner package...");

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
      setFacingMode(mode);
      setInfo("Requesting camera access...");

      const controls = await startZxing(mode);
      controlsRef.current = controls;
      setZxingReady(true);
      setIsActive(true);
      setPermission("granted");
      setInfo("Camera ready. Point QR/barcode inside the box and keep it steady.");
    } catch (err: any) {
      const message = getCameraErrorMessage(err);
      setError(message);
      setInfo("");
      setZxingReady(false);
      setPermission(err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError" ? "denied" : permission || "prompt");
      stopCamera();
      setTimeout(() => manualInputRef.current?.focus(), 100);
    } finally {
      setStarting(false);
    }
  }, [enabled, facingMode, permission, starting, stopCamera]);

  const switchCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    stopCamera();
    setTimeout(() => startCamera(next), 100);
  };

  const handleManualSubmit = () => {
    const code = manualInputRef.current?.value.trim() || "";
    if (!code) return;
    setInfo(`Code captured: ${code}`);
    emitScan(code);
    if (manualInputRef.current) manualInputRef.current.value = "";
  };

  const handleManualInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleManualSubmit();
  };

  useEffect(() => {
    checkPermissionState();
    import("@zxing/browser").then(() => setZxingReady(true)).catch(() => setZxingReady(false));
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

        {!isActive && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75 p-4 text-white">
            <div className="max-w-sm space-y-3 text-center">
              <CameraIcon className="mx-auto h-10 w-10 text-emerald-300" />
              <p className="font-semibold">ZXing QR/Barcode Scanner</p>
              <p className="text-xs text-slate-200">Press Start Camera, then choose Allow from the browser permission popup.</p>
              {!zxingReady && <p className="rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-100">Scanner package is loading. If it fails, run npm install after deploy.</p>}
              <Button type="button" onClick={() => startCamera()} disabled={starting || !enabled} className="w-full">
                {starting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CameraIcon className="mr-2 h-4 w-4" />}
                {starting ? "Opening Camera..." : "Start Camera"}
              </Button>
            </div>
          </div>
        )}

        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative h-40 w-56 rounded-lg border-2 border-blue-400 opacity-90 shadow-lg">
              <div className="absolute -top-1 -left-1 h-4 w-4 border-l-2 border-t-2 border-blue-500" />
              <div className="absolute -top-1 -right-1 h-4 w-4 border-r-2 border-t-2 border-blue-500" />
              <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-blue-500" />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-blue-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <QrCode className="h-8 w-8 text-blue-400 opacity-70" />
              </div>
            </div>
          </div>
        )}

        <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm">
          <div className={cn("h-2 w-2 rounded-full", isActive ? "animate-pulse bg-green-500" : permission === "denied" ? "bg-red-500" : "bg-slate-500")} />
          {isActive ? "ZXing scanning" : permission === "denied" ? "Permission denied" : starting ? "Opening" : "Offline"}
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
                <p>If it still says denied, clear site settings for easyschool.live and open the page again.</p>
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
        <p className="text-xs text-emerald-800">Camera blocked হলেও manual entry/barcode scanner দিয়ে attendance scan কাজ করবে।</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {isActive ? <Button size="sm" variant="outline" onClick={stopCamera} className="flex-1"><VideoOff className="mr-2 h-4 w-4" />Stop Camera</Button> : <Button size="sm" onClick={() => startCamera()} disabled={starting || !enabled} className="flex-1"><RefreshCw className={cn("mr-2 h-4 w-4", starting && "animate-spin")} />Retry Camera</Button>}
        <Button size="sm" variant="outline" onClick={switchCamera} disabled={starting || !enabled} className="flex-1"><CameraIcon className="mr-2 h-4 w-4" />{facingMode === "environment" ? "Use Front" : "Use Back"}</Button>
        <Button size="sm" variant="outline" onClick={() => manualInputRef.current?.focus()} className="flex-1"><ShieldAlert className="mr-2 h-4 w-4" />Use Manual</Button>
      </div>

      <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
        <p className="font-medium text-blue-900">Scanner Tips:</p>
        <ul className="mt-1 list-inside list-disc space-y-1">
          <li>Camera popup শুধু Start Camera চাপার পর আসবে।</li>
          <li>ZXing package দিয়ে QR/Barcode auto scan হবে।</li>
          <li>Allow camera permission from browser site settings.</li>
          <li>Use HTTPS and avoid opening inside unsupported in-app browsers.</li>
          <li>Manual entry works with barcode scanner devices and pasted QR data.</li>
        </ul>
      </div>
    </div>
  );
}
