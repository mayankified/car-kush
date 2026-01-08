import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Expense } from '../types';
import { Card, Button, Input, Select, Badge } from '../components/ui/AceternityUI';

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('MAINTENANCE');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { load(); }, []);

  const load = async () => setExpenses(await db.getExpenses());

  const handleAdd = async () => {
    if (!title || !amount) return;
    await db.addExpense({
      id: crypto.randomUUID(),
      title,
      amount: Number(amount),
      category: category as any,
      date
    });
    setTitle(''); setAmount('');
    load();
  };

  const handleDelete = async (id: string) => {
    if(confirm('Delete this expense?')) {
        await db.deleteExpense(id);
        load();
    }
  };

  const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-slate-900">Expense Tracker</h2>
         <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100">
             <span className="text-xs text-red-600 font-bold uppercase tracking-wider">Total Outflow</span>
             <div className="text-xl font-bold text-red-700">₹{totalExpenses.toLocaleString()}</div>
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Add Form */}
         <div className="md:col-span-1">
           <Card className="sticky top-4 border-red-100 shadow-red-500/5">
             <h3 className="font-bold text-lg mb-4 text-slate-900">Log Expense</h3>
             <Input label="Title / Description" value={title} onChange={(e:any) => setTitle(e.target.value)} placeholder="e.g. Electricity Bill" />
             <Input label="Amount (₹)" type="number" value={amount} onChange={(e:any) => setAmount(e.target.value)} placeholder="0.00" />
             <Input label="Date" type="date" value={date} onChange={(e:any) => setDate(e.target.value)} />
             <Select label="Category" value={category} onChange={(e:any) => setCategory(e.target.value)}>
                <option value="MAINTENANCE">Shop Maintenance</option>
                <option value="INVENTORY">Inventory / Stock</option>
                <option value="SALARY">Staff Salary</option>
                <option value="UTILITIES">Utilities (Electric/Water)</option>
                <option value="RENT">Rent</option>
                <option value="OTHER">Other</option>
             </Select>
             <Button className="w-full mt-4 bg-gradient-to-r from-slate-700 to-slate-800" onClick={handleAdd}>Add Expense</Button>
           </Card>
         </div>

         {/* List */}
         <div className="md:col-span-2 space-y-4">
            {expenses.slice().reverse().map(e => (
              <Card key={e.id} className="flex justify-between items-center group hover:border-red-200">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold text-lg">
                        ₹
                    </div>
                    <div>
                        <div className="font-bold text-lg text-slate-900">{e.title}</div>
                        <div className="flex gap-2 text-xs">
                             <span className="font-mono text-slate-500">{e.date}</span>
                             <Badge color="gray">{e.category}</Badge>
                        </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="text-xl font-bold text-slate-800">₹{e.amount}</div>
                    <button 
                      onClick={() => handleDelete(e.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                 </div>
              </Card>
            ))}
            {expenses.length === 0 && <div className="text-slate-400 text-center py-10">No expenses logged.</div>}
         </div>
      </div>
    </div>
  );
}