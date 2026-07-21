import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const personalDetailsSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone number is required').regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  whatsapp: z.string().min(1, 'WhatsApp number is required').regex(/^\d{10}$/, 'WhatsApp number must be exactly 10 digits'),
  email: z.string().email('Invalid email address'),
  dob: z.string().min(1, 'Date of birth is required').refine((date) => {
    const dob = new Date(date)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    return age >= 18 && age <= 100
  }, 'Employee must be between 18 and 100 years old'),
  address: z.string().min(1, 'Address is required'),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Gender is required' }),
})

export const educationSchema = z.object({
  collegeName: z.string().min(1, 'College name is required'),
  degree: z.string().min(1, 'Degree is required'),
  graduationYear: z.string().min(1, 'Graduation year is required').regex(/^\d{4}$/, 'Year must be 4 digits').refine((val) => {
    const year = parseInt(val, 10)
    return year >= 1950 && year <= new Date().getFullYear() + 5
  }, 'Enter a valid graduation year'),
  cgpa: z.string().min(1, 'CGPA/Percentage is required'),
  collegeAddress: z.string().min(1, 'College address is required'),
  specialization: z.string().optional(),
  fromYear: z.string().optional(),
  toYear: z.string().optional(),
  universityName: z.string().optional(),
}).refine((data) => {
  if (data.fromYear && data.toYear) {
    const from = parseInt(data.fromYear, 10)
    const to = parseInt(data.toYear, 10)
    if (!isNaN(from) && !isNaN(to)) {
      return (to - from) <= 4 && (to - from) >= 0
    }
  }
  return true
}, { message: 'Gap between From Year and To Year cannot exceed 4 years', path: ['toYear'] })

export const bankDetailsSchema = z.object({
  accountNumber: z.string().regex(/^\d{9,18}$/, 'Account number must be 9-18 digits'),
  bankName: z.string().min(1, 'Bank name is required'),
  branch: z.string().min(1, 'Branch is required'),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code (e.g. SBIN0001234)'),
})

export const leaveSchema = z.object({
  type: z.string().min(1, 'Leave type is required'),
  startDate: z.string().min(1, 'Start date is required').refine((date) => {
    const d = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d >= today
  }, 'Start date must be today or in the future'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(1, 'Reason is required'),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate)
  }
  return true
}, { message: 'End date must be on or after start date', path: ['endDate'] })

export const ticketSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
})

export const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>
export type EducationFormData = z.infer<typeof educationSchema>
export type BankDetailsFormData = z.infer<typeof bankDetailsSchema>
export type LeaveFormData = z.infer<typeof leaveSchema>
export type TicketFormData = z.infer<typeof ticketSchema>
export type AnnouncementFormData = z.infer<typeof announcementSchema>