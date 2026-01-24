
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

export enum JobStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMode {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  ONLINE = 'ONLINE',
  UNPAID = 'UNPAID'
}

export enum FuelType {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  CNG = 'CNG',
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  notes?: string;
  referredByCustomerId?: string;
  referringEmployeeId?: string; 
  createdAt: string;
  createdBy?: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  regNumber: string;
  model: string;
  color: string;
  fuelType: FuelType;
  lastServiceDate?: string;
  nextServiceDue?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  email?: string;
  commissionRate: number; 
  referredByEmployeeId?: string | null; // The ID of the staff who recruited them
  recruiterCommission?: number;
}

export interface JobService {
  id: string; // Added for React keys
  serviceName: string;
  priceAtTime: number;
}

// Added Service interface for global service catalog
export interface Service {
  id: string;
  name: string;
  price: number;
  description?: string;
}

// Added ReturnOrder interface for tracking refunds
export interface ReturnOrder {
  id: string;
  jobId: string;
  reason: string;
  refundAmount: number;
  status: string;
  createdAt: string;
}

export interface ReferralCommission {
  level: 1 | 2 | 3;
  customerId?: string;
  employeeId?: string;
  amount: number;
}

export interface SystemSettings {
  referralRateL1: number;
  referralRateL2: number;
  referralRateL3: number;
  gstRate: number;
  defaultDiscount: number;
}

export interface Job {
  id: string;
  customerId: string;
  vehicleId: string;
  assignedEmployeeId?: string;
  status: JobStatus;
  paymentMode?: PaymentMode;
  services: JobService[];
  // Added custom service fields for billing
  customServiceCharge: number;
  customServiceDescription?: string;
  discount: number;
  isGstEnabled: boolean;
  gstRateSnap: number;
  totalAmount: number;
  referralCommissions?: ReferralCommission[];
  notes?: string;
  images?: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy?: string;
}

export interface MonthlyTarget {
  id: string;
  month: string;
  targetAmount: number;
  achievedAmount: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'RENT' | 'SALARY' | 'INVENTORY' | 'UTILITIES' | 'MAINTENANCE' | 'OTHER';
  date: string;
  notes?: string;
}