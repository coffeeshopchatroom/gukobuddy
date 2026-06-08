
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { X, Check } from "lucide-react"

type CardProps = {
  className?: string;
  isActive: boolean;
  title?: string;
  subtitle?: string;
  activityTitle?: string;
  activityText?: string;
  zIndex: number;
  onClick?: () => void;
  emotion?: string;
  avatarId?: string;
  avatarGender?: 'male' | 'female';
};

const emotions = [
  { id: 'default', label: 'default' },
  { id: 'happy', label: 'happy' },
  { id: 'sad', label: 'sad' },
  { id: 'angry', label: 'angry' },
  { id: 'bored', label: 'bored' },
  { id: 'surprised', label: 'surprised' },
]

const GradientCard = ({
  className,
  isActive,
  title,
  subtitle,
  activityTitle,
  activityText,
  zIndex,
  onClick,
  emotion = 'default',
  avatarId = 'mii-m2',
  avatarGender = 'male'
}: CardProps): JSX.Element => {
  return (
    <section
      onClick={onClick}
      className={cn(
        "absolute transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer",
        isActive ? "hover:scale-[1.02]" : "hover:opacity-80",
        className
      )}
      style={{
        zIndex: zIndex,
        transform: isActive ? 'scale(1)' : 'perspective(1000px) rotateY(-15deg) scale(0.9)',
        opacity: isActive ? 1 : 0.6,
      }}
    >
      {/* Reflection */}
      <div
        className="absolute top-full left-0 w-full h-full opacity-30 transition-all duration-700 pointer-events-none"
        style={{
          transform: 'scaleY(-1) translateY(2px)',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 60%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 60%)',
        }}
      >
        <div className="w-full h-full rounded-[11px] bg-white/20 blur-md" />
      </div>

      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute w-full h-[62.57%] top-0 left-0 rounded-[11px] shadow-[36px_4px_22.4px_-24px_#0000006b] [background:radial-gradient(50%_50%_at_74%_49%,rgba(247,255,153,1)_0%,rgba(230,254,100,1)_18%,rgba(222,252,67,1)_33%,rgba(200,239,53,1)_45%,rgba(159,221,33,1)_70%,rgba(141,209,25,1)_100%)]" />
        <div className="absolute w-full h-[34.20%] top-[64.75%] left-0 rounded-[11px] [background:radial-gradient(50%_50%_at_74%_50%,rgba(129,129,129,0.01)_70%,rgba(92,92,91,0.31)_100%)]" />
        <div className="absolute w-full h-[29.41%] top-[33.16%] left-0 rounded-[0px_0px_11px_11px] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.62)_67%,rgba(0,0,0,0.82)_100%)]" />
      </div>

      {/* AVATAR PHOTO CONTAINER */}
      {title && (
        <div className={cn(
          "absolute top-[-60px] right-[15px] w-[330px] h-[600px] rounded-t-full rounded-b-full pointer-events-auto",
          isActive && "animate-float"
        )}>
          <img 
            src={`/avatars/${avatarGender}/${avatarId}/${avatarId}_${emotion}.png`} 
            alt={`${emotion} mii`} 
            className="w-full h-full object-cover drop-shadow-2xl"
            onError={(e) => {
              const fallbackAvatarId = avatarGender === 'female' ? 'mii-f1' : 'mii-m2';
              (e.target as HTMLImageElement).src = `/avatars/${avatarGender}/${fallbackAvatarId}/${fallbackAvatarId}_default.png`
            }}
          />
        </div>
      )}

      {title && (
        <div className="absolute top-[51px] left-[42px] font-medium text-white text-[35px] tracking-[-1.05px] leading-normal font-headline ">
          {title}
        </div>
      )}

      {subtitle && (
        <div className="absolute top-[116px] left-[42px] font-medium text-[#ffffffbd] text-[25px] tracking-[-0.75px] leading-normal whitespace-nowrap ">
          {subtitle}
        </div>
      )}

      {activityTitle && (
        <div className="absolute top-52 left-[42px] font-normal text-white text-[25px] tracking-[-0.75px] leading-normal whitespace-nowrap ">
          {activityTitle}
        </div>
      )}

      {activityText && (
        <div className="absolute top-[278px] left-[42px] font-normal text-[#ffffffab] text-[25px] tracking-[1.25px] leading-normal whitespace-nowrap ">
          {activityText}
        </div>
      )}
    </section>
  );
};

