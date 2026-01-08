
import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { Job, JobStatus, MonthlyTarget, Customer, UserRole, Vehicle } from '../types';
import { Card, Badge, Button, Input } from '../components/ui/AceternityUI';

export default function Dashboard({ onViewChange, userRole }: { onViewChange: (view: any) => void, userRole: UserRole }) {
  const [stats, setStats] = useState({
    todayJobs: 0,
    todayRevenue: 0,
    pendingJobs: 0,
    totalCustomers: 0,
    laborRevenue: 0
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [target, setTarget] = useState<MonthlyTarget | null>(null);
  const [dailyPerformance, setDailyPerformance] = useState<{date: string, amount: number}[]>([]);
  const [serviceAlerts, setServiceAlerts] = useState<Job[]>([]);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [newTargetInput, setNewTargetInput] = useState('0');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const jobsData = await db.getJobs();
    const custs = await db.getCustomers();
    const vehs = await db.getVehicles();
    setCustomers(custs);
    setVehicles(vehs);
    
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7);
    
    const todayJobsList = jobsData.filter(j => j.createdAt.startsWith(today));
    const completedToday = jobsData.filter(j => j.status === JobStatus.COMPLETED && j.completedAt?.startsWith(today));
    const pending = jobsData.filter(j => j.status !== JobStatus.COMPLETED && j.status !== JobStatus.CANCELLED);
    
    const revenue = completedToday.reduce((sum, j) => sum + j.totalAmount, 0);
    const labor = completedToday.reduce((sum, j) => {
        const servicesTotal = (j.services || []).reduce((sSum, s) => sSum + s.priceAtTime, 0);
        return sum + servicesTotal;
    }, 0);

    setStats({
      todayJobs: todayJobsList.length,
      todayRevenue: revenue,
      pendingJobs: pending.length,
      totalCustomers: custs.length,
      laborRevenue: labor
    });
    
    setRecentJobs(jobsData.slice(0, 5));

    // Calculate service alerts for old completed jobs (5 months ago)
    const alerts = jobsData
      .filter(j => j.status === JobStatus.COMPLETED && j.completedAt)
      .filter(j => {
          const compDate = new Date(j.completedAt!);
          const limitDate = new Date();
          limitDate.setMonth(limitDate.getMonth() - 5);
          return compDate < limitDate;
      })
      .slice(0, 3);
    setServiceAlerts(alerts);

    const monthTarget = await db.getTargetForMonth(currentMonth);
    setTarget(monthTarget);
    if (monthTarget) setNewTargetInput(monthTarget.targetAmount.toString());

    const thirtyDaysData = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayRev = jobsData
            .filter(j => j.status === JobStatus.COMPLETED && j.completedAt?.startsWith(dateStr))
            .reduce((sum, j) => sum + j.totalAmount, 0);
        thirtyDaysData.push({ date: dateStr, amount: dayRev });
    }
    setDailyPerformance(thirtyDaysData);
  };

  const handleSetTarget = async () => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7);
    await db.saveTarget({
        month: currentMonth,
        targetAmount: Number(newTargetInput)
    });
    setShowTargetModal(false);
    loadData();
  };

  const currentMonthRevenue = dailyPerformance.reduce((acc, curr) => acc + curr.amount, 0);
  const targetPercent = target && target.targetAmount > 0 
    ? Math.min(Math.round((currentMonthRevenue / target.targetAmount) * 100), 100)
    : 0;

  const isAdmin = userRole === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-900">Workshop Pulse</h2>
           <p className="text-sm text-slate-500">Business overview and critical floor alerts</p>
        </div>
        <Button onClick={() => onViewChange('JOBS')}>+ New Job Card</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col gap-1 border-blue-100">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Revenue Today</span>
            <div className="text-2xl font-black text-slate-900">₹{stats.todayRevenue.toLocaleString()}</div>
            <div className="text-[10px] mt-1 font-bold text-blue-600">
                Processed via manual entry
            </div>
        </Card>
        <Card className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Floor Tasks</span>
            <div className="text-2xl font-black text-amber-500">{stats.pendingJobs}</div>
        </Card>
        <Card className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Month to Date</span>
            <div className="text-2xl font-black text-blue-500">₹{currentMonthRevenue.toLocaleString()}</div>
        </Card>
        <Card className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Goal Progress</span>
            <div className="text-2xl font-black text-emerald-500">{targetPercent}%</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900">30-Day Trajectory</h3>
                    {isAdmin && <Button variant="ghost" className="h-8 text-xs font-bold" onClick={() => setShowTargetModal(true)}>Set Target</Button>}
                </div>
                <div className="h-40 w-full flex items-end gap-1 mb-4">
                    {dailyPerformance.map((day, i) => (
                        <div 
                            key={i} 
                            title={`${day.date}: ₹${day.amount}`} 
                            className="flex-1 bg-blue-500/10 hover:bg-blue-600 transition-all rounded-t-sm" 
                            style={{ height: `${Math.max((day.amount / (Math.max(...dailyPerformance.map(d => d.amount), 1))) * 100, 5)}%` }}
                        />
                    ))}
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-widest text-slate-400">
                        Retention Alerts
                    </h3>
                    <div className="space-y-3">
                        {serviceAlerts.length > 0 ? serviceAlerts.map(job => {
                            const cust = customers.find(c => c.id === job.customerId);
                            const veh = vehicles.find(v => v.id === job.vehicleId);
                            return (
                                <div key={job.id} className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex justify-between items-center">
                                    <div className="min-w-0 text-left">
                                        <div className="text-xs font-bold text-rose-900 truncate">{cust?.name || 'Unknown'}</div>
                                        <div className="text-[10px] font-bold text-rose-400">{veh?.regNumber || 'No Reg'}</div>
                                    </div>
                                    <Badge color="red">Due</Badge>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-6 text-slate-400 text-xs italic">All clients healthy.</div>
                        )}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-widest text-slate-400">
                        Floor Activity
                    </h3>
                    <div className="space-y-3">
                        {recentJobs.filter(j => j.status === JobStatus.IN_PROGRESS).slice(0, 3).map(job => {
                             const veh = vehicles.find(v => v.id === job.vehicleId);
                             return (
                                <div key={job.id} className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-blue-900">{veh?.regNumber || 'Job Card'}</span>
                                        <span className="text-blue-500 animate-pulse">In Progress</span>
                                    </div>
                                </div>
                             );
                        })}
                        {recentJobs.filter(j => j.status === JobStatus.IN_PROGRESS).length === 0 && (
                            <div className="text-center py-6 text-slate-400 text-xs italic">No cars on floor.</div>
                        )}
                    </div>
                </Card>
            </div>
        </div>

        <div className="space-y-6">
            <Card>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Partner Network</h3>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                    {customers.filter(c => c.referredByCustomerId || c.referringEmployeeId).slice(0, 6).map(c => (
                        <div key={c.id} className="flex items-center gap-3 p-2 border-b border-slate-50 last:border-none">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">{c.name[0]}</div>
                            <div className="flex-1 min-w-0 text-left">
                                <div className="text-sm font-bold truncate">{c.name}</div>
                                <div className="text-[10px] text-slate-400">Team Network</div>
                            </div>
                        </div>
                    ))}
                    {customers.filter(c => c.referredByCustomerId || c.referringEmployeeId).length === 0 && (
                        <div className="text-center py-10 text-slate-400 text-xs italic">No referral nodes yet.</div>
                    )}
                </div>
            </Card>

            <Card className="bg-slate-900 text-white border-none shadow-xl">
                <h3 className="text-lg font-bold mb-4">Efficiency Stats</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Avg Job Release</span>
                        <span className="font-bold">4.2h</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Customer Load</span>
                        <span className="font-bold text-emerald-400">85%</span>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                         <div className="text-[10px] font-bold uppercase opacity-50 mb-2 text-left">Growth Performance</div>
                         <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }} />
                         </div>
                    </div>
                </div>
            </Card>
        </div>
      </div>

      {showTargetModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <Card className="w-full max-w-sm">
                  <h3 className="text-xl font-bold mb-6">Target Update</h3>
                  <Input label="Monthly Goal (₹)" type="number" value={newTargetInput} onChange={(e:any) => setNewTargetInput(e.target.value)} autoFocus />
                  <div className="flex gap-3 justify-end mt-8">
                      <Button variant="secondary" onClick={() => setShowTargetModal(false)}>Cancel</Button>
                      <Button onClick={handleSetTarget}>Save Goal</Button>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
}
