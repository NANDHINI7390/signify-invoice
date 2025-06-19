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

  // Store the dataURL of a blank canvas with the component's background for comparison
  const [blankCanvasDataUrl, setBlankCanvasDataUrl] = useState<string | null>(null);

  const resizeCanvas = useCallback(() => {
    if (canvasRef.current && wrapperRef.current && signaturePadInstanceRef.current) {
      const canvas = canvasRef.current;
      const pad = signaturePadInstanceRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      
      const currentData = pad.toDataURL('image/png'); // Preserve current drawing

      canvas.style.width = `${wrapperRef.current.offsetWidth}px`;
      canvas.style.height = `200px`; // Fixed height

      canvas.width = wrapperRef.current.offsetWidth * ratio;
      canvas.height = 200 * ratio;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }
      
      pad.clear();
      // Capture what a blank canvas with the intended background looks like
      // Ensure the background is applied before capturing blank state if it's not transparent
      const tempBlankDataUrl = pad.toDataURL('image/png');
      if (!blankCanvasDataUrl) {
        setBlankCanvasDataUrl(tempBlankDataUrl);
      }
      
      if (currentData && currentData !== tempBlankDataUrl && currentData !== 'data:,') {
        pad.fromDataURL(currentData);
      }
    }
  }, [blankCanvasDataUrl]);

  const checkPadEmptyAndNotify = useCallback(() => {
    if (signaturePadInstanceRef.current) {
      const pad = signaturePadInstanceRef.current;
      const currentDataUrl = pad.toDataURL('image/png');
      
      // A pad is considered empty if its data URL matches the blank state or is the minimal 'data:,'
      const isTrulyEmpty = pad.isEmpty() || currentDataUrl === blankCanvasDataUrl || currentDataUrl === 'data:,';

      if (isTrulyEmpty) {
        onSignatureChange(null);
        if (placeholderRef.current) placeholderRef.current.style.display = 'block';
      } else {
        onSignatureChange(currentDataUrl);
        if (placeholderRef.current) placeholderRef.current.style.display = 'none';
      }
    }
  }, [onSignatureChange, blankCanvasDataUrl]);

  useEffect(() => {
    if (canvasRef.current && wrapperRef.current) {
      const canvas = canvasRef.current;
      // Initialize with a transparent background for the pad itself; container provides visible bg
      const pad = new SignaturePad(canvas, {
        backgroundColor: 'rgba(255, 255, 255, 0)', // Transparent for pad, container has bg
        penColor: 'rgb(31, 41, 55)', // Dark pen
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
      // Set initial blank canvas data URL
      if (pad && !blankCanvasDataUrl) {
        const tempCtx = canvas.getContext('2d');
        if (tempCtx) {
            // Temporarily clear to get the 'truly blank' state of this canvas instance
            const originalData = pad.toDataURL();
            pad.clear();
            setBlankCanvasDataUrl(pad.toDataURL('image/png'));
            if(originalData !== 'data:,') pad.fromDataURL(originalData); // Restore if it wasn't blank
        }
      }


      window.addEventListener('resize', resizeCanvas);
      
      return () => {
        window.removeEventListener('resize', resizeCanvas);
        signaturePadInstanceRef.current?.off(); 
      };
    }
  }, [resizeCanvas, checkPadEmptyAndNotify, blankCanvasDataUrl]);

  const clearSignature = () => {
    if (signaturePadInstanceRef.current) {
      signaturePadInstanceRef.current.clear();
      onSignatureChange(null); // Notify parent that signature is cleared
      setIsDrawing(false);
      if (placeholderRef.current) placeholderRef.current.style.display = 'block';
    }
  };
  
  return (
    <div 
      ref={wrapperRef} 
      className="relative w-full h-[200px] rounded-lg overflow-hidden border-2 border-dashed border-primary bg-blue-50 z-40" // bg-blue-50 is similar to #FAFBFF
      style={{ touchAction: 'none' }} // Apply touch-action to the container
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair" // Removed touch-none here, container has it
        aria-label="Signature Pad"
        id="signature-canvas" // Added ID for potential direct manipulation if needed
      />
      <div 
        ref={placeholderRef}
        id="signature-placeholder"
        className="signature-placeholder" // Class from globals.css for styling
      >
        ✍️ Draw your signature here
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon" 
        onClick={clearSignature}
        className="absolute top-2 right-2 text-text-light hover:text-destructive p-1 h-8 w-8 active:scale-90 bg-card-white/50 hover:bg-card-white/80 rounded-full z-10 clear-btn" // Added clear-btn class
        aria-label="Clear Signature"
        id="clear-signature" // Added ID for potential direct manipulation if needed
        // Disable if not drawing AND pad is empty
        disabled={!isDrawing && (signaturePadInstanceRef.current?.isEmpty() ?? true)} 
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
