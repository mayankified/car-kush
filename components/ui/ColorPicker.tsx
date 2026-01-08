import React, { useState, useRef } from 'react';

// Common Car Colors Database
const CAR_COLORS = [
  { name: 'White', hex: '#FFFFFF', border: true },
  { name: 'Black', hex: '#000000' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Grey', hex: '#6b7280' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Maroon', hex: '#7f1d1d' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Navy', hex: '#1e3a8a' },
  { name: 'Brown', hex: '#78350f' },
  { name: 'Beige', hex: '#f5f5dc', border: true },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Gold', hex: '#ffd700' },
  { name: 'Bronze', hex: '#cd7f32' },
];

// Helper: Convert Hex to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Helper: Find closest named color from a Hex value
const findClosestColorName = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    let minDiff = Infinity;
    let closestName = hex;

    CAR_COLORS.forEach(c => {
        const cRgb = hexToRgb(c.hex);
        if (cRgb) {
            // Euclidean distance in RGB space
            const diff = Math.sqrt(
                Math.pow(cRgb.r - rgb.r, 2) + 
                Math.pow(cRgb.g - rgb.g, 2) + 
                Math.pow(cRgb.b - rgb.b, 2)
            );
            if (diff < minDiff) {
                minDiff = diff;
                closestName = c.name;
            }
        }
    });
    
    // If exact match isn't close enough (threshold ~ 50), return Hex, else return Name
    return minDiff < 60 ? closestName : hex;
}

export const ColorPicker = ({ value, onChange, label, placeholder = "Select Color", className = "" }: { value: string, onChange: (val: string) => void, label?: string, placeholder?: string, className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const nativePickerRef = useRef<HTMLInputElement>(null);

  const getPreviewColor = (name: string) => {
    if (!name) return 'transparent';
    const known = CAR_COLORS.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (known) return known.hex;
    
    // Partial match (e.g. "Metallic Blue" -> Blue)
    const lower = name.toLowerCase();
    const match = CAR_COLORS.find(c => lower.includes(c.name.toLowerCase()));
    
    // Valid Hex check
    if (name.startsWith('#') && (name.length === 4 || name.length === 7)) return name;

    return match ? match.hex : 'transparent';
  };

  const handleNativeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value;
      const name = findClosestColorName(hex);
      onChange(name);
      // Don't close immediately so they see the result
  };

  const currentColor = getPreviewColor(value);

  return (
    <div className={`flex flex-col gap-1.5 mb-4 group relative w-full ${className}`}>
      {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">{label}</label>}
      
      <div className="relative flex items-center">
        {/* Preview Dot */}
        <div 
            className="absolute left-3 w-6 h-6 rounded-full border border-slate-200 shadow-sm z-10 transition-colors duration-300" 
            style={{ 
                backgroundColor: currentColor === 'transparent' ? '#f8fafc' : currentColor,
                backgroundImage: currentColor === 'transparent' ? 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)' : 'none',
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
            }} 
            onClick={() => setIsOpen(!isOpen)}
        />
        
        <input 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-12 pr-10 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400" 
        />
        
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 text-slate-400 hover:text-blue-600 p-1"
        >
          {isOpen ? (
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .739-.104 1.453-.298 2.136m-16.404 0A8.959 8.959 0 0 0 3 12c0 .739.104 1.453.298 2.136"/></svg>
          )}
        </button>
      </div>

      {/* Palette Popover */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white border border-slate-100 rounded-xl shadow-xl p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-3">
                 <span className="text-xs font-bold text-slate-400 uppercase">Popular</span>
                 <button 
                   onClick={() => nativePickerRef.current?.click()}
                   className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    Custom Mixer
                 </button>
                 {/* Hidden Native Input */}
                 <input 
                    type="color" 
                    ref={nativePickerRef} 
                    className="absolute opacity-0 pointer-events-none" 
                    onChange={handleNativeColorChange}
                 />
            </div>

            <div className="grid grid-cols-5 gap-3">
              {CAR_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    onChange(c.name);
                    setIsOpen(false);
                  }}
                  className="flex flex-col items-center gap-1.5 group/btn"
                >
                  <div 
                    className={`w-9 h-9 rounded-full shadow-sm transition-transform duration-200 group-hover/btn:scale-110 flex items-center justify-center ${c.border ? 'border border-slate-200' : ''}`}
                    style={{ backgroundColor: c.hex }}
                  >
                     {value.toLowerCase() === c.name.toLowerCase() && (
                        <svg className={['White', 'Silver', 'Yellow', 'Beige'].includes(c.name) ? "text-slate-800" : "text-white"} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                     )}
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium truncate w-full text-center">{c.name}</span>
                </button>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center flex justify-between px-2">
                <span>Or type custom name...</span>
                <span className="font-mono">{currentColor !== 'transparent' ? currentColor : ''}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};