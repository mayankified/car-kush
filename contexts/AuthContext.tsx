import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { db } from '../services/mockDb';
import { UserRole } from '../types';

interface AuthContextType {
  session: any;
  userRole: UserRole;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.STAFF);
  const [isLoading, setIsLoading] = useState(true);

  const resolveRole = async (email: string) => {
    try {
      const employees = await db.getEmployees();
      if (employees.length === 0) {
        // Genesis Admin
        const newAdmin = {
          id: crypto.randomUUID(),
          name: email.split('@')[0],
          email: email,
          role: UserRole.ADMIN,
          commissionRate: 15,
          phone: '0000000000'
        };
        await db.addEmployee(newAdmin);
        setUserRole(UserRole.ADMIN);
      } else {
        const emp = employees.find(e => e.email === email);
        setUserRole(emp ? (emp.role as UserRole) : UserRole.STAFF);
      }
    } catch (err) {
      console.error("Role resolution error:", err);
    }
  };

  useEffect(() => {
    // Initial Check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email) await resolveRole(session.user.email);
      setIsLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user?.email) {
        await resolveRole(currentSession.user.email);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, userRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};