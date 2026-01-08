import { getReferralChain } from '@/services/referralUtils';
import { Customer } from '@/types';
import React from 'react';
import { Badge, Card } from './ui/AceternityUI';

interface CustomerCardProps {
  customer: Customer;
  allCustomers: Customer[];
  allEmployees: any[];
  onSelect: (customer: Customer) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ 
  customer, 
  allCustomers, 
  allEmployees, 
  onSelect 
}) => {
  const directReferrals = allCustomers.filter(ref => ref.referredByCustomerId === customer.id);
  const chain = getReferralChain(customer, allCustomers, allEmployees);

  return (
    <Card className="cursor-pointer group hover:scale-[1.01] transition-all relative">
      <div onClick={() => onSelect(customer)}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
              {customer.name}
            </div>
            <div className="text-slate-500 text-xs font-medium">{customer.mobile}</div>
          </div>
          <Badge color={directReferrals.length > 0 ? "green" : "gray"}>
            {directReferrals.length} Team
          </Badge>
        </div>

        <div className="space-y-2 mt-2">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            Network Route
          </div>
          {chain.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
              {chain.reverse().map((link, idx) => (
                <React.Fragment key={link.id}>
                  <span className={`text-[10px] font-bold truncate max-w-[80px] ${link.type === 'S' ? 'text-indigo-600' : 'text-slate-700'}`}>
                    {link.name.split(' ')[0]}
                  </span>
                  {idx < chain.length - 1 && (
                    <svg className="text-slate-300" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 italic p-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              Direct Entry
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
          <span>Joined {new Date(customer.createdAt).toLocaleDateString()}</span>
          <span className="text-blue-500 group-hover:underline">View History →</span>
        </div>
      </div>
    </Card>
  );
};