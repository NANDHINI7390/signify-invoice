'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
// Conditional import to prevent build errors if 'signature_pad' is not installed.
let SignaturePad: any = undefined;
if (typeof window !== 'undefined') {
  try {
    SignaturePad = require('signature_pad').default || require('signature_pad');
  } catch (e) {
    console.warn("signature_pad library not found. Signature functionality will be disabled.");
  }
}

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface SignaturePadComponentProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

export default function SignaturePadComponent({ onSignatureChange }: SignaturePadComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadInstanceRef = useRef<any>(null); // Use 'any' for SignaturePad instance
  const [isDrawing, setIsDrawing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const resizeCanvas = useCallback(() => {
    if (canvasRef.current && wrapperRef.current && signaturePadInstanceRef.current) {
      const canvas = canvasRef.current;
      const pad = signaturePadInstanceRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      
      // Store current signature data
      const data = pad.toDataURL();

      canvas.width = wrapperRef.current.offsetWidth * ratio;
      canvas.height = 200 * ratio; // Fixed height, adjust as needed
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }
      
      // Restore signature data
      pad.clear(); // Clear the pad (which also resets context transformations)
      if (data && data !== "data:,") { // Check if data is not empty
         // Need to re-apply context scale if SignaturePad doesn't handle it on fromDataURL
         // This is often tricky. The library should ideally handle scaling.
         // If not, you might need to draw image manually:
         // const img = new Image();
         // img.onload = () => ctx.drawImage(img, 0, 0, canvas.width/ratio, canvas.height/ratio);
         // img.src = data;
         // For now, assume fromDataURL works as expected or with minor issues on resize.
        pad.fromDataURL(data);
      }
    }
  }, []);


  useEffect(() => {
    if (canvasRef.current && wrapperRef.current && SignaturePad) {
      const canvas = canvasRef.current;
      const pad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)', 
        penColor: 'rgb(31, 41, 55)', 
        onBegin: () => setIsDrawing(true),
        onEnd: () => {
          setIsDrawing(false);
          if (signaturePadInstanceRef.current && !signaturePadInstanceRef.current.isEmpty()) {
            onSignatureChange(signaturePadInstanceRef.current.toDataURL());
          } else {
            onSignatureChange(null);
          }
        }
      });
      signaturePadInstanceRef.current = pad;
      
      // Initial resize
      resizeCanvas();

      window.addEventListener('resize', resizeCanvas);
      
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizeCanvas, SignaturePad]); // Added SignaturePad to deps

  const clearSignature = () => {
    if (signaturePadInstanceRef.current) {
      signaturePadInstanceRef.current.clear();
      onSignatureChange(null);
      setIsDrawing(false);
    }
  };

  if (!SignaturePad) {
    return (
      <div className="border-2 border-dashed border-destructive rounded-lg p-4 text-center text-destructive bg-destructive/10">
        <p className="font-semibold">Signature Pad Library Not Loaded</p>
        <p className="text-sm">Please ensure 'signature_pad' is correctly installed and imported for full functionality.</p>
        <p className="text-xs mt-2">You can still use the 'Type Signature' option.</p>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full h-[200px] border border-primary-blue-focus rounded-lg cursor-crosshair touch-none bg-card"
        aria-label="Signature Pad"
        style={{ touchAction: 'none' }} // Ensure touch events are captured by canvas
      ></canvas>
      <Button
        type="button"
        variant="ghost"
        size="icon" 
        onClick={clearSignature}
        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive p-1 h-8 w-8 active:scale-90"
        aria-label="Clear Signature"
        disabled={!isDrawing && signaturePadInstanceRef.current?.isEmpty()}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
      {!isDrawing && signaturePadInstanceRef.current?.isEmpty() && (
         <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none font-body">
           Draw your signature here
         </p>
      )}
    </div>
  );
}
