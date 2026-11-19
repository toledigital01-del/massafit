import { createFileRoute } from "@tanstack/react-router";
import { DashboardView } from '@/components/dashboard-view';

// The home route ships no og:image, so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head:()=>({meta:[{title:'MassaFit · Seu progresso diário'},{name:'description',content:'Acompanhe suas metas de calorias, macros, água e ganho de massa muscular.'},{property:'og:title',content:'MassaFit · Seu progresso diário'},{property:'og:description',content:'Seu plano, seu ritmo, sua evolução. Nutrição e ganho de massa muscular.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return <DashboardView/>;
}
