
import { supabase } from './supabase';
import { Customer, Vehicle, Employee, Job, UserRole, JobStatus, FuelType, Expense, MonthlyTarget, ReferralCommission, SystemSettings, PaymentMode, ReturnOrder, Service } from '../types';

class DatabaseService {
  private handleError(context: string, error: any) {
    if (!error) return;
    console.error(`Error ${context}:`, error.message || error);
  }

  async getSettings(): Promise<SystemSettings> {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').single();
    if (error) {
      return { referralRateL1: 20, referralRateL2: 10, referralRateL3: 5, gstRate: 18, defaultDiscount: 10 };
    }
    return {
      referralRateL1: data.rate_l1 ?? 20,
      referralRateL2: data.rate_l2 ?? 10,
      referralRateL3: data.rate_l3 ?? 5,
      gstRate: data.gst_rate ?? 18,
      defaultDiscount: data.default_discount ?? 10
    };
  }

  async updateSettings(settings: SystemSettings): Promise<void> {
    const { error } = await supabase.from('settings').upsert({
      id: 'global', rate_l1: settings.referralRateL1, rate_l2: settings.referralRateL2, rate_l3: settings.referralRateL3,
      gst_rate: settings.gstRate, default_discount: settings.defaultDiscount, updated_at: new Date().toISOString()
    });
    if (error) this.handleError('updating settings', error);
  }

  async getTargetForMonth(month: string): Promise<MonthlyTarget | null> {
    const { data, error } = await supabase.from('targets').select('*').eq('month', month).single();
    if (error) return null;
    return { id: data.id, month: data.month, targetAmount: data.target_amount, achievedAmount: data.achieved_amount || 0 };
  }

  async saveTarget(target: Partial<MonthlyTarget>): Promise<void> {
    await supabase.from('targets').upsert({ month: target.month, target_amount: target.targetAmount });
  }

  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase.from('customers').select('*');
    if (error) return [];
    return (data || []).map((d: any) => ({
      id: d.id, name: d.name, mobile: d.mobile, email: d.email, notes: d.notes,
      referredByCustomerId: d.referred_by_customer_id,
      referringEmployeeId: d.referring_employee_id,
      createdAt: d.created_at, createdBy: d.created_by
    }));
  }
