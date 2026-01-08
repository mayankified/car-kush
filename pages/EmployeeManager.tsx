
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Employee, Job, JobStatus, UserRole } from '../types';
import { Card, Button, Input, Select, Badge } from '../components/ui/AceternityUI';

export default function EmployeeManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  const [name, setName] = useState('');
  const [role, setRole] = useState(UserRole.STAFF);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [commission, setCommission] = useState('10'); 

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setEmployees(await db.getEmployees());
    setJobs(await db.getJobs());
  };

  const handleAdd = async () => {
    if(!name || !commission || !email) return alert("Required fields missing.");
    await db.addEmployee({
      id: crypto.randomUUID(), name, role, phone, email, commissionRate: Number(commission)
    });
    setName(''); setPhone(''); setEmail(''); setCommission('10');
    refresh();
  };

  const handleDelete = async (id: string) => {
    if(confirm('Remove this staff?')) { await db.deleteEmployee(id); refresh(); }
  };

  const calculatePerformance = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return { revenue: 0, commission: 0, jobCount: 0 };
    
    const empJobs = jobs.filter(j => j.assignedEmployeeId === empId && j.status === JobStatus.COMPLETED);
    
    // Revenue from manually entered services
    const laborRevenue = empJobs.reduce((acc, j) => {
        const servicesTotal = j.services.reduce((sAcc, s) => sAcc + s.priceAtTime, 0);
        return acc + servicesTotal;
    }, 0);

    const totalCommission = Math.round((laborRevenue * emp.commissionRate) / 100);
    
    return {
        revenue: laborRevenue,
        commission: totalCommission,
        jobCount: empJobs.length
    };
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-6">
         <div className="lg:w-[350px] space-y-6">
            <Card>
                <div className="mb-6">
                    <h3 className="font-bold text-xl text-slate-900">Add Staff Member</h3>
                    <p className="text-sm text-slate-500">Register new staff and set payout rates.</p>
                </div>
                <div className="space-y-1">
                    <Input label="Full Name" value={name} onChange={(e:any) => setName(e.target.value)} />
                    <Input label="Email" type="email" value={email} onChange={(e:any) => setEmail(e.target.value)} />
                    <Input label="Phone" value={phone} onChange={(e:any) => setPhone(e.target.value)} />
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Role" value={role} onChange={(e:any) => setRole(e.target.value)}>
                            <option value={UserRole.STAFF}>Staff</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                        </Select>
                        <Input label="Payout %" type="number" value={commission} onChange={(e:any) => setCommission(e.target.value)} />
                    </div>
                </div>
                <Button className="w-full mt-4" onClick={handleAdd}>Save Member</Button>
            </Card>
         </div>

         <div className="flex-1 space-y-4">
            <h3 className="font-bold text-2xl text-slate-900">Staff Ledger</h3>
            <div className="grid gap-4">
                {employees.map(emp => {
                  const stats = calculatePerformance(emp.id);
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
                                <div className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">{emp.commissionRate}% Labor Payout</div>
                             </div>
                          </div>
                          <div className="flex items-center gap-8 w-full sm:w-auto">
                             <div className="text-right">
                                 <div className="text-[10px] text-slate-400 font-bold uppercase">Net Earnings</div>
                                 <div className="text-2xl font-black text-emerald-600">₹{stats.commission.toLocaleString()}</div>
                                 <div className="text-[10px] text-slate-400">{stats.jobCount} Jobs Completed</div>
                             </div>
                             <button onClick={() => handleDelete(emp.id)} className="p-2 text-slate-300 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
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
