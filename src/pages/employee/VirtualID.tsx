import { PageShell } from '../../components/PageShell'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { getDatabase } from '../../firebase/config'
import { IdCard, User, Building2, Calendar, Camera, Briefcase } from 'lucide-react'
import { motion } from 'framer-motion'
import { hrToast } from '../../components/HRCToast'

export function VirtualID() {
  const { user } = useAuth()
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (user?.uid) {
      let unsubEmp: (() => void) | null = null
      let unsubUser: (() => void) | null = null
      
      getDatabase().then((db: any) => {
        unsubEmp = db.onValue(`employees/${user.uid}`, (snapshot: any) => {
          const data = snapshot.val()
          if (data) {
            setEmployeeData(data)
          }
        })
        
        unsubUser = db.onValue(`users/${user.uid}`, (snapshot: any) => {
          const data = snapshot.val()
          if (data) {
            setUserData(data)
          }
        })
      })
      
      return () => {
        if (unsubEmp) unsubEmp()
        if (unsubUser) unsubUser()
      }
    }
  }, [user?.uid])

  const mergedData = { ...userData, ...employeeData }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit file size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      hrToast.error('Upload Failed', 'Image must be less than 2MB')
      return
    }

    setIsUploading(true)
    const reader = new FileReader()
    
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string
        const db = await getDatabase()
        
        await db.update(`employees/${user?.uid}`, {
          avatar: base64String
        })
        await db.update(`users/${user?.uid}`, {
          avatar: base64String
        })
        
        hrToast.success('Success', 'Profile picture updated')
      } catch (error) {
        console.error('Failed to update avatar:', error)
        hrToast.error('Error', 'Failed to update profile picture')
      } finally {
        setIsUploading(false)
      }
    }
    
    reader.readAsDataURL(file)
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <PageShell title="Virtual ID">
      <div className="max-w-md mx-auto mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border-soft rounded-2xl shadow-lg relative overflow-hidden"
        >
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-primary/10 border-b border-primary/20"></div>
          
          <div className="p-8 pt-12 flex flex-col items-center relative z-10">
            {/* Profile Pic */}
            <div 
              className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface shadow-md bg-bg-app z-10 flex-shrink-0 mb-4 relative group cursor-pointer"
              onClick={handleAvatarClick}
            >
              {isUploading ? (
                <div className="w-full h-full flex items-center justify-center text-primary bg-primary/5">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : mergedData?.avatar && (mergedData.avatar.startsWith('data:image') || mergedData.avatar.startsWith('http')) ? (
                <img src={mergedData.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-low bg-primary/5">
                  <User className="w-16 h-16 text-primary/40" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            
            {/* Identity */}
            <h3 className="font-display font-bold text-text-hi text-center text-2xl mb-1 line-clamp-1">
              {mergedData?.name || 'Employee Name'}
            </h3>
            <p className="text-sm text-primary font-medium text-center mb-6 line-clamp-1 bg-primary/10 px-3 py-1 rounded-full">
              {mergedData?.position || 'Employee'}
            </p>
            
            {/* Divider */}
            <div className="w-full h-px bg-border-soft my-2"></div>
            
            {/* Details */}
            <div className="w-full space-y-4 mt-6">
              <div className="flex items-center justify-between p-3 bg-bg-app rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <IdCard className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-text-low uppercase tracking-wider">Employee ID</span>
                </div>
                <span className="font-mono font-bold text-text-hi text-lg">{mergedData?.employeeCode || mergedData?.employeeId || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-bg-app rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-text-low uppercase tracking-wider">Job Title</span>
                </div>
                <span className="font-semibold text-text-hi text-right max-w-[200px] line-clamp-2">{mergedData?.position || 'Employee'}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-bg-app rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-text-low uppercase tracking-wider">Company</span>
                </div>
                <span className="font-semibold text-text-hi text-right max-w-[200px] line-clamp-2">{mergedData?.companyName || 'Acme Corp'}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-bg-app rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-text-low uppercase tracking-wider">Join Date</span>
                </div>
                <span className="font-semibold text-text-hi">{mergedData?.joinDate || 'N/A'}</span>
              </div>
            </div>
            
            {/* Watermark / Decoration */}
            <div className="absolute top-6 right-6 opacity-[0.05] pointer-events-none">
              <IdCard className="w-32 h-32 text-primary" />
            </div>
          </div>
        </motion.div>
      </div>
    </PageShell>
  )
}