async addCustomer(customer: Customer, userId: string): Promise<void> {
    await supabase.from('customers').insert({
      id: customer.id, 
      name: customer.name, 
      mobile: customer.mobile, 
      email: customer.email, 
      notes: customer.notes, 
      created_at: customer.createdAt, 
      created_by: userId,
      // FIXED: Used camelCase to match your Customer type
      referred_by_customer_id: customer.referredByCustomerId || null,
      referring_employee_id: customer.referringEmployeeId || null
    });
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.mobile) payload.mobile = updates.mobile;
    if (updates.email) payload.email = updates.email;
    
    // FIXED: Mapping frontend camelCase to database snake_case
    if (updates.referredByCustomerId !== undefined) {
        payload.referred_by_customer_id = updates.referredByCustomerId || null;
    }
    if (updates.referringEmployeeId !== undefined) {
        payload.referring_employee_id = updates.referringEmployeeId || null;
    }
    
    await supabase.from('customers').update(payload).eq('id', id);
  }
  async getJobs(): Promise<Job[]> {
    const { data, error } = await supabase.from('jobs').select('*, job_items(*)').order('created_at', { ascending: false });
    if (error) return [];
    return (data || []).map((d: any) => ({
      id: d.id, customerId: d.customer_id, vehicleId: d.vehicle_id, assignedEmployeeId: d.assigned_employee_id,
      status: d.status as JobStatus, paymentMode: d.payment_mode,
      discount: d.discount, isGstEnabled: d.is_gst_enabled, gstRateSnap: d.gst_rate_snap || 18,
      // Mapping new custom service fields
      customServiceCharge: d.custom_service_charge || 0,
      customServiceDescription: d.custom_service_description,
      totalAmount: d.total_amount, referralCommissions: d.referral_commissions || [],
      notes: d.notes, images: d.images || [], createdAt: d.created_at, startedAt: d.started_at, completedAt: d.completed_at,
      createdBy: d.created_by,
      services: (d.job_items || []).map((i: any) => ({ id: i.id, serviceName: i.service_name, priceAtTime: i.price_at_time }))
    }));
  }

  async addJob(job: Job, userId: string): Promise<void> {
    const { error } = await supabase.from('jobs').insert({
      id: job.id, customer_id: job.customerId, vehicle_id: job.vehicleId, assigned_employee_id: job.assignedEmployeeId || null,
      status: job.status, discount: job.discount, is_gst_enabled: job.isGstEnabled,
      gst_rate_snap: job.gstRateSnap, total_amount: job.totalAmount, created_at: job.createdAt,
      // Persisting new custom service fields
      custom_service_charge: job.customServiceCharge,
      custom_service_description: job.customServiceDescription,
      images: job.images || [], created_by: userId
    });
    if (error) throw error;
    if (job.services && job.services.length > 0) {
      const items = job.services.map(s => ({ job_id: job.id, service_name: s.serviceName, price_at_time: s.priceAtTime }));
      await supabase.from('job_items').insert(items);
    }
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<void> {
    // If job is being completed, calculate referral payout snapshot
    if (updates.status === JobStatus.COMPLETED) {
      const { data: jobData } = await supabase.from('jobs').select('*').eq('id', id).single();
      if (jobData) {
        const customers = await this.getCustomers();
        const settings = await this.getSettings();
        const referralCommissions: ReferralCommission[] = [];
        const rates = [settings.referralRateL1 / 100, settings.referralRateL2 / 100, settings.referralRateL3 / 100];
        const currentCustomer = customers.find(c => c.id === jobData.customer_id);

        let nextParent: { custId?: string, empId?: string } | null = null;
        if (currentCustomer?.referredByCustomerId) nextParent = { custId: currentCustomer.referredByCustomerId };
        else if (currentCustomer?.referringEmployeeId) nextParent = { empId: currentCustomer.referringEmployeeId };

        for (let i = 0; i < 3; i++) {
          if (!nextParent) break;
          if (nextParent.custId) {
            const parent = customers.find(c => c.id === nextParent!.custId);
            if (!parent) break;
            referralCommissions.push({ level: (i + 1) as 1 | 2 | 3, customerId: parent.id, amount: Math.round(jobData.total_amount * rates[i]) });
            if (parent.referredByCustomerId) nextParent = { custId: parent.referredByCustomerId };
            else if (parent.referringEmployeeId) nextParent = { empId: parent.referringEmployeeId };
            else nextParent = null;
          } else if (nextParent.empId) {
            referralCommissions.push({ level: (i + 1) as 1 | 2 | 3, employeeId: nextParent.empId, amount: Math.round(jobData.total_amount * rates[i]) });
            nextParent = null; // Staff are terminal nodes
          }
        }
        updates.referralCommissions = referralCommissions;
      }
    }

    const payload: any = { ...updates };
    const dbPayload: any = {};
    if (payload.status) dbPayload.status = payload.status;
    if (payload.startedAt) dbPayload.started_at = payload.startedAt;
    if (payload.completedAt) dbPayload.completed_at = payload.completedAt;
    if (payload.paymentMode) dbPayload.payment_mode = payload.paymentMode;
    if (payload.totalAmount !== undefined) dbPayload.total_amount = payload.totalAmount;
    if (payload.assignedEmployeeId !== undefined) dbPayload.assigned_employee_id = payload.assignedEmployeeId || null;
    if (payload.referralCommissions) dbPayload.referral_commissions = payload.referralCommissions;
    if (payload.customServiceCharge !== undefined) dbPayload.custom_service_charge = payload.customServiceCharge;
    if (payload.customServiceDescription !== undefined) dbPayload.custom_service_description = payload.customServiceDescription;

    const { error } = await supabase.from('jobs').update(dbPayload).eq('id', id);
    if (error) this.handleError("updating job", error);
  }

  async getVehicles(): Promise<Vehicle[]> {
    const { data, error } = await supabase.from('vehicles').select('*');
    if (error) return [];
    return (data || []).map((d: any) => ({
      id: d.id, customerId: d.customer_id, regNumber: d.reg_number,
      model: d.model, color: d.color, fuelType: d.fuel_type as FuelType,
      lastServiceDate: d.last_service_date, nextServiceDue: d.next_service_due
    }));
  }

  async addVehicle(vehicle: Vehicle, userId: string): Promise<void> {
    await supabase.from('vehicles').insert({
      id: vehicle.id,
      customer_id: vehicle.customerId,
      reg_number: vehicle.regNumber,
      model: vehicle.model,
      color: vehicle.color,
      fuel_type: vehicle.fuelType,
      created_by: userId
    });
  }

  async getEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase.from('employees').select('*');
    if (error) return [];
    return (data || []).map((d: any) => ({
      id: d.id, name: d.name, role: d.role as UserRole,
      phone: d.phone, email: d.email, commissionRate: d.commission_rate || 0
    }));
  }

  async addEmployee(emp: Employee): Promise<void> {
    await supabase.from('employees').insert({
      id: emp.id, name: emp.name, role: emp.role,
      phone: emp.phone, email: emp.email, commission_rate: emp.commissionRate
    });
  }

  async deleteEmployee(id: string): Promise<void> {
    await supabase.from('employees').delete().eq('id', id);
  }

  async getExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase.from('expenses').select('*');
    if (error) return [];
    return (data || []).map((d: any) => ({ id: d.id, title: d.title, amount: d.amount, category: d.category, date: d.date, notes: d.notes }));
  }

  async addExpense(expense: Expense): Promise<void> {
    await supabase.from('expenses').insert({ id: expense.id, title: expense.title, amount: expense.amount, category: expense.category, date: expense.date, notes: expense.notes });
  }

  async deleteExpense(id: string): Promise<void> {
    await supabase.from('expenses').delete().eq('id', id);
  }

  // Added missing methods for Returns
  async getReturns(): Promise<ReturnOrder[]> {
    const { data, error } = await supabase.from('returns').select('*');
    if (error) return [];
    return (data || []).map((d: any) => ({
      id: d.id, jobId: d.job_id, reason: d.reason,
      refundAmount: d.refund_amount, status: d.status, createdAt: d.created_at
    }));
  }

  async addReturn(ret: ReturnOrder): Promise<void> {
    await supabase.from('returns').insert({
      id: ret.id, job_id: ret.jobId, reason: ret.reason,
      refund_amount: ret.refundAmount, status: ret.status, created_at: ret.createdAt
    });
  }

  // Added missing methods for Service Catalog
  async getServices(): Promise<Service[]> {
    const { data, error } = await supabase.from('services').select('*');
    if (error) return [];
    return (data || []).map((d: any) => ({
      id: d.id, name: d.name, price: d.price, description: d.description
    }));
  }

  async addService(s: Service): Promise<void> {
    await supabase.from('services').insert({
      id: s.id, name: s.name, price: s.price, description: s.description
    });
  }

  async deleteService(id: string): Promise<void> {
    await supabase.from('services').delete().eq('id', id);
  }
}

export const db = new DatabaseService();