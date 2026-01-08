import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { supabase } from '../services/supabase';
import { Job, Customer, Vehicle, Employee, JobStatus, PaymentMode, SystemSettings, JobService } from '../types';
import { Card, Button, Input, Select, Badge } from '../components/ui/AceternityUI';

export default function JobManager() {
  const [mode, setMode] = useState<'LIST' | 'CREATE'>('LIST');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [globalSettings, setGlobalSettings] = useState<SystemSettings | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  
  // Dynamic Services State
  const [manualServices, setManualServices] = useState<JobService[]>([{ id: crypto.randomUUID(), serviceName: '', priceAtTime: 0 }]);
  
  const [discount, setDiscount] = useState<string>('0'); 
  const [isGstEnabled, setIsGstEnabled] = useState(false);
  const [gstRateSnap, setGstRateSnap] = useState(18);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [jobToComplete, setJobToComplete] = useState<Job | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(PaymentMode.CASH);

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (selectedCustomer && !editingJobId) {
        const customerVehicles = vehicles.filter(v => v.customerId === selectedCustomer);
        if (customerVehicles.length === 1) setSelectedVehicle(customerVehicles[0].id);
    }
  }, [selectedCustomer, vehicles, editingJobId]);

  const refreshData = async () => {
    try {
      const [j, c, v, settings] = await Promise.all([
        db.getJobs(), db.getCustomers(), db.getVehicles(), db.getSettings()
      ]);
      setJobs(j); 
      setCustomers(c); 
      setVehicles(v); 
      setGlobalSettings(settings);
    } catch (error) {
      console.error("Failed to load data", error);
    }
  };

  const handleStartNewJob = () => {
      resetForm();
      if (globalSettings) {
          setDiscount(globalSettings.defaultDiscount.toString());
          setGstRateSnap(globalSettings.gstRate);
          setIsGstEnabled(true);
      }
      setMode('CREATE');
  };

  const resetForm = () => {
    setEditingJobId(null); 
    setSelectedCustomer(''); 
    setSelectedVehicle(''); 
    setManualServices([{ id: crypto.randomUUID(), serviceName: '', priceAtTime: 0 }]); 
    setDiscount('0'); 
    setIsGstEnabled(false); 
    setGstRateSnap(18);
    setMode('LIST');
  };

  const handleEditJob = (job: Job) => {
    setEditingJobId(job.id);
    setSelectedCustomer(job.customerId);
    setSelectedVehicle(job.vehicleId);
    setManualServices(job.services.length > 0 ? job.services : [{ id: crypto.randomUUID(), serviceName: '', priceAtTime: 0 }]);
    setDiscount(job.discount.toString());
    setIsGstEnabled(job.isGstEnabled);
    setGstRateSnap(job.gstRateSnap);
    setMode('CREATE');
  };

  const addServiceRow = () => {
    setManualServices([...manualServices, { id: crypto.randomUUID(), serviceName: '', priceAtTime: 0 }]);
  };

  const updateServiceRow = (index: number, field: keyof JobService, value: any) => {
    const updated = [...manualServices];
    updated[index] = { ...updated[index], [field]: field === 'priceAtTime' ? Number(value) : value };
    setManualServices(updated);
  };

  const removeServiceRow = (index: number) => {
    if (manualServices.length === 1) return;
    setManualServices(manualServices.filter((_, i) => i !== index));
  };

  const handleSaveJob = async () => {
    if (!selectedCustomer || !selectedVehicle) return alert('Select Customer & Vehicle');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const validServices = manualServices.filter(s => s.serviceName.trim() !== '');
    const subtotal = validServices.reduce((acc, s) => acc + s.priceAtTime, 0);
    const taxable = Math.max(0, subtotal - Number(discount));
    const total = isGstEnabled ? Math.round(taxable * (1 + gstRateSnap / 100)) : taxable;

    const jobData: any = {
      customerId: selectedCustomer,
      vehicleId: selectedVehicle,
      services: validServices,
      discount: Number(discount),
      isGstEnabled: isGstEnabled,
      gstRateSnap: gstRateSnap,
      totalAmount: total
    };

    try {
        if (editingJobId) {
            await db.updateJob(editingJobId, jobData);
        } else {
            const newJob: Job = { id: crypto.randomUUID(), status: JobStatus.PENDING, createdAt: new Date().toISOString(), ...jobData };
            await db.addJob(newJob, session.user.id);
        }
        await refreshData();
        resetForm();
    } catch (err: any) {
        alert("Error saving job card: " + err.message);
    }
  };

  const handleStartJob = async (id: string) => {
    await db.updateJob(id, { status: JobStatus.IN_PROGRESS, startedAt: new Date().toISOString() });
    refreshData();
  };

  const openCompleteModal = (job: Job) => { 
    setJobToComplete(job); 
    setPaymentMode(PaymentMode.CASH); 
    setPaymentModalOpen(true); 
  };

  const confirmCompleteJob = async () => {
    if (!jobToComplete) return;
    try {
        await db.updateJob(jobToComplete.id, {
          status: JobStatus.COMPLETED,
          completedAt: new Date().toISOString(),
          paymentMode: paymentMode
        });
        setPaymentModalOpen(false); 
        setJobToComplete(null);
        await refreshData();
    } catch (err: any) {
        alert("Critical: Could not finalize invoice. " + err.message);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const cust = customers.find(c => c.id === job.customerId);
    const veh = vehicles.find(v => v.id === job.vehicleId);
    const matchesSearch = (cust?.name.toLowerCase().includes(searchTerm.toLowerCase()) || veh?.regNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch && (statusFilter === 'ALL' || job.status === statusFilter);
  });

  const subtotalLive = manualServices.reduce((a, b) => a + b.priceAtTime, 0);
  const taxableFinal = Math.max(0, subtotalLive - Number(discount));
  const gstFinal = isGstEnabled ? Math.round(taxableFinal * (gstRateSnap / 100)) : 0;
  const totalFinal = taxableFinal + gstFinal;

  if (mode === 'CREATE') {
    return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center gap-4">
           <Button variant="secondary" onClick={resetForm}>← Cancel</Button>
           <h2 className="text-2xl font-bold text-slate-900">{editingJobId ? 'Modify Job Card' : 'New Workshop Entry'}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b pb-2">1. Core Details</h3>
                <Select label="Customer" value={selectedCustomer} onChange={(e:any) => setSelectedCustomer(e.target.value)} disabled={!!editingJobId}>
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>)}
                </Select>
                <Select label="Vehicle" value={selectedVehicle} onChange={(e:any) => setSelectedVehicle(e.target.value)} disabled={!selectedCustomer || !!editingJobId}>
                    <option value="">Select Vehicle</option>
                    {vehicles.filter(v => v.customerId === selectedCustomer).map(v => <option key={v.id} value={v.id}>{v.regNumber} - {v.model}</option>)}
                </Select>
            </Card>

            <Card className="bg-slate-900 text-white border-none shadow-2xl">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold">Summary</h3>
                     <Badge color="blue">Live</Badge>
                 </div>
                 <div className="space-y-3">
                     <div className="flex justify-between text-xs text-slate-400"><span>Services Total</span><span className="text-white">₹{subtotalLive}</span></div>
                     <div className="flex justify-between text-xs text-slate-400"><span>Discount</span><span className="text-rose-400">-₹{discount}</span></div>
                     <div className="flex justify-between text-xs text-slate-400"><span>GST ({gstRateSnap}%)</span><span className="text-white">₹{gstFinal}</span></div>
                     <div className="pt-6 border-t border-slate-800 flex justify-between items-end">
                         <div>
                             <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Invoice</div>
                             <div className="text-4xl font-black text-emerald-400">₹{totalFinal.toLocaleString()}</div>
                         </div>
                     </div>
                     <Button className="w-full mt-4" onClick={handleSaveJob}>Save & Commit</Button>
                 </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">2. Services & Pricing</h3>
                <Button variant="ghost" className="text-xs h-8" onClick={addServiceRow}>+ Add Service Row</Button>
              </div>
              
              <div className="space-y-4">
                {manualServices.map((service, index) => (
                  <div key={service.id} className="flex gap-4 items-end animate-in fade-in slide-in-from-left-2">
                    <div className="flex-1">
                      <Input 
                        label={index === 0 ? "Service Name" : ""} 
                        placeholder="e.g. Interior Detailing" 
                        value={service.serviceName} 
                        onChange={(e:any) => updateServiceRow(index, 'serviceName', e.target.value)} 
                      />
                    </div>
                    <div className="w-32">
                      <Input 
                        label={index === 0 ? "Price (₹)" : ""} 
                        type="number" 
                        placeholder="0" 
                        value={service.priceAtTime} 
                        onChange={(e:any) => updateServiceRow(index, 'priceAtTime', e.target.value)} 
                      />
                    </div>
                    <button 
                      onClick={() => removeServiceRow(index)} 
                      className={`mb-5 p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all ${manualServices.length === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6 mt-10 pt-6 border-t border-slate-100">
                <Input label="Manual Discount (₹)" type="number" value={discount} onChange={(e:any) => setDiscount(e.target.value)} />
                <div className="flex items-center gap-3 pt-8">
                  <input type="checkbox" id="gst" checked={isGstEnabled} onChange={(e) => setIsGstEnabled(e.target.checked)} className="w-5 h-5 rounded text-blue-600" />
                  <label htmlFor="gst" className="text-xs font-bold uppercase tracking-widest text-slate-500">Apply GST ({gstRateSnap}%)</label>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div><h2 className="text-2xl font-bold text-slate-900">Live Workshop Floor</h2><p className="text-sm text-slate-500">Managing active car cards</p></div>
        <Button onClick={handleStartNewJob}>+ New Job Card</Button>
      </div>

      <div className="flex gap-4">
         <div className="relative flex-1"><input placeholder="Search Reg No or Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none" /><svg className="absolute left-3 top-3 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
         <select className="px-4 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wider" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
             <option value="ALL">All Status</option><option value={JobStatus.PENDING}>Pending</option><option value={JobStatus.IN_PROGRESS}>In Progress</option><option value={JobStatus.COMPLETED}>Completed</option>
         </select>
      </div>

      <div className="grid gap-4">
        {filteredJobs.map(job => {
             const cust = customers.find(c => c.id === job.customerId);
             const veh = vehicles.find(v => v.id === job.vehicleId);
             return (
               <Card key={job.id} className="group relative">
                 <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <Badge color={job.status === JobStatus.COMPLETED ? 'green' : job.status === JobStatus.PENDING ? 'yellow' : 'blue'}>{job.status}</Badge>
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="font-black text-xl text-slate-900 tracking-tight">{veh?.regNumber || 'Unknown'}</div>
                        <div className="text-sm text-slate-500 font-medium">{cust?.name} • {veh?.model}</div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-3 w-full md:w-auto">
                        <div className="text-3xl font-black text-slate-900">₹{job.totalAmount.toLocaleString()}</div>
                        <div className="flex gap-2">
                             {job.status === JobStatus.PENDING && <Button className="text-xs py-1.5 h-auto px-4" onClick={() => handleStartJob(job.id)}>Start Work</Button>}
                             {job.status === JobStatus.IN_PROGRESS && <Button className="text-xs py-1.5 h-auto px-4" onClick={() => openCompleteModal(job)}>Finalize & Release</Button>}
                             <Button variant="secondary" className="text-xs py-1.5 h-auto px-4" onClick={() => handleEditJob(job)}>Edit Card</Button>
                        </div>
                    </div>
                 </div>
               </Card>
             );
        })}
      </div>

      {paymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <Card className="w-full max-w-sm shadow-2xl">
                 <h3 className="text-xl font-bold mb-4 text-slate-900">Payment & Release</h3>
                 <p className="text-sm text-slate-500 mb-6">Invoice Total: ₹{jobToComplete?.totalAmount.toLocaleString()}</p>
                 <Select label="Payment Mode" value={paymentMode} onChange={(e:any) => setPaymentMode(e.target.value)}>
                    <option value={PaymentMode.CASH}>Cash</option>
                    <option value={PaymentMode.UPI}>UPI Scan</option>
                    <option value={PaymentMode.CARD}>Card</option>
                    <option value={PaymentMode.UNPAID}>Mark as Unpaid</option>
                 </Select>
                 <div className="flex gap-3 mt-8 justify-end">
                     <Button variant="secondary" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
                     <Button className="px-10" onClick={confirmCompleteJob}>Confirm & Release</Button>
                 </div>
             </Card>
        </div>
      )}
    </div>
  );
}