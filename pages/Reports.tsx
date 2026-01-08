
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Job, ReturnOrder, JobStatus, Employee, Expense, Customer } from '../types';
import { Card, Button, Badge } from '../components/ui/AceternityUI';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'REVENUE' | 'JOBS' | 'REFERRALS'>('REVENUE');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const load = async () => {
      const [j, r, e, c, ex] = await Promise.all([
        db.getJobs(), db.getReturns(), db.getEmployees(), db.getCustomers(), db.getExpenses()
      ]);
      setJobs(j);
      setReturns(r);
      setEmployees(e);
      setCustomers(c);
      setExpenses(ex);
    };
    load();
  }, []);

  const completedJobs = jobs.filter(j => j.status === JobStatus.COMPLETED);
  const totalRevenue = completedJobs.reduce((acc, j) => acc + j.totalAmount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  
  const totalLaborCommission = employees.reduce((acc, emp) => {
    const empJobs = completedJobs.filter(j => j.assignedEmployeeId === emp.id);
    const laborOnly = empJobs.reduce((sum, j) => {
        const services = j.services.reduce((sSum, s) => sSum + s.priceAtTime, 0);
        return sum + services + j.customServiceCharge;
    }, 0);
    return acc + Math.round((laborOnly * emp.commissionRate) / 100);
  }, 0);

  const totalReferralCommission = completedJobs.reduce((acc, j) => {
    const referralsTotal = (j.referralCommissions || []).reduce((sum, r) => sum + r.amount, 0);
    return acc + referralsTotal;
  }, 0);

  const netProfit = totalRevenue - totalExpenses - totalLaborCommission - totalReferralCommission;

  const formatCurrency = (amount: number) => {
      return amount.toLocaleString('en-IN', {
          maximumFractionDigits: 0,
          style: 'currency',
          currency: 'INR'
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-2xl font-bold text-slate-900">Advanced Reports</h2>
            <p className="text-sm text-slate-500">Tracking labor margins and multi-node referral payouts</p>
         </div>
         <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('REVENUE')} className={`px-4 py-2 text-xs font-bold rounded-lg ${activeTab === 'REVENUE' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Margins</button>
            <button onClick={() => setActiveTab('REFERRALS')} className={`px-4 py-2 text-xs font-bold rounded-lg ${activeTab === 'REFERRALS' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Network Payouts</button>
         </div>
      </div>

      {activeTab === 'REVENUE' && (
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-900 text-white border-none shadow-2xl">
                 <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Net Workshop Profit</div>
                 <div className="text-3xl font-black mt-2 text-emerald-400">{formatCurrency(netProfit)}</div>
              </Card>
              <Card>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Referral Liability</div>
                 <div className="text-2xl font-bold mt-2 text-indigo-600">{formatCurrency(totalReferralCommission)}</div>
              </Card>
              <Card>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Labor Commissions</div>
                 <div className="text-2xl font-bold mt-2 text-blue-600">{formatCurrency(totalLaborCommission)}</div>
              </Card>
              <Card>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fixed Expenses</div>
                 <div className="text-2xl font-bold mt-2 text-rose-500">-{formatCurrency(totalExpenses)}</div>
              </Card>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Staff Network Bonus</h3>
                    <div className="space-y-4">
                        {employees.map(emp => {
                            const bonus = completedJobs.reduce((acc, j) => {
                                const myComm = (j.referralCommissions || []).find(r => r.employeeId === emp.id);
                                return acc + (myComm ? myComm.amount : 0);
                            }, 0);
                            if (bonus === 0) return null;
                            return (
                                <div key={emp.id} className="flex justify-between items-center p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                    <div>
                                        <div className="font-bold text-slate-900">{emp.name}</div>
                                        <div className="text-[10px] text-indigo-400 font-bold uppercase">Staff Referral</div>
                                    </div>
                                    <div className="text-lg font-black text-indigo-600">{formatCurrency(bonus)}</div>
                                </div>
                            );
                        }).filter(Boolean)}
                        {employees.every(e => completedJobs.every(j => !(j.referralCommissions || []).some(r => r.employeeId === e.id))) && (
                            <div className="text-center py-10 text-slate-400 text-xs italic">No staff referrals yet.</div>
                        )}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Client Network Bonus</h3>
                    <div className="space-y-4">
                        {customers.map(c => {
                            const bonus = completedJobs.reduce((acc, j) => {
                                const myComm = (j.referralCommissions || []).find(r => r.customerId === c.id);
                                return acc + (myComm ? myComm.amount : 0);
                            }, 0);
                            if (bonus === 0) return null;
                            return (
                                <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div>
                                        <div className="font-bold text-slate-900">{c.name}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Customer Referral</div>
                                    </div>
                                    <div className="text-lg font-black text-slate-700">{formatCurrency(bonus)}</div>
                                </div>
                            );
                        }).filter(Boolean)}
                    </div>
                </Card>
           </div>
        </div>
      )}
    </div>
  );
}
