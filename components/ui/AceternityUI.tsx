import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; noPadding?: boolean }> = ({ children, className = '', noPadding = false }) => (
  <div className={`relative group bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.1)] rounded-2xl transition-all duration-300 overflow-hidden ${className}`}>
    {/* Top Gradient Line */}
    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-80" />
    
    {/* Subtle Background Mesh */}
    <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    
    <div className={`relative z-10 ${noPadding ? '' : 'p-6'}`}>{children}</div>
  </div>
);

export const Button: React.FC<any> = ({ onClick, children, variant = 'primary', className = '', type = 'button', disabled = false }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20 border border-transparent",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300",
    danger: "bg-gradient-to-r from-red-500 to-rose-600 text-white border border-transparent hover:from-red-600 hover:to-rose-700 shadow-red-500/20",
    outline: "border-2 border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-100 bg-transparent",
    ghost: "bg-transparent text-indigo-600 hover:bg-indigo-50 border border-transparent",
  };
  
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  );
};

export const Input: React.FC<any> = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5 mb-4 group">
    {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">{label}</label>}
    <input 
      {...props} 
      className="bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm" 
    />
  </div>
);

export const Select: React.FC<any> = ({ label, children, ...props }) => (
  <div className="flex flex-col gap-1.5 mb-4 group">
    {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">{label}</label>}
    <div className="relative">
      <select 
        {...props} 
        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none shadow-sm cursor-pointer" 
      >
        {children}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode, color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' }> = ({ children, color = 'blue' }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    gray: "bg-slate-100 text-slate-600 border-slate-200",
    purple: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wide ${colors[color]}`}>
      {children}
    </span>
  );
};