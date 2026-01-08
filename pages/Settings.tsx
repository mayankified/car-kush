
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { SystemSettings } from '../types';
import { Card, Button, Input } from '../components/ui/AceternityUI';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    referralRateL1: 20,
    referralRateL2: 10,
    referralRateL3: 5,
    gstRate: 18,
    defaultDiscount: 10
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await db.getSettings();
    setSettings(s);
    setLoading(false);
  };

  const handleUpdateSettings = async () => {
    await db.updateSettings(settings);
    alert('Global settings updated successfully!');
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Global Settings</h2>
        <p className="text-sm text-slate-500">Configure core system variables and billing defaults.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billing Defaults */}
        <Card className="border-blue-100">
          <div className="mb-6">
            <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
              Billing Configuration
            </h3>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Automatic snapshots for new jobs</p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Input 
                label="Standard GST Rate (%)" 
                type="number" 
                value={settings.gstRate} 
                onChange={(e:any) => setSettings({...settings, gstRate: Number(e.target.value)})} 
              />
              <span className="absolute right-4 top-[38px] text-slate-400 font-bold">%</span>
            </div>
            
            <div className="relative">
              <Input 
                label="Default Customer Discount (₹)" 
                type="number" 
                value={settings.defaultDiscount} 
                onChange={(e:any) => setSettings({...settings, defaultDiscount: Number(e.target.value)})} 
              />
              <span className="absolute right-4 top-[38px] text-slate-400 font-bold">₹</span>
            </div>
          </div>
        </Card>

        {/* Network Referral Structure */}
        <Card className="border-indigo-100 bg-indigo-50/20">
          <div className="mb-4">
            <h3 className="font-bold text-xl text-indigo-900 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 12 17.19 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/><line x1="4.7" x2="8" y1="16.06" y2="14.19"/><line x1="19.3" x2="16" y1="16.06" y2="14.19"/></svg>
              Referral Payout Structure
            </h3>
            <p className="text-xs text-indigo-600 font-medium">3-Tier Multi-Level Marketing percentages.</p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Input 
                label="Level 1 (Legacy)" 
                type="number" 
                value={settings.referralRateL1} 
                onChange={(e:any) => setSettings({...settings, referralRateL1: Number(e.target.value)})} 
              />
              <span className="absolute right-4 top-[38px] text-indigo-400 font-bold">%</span>
            </div>
            <div className="relative">
              <Input 
                label="Level 2 (Indirect)" 
                type="number" 
                value={settings.referralRateL2} 
                onChange={(e:any) => setSettings({...settings, referralRateL2: Number(e.target.value)})} 
              />
              <span className="absolute right-4 top-[38px] text-indigo-400 font-bold">%</span>
            </div>
            <div className="relative">
              <Input 
                label="Level 3 (Direct Referrer)" 
                type="number" 
                value={settings.referralRateL3} 
                onChange={(e:any) => setSettings({...settings, referralRateL3: Number(e.target.value)})} 
              />
              <span className="absolute right-4 top-[38px] text-indigo-400 font-bold">%</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleUpdateSettings} className="px-12 py-3 shadow-lg">Save System Configuration</Button>
      </div>
    </div>
  );
}
