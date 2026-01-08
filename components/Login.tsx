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
    db.getEmployees().then((emps) => {
      setIsFirstRun(emps.length === 0);
    });
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900 to-black px-4">
      <div className="w-full max-w-md">

        {/* Logo & Branding */}
        <div className="text-center ">
          <div className="flex justify-center ">
            <img
              src="/logo.png"
              alt="Kush Motors"
              className="h-40 w-auto drop-shadow-xl"
              draggable={false}
            />
          </div>

        </div>

        <Card className="relative border border-slate-800 bg-slate-800/60 backdrop-blur-xl shadow-xl rounded-2xl px-6">

          {/* Setup badge */}
          {isFirstRun && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-4 py-1 rounded-full tracking-widest shadow-lg">
              SETUP MODE
            </div>
          )}

          <h2 className="text-xl font-bold text-white text-center mb-1">
            {isSignUp ? 'Create Admin Account' : 'Staff Login'}
          </h2>

          <p className="text-center text-xs text-slate-400 mb-6">
            {isFirstRun
              ? 'First registered user becomes system admin'
              : 'Login to access your dashboard'}
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300 text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              placeholder="you@company.com"
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />

            <Button
              onClick={handleAuth}
              disabled={loading}
              className="w-full py-3 text-base font-semibold"
            >
              {loading
                ? 'Please wait...'
                : isSignUp
                ? 'Create Account'
                : 'Login'}
            </Button>
          </div>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Login'
                : 'Need an account? Sign up'}
            </button>
          </div>
        </Card>

        {/* Setup hint */}
        {isFirstRun && (
          <div className="mt-6 text-center">
            <p className="text-xs text-blue-400">
              System initialization in progress — registration is open
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
