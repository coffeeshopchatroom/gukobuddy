
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useMemoFirebase } from "@/firebase"
import { doc, setDoc } from "firebase/firestore"
import { ChevronLeft, Loader2 } from "lucide-react"

const MALE_AVATARS = [
  { id: 'mii-m1'},
  { id: 'mii-m2'},
  { id: 'mii-m3'},
]

export default function AvatarPickerPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'profile', 'settings') : null, [db, user])
  
  const [step, setStep] = React.useState<'gender' | 'selection'>('gender')
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleSelectAvatar = async (avatarId: string) => {
    if (!profileRef) return
    setIsUpdating(true)
    try {
      await setDoc(profileRef, { selectedAvatar: avatarId }, { merge: true })
      router.push('/admin/xbox-test')
    } catch (error) {
      console.error("Failed to update avatar", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#243d15] flex items-center justify-center overflow-hidden font-sans select-none z-[9999]">
      <main
        className="relative shrink-0 overflow-hidden shadow-2xl animate-background-shift [background:radial-gradient(173.24%_228.65%_at_17.13%_-29.45%,#243D15_0%,#385817_13%,#5F8F20_26%,#8AAB68_45%,#CDE5BA_67%)]"
        style={{
          width: '2393px',
          height: '1406px',
          transform: `scale(${typeof window !== 'undefined' ? Math.min(window.innerWidth / 2393, window.innerHeight / 1406) : 1})`,
        }}
      >
        {/* Floor Horizon */}
        <div
          style={{
            width: '5962px',
            height: '1604px',
            left: '-1785px',
            top: '703px',
            background: 'linear-gradient(180deg, #686868 0%, #939393 100%)',
            boxShadow: '0px -103px 118.8px 12px rgba(255, 255, 255, 0.44)',
            outline: '4px solid white'
          }}
          className="absolute rounded-full z-10"
        />

        {/* Content Area */}
        <div className="absolute inset-0 z-50 flex flex-col items-center pt-40 px-60">
          <div className="w-full flex items-center justify-between mb-20">
            <h1 className="text-white text-9xl font-headline lowercase drop-shadow-2xl animate-fade-in">
              {step === 'gender' ? 'what style do you want?' : 'choose your avatar'}
            </h1>
            {step === 'selection' && (
              <button 
                onClick={() => setStep('gender')}
                className="flex items-center gap-4 text-white/60 hover:text-white transition-all hover:translate-x-[-10px]"
              >
                <ChevronLeft size={80} />
                <span className="text-5xl font-headline lowercase">back</span>
              </button>
            )}
          </div>

          {step === 'gender' ? (
            <div className="flex gap-20 mt-40">
              <button 
                onClick={() => setStep('selection')}
                className="w-[500px] h-[700px] rounded-[40px] bg-white/5 border-4 border-white/10 hover:bg-white/10 hover:scale-105 hover:border-white/30 transition-all flex items-center justify-center group"
              >
                <img src="/devmade-icons/maleicon.png" alt="Male" className="w-122 h-full" />
              </button>
              <button 
                onClick={() => setStep('selection')}
                className="w-[500px] h-[700px] rounded-[40px] bg-white/5 border-4 border-white/10 hover:bg-white/10 hover:scale-105 hover:border-white/30 transition-all flex items-center justify-center group"
              >
                <img src="/devmade-icons/femaleicon.png" alt="Female" className="w-122 h-full" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-16 mt-20 w-full max-w-7xl animate-in fade-in slide-in-from-bottom-20 duration-700">
              {MALE_AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handleSelectAvatar(avatar.id)}
                  disabled={isUpdating}
                  className="relative group bg-white/5 border-4 border-white/10 rounded-[60px] p-10 hover:bg-white/20 transition-all hover:scale-110 hover:border-white/30 flex flex-col items-center gap-10 shadow-xl"
                >
                  <div className="w-64 h-64 rounded-full overflow-hidden border-8 border-white/10 bg-black/20 group-hover:border-white/40 transition-colors">
                    <img 
                      src={`/avatars/male/headshots/${avatar.id}.png`} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/avatar/200/200'
                      }}
                    />
                  </div>
                  
                  {isUpdating && <Loader2 className="absolute inset-0 m-auto text-white animate-spin" size={64} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Nav Controls */}
        <div className="absolute bottom-[100px] left-[134px] z-[100] flex items-center gap-8">
           <div className="flex items-center gap-4 group">
             <div className="w-[50px] h-[50px] bg-green-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg group-hover:animate-pulse">A</div>
             <span className="text-white text-3xl lowercase font-medium">select</span>
           </div>
           <div className="flex items-center gap-4 group">
             <div className="w-[50px] h-[50px] bg-red-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg group-hover:animate-pulse">B</div>
             <span className="text-white text-3xl lowercase font-medium">back</span>
           </div>
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabin:wght@400;500&family=Roboto:wght@400;700&display=swap');
        body { background: #243d15 !important; margin: 0; padding: 0; }
        .font-headline { font-family: 'Cabin', sans-serif !important; }
        * { font-family: 'Roboto', sans-serif; }

        @keyframes background-shift {
          0%, 100% { --bg-x: 17.13%; --bg-y: -29.45%; }
          50% { --bg-x: 20%; --bg-y: -25%; }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-background-shift {
          animation: background-shift 15s infinite ease-in-out;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
