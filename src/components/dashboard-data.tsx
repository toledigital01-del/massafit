import { useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { useAuth } from './auth-context';
import { AuthDialog } from './auth-dialog';
import { ProfileDialog } from './profile-dialog';
import { getDashboard, recordAction } from '@/lib/massafit.functions';
import { calculateGoals, exampleProfile, localDay } from '@/lib/nutrition';
import { Button } from './ui/button';
import { foodCatalog } from '@/lib/food-catalog';
export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
const guestFoods = foodCatalog.map((f,index)=>({...f,id:`guest-${index}`}));
const guestData:DashboardData={profile:{...exampleProfile,id:'guest',name:'',onboarded:true},goals:{...calculateGoals(exampleProfile),user_id:'guest'},foods:guestFoods,meals:[],water:[],weights:[],supplements:[],favorites:[],recent:[]};
export function useDashboardData(day:string) {
 const {user,loading}=useAuth();const fetchData=useServerFn(getDashboard);
 return useQuery({queryKey:['massafit',user?.id,day],queryFn:()=>fetchData({data:{day}}),enabled:!loading && Boolean(user)});
}
export function DataBoundary({day=localDay(),children}:{day?:string;children:(data:DashboardData,act:(data:Parameters<typeof recordAction>[0]['data'])=>Promise<boolean>,busy:boolean)=>ReactNode}) {
 const {user,loading}=useAuth();const query=useDashboardData(day);const [auth,setAuth]=useState(false);const [busy,setBusy]=useState(false);const action=useServerFn(recordAction);const qc=useQueryClient();
 async function act(data:Parameters<typeof recordAction>[0]['data']){if(!user){setAuth(true);return false;}setBusy(true);try {await action({data});await qc.invalidateQueries({queryKey:['massafit']});toast.success('Registro salvo');return true;}catch(e){toast.error(e instanceof Error?e.message:'Não foi possível salvar.');return false;}finally{setBusy(false);}}
 if(loading || (user && query.isPending))return <div className="py-12 space-y-5 animate-pulse"><div className="h-10 w-2/3 bg-muted rounded-md"/><div className="h-64 bg-muted rounded-md"/><div className="h-48 bg-muted rounded-md"/></div>;
 if(user && query.isError)return <div className="py-16 text-center"><p className="mb-5 text-muted-foreground">Não foi possível carregar seus dados.</p><Button onClick={()=>void query.refetch()}>Tentar novamente</Button></div>;
 const data=user?query.data:guestData;if(!data || !data.profile)return null;
 return <>{!user && <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3 text-xs text-muted-foreground"><span>Prévia do plano · Seus registros começam ao criar uma conta.</span><Button variant="link" className="h-8 p-0 text-xs" onClick={()=>setAuth(true)}>Criar minha conta →</Button></div>}{children(data,act,busy)}<AuthDialog open={auth} onClose={()=>setAuth(false)}/>{user && !data.profile.onboarded && <ProfileDialog required profile={{...data.profile,name:data.profile.name || user.user_metadata?.["name"] || ''}} goals={data.goals ?? calculateGoals(data.profile)} onClose={()=>void qc.invalidateQueries({queryKey:['massafit']})}/>}</>;
}