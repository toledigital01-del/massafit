import { useState, type FormEvent } from 'react';
import { X, ArrowRight, Dumbbell, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
export function AuthDialog({open,onClose}:{open:boolean;onClose:()=>void}) {
  const [mode,setMode] = useState<'login'|'signup'|'forgot'>('login');
  const [email,setEmail] = useState('');const [password,setPassword] = useState('');const [name,setName] = useState('');
  const [busy,setBusy] = useState(false);const [message,setMessage] = useState('');
  async function submit(e:FormEvent) {
    e.preventDefault();setBusy(true);setMessage('');
    try {
      if(mode==='forgot') {
        const {error} = await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`});
        if(error) throw error;setMessage('Confira seu e-mail para redefinir a senha.');
      } else if(mode==='signup') {
        const {data,error} = await supabase.auth.signUp({email,password,options:{data:{name},emailRedirectTo:window.location.origin}});
        if(error) throw error;if(data.session) onClose();else setMessage('Conta criada! Confirme seu e-mail para entrar e montar seu plano.');
      } else {
        const {error} = await supabase.auth.signInWithPassword({email,password});if(error) throw error;onClose();
      }
    } catch {setMessage('Não foi possível continuar. Confira seus dados e tente novamente.');} finally {setBusy(false);}
  }
  async function google() {setBusy(true);setMessage('');try {const result=await lovable.auth.signInWithOAuth('google',{redirect_uri:window.location.origin});if(result.error) setMessage('Não foi possível entrar com o Google. Tente novamente.');else if(!result.redirected) onClose();} catch {setMessage('Não foi possível entrar com o Google.');} finally {setBusy(false);} }
  return <Dialog open={open} onOpenChange={v=>{if(!v)onClose();}}><DialogContent className="max-w-md p-8" aria-describedby={undefined}>
    <div className="brand mb-7"><span className="brand-symbol"><Dumbbell size={22}/></span><span>Massa<span className="text-primary">Fit</span></span></div>
    <DialogTitle className="text-2xl">{mode==='signup'?'Seu próximo passo começa aqui.':mode==='forgot'?'Recupere sua senha':'Bom ter você por aqui.'}</DialogTitle>
    <p className="text-sm text-muted-foreground">{mode==='signup'?'Crie sua conta e personalize suas metas.':'Entre para acompanhar seu progresso.'}</p>
    {mode!=='forgot' && <Button variant="google" className="w-full mt-3" onClick={google} disabled={busy}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Continuar com Google</Button>}
    <form onSubmit={submit} className="space-y-4 mt-2">
      {mode==='signup' && <label className="field">Seu nome<input value={name} onChange={e=>setName(e.target.value)} required maxLength={60} autoComplete="given-name"/></label>}
      <label className="field">E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label>
      {mode!=='forgot' && <label className="field">Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required autoComplete={mode==='signup'?'new-password':'current-password'}/></label>}
      {mode==='login' && <Button type="button" variant="link" className="px-0 h-8 text-xs" onClick={()=>{setMode('forgot');setMessage('');}}>Esqueci minha senha</Button>}
      {message && <p role="status" className="text-sm text-primary flex items-start gap-2"><Mail size={18} className="shrink-0"/>{message}</p>}
      <Button className="w-full" disabled={busy}>{busy?'Aguarde…':mode==='signup'?'Criar minha conta':mode==='forgot'?'Enviar e-mail':'Entrar'}<ArrowRight/></Button>
    </form>
    <Button variant="ghost" className="w-full text-sm text-muted-foreground" onClick={()=>{setMode(mode==='login'?'signup':'login');setMessage('');}}>{mode==='login'?'Ainda não tem conta? Cadastre-se':'Já tenho uma conta'}</Button>
  </DialogContent></Dialog>;
}