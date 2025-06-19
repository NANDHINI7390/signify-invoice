
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

  const checkPadEmptyAndNotify = useCallback(() => {
    if (signaturePadInstanceRef.current) {
      const pad = signaturePadInstanceRef.current;
      if (pad.isEmpty()) {
        onSignatureChange(null);
        if (placeholderRef.current) placeholderRef.current.style.display = 'block';
      } else {
        const currentDataUrl = pad.toDataURL('image/png');
        onSignatureChange(currentDataUrl);
        if (placeholderRef.current) placeholderRef.current.style.display = 'none';
      }
    }
  }, [onSignatureChange]);

  const resizeCanvas = useCallback(() => {
    if (canvasRef.current && wrapperRef.current && signaturePadInstanceRef.current) {
      const canvas = canvasRef.current;
      const pad = signaturePadInstanceRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      
      const currentSignatureData = pad.isEmpty() ? null : pad.toDataURL('image/png');

      canvas.style.width = `${wrapperRef.current.offsetWidth}px`;
      canvas.style.height = `200px`; 

      canvas.width = wrapperRef.current.offsetWidth * ratio;
      canvas.height = 200 * ratio;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }
      
      pad.clear(); // Clear before restoring, especially after context scaling
      if (currentSignatureData) {
         pad.fromDataURL(currentSignatureData);
      }
      // Ensure placeholder visibility is correct after resize and potential restoration
      checkPadEmptyAndNotify();
    }
  }, [checkPadEmptyAndNotify]);

  useEffect(() => {
    if (canvasRef.current && wrapperRef.current) {
      const canvas = canvasRef.current;
      const pad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)', // Opaque white background for the signature itself
        penColor: 'rgb(31, 41, 55)', 
        minWidth: 0.75,
        maxWidth: 2.0,
        throttle: 16,
        minDistance: 3,
        onBegin: () => {
          setIsDrawing(true);
          if (placeholderRef.current) placeholderRef.current.style.display = 'none';
        },
        onEnd: () => {
          setIsDrawing(false);
          checkPadEmptyAndNotify();
        }
      });
      signaturePadInstanceRef.current = pad;
      
      resizeCanvas(); 
      checkPadEmptyAndNotify(); // Initial check

      window.addEventListener('resize', resizeCanvas);
      
      return () => {
        window.removeEventListener('resize', resizeCanvas);
        signaturePadInstanceRef.current?.off(); 
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSignatureChange]); // checkPadEmptyAndNotify and resizeCanvas are memoized

  const clearSignature = () => {
    if (signaturePadInstanceRef.current) {
      signaturePadInstanceRef.current.clear();
      onSignatureChange(null); 
      setIsDrawing(false); // Reset drawing state
      if (placeholderRef.current) placeholderRef.current.style.display = 'block'; // Show placeholder
    }
  };
  
  return (
    <div 
      ref={wrapperRef} 
      className="relative w-full h-[200px] rounded-lg overflow-hidden border-2 border-dashed border-primary bg-blue-50" // Container styling
      style={{ touchAction: 'none' }} 
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair" // Canvas takes full space of container
        aria-label="Signature Pad"
        id="signature-canvas"
      />
      <div 
        ref={placeholderRef}
        id="signature-placeholder"
        className="signature-placeholder absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        style={{ display: (signaturePadInstanceRef.current?.isEmpty() && !isDrawing) ? 'block' : 'none' }}
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
        // Disable if not drawing AND pad is empty. Enable if drawing or pad has content.
        disabled={!isDrawing && (signaturePadInstanceRef.current?.isEmpty() ?? true)} 
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

