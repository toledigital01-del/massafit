import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { isValidBarcode } from '@/lib/barcode';

type Detector = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (o: { formats: string[] }) => Detector;
const ctor = (): DetectorCtor | undefined => (typeof window === 'undefined' ? undefined : (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector);
/** O leitor por câmera depende do navegador (Chrome no Android tem; iPhone ainda não). */
export const canScanBarcode = () => Boolean(ctor()) && typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

export function BarcodeScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null); const [error, setError] = useState('');
  useEffect(() => {
    let stop = false; let stream: MediaStream | null = null; let timer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      try {
        const Detector = ctor(); if (!Detector) throw new Error('sem suporte');
        const detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a'] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
        const v = video.current; if (!v || stop) return; v.srcObject = stream; await v.play();
        const tick = async () => {
          if (stop) return;
          try { const found = (await detector.detect(v)).map(b => b.rawValue).find(isValidBarcode); if (found) { onCode(found); return; } } catch { /* tenta no próximo quadro */ }
          timer = setTimeout(() => void tick(), 250);
        };
        void tick();
      } catch { setError('Não consegui abrir a câmera. Permita o acesso ou digite o código.'); }
    })();
    return () => { stop = true; if (timer) clearTimeout(timer); stream?.getTracks().forEach(t => t.stop()); };
  }, [onCode]);
  return <div className="space-y-2">
    {error ? <p className="text-sm text-destructive">{error}</p> : <div className="relative overflow-hidden rounded-md bg-black"><video ref={video} muted playsInline className="w-full max-h-60 object-cover"/><div className="pointer-events-none absolute inset-x-8 top-1/2 h-px bg-primary/80"/></div>}
    {!error && <p className="text-[11px] text-muted-foreground text-center">Aponte para as barras do produto, bem de perto e com boa luz.</p>}
    <Button variant="ghost" className="w-full" onClick={onClose}>Fechar câmera</Button>
  </div>;
}
