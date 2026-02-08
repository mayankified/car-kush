import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { UserRole } from '../types';
import { Card, Button, Badge, Input } from '../components/ui/AceternityUI';
import { useAuth } from '@/contexts/AuthContext';

export default function InvoiceList() {
  const { session, userRole } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);

  const isAdmin = userRole === UserRole.ADMIN;

  useEffect(() => {
    loadInvoices();
  }, [session]);

  const loadInvoices = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    
    let data = await db.getManualInvoices();
    
    // 🔥 Role-based filtering: Staff only see their own
    if (!isAdmin) {
      data = data.filter(inv => inv.createdById === session.user.id);
    }
    
    setInvoices(data);
    setLoading(false);
  };

  const handleSaveEdit = async () => {
    if (!editingInvoice) return;
    try {
      // Recalculate Totals
      const subtotal = editingInvoice.items.reduce((acc: number, item: any) => acc + Number(item.price || 0), 0);
      const taxable = subtotal - Number(editingInvoice.discount || 0);
      const tax = editingInvoice.isGstEnabled ? Math.round(taxable * 0.18) : 0;
      const totalAmount = taxable + tax;

      await db.updateManualInvoice(editingInvoice.id, {
        ...editingInvoice,
        subtotal,
        tax,
        totalAmount
      });

      setEditingInvoice(null);
      loadInvoices();
      alert("Invoice updated successfully!");
    } catch (err) {
      alert("Failed to update invoice");
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReprint = (inv: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Allow popups');

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${inv.id.slice(0,6)}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f3f4f6; padding: 10px; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            .totals { margin-top: 30px; text-align: right; width: 300px; margin-left: auto; }
            .row { display: flex; justify-content: space-between; padding: 5px 0; }
            .grand-total { font-size: 20px; font-weight: bold; border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><div class="logo">Kush Motors</div>Manual Invoice Copy</div>
            <div style="text-align:right">
              <b>ID: #${inv.id.slice(0,6).toUpperCase()}</b><br/>
              Date: ${new Date(inv.createdAt).toLocaleDateString('en-IN')}
            </div>
          </div>
          <div style="background:#f9fafb; padding:15px; border-radius:8px;">
            <b>Billed To:</b> ${inv.customerName}<br/>
            <b>Mobile:</b> ${inv.mobile || 'N/A'}<br/>
            <b>Vehicle:</b> ${inv.vehicleDetails || 'N/A'}
          </div>
          <table>
            <thead><tr><th>Description</th><th style="text-align:right">Price</th></tr></thead>
            <tbody>
              ${inv.items.map((item: any) => `
                <tr><td>${item.name}</td><td style="text-align:right">₹${item.price}</td></tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div class="row"><span>Subtotal:</span><span>₹${inv.subtotal}</span></div>
            <div class="row"><span>Discount:</span><span>-₹${inv.discount}</span></div>
            ${inv.isGstEnabled ? `<div class="row"><span>GST (18%):</span><span>₹${inv.tax}</span></div>` : ''}
            <div class="row grand-total"><span>Total:</span><span>₹${inv.totalAmount}</span></div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
  };

  return (
    <div className="space-y-6">
      {/* Edit Modal (Admin Only) */}
      {editingInvoice && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Edit Invoice #{editingInvoice.id.slice(0,6)}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input label="Customer Name" value={editingInvoice.customerName} onChange={(e: any) => setEditingInvoice({...editingInvoice, customerName: e.target.value})} />
              <Input label="Mobile" value={editingInvoice.mobile} onChange={(e: any) => setEditingInvoice({...editingInvoice, mobile: e.target.value})} />
            </div>

            <div className="space-y-2 mb-4">
              <label className="text-sm font-semibold">Items / Services</label>
              {editingInvoice.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <Input 
                    className="flex-1" 
                    value={item.name} 
                    onChange={(e: any) => {
                      const newItems = [...editingInvoice.items];
                      newItems[idx].name = e.target.value;
                      setEditingInvoice({...editingInvoice, items: newItems});
                    }}
                  />
                  <Input 
                    className="w-32" 
                    type="number" 
                    value={item.price} 
                    onChange={(e: any) => {
                      const newItems = [...editingInvoice.items];
                      newItems[idx].price = e.target.value;
                      setEditingInvoice({...editingInvoice, items: newItems});
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-4 items-center mb-6">
              <Input label="Discount (₹)" type="number" value={editingInvoice.discount} onChange={(e: any) => setEditingInvoice({...editingInvoice, discount: e.target.value})} />
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" checked={editingInvoice.isGstEnabled} onChange={(e) => setEditingInvoice({...editingInvoice, isGstEnabled: e.target.checked})} className="w-4 h-4" />
                <span className="text-sm font-medium">Apply GST (18%)</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setEditingInvoice(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} className="bg-blue-600">Save Changes</Button>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isAdmin ? "Global Invoice History" : "My Invoices"}
          </h2>
          <p className="text-slate-500 text-sm">
            {isAdmin ? "Manage all manual bills generated by the team." : "View your recently created manual bills."}
          </p>
        </div>
        <div className="w-full md:w-72">
          <Input 
            placeholder="Search customer or ID..." 
            value={searchTerm} 
            onChange={(e: any) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <Card className="overflow-hidden p-0 border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Invoice ID</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                {isAdmin && <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Staff</th>}
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Total</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-slate-400 italic">Fetching records...</td></tr>
              ) : filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-400">#{inv.id.slice(0, 6).toUpperCase()}</td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{inv.customerName}</div>
                    <div className="text-xs text-slate-500">{inv.vehicleDetails || 'No Vehicle'}</div>
                  </td>
                  {isAdmin && (
                    <td className="p-4">
                      <Badge color="purple">{inv.creatorName || 'Staff'}</Badge>
                    </td>
                  )}
                  <td className="p-4 text-sm text-slate-600">
                    {new Date(inv.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="p-4 text-right font-bold text-slate-900">
                    ₹{inv.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" className="text-xs h-8" onClick={() => handleReprint(inv)}>
                        Print
                      </Button>
                      {isAdmin && (
                        <Button 
                          variant="ghost" 
                          className="text-xs h-8 text-blue-600 border border-blue-100 hover:bg-blue-50" 
                          onClick={() => setEditingInvoice(inv)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredInvoices.length === 0 && (
                <tr><td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-slate-400">No invoices found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}