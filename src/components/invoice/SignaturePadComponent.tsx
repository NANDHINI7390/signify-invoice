
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

  const resizeCanvas = useCallback(() => {
    if (canvasRef.current && wrapperRef.current && signaturePadInstanceRef.current) {
      const canvas = canvasRef.current;
      const pad = signaturePadInstanceRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      
      const data = pad.toDataURL();

      canvas.style.width = `${wrapperRef.current.offsetWidth}px`;
      canvas.style.height = `200px`;

      canvas.width = wrapperRef.current.offsetWidth * ratio;
      canvas.height = 200 * ratio; 
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }
      
      pad.clear(); 
      // signature_pad's toDataURL returns 'data:,' for an empty canvas
      if (data && data !== "data:,") {
        pad.fromDataURL(data);
      }
    }
  }, []);


  useEffect(() => {
    if (canvasRef.current && wrapperRef.current) {
      const canvas = canvasRef.current;
      const pad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)', 
        penColor: 'rgb(31, 41, 55)',
        onBegin: () => setIsDrawing(true),
        onEnd: () => {
          setIsDrawing(false);
          if (signaturePadInstanceRef.current) {
            const currentPad = signaturePadInstanceRef.current;
            const currentDataUrl = currentPad.toDataURL('image/png');
            // Directly check if dataURL indicates an empty canvas ('data:,')
            if (currentDataUrl && currentDataUrl !== 'data:,') {
              onSignatureChange(currentDataUrl);
            } else {
              onSignatureChange(null);
            }
          }
        }
      });
      signaturePadInstanceRef.current = pad;
      
      resizeCanvas(); 

      window.addEventListener('resize', resizeCanvas);
      
      return () => {
        window.removeEventListener('resize', resizeCanvas);
        signaturePadInstanceRef.current?.off(); 
      };
    }
  }, [resizeCanvas, onSignatureChange]);

  const clearSignature = () => {
    if (signaturePadInstanceRef.current) {
      signaturePadInstanceRef.current.clear();
      onSignatureChange(null);
      setIsDrawing(false);
    }
  };

  return (
    <div 
      ref={wrapperRef} 
      className="relative w-full h-[200px] rounded-lg overflow-hidden border border-primary-blue-DEFAULT z-40 bg-card-white"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none bg-card-white"
        style={{ touchAction: 'none' }} // Explicitly add touch-action: none
        aria-label="Signature Pad"
      ></canvas>
      <Button
        type="button"
        variant="ghost"
        size="icon" 
        onClick={clearSignature}
        className="absolute top-2 right-2 text-text-light hover:text-destructive-DEFAULT p-1 h-8 w-8 active:scale-90 bg-card-white/50 hover:bg-card-white/80 rounded-full z-10"
        aria-label="Clear Signature"
        disabled={!isDrawing && (signaturePadInstanceRef.current?.isEmpty() ?? true)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
      {!isDrawing && (signaturePadInstanceRef.current?.isEmpty() ?? true) && (
         <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-text-light pointer-events-none font-body">
           Draw your signature here
         </p>
      )}
    </div>
  );
}
