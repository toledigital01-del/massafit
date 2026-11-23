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
export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
const guestFoods = [
 ['Ovo cozido',146,13.3,9.5,0.6,'1 unidade',50],['Pão integral',253,9.4,3.7,49.9,'1 fatia',25],['Aveia em flocos',394,13.9,8.5,66.6,'1 colher de sopa',15],['Arroz branco cozido',128,2.5,0.2,28.1,'1 colher de sopa',25],['Feijão carioca cozido',76,4.8,0.5,13.6,'1 concha',100],['Peito de frango grelhado',159,32,2.5,0,'1 filé médio',100],['Patinho grelhado',219,35.9,7.3,0,'1 bife médio',100],['Tilápia grelhada',128,26,2.7,0,'1 filé',120],['Batata-doce cozida',77,0.6,0.1,18.4,'1 unidade pequena',100],['Tapioca preparada',230,0.2,0,57.5,'1 unidade média',60],['Banana-prata',98,1.3,0.1,26,'1 unidade',80],['Iogurte natural',51,4.1,3,1.9,'1 pote',170],['Leite integral',61,2.9,3.3,4.3,'1 copo',200],['Castanha-do-pará',643,14.5,63.5,15.1,'2 unidades',10],['Azeite de oliva',884,0,100,0,'1 colher de sopa',13],['Pasta de amendoim',588,25,50,20,'1 colher de sopa',15],['Whey protein',400,80,6,8,'1 medida',30],
].map((f,index)=>({id:`guest-${index}`,name:String(f[0]),calories:Number(f[1]),protein:Number(f[2]),fat:Number(f[3]),carbs:Number(f[4]),portion_label:String(f[5]),portion_grams:Number(f[6])}));
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