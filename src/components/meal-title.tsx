import { Apple, Coffee, Dumbbell, Moon, Soup, Utensils, type LucideIcon } from 'lucide-react';

const ICON: Record<string, LucideIcon> = { 'Café da manhã': Coffee, Lanche: Apple, Almoço: Utensils, 'Pré-treino': Dumbbell, Jantar: Soup, Ceia: Moon };

/** Título de refeição com ícone em destaque, para diferenciar os cartões à primeira vista. */
export function MealTitle({ label, sub, meta, done = false }: { label: string; sub?: string | undefined; meta?: string | undefined; done?: boolean }) {
  const Icon = ICON[label] ?? Utensils;
  return <div className="flex items-center gap-3 min-w-0">
    <span className={`size-11 shrink-0 rounded-xl grid place-items-center ${done ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'}`}><Icon size={22} aria-hidden="true"/></span>
    <div className="min-w-0">
      <h2 className="text-lg font-bold leading-tight whitespace-nowrap">{label}</h2>
      {(meta || sub) && <p className="text-xs text-muted-foreground mt-0.5 truncate">{meta && <span className="font-semibold text-foreground/80">{meta}</span>}{meta && sub && ' · '}{sub}</p>}
    </div>
  </div>;
}

/** Classe do cartão: ganha contorno na cor da marca quando a refeição já foi registrada. */
export const mealCardClass = (done: boolean) => `panel p-4 ${done ? 'border-primary/60 bg-primary/5' : 'bg-card'}`;
