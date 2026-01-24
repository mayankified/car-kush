import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Employee, Job, JobStatus, UserRole } from '../types';
import { Card, Button, Input, Select, Badge } from '../components/ui/AceternityUI';
import { supabase } from '@/services/supabase';

export default function EmployeeManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState(UserRole.STAFF);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [commission, setCommission] = useState('10'); // Direct labor payout
  const [password, setPassword] = useState('');
  
  // New Referral State
  const [referredBy, setReferredBy] = useState(''); // ID of the recruiter
  const [recruiterComm, setRecruiterComm] = useState('5'); // % recruiter gets from this person's sales

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setEmployees(await db.getEmployees());
    setJobs(await db.getJobs());
  };

  const handleAdd = async () => {
    if (!name || !commission || !email || !password) {
      return alert("Required fields missing.");
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      alert(error?.message || "Failed to create auth user");
      return;
    }

    await db.addEmployee({
      id: data.user.id,
      name,
      role,
      phone,
      email,
      commissionRate: Number(commission),
      referredByEmployeeId: referredBy || null,
      recruiterCommission: Number(recruiterComm)
    });

    // Reset Form
    setName(''); setPhone(''); setEmail(''); setPassword('');
    setCommission('10'); setReferredBy(''); setRecruiterComm('2');
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this staff?')) { 
      await db.deleteEmployee(id); 
      refresh(); 
    }
  };

const calculatePerformance = (empId: string) => {
  const emp = employees.find(e => e.id === empId);
  if (!emp) return { revenue: 0, myCommission: 0, referralEarnings: 0, jobCount: 0 };

  // 1. Filter jobs completed by this employee (for Direct Labor)
  const myJobs = jobs.filter(j => j.assignedEmployeeId === empId && j.status === JobStatus.COMPLETED);
  
  // Calculate Direct Labor Revenue
  const laborRevenue = myJobs.reduce((acc, j) => {
    const servicesTotal = j.services?.reduce((sAcc, s) => sAcc + s.priceAtTime, 0) || 0;
    return acc + servicesTotal;
  }, 0);

  // Direct Commission (Personal Work)
  const myCommission = Math.round((laborRevenue * (emp.commissionRate || 0)) / 100);

  // 2. Calculate ALL Referral Earnings from the Snapshots
  // We look through EVERY completed job to see if this employee's ID is in the commission list
  let totalReferralEarnings = 0;

  jobs.filter(j => j.status === JobStatus.COMPLETED).forEach(job => {
    if (job.referralCommissions && Array.isArray(job.referralCommissions)) {
      // Find any commission entry where this employee is the beneficiary
      const myShares = job.referralCommissions.filter(rc => rc.employeeId === empId);
      
      myShares.forEach(share => {
        totalReferralEarnings += share.amount;
      });
    }
  });

  return {
    revenue: laborRevenue,
    myCommission: myCommission,
    referralEarnings: totalReferralEarnings,
    jobCount: myJobs.length
  };
};
  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[350px] space-y-6">
          <Card>
            <div className="mb-6">
              <h3 className="font-bold text-xl text-slate-900">Add Staff Member</h3>
              <p className="text-sm text-slate-500">Register new staff and set referral links.</p>
            </div>
            <div className="space-y-3">
              <Input label="Full Name" value={name} onChange={(e: any) => setName(e.target.value)} />
              <Input label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
              <Input label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
              <Input label="Phone" value={phone} onChange={(e: any) => setPhone(e.target.value)} />
              
              <div className="grid grid-cols-2 gap-4">
                <Select label="Role" value={role} onChange={(e: any) => setRole(e.target.value)}>
                  <option value={UserRole.STAFF}>Staff</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </Select>
                <Input label="Labor Payout %" type="number" value={commission} onChange={(e: any) => setCommission(e.target.value)} />
              </div>

              <hr className="my-2 border-slate-100" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Internal Referral</p>
              
              <Select label="Recruited By" value={referredBy} onChange={(e: any) => setReferredBy(e.target.value)}>
                <option value="">Direct Hire (No Referral)</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
              
              <Input 
                label="Recruiter's Share %" 
                type="number" 
                value={recruiterComm} 
                onChange={(e: any) => setRecruiterComm(e.target.value)} 
                placeholder="2"
              />
            </div>
            <Button className="w-full mt-6" onClick={handleAdd}>Save Member</Button>
          </Card>
        </div>

        <div className="flex-1 space-y-4">
          <h3 className="font-bold text-2xl text-slate-900">Staff Ledger</h3>
          <div className="grid gap-4">
            {employees.map(emp => {
              const stats = calculatePerformance(emp.id);
              const totalEarnings = stats.myCommission + stats.referralEarnings;
              
              return (
                <Card key={emp.id} className="group hover:border-blue-400 transition-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
                        {emp.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-slate-900 flex items-center gap-2">
                          {emp.name}
                          <Badge color={emp.role === UserRole.ADMIN ? 'purple' : 'gray'}>{emp.role}</Badge>
                        </div>
                        <div className="flex gap-3 mt-1">
                           <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">{emp.commissionRate}% Labor</span>
                           {emp.referredByEmployeeId && (
                             <span className="text-[10px] text-orange-600 font-black uppercase tracking-widest">
                               Recruited by {employees.find(e => e.id === emp.referredByEmployeeId)?.name}
                             </span>
                           )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 w-full sm:w-auto bg-slate-50 p-3 rounded-xl">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Total Payout</div>
                        <div className="text-2xl font-black text-emerald-600">₹{totalEarnings.toLocaleString()}</div>
                        <div className="text-[9px] text-slate-500">
                          Labor: ₹{stats.myCommission} | Referral: ₹{stats.referralEarnings}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(emp.id)} className="p-2 text-slate-300 hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}