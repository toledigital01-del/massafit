import { useEffect, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { useAuth } from './auth-context';
import { AuthDialog } from './auth-dialog';
import { OnboardingWizard } from './onboarding-wizard';
import { getDashboard, recordAction, saveProfile } from '@/lib/massafit.functions';
import { calculateGoals, exampleProfile, localDay } from '@/lib/nutrition';
import { Button } from './ui/button';
import { clearGuest, loadGuest, markSkipped, saveGuest, wasSkipped, type Guest } from '@/lib/onboarding';
import { foodCatalog } from '@/lib/food-catalog';
export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
const guestFoods = foodCatalog.map((f,index)=>({...f,id:`guest-${index}`}));
const guestData:DashboardData={profile:{...exampleProfile,id:'guest',name:'',onboarded:true},goals:{...calculateGoals(exampleProfile),user_id:'guest'},foods:guestFoods,meals:[],water:[],weights:[],supplements:[],favorites:[],recent:[]};
export function useDashboardData(day:string) {
 const {user,loading}=useAuth();const fetchData=useServerFn(getDashboard);
 return useQuery({queryKey:['massafit',user?.id,day],queryFn:()=>fetchData({data:{day}}),enabled:!loading && Boolean(user)});
}
export function DataBoundary({day=localDay(),children}:{day?:string;children:(data:DashboardData,act:(data:Parameters<typeof recordAction>[0]['data'])=>Promise<boolean>,busy:boolean)=>ReactNode}) {
 const {user,loading}=useAuth();const query=useDashboardData(day);const [auth,setAuth]=useState(false);const [busy,setBusy]=useState(false);const action=useServerFn(recordAction);const save=useServerFn(saveProfile);const qc=useQueryClient();
 const [guest,setGuest]=useState<Guest|null>(null);const [ready,setReady]=useState(false);const [wizard,setWizard]=useState(false);const [autoFailed,setAutoFailed]=useState(false);
 useEffect(()=>{setGuest(loadGuest());setReady(true);if(!loadGuest()&&!wasSkipped())setWizard(true);},[]);
 const pending=Boolean(user)&&Boolean(query.data)&&!query.data?.profile?.onboarded;
 // quem montou o plano antes de criar a conta não precisa responder tudo de novo
 useEffect(()=>{if(!user||!pending||!guest)return;let live=true;void (async()=>{try{await save({data:{profile:{...guest.profile,sex:guest.profile.sex==='female'?'female':'male'},surplus:guest.adj}});clearGuest();if(live){setGuest(null);await qc.invalidateQueries({queryKey:['massafit']});}}catch{if(live)setAutoFailed(true);}})();return()=>{live=false;};},[user,pending,guest,save,qc]);
 async function act(data:Parameters<typeof recordAction>[0]['data']){if(!user){setAuth(true);return false;}setBusy(true);try {await action({data});await qc.invalidateQueries({queryKey:['massafit']});toast.success('Registro salvo');return true;}catch(e){toast.error(e instanceof Error?e.message:'Não foi possível salvar.');return false;}finally{setBusy(false);}}
 if(loading || (user && query.isPending))return <div className="py-12 space-y-5 animate-pulse"><div className="h-10 w-2/3 bg-muted rounded-md"/><div className="h-64 bg-muted rounded-md"/><div className="h-48 bg-muted rounded-md"/></div>;
 if(user && query.isError)return <div className="py-16 text-center"><p className="mb-5 text-muted-foreground">Não foi possível carregar seus dados.</p><Button onClick={()=>void query.refetch()}>Tentar novamente</Button></div>;
 const data=user?query.data:(guest?{...guestData,profile:{...guestData.profile!,...guest.profile,id:'guest',onboarded:true},goals:{...calculateGoals(guest.profile,guest.adj),user_id:'guest'}} as DashboardData:guestData);if(!data || !data.profile)return null;
 const finishGuest=async(profile:Guest['profile'],adj:number)=>{const g={profile,adj};saveGuest(g);setGuest(g);setWizard(false);};
 const finishUser=async(profile:Guest['profile'],adj:number)=>{await save({data:{profile:{...profile,sex:profile.sex==='female'?'female':'male'},surplus:adj}});await qc.invalidateQueries({queryKey:['massafit']});};
 return <>{!user && <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3 text-xs text-muted-foreground"><span>{guest?'Plano montado com os seus dados · ':'Prévia com dados de exemplo · '}Seus registros começam ao criar uma conta.</span><span className="flex gap-3">{ready&&<Button variant="link" className="h-8 p-0 text-xs" onClick={()=>setWizard(true)}>{guest?'Refazer meu plano':'Montar o meu plano'}</Button>}<Button variant="link" className="h-8 p-0 text-xs" onClick={()=>setAuth(true)}>Criar minha conta →</Button></span></div>}{children(data,act,busy)}<AuthDialog open={auth} onClose={()=>setAuth(false)}/>{!user && wizard && <OnboardingWizard initial={guest?.profile} submitLabel="Ver meu plano" onFinish={finishGuest} onSkip={()=>{markSkipped();setWizard(false);}}/>}{user && !data.profile.onboarded && (!guest || autoFailed) && <OnboardingWizard initial={{...(guest?.profile ?? data.profile),name:(guest?.profile.name || data.profile.name || user.user_metadata?.["name"] || '')}} submitLabel="Começar meu plano" onFinish={finishUser}/>}</>;
}
