import { PageShell } from '../../components/PageShell'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import { getDatabase } from '../../firebase/config'
import { User } from 'lucide-react'
import { motion } from 'framer-motion'

export function DigitalID() {
  const { user } = useAuth()
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)

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

  return (
    <PageShell title="Digital ID">
      <div className="flex justify-center items-center py-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-[320px] h-[480px] bg-white rounded-xl shadow-2xl relative overflow-hidden flex flex-col items-center border border-gray-200"
        >
          {/* Top Logo Section */}
          <div className="w-[220px] bg-[#222222] mt-8 rounded-md py-4 flex flex-col items-center justify-center z-10 shadow-md"> 
             <div className="flex items-center">
                <svg width="32" height="28" viewBox="0 0 32 28" className="mr-0.5">
                  <path d="M2,4 L16,4 L9,24 Z" fill="#E31E24" />
                  <path d="M17,4 L27,4 L22,11 Z" fill="#e66827" />
                </svg>
                <span className="text-[#E31E24] text-[28px] font-black tracking-wide leading-none">EPCON</span>
             </div>
             <div className="text-[#e66827] text-[11px] font-medium tracking-[0.2em] mt-2">Code</div>
          </div>
          <div className="text-[#E31E24] text-[12px] font-semibold mt-3 z-10 tracking-wide">
            VEPCON Soft Systems Pvt Ltd
          </div>

          {/* Sweeping background graphic */}
          <svg viewBox="0 0 320 480" className="absolute inset-0 z-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-20,290 C120,290 180,240 340,160 L340,320 C180,320 100,320 -20,310 Z" fill="#e66827" />
            <path d="M-20,270 C100,280 180,250 340,180 L340,260 C200,280 100,290 -20,280 Z" fill="#E31E24" />
            <path d="M-20,265 C60,265 140,255 240,210 L340,160 L340,190 C220,240 100,275 -20,275 Z" fill="#d91e23" />
            
            {/* Bottom rectangles */}
            <rect x="20" y="460" width="280" height="8" fill="#e66827" rx="3" />
            <rect x="20" y="460" width="80" height="8" fill="#E31E24" rx="3" />
          </svg>

          {/* Photo */}
          <div className="mt-8 z-10">
            <div 
              className="w-[140px] h-[140px] rounded-full overflow-hidden border-[6px] border-[#1f1f1f] shadow-lg bg-gray-100 relative flex items-center justify-center"
            >
              {mergedData?.avatar && (mergedData.avatar.startsWith('data:image') || mergedData.avatar.startsWith('http')) ? (
                <img src={mergedData.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-white">
                  <User className="w-20 h-20" />
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="mt-auto mb-14 flex flex-col items-center z-10 w-full px-6 text-center">
             <h2 className="text-[22px] font-black text-gray-900 leading-tight tracking-tight uppercase">
               {mergedData?.name || 'Employee Name'}
             </h2>
             <div className="w-full h-px bg-gray-300 my-2"></div>
             <p className="text-[14px] font-bold text-gray-800">
               {mergedData?.position || mergedData?.role || 'Employee'}
             </p>
             <p className="text-[12px] font-medium text-gray-600 mt-1">
               {mergedData?.email || 'email@example.com'}
             </p>
          </div>
        </motion.div>
      </div>
    </PageShell>
  )
}
