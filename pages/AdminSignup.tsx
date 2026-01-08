
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { db } from '../services/mockDb';
import { UserRole } from '../types';
import { Card, Button, Input } from '../components/ui/AceternityUI';

export default function AdminSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleAdminOnboarding = async () => {
    if (!email || !password) return setError('All fields required');
    setLoading(true);
    setError('');

    try {
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Create Admin Employee Record
      await db.addEmployee({
        id: crypto.randomUUID(),
        name: email.split('@')[0].toUpperCase(),
        email: email,
        role: UserRole.ADMIN,
        commissionRate: 0,
        phone: 'HIDDEN'
      });

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                System Genesis Module
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Initialize Admin</h1>
            <p className="text-slate-400 text-sm">Direct administrative access override.</p>
        </div>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-xl">
          {success ? (
            <div className="py-12 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Admin Created!</h3>
                <p className="text-slate-400 text-sm">Redirecting to secure login gateway...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center">
                    ERROR: {error.toUpperCase()}
                </div>
              )}

              <div className="space-y-4">
                  <div className="group">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block group-focus-within:text-blue-500 transition-colors">Admin Identity</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@studio.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-700 font-medium"
                    />
                  </div>

                  <div className="group">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block group-focus-within:text-blue-500 transition-colors">Access Cipher</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-700 font-medium"
                    />
                  </div>
              </div>

              <div className="pt-4">
                  <button 
                    onClick={handleAdminOnboarding}
                    disabled={loading}
                    className="w-full bg-white text-black hover:bg-slate-200 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  >
                    {loading ? 'Initializing...' : 'Grant Admin Privileges'}
                  </button>
              </div>

              <p className="text-[10px] text-center text-slate-600 font-bold uppercase tracking-widest leading-relaxed pt-2">
                Warning: This process registers a new identity with root-level system permissions.
              </p>
            </div>
          )}
        </Card>
        
        <div className="mt-8 text-center">
            <button onClick={() => navigate('/login')} className="text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest transition-colors">
                ← Return to standard gateway
            </button>
        </div>
      </div>
    </div>
  );
}
