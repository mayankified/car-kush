
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { UserRole } from '../types';
import { Button } from './ui/AceternityUI';

const Icons = {
  Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>,
  Jobs: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2" /><path d="M8 17h2" /><path d="M14 13h2" /></svg>,
  Customers: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  Employees: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>,
  Billing: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></svg>,
  Reports: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  Expenses: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
};

export default function MainLayout({ userRole, session }: { userRole: UserRole, session: any }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isAdmin = userRole === UserRole.ADMIN;

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any; label: string }) => {
    return (
      <NavLink
        to={to}
        onClick={() => isMobile && setSidebarOpen(false)}
        className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden mb-1 ${isActive
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
      >
        <div className="relative z-10 flex items-center gap-3 font-medium">
          <Icon />
          <span>{label}</span>
        </div>
      </NavLink>
    );
  };

  return (
    <div className="flex h-screen bg-[#F1F5F9] text-slate-900 overflow-hidden font-sans">
      <aside
        className={`${sidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full'
          } bg-[#0f172a] border-r border-slate-800/60 transition-all duration-300 flex flex-col fixed md:relative z-50 h-full shadow-2xl md:shadow-none overflow-hidden`}
        style={{ backgroundImage: 'radial-gradient(circle at top left, #1e293b 0%, #0f172a 40%)' }}
      >
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="relative w-10 h-10 group cursor-pointer">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 rounded-full"></div>
              <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white border border-white/10 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 4h3v-7.25c0-1.16-.52-2.2-1.38-2.96L17.5 7.04C17.07 6.64 16.5 6.42 15.93 6.42h-3.46M19 13h-4.5c-.83 0-1.5-.67-1.5-1.5V6.42L8.5 2.1c-.26-.26-.6-.4-1-.4a1.45 1.45 0 0 0-1.04.44L2.06 6.5A2.5 2.5 0 0 0 2 8.28V20h3m14 0h-2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none">CAR STUDIO</h1>
              <span className="text-[10px] font-bold text-blue-400 tracking-[0.2em] uppercase">{userRole} MODE</span>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent mb-4" />
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4 scrollbar-hide">
          <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 mt-1">Main</div>
          <NavItem to="/" icon={Icons.Dashboard} label="Dashboard" />
          <NavItem to="/jobs" icon={Icons.Jobs} label="Jobs & Workflow" />
          <NavItem to="/tree" icon={Icons.Jobs} label="Your Network" />

          <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 mt-4">Management</div>
          <NavItem to="/customers" icon={Icons.Customers} label="Customers" />
          {isAdmin && <NavItem to="/team" icon={Icons.Employees} label="Staff & Team" />}

          <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 mt-4">Finance</div>
          <NavItem to="/billing" icon={Icons.Billing} label="Invoices" />
          {isAdmin && <NavItem to="/expenses" icon={Icons.Expenses} label="Expenses" />}
          {isAdmin && <NavItem to="/reports" icon={Icons.Reports} label="Reports" />}

          {isAdmin && (
            <>
              <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 mt-4">System</div>
              <NavItem to="/settings" icon={Icons.Settings} label="Settings" />
            </>
          )}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-[1px]">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white">
                  {session?.user?.email?.[0].toUpperCase()}
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-bold text-white truncate">{session?.user?.email?.split('@')[0]}</div>
                <div className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {userRole}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2 flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-red-500/10"
            >
              <Icons.Logout /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#F8F9FC] relative">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
            </div>
            <h1 className="font-bold text-lg text-slate-900">Car Studio</h1>
          </div>
          <Button variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
            <Icons.Menu />
          </Button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
