import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserRole } from './types';

// Components & Pages
import Login from './components/Login';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import JobManager from './pages/JobManager';
import CustomerManager from './pages/CustomerManager';
import EmployeeManager from './pages/EmployeeManager';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import SettingsPage from './pages/Settings';
import NetworkTree from './pages/NetworkTree';
import Loader from './components/Loader';
import ManualInvoice from './pages/Invoice';
import InvoiceList from './pages/InvoiceList';

function AppRoutes() {
  const { session, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (

      <Loader />
    )

  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login onLoginSuccess={() => { }} />} />

      <Route element={session ? <MainLayout userRole={userRole} session={session} /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Dashboard onViewChange={() => { }} userRole={userRole} />} />
        <Route path="/jobs" element={<JobManager />} />
        <Route path="/customers" element={<CustomerManager />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/tree" element={<NetworkTree />} />
        <Route path="/invoice" element={<ManualInvoice />} />
        <Route path="/invoices" element={<InvoiceList/>} />


        {userRole === UserRole.ADMIN && (
          <>
            <Route path="/team" element={<EmployeeManager />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsPage />} />
          </>
        )}
      </Route>
      <Route path="*" element={<Navigate to={session ? "/" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}