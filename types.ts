
export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  IN_PROGRESS = 'IN_PROGRESS'
}

export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  ADMIN = 'Administrador',
  RECEPCIONIST = 'Recepcionista',
  SPECIALIST = 'Especialista'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  companyId?: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  backgroundImage?: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface Sede {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
  sedeIds: string[];
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price?: number;
  category: string;
}

export interface Treatment {
  id: string;
  name: string;
  sessions: number;
  price: number;
  description: string;
}

export interface Medication {
  name: string;
  instructions: string;
}

export interface ClinicalHistoryEntry {
  id: string;
  date: string;
  professionalId: string;
  notes: string;
  medications?: Medication[];
  treatmentId?: string;
  sessionNumber?: number;
  totalSessions?: number;
  nextSessionDate?: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  history: ClinicalHistoryEntry[];
}

export interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  serviceId: string;
  sedeId: string;
  professionalId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  bookingCode: string;
  treatmentId?: string;
}
