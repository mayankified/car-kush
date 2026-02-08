import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '../components/ui/AceternityUI';

interface ManualService {
    name: string;
    price: number;
}

export default function ManualInvoice() {
    const [customerName, setCustomerName] = useState('');
    const [mobile, setMobile] = useState('');
    const [vehicleDetails, setVehicleDetails] = useState('');
    const [services, setServices] = useState<ManualService[]>([{ name: '', price: 0 }]);
    const [discount, setDiscount] = useState(0);
    const [isGstEnabled, setIsGstEnabled] = useState(false);

    const addService = () => setServices([...services, { name: '', price: 0 }]);

    const updateService = (index: number, field: keyof ManualService, value: string | number) => {
        const newServices = [...services];
        newServices[index] = { ...newServices[index], [field]: value };
        setServices(newServices);
    };

    const removeService = (index: number) => {
        setServices(services.filter((_, i) => i !== index));
    };

    const calculateTotals = () => {
        const subtotal = services.reduce((acc, s) => acc + Number(s.price), 0);
        const taxable = subtotal - Number(discount);
        const gst = isGstEnabled ? Math.round(taxable * 0.18) : 0;
        const total = taxable + gst;
        return { subtotal, gst, total };
    };

    const handlePrint = () => {
        const { subtotal, gst, total } = calculateTotals();
        const invoiceId = Math.random().toString(36).substr(2, 6).toUpperCase();
        const date = new Date().toLocaleDateString('en-IN');

        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert('Please allow popups');

        // Using your exact styling from the Billing component
        printWindow.document.write(`
      <html>
        <head>
          <title>Manual Invoice - Kush Motors</title>
          <style>
            body { font-family: 'Helvetica Neue', sans-serif; padding: 40px; color: #1f2937; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .logo-text { font-size: 28px; font-weight: 800; letter-spacing: -1px; color: #000; }
            .address { font-size: 13px; color: #4b5563; line-height: 1.4; margin-top: 5px; }
            .gst-tag { font-size: 13px; font-weight: bold; color: #1f2937; margin-top: 5px; }
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
            .grand-total { font-size: 20px; font-weight: 800; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
             <div>
               <div class="logo-text">Kush Motors</div>
               <div class="address">
                 Ambala Road, Near Indian Oil Petrol Pump,<br/>
                 Near Hanuman Mandir, Kaithal, Haryana – 136027
               </div>
               <div class="gst-tag">GSTIN: 06ATCPB4518P3ZL</div>
             </div>
             <div class="meta-block">
               <div class="invoice-tag">INVOICE</div>
               <div class="invoice-val">#${invoiceId}</div>
               <br/>
               <div class="invoice-tag">DATE</div>
               <div class="invoice-val">${date}</div>
             </div>
          </div>

          <div class="bill-to">
             <div class="bill-title">Billed To</div>
             <div class="client-name">${customerName || 'Walking Customer'}</div>
             <div class="client-detail">Mobile: ${mobile || 'N/A'}</div>
             <div class="client-detail">Vehicle: ${vehicleDetails || 'N/A'}</div>
          </div>

          <table>
            <thead><tr><th>Description</th><th class="amount-col">Price</th></tr></thead>
            <tbody>
              ${services.map(s => `
                <tr><td>${s.name || 'Service'}</td><td class="amount-col">₹${Number(s.price).toLocaleString('en-IN')}</td></tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
             <div class="totals-box">
                <div class="row"><span>Subtotal</span><span>₹${totals.subtotal.toLocaleString('en-IN')}</span></div>
                <div class="row"><span>Discount</span><span>-₹${Number(discount).toLocaleString('en-IN')}</span></div>
                ${isGstEnabled ? `<div class="row"><span>GST (18%)</span><span>₹${totals.gst.toLocaleString('en-IN')}</span></div>` : ''}
                <div class="row"><span class="grand-total">Total</span><span class="grand-total">₹${totals.total.toLocaleString('en-IN')}</span></div>
             </div>
          </div>
          <div class="footer">Thank you for your business!</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    };

    const totals = calculateTotals();

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Create Manual Invoice</h2>
                <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">Generate & Print PDF</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 space-y-4">
                    <h3 className="font-semibold border-b pb-2">Customer Details</h3>
                    <Input label="Customer Name" value={customerName} onChange={(e: any) => setCustomerName(e.target.value)} placeholder="Enter name" />
                    <Input label="Mobile Number" value={mobile} onChange={(e: any) => setMobile(e.target.value)} placeholder="9999999999" />
                    <Input label="Vehicle & Reg No." value={vehicleDetails} onChange={(e: any) => setVehicleDetails(e.target.value)} placeholder="Swift - DL 1C XX 0000" />
                </Card>

                <Card className="p-6 space-y-4">
                    <h3 className="font-semibold border-b pb-2">Tax & Discounts</h3>
                    <Input label="Flat Discount (₹)" type="number" value={discount} onChange={(e: any) => setDiscount(e.target.value)} />
                    <div className="flex items-center gap-2 pt-4">
                        <input type="checkbox" id="gst" checked={isGstEnabled} onChange={(e) => setIsGstEnabled(e.target.checked)} className="w-4 h-4" />
                        <label htmlFor="gst" className="text-sm font-medium">Apply GST (18%)</label>
                    </div>
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                        <div className="flex justify-between text-sm mb-1"><span>Subtotal:</span><span>₹{totals.subtotal}</span></div>
                        <div className="flex justify-between text-lg font-bold"><span>Total:</span><span className="text-blue-600">₹{totals.total}</span></div>
                    </div>
                </Card>
            </div>

            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Services / Items</h3>
                    <Button variant="outline" onClick={addService} className="text-xs">+ Add Row</Button>
                </div>

                <div className="space-y-3">
                    {services.map((service, index) => (
                        <div key={index} className="flex gap-4 items-end animate-in fade-in slide-in-from-top-1">
                            <div className="flex-1">
                                <Input
                                    placeholder="Service Name"
                                    value={service.name}
                                    onChange={(e: any) => updateService(index, 'name', e.target.value)}
                                />
                            </div>
                            <div className="w-32">
                                <Input
                                    type="number"
                                    placeholder="Price"
                                    value={service.price}
                                    onChange={(e: any) => updateService(index, 'price', e.target.value)}
                                />
                            </div>
                            <Button
                                variant="ghost"
                                className="text-red-500 hover:bg-red-50 mb-1"
                                onClick={() => removeService(index)}
                                disabled={services.length === 1}
                            >
                                ✕
                            </Button>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}