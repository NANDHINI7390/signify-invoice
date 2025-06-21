
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import SignaturePad from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface SignaturePadComponentProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

export default function SignaturePadComponent({ onSignatureChange }: SignaturePadComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadInstanceRef = useRef<SignaturePad | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  const updateSignatureState = useCallback(() => {
    if (signaturePadInstanceRef.current && canvasRef.current) {
      const pad = signaturePadInstanceRef.current;
      
      if (pad.isEmpty()) {
        console.log('SignaturePadComponent: Pad is empty. Sending null.');
        onSignatureChange(null);
        if (placeholderRef.current) placeholderRef.current.style.display = 'block';
        return;
      }

      // Per user prompt: convert canvas to a proper image to ensure it can be displayed in the PDF.
      // Create a new canvas with a white background to avoid transparency issues in the PDF.
      const cleanCanvas = document.createElement('canvas');
      cleanCanvas.width = canvasRef.current.width;
      cleanCanvas.height = canvasRef.current.height;
      const cleanCtx = cleanCanvas.getContext('2d');
      if (cleanCtx) {
        // Fill with white background
        cleanCtx.fillStyle = '#FFFFFF';
        cleanCtx.fillRect(0, 0, cleanCanvas.width, cleanCanvas.height);
        // Draw original signature on top
        cleanCtx.drawImage(canvasRef.current, 0, 0);
      }
      
      // Get the image data from the cleaned canvas
      const signatureImageData = cleanCanvas.toDataURL('image/png');
      
      console.log('SignaturePadComponent: Captured signature data. Length:', signatureImageData.length, 'Prefix:', signatureImageData.substring(0, 50) + '...');
      onSignatureChange(signatureImageData);
      if (placeholderRef.current) placeholderRef.current.style.display = 'none';

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
        backgroundColor: 'rgba(255, 255, 255, 0)', // Transparent background for drawing
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
