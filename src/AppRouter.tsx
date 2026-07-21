import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthGuard } from './components/AuthGuard'
import { AdminGuard } from './components/AdminGuard'
import { Login } from './pages/Login'
import { Setup } from './pages/Setup'
import { Sidebar } from './components/Sidebar'
import { CardSkeleton } from './components/skeletons/CardSkeleton'
import { useAuth } from './context/AuthContext'
import { useNavigate } from 'react-router-dom'

const EmployeeDashboard = lazy(() => import('./pages/employee/Dashboard').then(m => ({ default: m.EmployeeDashboard })))
const VirtualID = lazy(() => import('./pages/employee/VirtualID').then(m => ({ default: m.VirtualID })))
const DigitalID = lazy(() => import('./pages/employee/DigitalID').then(m => ({ default: m.DigitalID })))
const Profile = lazy(() => import('./pages/employee/Profile').then(m => ({ default: m.Profile })))
const Leave = lazy(() => import('./pages/employee/Leave').then(m => ({ default: m.Leave })))
const Attendance = lazy(() => import('./pages/employee/Attendance').then(m => ({ default: m.Attendance })))
const Documents = lazy(() => import('./pages/employee/Documents').then(m => ({ default: m.Documents })))
const Directory = lazy(() => import('./pages/employee/Directory').then(m => ({ default: m.Directory })))
const HolidayCalendar = lazy(() => import('./pages/employee/HolidayCalendar').then(m => ({ default: m.HolidayCalendar })))
const Notifications = lazy(() => import('./pages/employee/Notifications').then(m => ({ default: m.Notifications })))
const SupportTickets = lazy(() => import('./pages/employee/SupportTickets').then(m => ({ default: m.SupportTickets })))
const Education = lazy(() => import('./pages/employee/Education').then(m => ({ default: m.Education })))
const BankDetails = lazy(() => import('./pages/employee/BankDetails').then(m => ({ default: m.BankDetails })))
const Tasks = lazy(() => import('./pages/employee/Tasks').then(m => ({ default: m.Tasks })))
const EmployeeProjects = lazy(() => import('./pages/employee/Projects').then(m => ({ default: m.Projects })))
const EmployeeProjectDetail = lazy(() => import('./pages/employee/ProjectDetail').then(m => ({ default: m.ProjectDetail })))
const EmployeeChat = lazy(() => import('./pages/employee/Chat').then(m => ({ default: m.Chat })))

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard').then(m => ({ default: m.AdminDashboard })))
const Employees = lazy(() => import('./pages/admin/Employees').then(m => ({ default: m.Employees })))
const LeaveQueue = lazy(() => import('./pages/admin/LeaveQueue').then(m => ({ default: m.LeaveQueue })))
const Announcements = lazy(() => import('./pages/admin/Announcements').then(m => ({ default: m.Announcements })))
const Holidays = lazy(() => import('./pages/admin/Holidays').then(m => ({ default: m.Holidays })))
const DocumentCenter = lazy(() => import('./pages/admin/DocumentCenter').then(m => ({ default: m.DocumentCenter })))
const AttendanceViewer = lazy(() => import('./pages/admin/AttendanceViewer').then(m => ({ default: m.AttendanceViewer })))
const Reports = lazy(() => import('./pages/admin/Reports').then(m => ({ default: m.Reports })))
const AuditLog = lazy(() => import('./pages/admin/AuditLog').then(m => ({ default: m.AuditLog })))
const Tickets = lazy(() => import('./pages/admin/Tickets').then(m => ({ default: m.Tickets })))
const EmployeesView = lazy(() => import('./pages/admin/EmployeesView').then(m => ({ default: m.EmployeesView })))
const Projects = lazy(() => import('./pages/admin/Projects').then(m => ({ default: m.Projects })))
const TaskManagement = lazy(() => import('./pages/admin/TaskManagement').then(m => ({ default: m.TaskManagement })))
const ProjectTimesheet = lazy(() => import('./pages/admin/ProjectTimesheet').then(m => ({ default: m.ProjectTimesheet })))
const Clients = lazy(() => import('./pages/admin/Clients').then(m => ({ default: m.Clients })))
const ChatList = lazy(() => import('./pages/admin/ChatList').then(m => ({ default: m.ChatList })))
const EmployeeProfile = lazy(() => import('./pages/admin/EmployeeProfile').then(m => ({ default: m.EmployeeProfile })))
const ProjectDetail = lazy(() => import('./pages/admin/ProjectDetail').then(m => ({ default: m.ProjectDetail })))
const AddEmployee = lazy(() => import('./pages/admin/AddEmployee').then(m => ({ default: m.AddEmployee })))

function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/employee/*"
        element={
          <AuthGuard>
            <EmployeeLayout />
          </AuthGuard>
        }
      />

      <Route
        path="/admin/*"
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      />
    </Routes>
  )
}

function EmployeeLayout() {
  const { signOutUser } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOutUser()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-bg-app">
      <Sidebar onSignOut={handleSignOut} />
      <div className="w-full flex-1 md:ml-64 pt-16 md:pt-0">
        <Suspense fallback={<div className="p-6"><CardSkeleton /></div>}>
          <Routes>
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="virtual-id" element={<VirtualID />} />
            <Route path="digital-id" element={<DigitalID />} />
            <Route path="profile" element={<Profile />} />
            <Route path="leave" element={<Leave />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="documents" element={<Documents />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="projects" element={<EmployeeProjects />} />
            <Route path="projects/:projectId" element={<EmployeeProjectDetail />} />
            <Route path="chat" element={<EmployeeChat />} />
            <Route path="directory" element={<Directory />} />
            <Route path="holidays" element={<HolidayCalendar />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="support" element={<SupportTickets />} />
            <Route path="education" element={<Education />} />
            <Route path="bank-details" element={<BankDetails />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  )
}

function AdminLayout() {
  const { signOutUser } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOutUser()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-bg-app">
      <Sidebar onSignOut={handleSignOut} isAdmin={true} />
      <div className="w-full flex-1 md:ml-64 pt-16 md:pt-0">
        <Suspense fallback={<div className="p-6"><CardSkeleton /></div>}>
          <Routes>
<Route path="dashboard" element={<AdminDashboard />} />
            <Route path="employees-view" element={<EmployeesView />} />
            <Route path="add-employee" element={<AddEmployee />} />
            <Route path="employees" element={<Employees />} />
            <Route path="leaves" element={<LeaveQueue />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="holidays" element={<Holidays />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="documents" element={<DocumentCenter />} />
            <Route path="attendance" element={<AttendanceViewer />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:projectId" element={<ProjectDetail />} />
            <Route path="employee/:employeeId" element={<EmployeeProfile />} />
            <Route path="tasks" element={<TaskManagement />} />
            <Route path="timesheet" element={<ProjectTimesheet />} />
            <Route path="clients" element={<Clients />} />
            <Route path="chat" element={<ChatList />} />
            <Route path="*" element={<div>Admin Home</div>} />
          </Routes>
        </Suspense>
      </div>
    </div>
  )
}

export default AppRouter