export default function Xbox360ThemeReplica() {
  const { user } = useUser();
  const db = useFirestore();
  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'profile', 'settings') : null, [db, user]);
  const { data: profile } = useDoc(profileRef);

  const [activeTab, setActiveTab] = React.useState<number>(2);
  const [currentEmotion, setCurrentEmotion] = React.useState<string>('default');
  const [hoverEmotion, setHoverEmotion] = React.useState<string | null>(null);
  const [showEmotionPicker, setShowEmotionPicker] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const tabs = ["Friends", "Study Sessions", "My Channel"];
  const displayName = user?.isAnonymous ? "guest" : (profile?.displayName || user?.displayName || "whatNot");
  const avatarUrl = profile?.photoUrl || user?.photoURL || "https://picsum.photos/seed/xboxava/200/200";
  const selectedAvatarId = profile?.selectedAvatar || 'mii-m2';
  const selectedAvatarGender = profile?.avatarGender || 'male';

  const previewAvatarPath = `/avatars/${selectedAvatarGender}/${selectedAvatarId}/${selectedAvatarId}_${hoverEmotion || currentEmotion}.png`;

  return (
    <div className="fixed inset-0 bg-[#243d15] flex items-center justify-center overflow-hidden font-sans select-none z-[9999]">
      <main
        className="relative shrink-0 overflow-hidden shadow-2xl animate-background-shift [background:radial-gradient(173.24%_228.65%_at_var(--bg-x,17.13%)_var(--bg-y,-29.45%),#243D15_0%,#385817_13%,#5F8F20_26%,#8AAB68_45%,#CDE5BA_67%)]"
        style={{
          width: '2393px',
          height: '1406px',
          transform: `scale(${typeof window !== 'undefined' ? Math.min(window.innerWidth / 2393, window.innerHeight / 1406) : 1})`,
        }}
      >
        {/* Bokeh Overlays */}
        <div className="absolute top-[-108px] left-[784px] w-[1769px] h-[1016px] [background:radial-gradient(106.52%_186.07%_at_68.66%_0%,rgba(0,0,0,0.64)_0%,rgba(0,0,0,0.03)_46%,rgba(0,0,0,0)_63%)]" aria-hidden="true" />

        {/* Profile Section */}
        <div className="absolute top-32 left-[1812px] flex flex-col items-end gap-2 z-50 animate-fade-in">
          <div className="flex items-center gap-6">
             <div className="text-right">
                <div className="[text-shadow:0px_4px_4px_#00000040] font-normal text-white text-6xl tracking-tight  font-headline">{displayName}</div>
                <div className="flex items-center justify-end gap-3 mt-2">
                  <div className="[text-shadow:0px_4px_4px_#00000040] font-normal text-[#dddddd] text-[50px] tracking-wide">700</div>
                  <div className="w-[49px] h-[47px] rounded-full shadow-[0px_4px_4px_#00000040] flex items-center justify-center">
                    <img src="/devmade-icons/gukocoin.png" alt="G" className="w-[49px] h-[47px]" />
                  </div>
                </div>
             </div>
             <div className="relative group cursor-pointer" onClick={() => setActiveTab(2)}>
                <img className="w-[147px] h-[147px] rounded-[9px] border-[5px] border-[#ACBB68] object-cover shadow-xl transition-transform group-hover:scale-105" alt="avatar" src={avatarUrl} />
                {/* Online Indicator */}
                <div className="absolute bottom-[-10px] right-[-10px] w-[42px] h-[43px] rounded-full border-2 border-[#8DD590] bg-gradient-to-b from-[#6CBF4B] to-[#8EC158] flex items-center justify-center shadow-lg">
                   <div className="w-[33px] h-[12px] rounded-full bg-white/30 blur-[2px] animate-pulse" />
                </div>
             </div>
          </div>
        </div>

        {/* Massive Half Circle Floor / Horizon */}
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

        {/* Floor Glows */}
        <div className="absolute top-[878px] left-[-35px] w-[1562px] h-[370px] rounded-full [background:radial-gradient(50%_50%_at_50%_50%,rgba(217,217,217,0.4)_0%,rgba(115,115,115,0)_100%)] z-20 animate-pulse-slow" />
        <div className="absolute top-[794px] left-[720px] w-[1281px] h-[353px] rounded-full [background:radial-gradient(50%_50%_at_50%_50%,rgba(217,217,217,0.4)_0%,rgba(115,115,115,0)_100%)] z-20 animate-pulse-slow" style={{ animationDelay: '1s' }} />

        {/* Navigation Sidebar */}
        <nav className="absolute top-[134px] left-[134px] z-50 flex flex-col gap-2 items-start">
          {tabs.map((tab, idx) => (
            <div
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={cn(
                "transition-all duration-500 cursor-pointer font-headline  font-medium",
                activeTab === idx ? "text-white text-[64px] ml-0" : "text-white/30 text-[35px] ml-24"
              )}
            >
              {activeTab === idx && <span className="mr-4 inline-block animate-bounce-sideways">•</span>}
              {tab}
            </div>
          ))}
        </nav>

        {/* Interactive Blade Stack */}
        <div className="absolute inset-0 pointer-events-none z-30">
          {/* Main Card (Open Tray) */}
          <section
            onClick={() => setActiveTab(2)}
            className={cn("absolute top-[419px] left-[375px] w-[852px] h-[959px] transition-all duration-700 pointer-events-auto", activeTab === 2 ? "translate-x-0" : "-translate-x-[600px] opacity-40")}
            style={{ zIndex: activeTab === 2 ? 100 : 10 }}
          >
            <div className="absolute inset-0 group">
              <div className="absolute w-full h-[62.57%] top-0 left-0 rounded-[11px] shadow-[36px_4px_22.4px_-24px_#0000006b] [background:radial-gradient(50%_50%_at_74%_49%,rgba(247,255,153,1)_0%,rgba(230,254,100,1)_18%,rgba(222,252,67,1)_33%,rgba(200,239,53,1)_45%,rgba(159,221,33,1)_70%,rgba(141,209,25,1)_100%)]" />
              <div className="absolute w-full h-[34.20%] top-[64.75%] left-0 rounded-[11px] [background:radial-gradient(50%_50%_at_74%_50%,rgba(129,129,129,0.01)_70%,rgba(92,92,91,0.31)_100%)]" />
              <div className="absolute w-full h-[29.41%] top-[33.16%] left-0 rounded-b-[11px] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.62)_67%,rgba(0,0,0,0.82)_100%)]" />
            </div>
            {/* Reflection */}
            <div
              className="absolute top-full left-0 w-full h-full opacity-30 transition-all duration-700 pointer-events-none"
              style={{
                transform: 'scaleY(-1) translateY(2px)',
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 60%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 60%)',
              }}
            >
              <div className="w-full h-full rounded-[11px] bg-white/20 blur-md" />
            </div>
            <div className="absolute top-[489px] left-12 [text-shadow:0px_4px_4px_#00000040] font-headline text-white text-[50px] ">Open Channel</div>
            <div className="absolute bottom-[320px] left-0 font-normal text-black/40 text-3xl px-12">1 of 8</div>
          </section>

          {/* Secondary Blade (Status/Activity) */}
          <GradientCard
            isActive={activeTab === 2}
            zIndex={activeTab === 2 ? 90 : 20}
            className={cn("top-[486px] left-[1212px] w-[636px] h-[762px] pointer-events-auto", activeTab === 2 ? "translate-x-0" : "translate-x-[-400px]")}
            title={displayName}
            subtitle="20 hours"
            activityTitle="Latest Activities"
            activityText="whoosh.. theres nothing here!"
            emotion={currentEmotion}
            avatarId={selectedAvatarId}
            avatarGender={selectedAvatarGender}
            onClick={() => setShowEmotionPicker(true)}
          />

          {/* Tertiary Blade (Controllers) */}
          <section
            onClick={() => setActiveTab(2)}
            className={cn("absolute top-[522px] left-[1721px] w-[538px] h-[659px] transition-all duration-700 pointer-events-auto", activeTab === 2 ? "translate-x-0" : "translate-x-[400px]")}
            style={{ zIndex: activeTab === 2 ? 80 : 30 }}
          >
            <div className="absolute inset-0">
              <div className="absolute w-full h-[62.57%] top-0 left-0 rounded-[11px] shadow-[36px_4px_22.4px_-24px_#0000006b] [background:radial-gradient(50%_50%_at_74%_49%,rgba(247,255,153,1)_0%,rgba(230,254,100,1)_18%,rgba(222,252,67,1)_33%,rgba(200,239,53,1)_45%,rgba(159,221,33,1)_70%,rgba(141,209,25,1)_100%)]" />
              <div className="absolute w-full h-[34.20%] top-[64.75%] left-0 rounded-[11px] [background:radial-gradient(50%_50%_at_74%_50%,rgba(129,129,129,0.01)_70%,rgba(92,92,91,0.31)_100%)]" />
              <div className="absolute w-full h-[29.41%] top-[33.16%] left-0 rounded-b-[11px] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.62)_67%,rgba(0,0,0,0.82)_100%)]" />
            </div>
            {/* Reflection */}
            <div
              className="absolute top-full left-0 w-full h-full opacity-30 transition-all duration-700 pointer-events-none"
              style={{
                transform: 'scaleY(-1) translateY(2px)',
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 60%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 60%)',
              }}
            >
              <div className="w-full h-full rounded-[11px] bg-white/20 blur-md" />
            </div>
            <div className="absolute top-[347px] left-12 font-headline text-white text-[35px] ">Controllers</div>
          </section>
        </div>

        {/* Emotion Picker Pop-up */}
        {showEmotionPicker && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-[1000] flex items-center justify-center animate-in fade-in duration-300">
            <div className="relative w-[1200px] h-[800px] rounded-[40px] overflow-hidden flex flex-col shadow-2xl border-4 border-white/20 [background:radial-gradient(173.24%_228.65%_at_17.13%_-29.45%,#243D15_0%,#385817_13%,#5F8F20_26%,#8AAB68_45%,#CDE5BA_67%)]">
              <button 
                onClick={() => setShowEmotionPicker(false)}
                className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"
              >
                <X size={64} />
              </button>

              <div className="p-16 flex-1 flex flex-col items-center">
                <h2 className="text-white text-7xl font-headline  mb-12 [text-shadow:0px_4px_4px_#00000040]">Choose Expression</h2>
                
                <div className="flex items-center justify-between w-full flex-1 gap-20">
                  {/* List */}
                  <div className="flex flex-col gap-6 flex-1">
                    {emotions.map((emo) => (
                      <button
                        key={emo.id}
                        onMouseEnter={() => setHoverEmotion(emo.id)}
                        onMouseLeave={() => setHoverEmotion(null)}
                        onClick={() => {
                          setCurrentEmotion(emo.id);
                          setShowEmotionPicker(false);
                        }}
                        className={cn(
                          "w-full py-8 px-12 rounded-[20px] text-5xl font-medium transition-all duration-300 flex items-center justify-between  font-headline",
                          (hoverEmotion === emo.id || (!hoverEmotion && currentEmotion === emo.id)) 
                            ? "bg-white text-[#243d15] scale-105 shadow-xl" 
                            : "bg-white/5 text-white/60 hover:bg-white/10"
                        )}
                      >
                        {emo.label}
                        {(hoverEmotion === emo.id || (!hoverEmotion && currentEmotion === emo.id)) && <Check size={48} />}
                      </button>
                    ))}
                  </div>

                  {/* Preview Area */}
                  <div className="relative w-[500px] h-[500px] flex items-center justify-center bg-black/20 rounded-full border-8 border-white/10 overflow-visible">
                     <img 
                      src={previewAvatarPath} 
                      alt="preview" 
                      className="h-[700px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform -translate-y-20 animate-in zoom-in duration-300"
                      onError={(e) => {
                        const fallbackAvatarId = selectedAvatarGender === 'female' ? 'mii-f1' : 'mii-m2';
                        (e.target as HTMLImageElement).src = `/avatars/${selectedAvatarGender}/${fallbackAvatarId}/${fallbackAvatarId}_default.png`
                      }}
                    />
                  </div>
                </div>

                <div className="mt-12 text-white/30 text-3xl font-headline ">
                  Move your cursor to preview, click to select
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Nav Controls */}
        <div className="absolute bottom-[100px] left-[134px] z-[100] flex items-center gap-8">
           <div className="flex items-center gap-4 group">
             <div className="w-[50px] h-[50px] bg-green-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg group-hover:animate-pulse">A</div>
             <span className="text-white text-3xl  font-medium">select</span>
           </div>
           <div className="flex items-center gap-4 group">
             <div className="w-[50px] h-[50px] bg-red-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg group-hover:animate-pulse">B</div>
             <span className="text-white text-3xl  font-medium">back</span>
           </div>
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabin:wght@400;500&family=Roboto:wght@400;700&display=swap');

        body {
          background: #243d15 !important;
          margin: 0;
          padding: 0;
        }

        .font-headline {
          font-family: 'Cabin', sans-serif !important;
        }

        * {
          font-family: 'Roboto', sans-serif;
        }

        @keyframes background-shift {
          0%, 100% { --bg-x: 17.13%; --bg-y: -29.45%; }
          50% { --bg-x: 20%; --bg-y: -25%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.02); }
        }

        @keyframes bounce-sideways {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }

        .animate-background-shift {
          animation: background-shift 15s infinite ease-in-out;
        }

        .animate-float {
          animation: float 4s infinite ease-in-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 6s infinite ease-in-out;
        }

        .animate-bounce-sideways {
          animation: bounce-sideways 1s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
