import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Service } from '../types';
import { Card, Button, Input } from '../components/ui/AceternityUI';

export default function ServiceManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => setServices(await db.getServices());

  const handleAdd = async () => {
    if (!name || !price) return;
    await db.addService({
      id: crypto.randomUUID(),
      name,
      price: Number(price),
      description: desc
    });
    setName(''); setPrice(''); setDesc('');
    load();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      await db.deleteService(id);
      load();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Service Menu</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Add Form */}
         <div className="md:col-span-1">
           <Card className="sticky top-4">
             <h3 className="font-bold text-lg mb-4 text-slate-900">Add New Service</h3>
             <Input label="Service Name" value={name} onChange={(e:any) => setName(e.target.value)} placeholder="e.g. Teflon Coating" />
             <Input label="Price (₹)" type="number" value={price} onChange={(e:any) => setPrice(e.target.value)} placeholder="0.00" />
             <Input label="Description" value={desc} onChange={(e:any) => setDesc(e.target.value)} placeholder="Brief details..." />
             <Button className="w-full mt-2" onClick={handleAdd}>Add to Menu</Button>
           </Card>
         </div>

         {/* List */}
         <div className="md:col-span-2 space-y-4">
            {services.map(s => (
              <Card key={s.id} className="flex justify-between items-center group">
                 <div>
                    <div className="font-bold text-lg text-slate-900">{s.name}</div>
                    <div className="text-sm text-slate-500">{s.description || 'No description provided'}</div>
                 </div>
                 <div className="text-right flex items-center gap-4">
                    <div className="text-xl font-bold text-slate-800">₹{s.price}</div>
                    <button 
                      onClick={() => handleDelete(s.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      title="Delete Service"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                 </div>
              </Card>
            ))}
            {services.length === 0 && <div className="text-slate-500 text-center py-10">No services found. Add one!</div>}
         </div>
      </div>
    </div>
  );
}