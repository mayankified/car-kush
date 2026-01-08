import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Job, JobStatus, Customer, Vehicle, ReturnOrder, PaymentMode } from '../types';
import { Card, Button, Badge, Input, Select } from '../components/ui/AceternityUI';

export default function Billing() {
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  
  // Return Modal State
  const [selectedJobForReturn, setSelectedJobForReturn] = useState<Job | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);

  // Settle Modal State
  const [settleJob, setSettleJob] = useState<Job | null>(null);
  const [settleMode, setSettleMode] = useState<PaymentMode>(PaymentMode.CASH);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    const allJobs = await db.getJobs();
    setCompletedJobs(allJobs.filter(j => j.status === JobStatus.COMPLETED));
    setCustomers(await db.getCustomers());
    setVehicles(await db.getVehicles());
    setReturns(await db.getReturns());
  };

  const handlePrint = (job: Job) => {
    const cust = customers.find(c => c.id === job.customerId);
    const veh = vehicles.find(v => v.id === job.vehicleId);
    
    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Please allow popups for printing');

    const subtotal = job.services.reduce((a, s) => a + s.priceAtTime, 0) + job.customServiceCharge;
    const taxable = subtotal - job.discount;
    const gst = job.isGstEnabled ? Math.round(taxable * 0.18) : 0;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${job.id.slice(0,6)}</title>
          <style>
            body { font-family: 'Helvetica Neue', sans-serif; padding: 40px; color: #1f2937; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .logo-text { font-size: 28px; font-weight: 800; letter-spacing: -1px; color: #000; }
            .address { font-size: 14px; color: #4b5563; line-height: 1.4; margin-top: 5px; }
            .meta-block { text-align: right; }
            .invoice-tag { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #6b7280; margin-bottom: 5px; }
            .invoice-val { font-size: 16px; font-weight: 600; }
            
            .bill-to { margin-bottom: 30px; background: #f9fafb; padding: 20px; border-radius: 8px; }
            .bill-title { font-size: 12px; font-weight: bold; color: #6b7280; text-transform: uppercase; margin-bottom: 10px; }
            .client-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .client-detail { font-size: 14px; color: #4b5563; }

            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f3f4f6; padding: 12px; font-size: 12px; text-transform: uppercase; font-weight: bold; border-bottom: 2px solid #e5e7eb; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            .amount-col { text-align: right; }
            
            .totals { display: flex; justify-content: flex-end; margin-top: 30px; }
            .totals-box { width: 300px; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e5e7eb; }
            .row:last-child { border-bottom: none; border-top: 2px solid #000; padding-top: 15px; margin-top: 5px; }
            .total-label { font-size: 14px; color: #6b7280; }
            .total-val { font-size: 14px; font-weight: 600; }
            .grand-total { font-size: 20px; font-weight: 800; }

            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
             <div>
               <div class="logo-text">CAR STUDIO</div>
               <div class="address">
                 Shop No. 42, Auto Market, Sector 16<br/>
                 Noida, Uttar Pradesh - 201301<br/>
                 Phone: +91 98765 43210
               </div>
             </div>
             <div class="meta-block">
               <div class="invoice-tag">INVOICE</div>
               <div class="invoice-val">#${job.id.slice(0,6).toUpperCase()}</div>
               <br/>
               <div class="invoice-tag">DATE</div>
               <div class="invoice-val">${new Date(job.completedAt || job.createdAt).toLocaleDateString('en-IN')}</div>
               <br/>
               <div class="invoice-tag">PAYMENT MODE</div>
               <div class="invoice-val" style="color:${job.paymentMode === 'UNPAID' ? '#ef4444' : '#2563eb'};">${job.paymentMode || 'CASH'}</div>
             </div>
          </div>

          <div class="bill-to">
             <div class="bill-title">Billed To</div>
             <div class="client-name">${cust?.name}</div>
             <div class="client-detail">Mobile: ${cust?.mobile}</div>
             <div class="client-detail" style="margin-top: 5px;">
                Vehicle: <b>${veh?.model}</b> <span style="font-family: monospace; background: #e5e7eb; padding: 2px 5px; border-radius: 4px;">${veh?.regNumber}</span>
             </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th class="amount-col">Price</th>
              </tr>
            </thead>
            <tbody>
              ${job.services.map(s => `
                <tr>
                  <td>${s.serviceName}</td>
                  <td class="amount-col">₹${s.priceAtTime.toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
              ${job.customServiceCharge > 0 ? `
                <tr>
                  <td>${job.customServiceDescription || 'Additional Service'}</td>
                  <td class="amount-col">₹${job.customServiceCharge.toLocaleString('en-IN')}</td>
                </tr>
              ` : ''}
            </tbody>
          </table>

          <div class="totals">
             <div class="totals-box">
                <div class="row">
                   <span class="total-label">Subtotal</span>
                   <span class="total-val">₹${subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div class="row">
                   <span class="total-label">Discount</span>
                   <span class="total-val text-red">-₹${job.discount.toLocaleString('en-IN')}</span>
                </div>
                ${job.isGstEnabled ? `
                  <div class="row">
                     <span class="total-label">GST (18%)</span>
                     <span class="total-val">₹${gst.toLocaleString('en-IN')}</span>
                  </div>
                ` : ''}
                <div class="row">
                   <span class="total-label" style="align-self:center;">Total Amount</span>
                   <span class="grand-total">₹${job.totalAmount.toLocaleString('en-IN')}</span>
                </div>
             </div>
          </div>

          <div class="footer">
             Thank you for choosing Car Studio!<br/>
             For support, contact us at +91 98765 43210
          </div>

          <script>
            window.print();
          </script>
        </body>
      </html>
    `);
  };

  const openWhatsAppInvoice = (job: Job) => {
      const cust = customers.find(c => c.id === job.customerId);
      if (!cust) return;
      
      const msg = `Hi ${cust.name}, here is your Invoice #${job.id.slice(0,6)} from Car Studio for ₹${job.totalAmount}. Thank you for your business!`;
      window.open(`https://wa.me/91${cust.mobile}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const initiateReturn = (job: Job) => {
    setSelectedJobForReturn(job);
    setRefundAmount(0);
    setReturnReason('');
  };

  const submitReturn = async () => {
    if (!selectedJobForReturn) return;
    const newReturn: ReturnOrder = {
      id: crypto.randomUUID(),
      jobId: selectedJobForReturn.id,
      reason: returnReason,
      refundAmount: Number(refundAmount),
      status: 'APPROVED',
      createdAt: new Date().toISOString()
    };
    await db.addReturn(newReturn);
    alert('Return Processed Successfully');
    setSelectedJobForReturn(null);
    refresh();
  };

  const openSettleModal = (job: Job) => {
      setSettleJob(job);
      setSettleMode(PaymentMode.CASH);
  };

  const confirmSettle = async () => {
      if(!settleJob) return;
      await db.updateJob(settleJob.id, { paymentMode: settleMode });
      setSettleJob(null);
      refresh();
  };

  return (
    <div className="space-y-6">
      {/* Return Modal */}
      {selectedJobForReturn && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <Card className="w-full max-w-md shadow-2xl border-slate-300">
              <h3 className="text-xl font-bold mb-4 text-slate-900">Process Return / Refund</h3>
              <div className="mb-4 p-3 bg-slate-50 rounded text-sm">
                 <p className="font-bold">Job #{selectedJobForReturn.id.slice(0,6)}</p>
                 <p>Total Paid: ₹{selectedJobForReturn.totalAmount}</p>
              </div>
              <Input label="Reason for Return" value={returnReason} onChange={(e:any) => setReturnReason(e.target.value)} placeholder="e.g. Service dissatisfaction" />
              <Input label="Refund Amount" type="number" value={refundAmount} onChange={(e:any) => setRefundAmount(e.target.value)} />
              <div className="flex gap-3 justify-end mt-6">
                 <Button variant="outline" onClick={() => setSelectedJobForReturn(null)}>Cancel</Button>
                 <Button variant="danger" onClick={submitReturn}>Confirm Refund</Button>
              </div>
           </Card>
        </div>
      )}

      {/* Settle Modal */}
      {settleJob && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4 text-slate-900">Settle Unpaid Invoice</h3>
                <p className="text-sm text-slate-500 mb-4">Invoice #{settleJob.id.slice(0,6)} • ₹{settleJob.totalAmount}</p>
                <Select label="Payment Method" value={settleMode} onChange={(e:any) => setSettleMode(e.target.value)}>
                    <option value={PaymentMode.CASH}>Cash</option>
                    <option value={PaymentMode.UPI}>UPI / QR Code</option>
                    <option value={PaymentMode.CARD}>Credit / Debit Card</option>
                    <option value={PaymentMode.ONLINE}>Online Transfer</option>
                </Select>
                <div className="flex gap-3 justify-end mt-6">
                    <Button variant="outline" onClick={() => setSettleJob(null)}>Cancel</Button>
                    <Button onClick={confirmSettle}>Confirm Payment</Button>
                </div>
            </Card>
        </div>
      )}

      <h2 className="text-2xl font-bold text-slate-900">Billing History & Returns</h2>
      
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4">Invoice ID</th>
              <th className="p-4">Date</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Mode</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {completedJobs.map(job => {
              const cust = customers.find(c => c.id === job.customerId);
              const jobReturn = returns.find(r => r.jobId === job.id);
              const isUnpaid = job.paymentMode === PaymentMode.UNPAID;
              
              return (
                <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-slate-500">#{job.id.slice(0,6)}</td>
                  <td className="p-4 text-sm text-slate-600">
                    {job.completedAt ? new Date(job.completedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{cust?.name}</div>
                    <div className="text-xs text-slate-500">{cust?.mobile}</div>
                  </td>
                  <td className="p-4">
                     {job.paymentMode ? (
                        <Badge color={isUnpaid ? "red" : "purple"}>{job.paymentMode}</Badge>
                     ) : (
                        <Badge color="gray">CASH</Badge>
                     )}
                  </td>
                  <td className="p-4 text-right font-bold text-slate-900">
                    {jobReturn ? (
                      <div>
                        <span className="line-through text-slate-400 block text-xs">₹{job.totalAmount}</span>
                        <span className="text-red-600">₹{job.totalAmount - jobReturn.refundAmount}</span>
                      </div>
                    ) : (
                      <span className={isUnpaid ? "text-red-600" : ""}>₹{job.totalAmount}</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" className="text-xs py-1 h-8" onClick={() => handlePrint(job)}>
                        Print
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="text-xs py-1 h-8 text-green-600 border border-green-200 hover:bg-green-50" 
                            onClick={() => openWhatsAppInvoice(job)}
                        >
                            WhatsApp
                        </Button>
                        
                        {!jobReturn && isUnpaid && (
                            <Button 
                                className="text-xs py-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-emerald-500/20" 
                                onClick={() => openSettleModal(job)}
                            >
                                Settle
                            </Button>
                        )}

                        {!jobReturn && !isUnpaid && (
                            <Button variant="secondary" className="text-xs py-1 h-8 text-red-500 hover:text-red-600 border-red-100 hover:bg-red-50" onClick={() => initiateReturn(job)}>
                            Return
                            </Button>
                        )}

                        {jobReturn && <Badge color="red">Refunded</Badge>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {completedJobs.length === 0 && (
               <tr><td colSpan={6} className="p-8 text-center text-slate-400">No invoices generated yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}