
import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { supabase } from '../services/supabase';
import { Customer, Vehicle, FuelType, Job, JobStatus, Employee } from '../types';
import { Card, Button, Input, Select, Badge } from '../components/ui/AceternityUI';
import { ColorPicker } from '../components/ui/ColorPicker';
import { CustomerCard } from '@/components/CustomerCard';

export default function CustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New/Edit Customer State
  const [customerId, setCustomerId] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [referredBySource, setReferredBySource] = useState<'CUSTOMER' | 'STAFF' | 'NONE'>('NONE');
  const [referredByValue, setReferredByValue] = useState('');

  // New Vehicle State
  const [regNo, setRegNo] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [fuel, setFuel] = useState<FuelType>(FuelType.PETROL);

  const loadData = async () => {
    const [c, v, j, e] = await Promise.all([
      db.getCustomers(), db.getVehicles(), db.getJobs(), db.getEmployees()
    ]);
    setCustomers(c);
    setVehicles(v);
    setJobs(j);
    setEmployees(e);
  };

  useEffect(() => { loadData(); }, []);

  const handleOnboard = async () => {
    if (!name || !mobile || !regNo || !model) return alert("Fill all details");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return alert("Session expired. Please log in again.");

    const newCustomerId = crypto.randomUUID();

    const newCust: Customer = {
      id: newCustomerId,
      name,
      mobile,
      email: email || undefined,
      referredByCustomerId: referredBySource === 'CUSTOMER' ? referredByValue : undefined,
      referringEmployeeId: referredBySource === 'STAFF' ? referredByValue : undefined,
      createdAt: new Date().toISOString()
    };

    const newVeh: Vehicle = {
      id: crypto.randomUUID(),
      customerId: newCustomerId,
      regNumber: regNo,
      model,
      color,
      fuelType: fuel
    };

    try {
      await db.addCustomer(newCust, session.user.id);
      await db.addVehicle(newVeh, session.user.id);
      await loadData();
      setIsAdding(false);
      resetForm();
    } catch (error: any) {
      alert(`Failed to onboard customer: ${error.message || 'Unknown Error'}`);
    }
  };

  const handleUpdate = async () => {
    if (!name || !mobile) return alert("Name and Mobile are required");
    try {
      await db.updateCustomer(customerId, {
        name,
        mobile,
        email: email || undefined,
        referredByCustomerId: referredBySource === 'CUSTOMER' ? referredByValue : undefined,
        referringEmployeeId: referredBySource === 'STAFF' ? referredByValue : undefined
      });
      await loadData();
      setIsEditing(false);
      setSelectedCustomer(null);
      resetForm();
    } catch (error: any) {
      alert(`Failed to update customer: ${error.message || 'Unknown Error'}`);
    }
  };

  const handleAddVehicle = async () => {
    if (!selectedCustomer || !regNo || !model) return alert("Vehicle details missing");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return alert("Session expired. Please log in again.");

    const newVeh: Vehicle = {
      id: crypto.randomUUID(),
      customerId: selectedCustomer.id,
      regNumber: regNo,
      model,
      color,
      fuelType: fuel
    };

    try {
      await db.addVehicle(newVeh, session.user.id);
      await loadData();
      setIsAddingVehicle(false);
      setRegNo(''); setModel(''); setColor(''); setFuel(FuelType.PETROL);
    } catch (error: any) {
      alert(`Failed to add vehicle: ${error.message || 'Unknown Error'}`);
    }
  };

  const resetForm = () => {
    setCustomerId('');
    setName('');
    setMobile('');
    setEmail('');
    setReferredBySource('NONE');
    setReferredByValue('');
    setRegNo('');
    setModel('');
    setColor('');
    setFuel(FuelType.PETROL);
  };

  const startEdit = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomerId(c.id);
    setName(c.name);
    setMobile(c.mobile);
    setEmail(c.email || '');
    if (c.referredByCustomerId) {
      setReferredBySource('CUSTOMER');
      setReferredByValue(c.referredByCustomerId);
    } else if (c.referringEmployeeId) {
      setReferredBySource('STAFF');
      setReferredByValue(c.referringEmployeeId);
    } else {
      setReferredBySource('NONE');
      setReferredByValue('');
    }
    setIsEditing(true);
    setIsAdding(false);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile.includes(search)
  );

  const getReferralChain = (customer: Customer) => {
    const chain: { id: string, name: string, type: 'C' | 'S' }[] = [];
    let currentLink: { custId?: string, empId?: string } | undefined = undefined;

    if (customer.referredByCustomerId) currentLink = { custId: customer.referredByCustomerId };
    else if (customer.referringEmployeeId) currentLink = { empId: customer.referringEmployeeId };

    while (currentLink && chain.length < 3) {
      if (currentLink.custId) {
        const parent = customers.find(c => c.id === currentLink!.custId);
        if (parent) {
          chain.push({ id: parent.id, name: parent.name, type: 'C' });
          if (parent.referredByCustomerId) currentLink = { custId: parent.referredByCustomerId };
          else if (parent.referringEmployeeId) currentLink = { empId: parent.referringEmployeeId };
          else currentLink = undefined;
        } else break;
      } else if (currentLink.empId) {
        const staff = employees.find(e => e.id === currentLink!.empId);
        if (staff) {
          chain.push({ id: staff.id, name: staff.name, type: 'S' });
        }
        currentLink = undefined; // Staff is terminal
      }
    }
    return chain;
  };

  const customerJobs = selectedCustomer ? jobs.filter(j => j.customerId === selectedCustomer.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Customers & Referral Network</h2>
          <p className="text-slate-500 text-sm">Manage client directory and staff-driven network</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative">
            <input
              placeholder="Search Name or Mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 w-full md:w-64 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
            <svg className="absolute left-3 top-2.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </div>
          <Button onClick={() => { setIsAdding(!isAdding); setIsEditing(false); resetForm(); }}>
            {isAdding ? 'Cancel' : '+ New Onboarding'}
          </Button>
        </div>
      </div>

      {(isAdding || isEditing) && (
        <Card className="animate-in fade-in slide-in-from-top-4 border-blue-200 shadow-blue-500/10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-900">{isEditing ? 'Update Profile' : 'New Onboarding'}</h3>
              <p className="text-xs text-slate-500">Track how this customer joined the studio.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs text-blue-600 uppercase font-black tracking-widest">Personal Info</h4>
              <Input label="Owner Name" placeholder="Rahul Sharma" value={name} onChange={(e: any) => setName(e.target.value)} />
              <Input label="Mobile" placeholder="+91..." value={mobile} onChange={(e: any) => setMobile(e.target.value)} />
              <Input label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />

              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Referral Source</label>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => { setReferredBySource('NONE'); setReferredByValue(''); }} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${referredBySource === 'NONE' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}>NONE</button>
                  <button onClick={() => { setReferredBySource('CUSTOMER'); setReferredByValue(''); }} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${referredBySource === 'CUSTOMER' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}>CUSTOMER</button>
                  <button onClick={() => { setReferredBySource('STAFF'); setReferredByValue(''); }} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${referredBySource === 'STAFF' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}>STAFF</button>
                </div>

                {referredBySource === 'CUSTOMER' && (
                  <Select value={referredByValue} onChange={(e: any) => setReferredByValue(e.target.value)}>
                    <option value="">Select Customer</option>
                    {customers.filter(c => c.id !== customerId).map(c => <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>)}
                  </Select>
                )}
                {referredBySource === 'STAFF' && (
                  <Select value={referredByValue} onChange={(e: any) => setReferredByValue(e.target.value)}>
                    <option value="">Select Staff Member</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} (Technician)</option>)}
                  </Select>
                )}
              </div>
            </div>
            {!isEditing && (
              <div className="space-y-4">
                <h4 className="text-xs text-indigo-600 uppercase font-black tracking-widest">Initial Vehicle</h4>
                <Input label="Registration No" placeholder="DL-XX-XXXX" value={regNo} onChange={(e: any) => setRegNo(e.target.value)} />
                <Input label="Model" placeholder="e.g. Swift" value={model} onChange={(e: any) => setModel(e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker label="Color" value={color} onChange={setColor} className="mb-0" />
                  <Select label="Fuel" value={fuel} onChange={(e: any) => setFuel(e.target.value)}>
                    {Object.values(FuelType).map(f => <option key={f} value={f}>{f}</option>)}
                  </Select>
                </div>
              </div>
            )}
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
            <Button variant="secondary" onClick={() => { setIsAdding(false); setIsEditing(false); resetForm(); }}>Cancel</Button>
            <Button className="px-10" onClick={isEditing ? handleUpdate : handleOnboard}>
              {isEditing ? 'Save Changes' : 'Onboard Customer'}
            </Button>
          </div>
        </Card>
      )}

      {selectedCustomer && !isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => setSelectedCustomer(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-2xl font-black">
                {selectedCustomer.name[0]}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{selectedCustomer.name}</h3>
                <div className="flex items-center gap-4 text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg> {selectedCustomer.mobile}</span>
                  <Button variant="ghost" className="h-8 text-xs p-0" onClick={(e) => startEdit(selectedCustomer, e as any)}>Edit Profile</Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Service & Visit Ledger</h4>
                  <div className="space-y-3">
                    {customerJobs.map(job => (
                      <div key={job.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold text-slate-900">Job #{job.id.slice(0, 6).toUpperCase()}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">{new Date(job.createdAt).toLocaleDateString()}</div>
                          </div>
                          <Badge color={job.status === JobStatus.COMPLETED ? 'green' : 'blue'}>{job.status}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {/* Fixed: s.serviceId -> s.id */}
                          {job.services.map(s => <span key={s.id} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-medium">{s.serviceName}</span>)}
                        </div>
                        <div className="text-right font-black text-slate-900">₹{job.totalAmount.toLocaleString()}</div>
                      </div>
                    ))}
                    {customerJobs.length === 0 && <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 italic text-sm">No service history found.</div>}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Linked Vehicles</h4>
                  <div className="space-y-2">
                    {vehicles.filter(v => v.customerId === selectedCustomer.id).map(v => (
                      <div key={v.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{v.model}</div>
                          <div className="text-[10px] font-mono text-blue-600 font-bold">{v.regNumber}</div>
                        </div>
                        <Badge color="blue">{v.fuelType}</Badge>
                      </div>
                    ))}
                    {!isAddingVehicle ? (
                      <button
                        onClick={() => setIsAddingVehicle(true)}
                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-all font-bold text-xs uppercase"
                      >
                        + Link Vehicle
                      </button>
                    ) : (
                      <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl space-y-3">
                        <Input label="Reg Number" value={regNo} onChange={(e: any) => setRegNo(e.target.value)} />
                        <Input label="Model" value={model} onChange={(e: any) => setModel(e.target.value)} />
                        <div className="grid grid-cols-2 gap-2">
                          <ColorPicker label="Color" value={color} onChange={setColor} className="mb-0" />
                          <Select label="Fuel" value={fuel} onChange={(e: any) => setFuel(e.target.value)}>
                            {Object.values(FuelType).map(f => <option key={f} value={f}>{f}</option>)}
                          </Select>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button className="flex-1 text-xs" onClick={handleAddVehicle}>Add</Button>
                          <Button variant="secondary" className="text-xs" onClick={() => setIsAddingVehicle(false)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Upline Trace</h4>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    {getReferralChain(selectedCustomer).length > 0 ? (
                      <div className="space-y-4">
                        {getReferralChain(selectedCustomer).reverse().map((link, idx) => (
                          <div key={link.id} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${link.type === 'S' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'}`}>
                              {link.name[0]}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-indigo-900">{link.name}</div>
                              <div className="text-[10px] text-indigo-400 font-bold uppercase">{link.type === 'S' ? 'Staff Origin' : `L${idx + 1} Path`}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-indigo-500 italic text-center py-2">Direct Client</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(c => (
          <CustomerCard
            key={c.id}
            customer={c}
            allCustomers={customers}
            allEmployees={employees}
            onSelect={setSelectedCustomer}
          />
        ))}
      </div>
    </div>
  );
}