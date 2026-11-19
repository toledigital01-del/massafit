import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
const AuthContext = createContext<{user:User|null;loading:boolean}>({user:null,loading:true});
export function AuthProvider({children}:{children:ReactNode}) {
  const [user,setUser] = useState<User|null>(null); const [loading,setLoading] = useState(true);
  const queryClient = useQueryClient();
  useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({data}) => {if(alive){setUser(data.user);setLoading(false);}});
    const {data:{subscription}} = supabase.auth.onAuthStateChange((event,session) => {
      if(!['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event)) return;
      setUser(session?.user ?? null);setLoading(false);
      if(event === 'SIGNED_OUT') queryClient.removeQueries({queryKey:['massafit']});
      else void queryClient.invalidateQueries({queryKey:['massafit']});
    });
    return () => {alive=false;subscription.unsubscribe();};
  },[queryClient]);
  return <AuthContext.Provider value={{user,loading}}>{children}</AuthContext.Provider>;
}
export function useAuth(){return useContext(AuthContext);}