import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  title: string;
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  title,
  onCapture,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1080 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera access denied or not available', err);
      setCameraError('Camera access not granted or not supported on this device. You can choose a photo from files instead.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, flip horizontally for natural mirror feel
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      onClose();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onCapture(reader.result);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-neutral-900 text-white rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base text-neutral-100">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-neutral-800 text-neutral-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Camera Viewport / Photo Preview */}
            <div className="relative aspect-square w-full bg-neutral-950 flex items-center justify-center overflow-hidden">
              {capturedPhoto ? (
                <img
                  src={capturedPhoto}
                  alt="Captured snapshot"
                  className="w-full h-full object-cover"
                />
              ) : cameraError ? (
                <div className="p-6 text-center text-neutral-400">
                  <Camera className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
                  <p className="text-xs sm:text-sm text-neutral-300 mb-4">{cameraError}</p>
                  <label className="inline-flex items-center gap-2 py-2 px-4 bg-emerald-600 text-white text-xs font-semibold rounded-xl cursor-pointer hover:bg-emerald-700">
                    <span>Choose from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  />
                  {/* Camera overlay guideline */}
                  <div className="absolute inset-6 border-2 border-white/20 rounded-2xl pointer-events-none border-dashed" />
                  
                  {/* Switch camera toggle button */}
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="absolute top-3 right-3 p-2.5 rounded-full bg-neutral-900/70 backdrop-blur-md text-white hover:bg-neutral-800 transition-colors shadow-md"
                    title="Flip camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="p-4 bg-neutral-900 border-t border-neutral-800">
              {capturedPhoto ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold text-neutral-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-sm font-bold text-neutral-950 shadow-md shadow-emerald-500/20"
                  >
                    <Check className="w-4 h-4" />
                    Use Photo
                  </button>
                </div>
              ) : !cameraError ? (
                <div className="flex items-center justify-between gap-4">
                  <label className="text-xs text-neutral-400 hover:text-white cursor-pointer px-2 py-1">
                    Upload file
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={takeSnapshot}
                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:scale-95 transition-transform"
                    aria-label="Take snapshot"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500" />
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs text-neutral-400 hover:text-white px-2 py-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
