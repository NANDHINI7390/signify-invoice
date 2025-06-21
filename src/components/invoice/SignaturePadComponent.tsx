
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import SignaturePad from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface SignaturePadComponentProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

const MIN_MEANINGFUL_DATA_URL_LENGTH = 150; // A reasonable threshold for a non-trivial PNG

export default function SignaturePadComponent({ onSignatureChange }: SignaturePadComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadInstanceRef = useRef<SignaturePad | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  const updateSignatureState = useCallback(() => {
    if (signaturePadInstanceRef.current && canvasRef.current) {
      const pad = signaturePadInstanceRef.current;
      let dataUrlToSend: string | null = null;

      if (!pad.isEmpty()) {
        const currentDataUrl = pad.toDataURL('image/png'); // As per prompt, generate a transparent PNG

        // Validate the generated data URL to ensure it's not effectively blank
        if (currentDataUrl && currentDataUrl !== 'data:,' && currentDataUrl.length > MIN_MEANINGFUL_DATA_URL_LENGTH) {
          dataUrlToSend = currentDataUrl;
          console.log('SignaturePadComponent: Pad has meaningful content. Sending PNG Data URL (prefix & length):', dataUrlToSend.substring(0, 50) + '...', dataUrlToSend.length);
          if (placeholderRef.current) placeholderRef.current.style.display = 'none';
        } else {
          console.log(`SignaturePadComponent: Pad.isEmpty() is false, but toDataURL gave trivial data (url: ${currentDataUrl?.substring(0,30)}, len: ${currentDataUrl?.length}). Treating as empty. Sending null.`);
          if (placeholderRef.current) placeholderRef.current.style.display = 'block';
        }
      } else {
        console.log('SignaturePadComponent: Pad is truly empty (isEmpty() is true). Sending null.');
        if (placeholderRef.current) placeholderRef.current.style.display = 'block';
      }
      onSignatureChange(dataUrlToSend);
    } else {
      console.log('SignaturePadComponent: Pad instance or canvas not found, sending null.');
      onSignatureChange(null);
      if (placeholderRef.current) placeholderRef.current.style.display = 'block';
    }
  }, [onSignatureChange]);

  const resizeCanvas = useCallback(() => {
    if (canvasRef.current && wrapperRef.current && signaturePadInstanceRef.current) {
      const canvas = canvasRef.current;
      const pad = signaturePadInstanceRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      
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
         pad.fromData(currentSignaturePoints); 
      }
      updateSignatureState(); 
    }
  }, [updateSignatureState]);

  useEffect(() => {
    if (canvasRef.current && wrapperRef.current) {
      const canvas = canvasRef.current;
      const pad = new SignaturePad(canvas, {
        backgroundColor: 'rgba(255, 255, 255, 0)', // Use a transparent background for PNG
        penColor: 'rgb(31, 41, 55)', 
        minWidth: 0.75, 
        maxWidth: 2.5, 
        throttle: 16, 
        minDistance: 5, 
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
      
      resizeCanvas(); 
      
      window.addEventListener('resize', resizeCanvas);
      
      const initialTimeout = setTimeout(() => updateSignatureState(), 50);

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        signaturePadInstanceRef.current?.off(); 
        clearTimeout(initialTimeout);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
