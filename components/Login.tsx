
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { db } from '../services/mockDb';
import { Card, Button, Input } from './ui/AceternityUI';

export default function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isFirstRun, setIsFirstRun] = useState(false);

  useEffect(() => {
    // Check if the system has any employees
    db.getEmployees().then(emps => {
        setIsFirstRun(emps.length === 0);
    });
  }, []);

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Car Studio</h1>
            <p className="text-slate-400">Professional Management System</p>
        </div>
        
        <Card className="border-slate-800 bg-slate-800/50 backdrop-blur relative">
           {isFirstRun && (
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">
                Setup Mode Active
             </div>
           )}

           <h2 className="text-xl font-bold text-white mb-2 text-center">{isSignUp ? 'Create Account' : 'Staff Login'}</h2>
           <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest mb-6 font-bold">
             {isFirstRun ? 'The first user to sign up will be the Admin' : 'Enter your credentials to continue'}
           </p>
           
           {error && (
             <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
               {error}
             </div>
           )}

           <div className="space-y-4">
               <Input label="Email Address" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="your@email.com" />
               <Input label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" />
               
               <Button onClick={handleAuth} disabled={loading} className="w-full py-3 text-lg">
                 {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
               </Button>
           </div>
           
           <div className="mt-6 text-center">
             <button onClick={() => setIsSignUp(!isSignUp)} className="text-slate-400 hover:text-white text-sm transition-colors">
               {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
             </button>
           </div>
        </Card>

        {isFirstRun && (
            <div className="mt-6 text-center animate-pulse">
                <p className="text-xs text-blue-400 font-medium">System Initialization: Registration is currently open.</p>
            </div>
        )}
      </div>
    </div>
  );
}
