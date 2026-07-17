export type UserRole = 'employee' | 'admin'

export interface UserProfile {
  uid: string
  email: string
  fullName: string
  employeeId: string
  phone?: string
  companyName?: string
  position?: string
  photoURL?: string
  profileComplete: boolean
}

export interface Education {
  id?: string
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string
  grade?: string
}

export interface BankDetails {
  accountNumber: string
  bankName: string
  branch: string
  ifscCode: string
}

export interface Document {
  id?: string
  name: string
  url: string
  type: 'offer' | 'payslip' | 'id' | 'education' | 'other'
  uploadedAt: string
  size?: number
}

export interface Leave {
  id?: string
  type: string
  startDate: string
  endDate: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  appliedAt: string
  approvedBy?: string
  approvedAt?: string
  days: number
}

export interface Attendance {
  id?: string
  date: string
  clockIn?: string
  clockOut?: string
  status: 'present' | 'late' | 'absent'
}

export interface SupportTicket {
  id?: string
  subject: string
  description: string
  status: 'open' | 'in-progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
}

export interface RailEvent {
  status: 'pulse' | 'signal' | 'warn' | 'neutral'
  message: string
  timestamp: number
}