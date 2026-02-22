
import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, CameraOff } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1024 }, height: { ideal: 1024 } } 
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Could not access camera. Please check permissions.");
      }
    }
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      onCapture(dataUrl);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center">
      <div className="w-full flex justify-between p-4 text-white">
        <h3 className="font-bold flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Real-time Capture
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-8 space-y-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
              <CameraOff className="text-white w-8 h-8" />
            </div>
            <p className="text-slate-400">{error}</p>
            <button onClick={onClose} className="text-orange-500 font-bold">Go Back</button>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute bottom-12 flex gap-8 items-center">
          <button 
            onClick={takePhoto}
            className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 active:scale-90 transition-transform flex items-center justify-center group shadow-2xl"
          >
            <div className="w-16 h-16 bg-orange-500 rounded-full group-hover:scale-95 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
