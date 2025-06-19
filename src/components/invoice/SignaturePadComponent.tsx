
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import SignaturePad from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface SignaturePadComponentProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

// A reasonable minimum length for a data URL that actually contains some drawing.
// 'data:image/png;base64,' is about 22 chars. A tiny PNG might be ~100-150 chars.
const MIN_MEANINGFUL_DATA_URL_LENGTH = 150;

export default function SignaturePadComponent({ onSignatureChange }: SignaturePadComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadInstanceRef = useRef<SignaturePad | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  const updateSignatureState = useCallback(() => {
    if (signaturePadInstanceRef.current) {
      const pad = signaturePadInstanceRef.current;
      const isEmptyByLibrary = pad.isEmpty();
      let dataUrlToSend: string | null = null;

      if (!isEmptyByLibrary) {
        const currentDataUrl = pad.toDataURL('image/png');
        // Further check: even if library says not empty, ensure data URL is meaningful
        if (currentDataUrl && currentDataUrl !== 'data:,' && currentDataUrl.length > MIN_MEANINGFUL_DATA_URL_LENGTH) {
          dataUrlToSend = currentDataUrl;
          console.log('SignaturePadComponent: Pad has meaningful content. Sending Data URL (prefix & length):', dataUrlToSend.substring(0, 50) + '...', dataUrlToSend.length);
          if (placeholderRef.current) placeholderRef.current.style.display = 'none';
        } else {
          console.log(`SignaturePadComponent: Pad.isEmpty() is false, but toDataURL gave trivial data (url: ${currentDataUrl?.substring(0,30)}, len: ${currentDataUrl?.length}). Treating as empty. Sending null.`);
          if (placeholderRef.current) placeholderRef.current.style.display = 'block';
        }
      } else {
        console.log('SignaturePadComponent: Pad is truly empty (isEmpty() is true). Sending null.');
        if (placeholderRef.current) placeholderRef.current.style.display = 'block';
      }
      onSignatureChange(dataUrlToSend); // This will send null if conditions above aren't met
    } else {
      console.log('SignaturePadComponent: Pad instance not found, sending null.');
      onSignatureChange(null);
      if (placeholderRef.current) placeholderRef.current.style.display = 'block';
    }
  }, [onSignatureChange]);

  const resizeCanvas = useCallback(() => {
    if (canvasRef.current && wrapperRef.current && signaturePadInstanceRef.current) {
      const canvas = canvasRef.current;
      const pad = signaturePadInstanceRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      
      // Try to save signature data as points array for more robust restoration
      const currentSignaturePoints = pad.isEmpty() ? null : pad.toData();

      canvas.style.width = `${wrapperRef.current.offsetWidth}px`;
      canvas.style.height = `200px`; 

      canvas.width = wrapperRef.current.offsetWidth * ratio;
      canvas.height = 200 * ratio;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }
      
      pad.clear(); 
      if (currentSignaturePoints && currentSignaturePoints.length > 0) {
         // Important: Ensure the pad's internal state (like _isEmpty) is updated after fromData
         pad.fromData(currentSignaturePoints);
      }
      // After resize and potential data restoration, update state
      updateSignatureState();
    }
  }, [updateSignatureState]);

  useEffect(() => {
    if (canvasRef.current && wrapperRef.current) {
      const canvas = canvasRef.current;
      const pad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)', // Opaque white background for the canvas data
        penColor: 'rgb(31, 41, 55)', 
        minWidth: 0.75,
        maxWidth: 2.5,
        throttle: 16, // (ms) Draw the next point at most once per every x milliseconds
        minDistance: 5, // (px) Minimal distance between two points
        onBegin: () => {
          setIsDrawing(true);
          if (placeholderRef.current) placeholderRef.current.style.display = 'none';
        },
        onEnd: () => {
          setIsDrawing(false);
          console.log('SignaturePadComponent: onEnd triggered.');
          updateSignatureState(); 
        }
      });
      signaturePadInstanceRef.current = pad;
      
      resizeCanvas(); // Initial resize and state update
      // updateSignatureState(); // Called by resizeCanvas

      window.addEventListener('resize', resizeCanvas);
      
      return () => {
        window.removeEventListener('resize', resizeCanvas);
        signaturePadInstanceRef.current?.off(); 
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // updateSignatureState and resizeCanvas are memoized

  const clearSignature = () => {
    if (signaturePadInstanceRef.current) {
      signaturePadInstanceRef.current.clear();
      setIsDrawing(false); 
      console.log('SignaturePadComponent: clearSignature called.');
      updateSignatureState(); 
    }
  };
  
  return (
    <div 
      ref={wrapperRef} 
      className="relative w-full h-[200px] rounded-lg overflow-hidden border-2 border-dashed border-primary bg-gray-50"
      style={{ touchAction: 'none' }} 
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair" 
        aria-label="Signature Pad"
        id="signature-canvas"
      />
      <div 
        ref={placeholderRef}
        id="signature-placeholder"
        className="signature-placeholder absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      >
        ✍️ Draw your signature here
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon" 
        onClick={clearSignature}
        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive p-1 h-8 w-8 active:scale-90 bg-card/50 hover:bg-card/80 rounded-full z-10 clear-btn" 
        aria-label="Clear Signature"
        id="clear-signature"
        disabled={!isDrawing && (signaturePadInstanceRef.current?.isEmpty() ?? true)} 
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

