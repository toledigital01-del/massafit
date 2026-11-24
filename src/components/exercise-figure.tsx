import { useEffect, useRef, useState } from 'react';
import { cycleE, renderFigure, VIEWBOX } from '@/lib/exercise-figures';

/** Quadro estático: e = 0 (início) ou 1 (fim). */
export function FigureFrame({ slug, e, className = '', label }: { slug: string; e: number; className?: string; label?: string | undefined }) {
  return <svg viewBox={VIEWBOX} role="img" aria-label={label ?? 'Figura do exercício'} className={className} dangerouslySetInnerHTML={{ __html: renderFigure(slug, e) }}/>;
}

/** Animação em loop (início → fim → início) com os músculos em vermelho. Respeita "reduzir movimento". */
export function FigureAnimated({ slug, className = '', label }: { slug: string; className?: string; label?: string | undefined }) {
  const [e, setE] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t0 = performance.now();
    const loop = (now: number) => { setE(cycleE(now - t0)); raf.current = requestAnimationFrame(loop); };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [slug]);
  return <FigureFrame slug={slug} e={e} className={className} label={label}/>;
}
