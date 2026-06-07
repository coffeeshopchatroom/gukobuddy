
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type CardProps = {
  className?: string;
  isActive: boolean;
  title?: string;
  subtitle?: string;
  activityTitle?: string;
  activityText?: string;
  image?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
};

const GradientCard = ({
  className,
  isActive,
  title,
  subtitle,
  activityTitle,
  activityText,
  image,
  onClick,
}: CardProps): JSX.Element => {
  return (
    <section
      onClick={onClick}
      className={cn(
        "absolute transition-all duration-700 ease-out cursor-pointer",
        isActive ? "z-50 scale-100" : "z-10 scale-90 opacity-80",
        className
      )}
      style={{
        transform: isActive ? 'none' : 'perspective(1000px) rotateY(-15deg)',
      }}
    >
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute w-full h-[62.57%] top-0 left-0 rounded-[11px] shadow-[36px_4px_22.4px_-24px_#0000006b] [background:radial-gradient(50%_50%_at_74%_49%,rgba(247,255,153,1)_0%,rgba(230,254,100,1)_18%,rgba(222,252,67,1)_33%,rgba(200,239,53,1)_45%,rgba(159,221,33,1)_70%,rgba(141,209,25,1)_100%)]" />
        <div className="absolute w-full h-[34.20%] top-[64.75%] left-0 rounded-[11px] [background:radial-gradient(50%_50%_at_74%_50%,rgba(129,129,129,0.01)_70%,rgba(92,92,91,0.31)_100%)]" />
        <div className="absolute w-full h-[29.41%] top-[33.16%] left-0 rounded-[0px_0px_11px_11px] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.62)_67%,rgba(0,0,0,0.82)_100%)]" />
      </div>

      {image && (
        <div className="absolute inset-0 flex items-center justify-center p-12 pb-32">
          <img src={image} alt="" className="w-full h-full object-contain drop-shadow-2xl" />
        </div>
      )}

      {title && (
        <div className="absolute top-[51px] left-[42px] font-medium text-white text-[35px] tracking-[-1.05px] leading-normal font-headline lowercase">
          {title}
        </div>
      )}

      {subtitle && (
        <div className="absolute top-[116px] left-[42px] font-medium text-[#ffffffbd] text-[25px] tracking-[-0.75px] leading-normal whitespace-nowrap lowercase">
          {subtitle}
        </div>
      )}

      {activityTitle && (
        <div className="absolute top-52 left-[42px] font-normal text-white text-[25px] tracking-[-0.75px] leading-normal whitespace-nowrap lowercase">
          {activityTitle}
        </div>
      )}

      {activityText && (
        <div className="absolute top-[278px] left-[42px] font-normal text-[#ffffffab] text-[25px] tracking-[1.25px] leading-normal whitespace-nowrap lowercase">
          {activityText}
        </div>
      )}
    </section>
  );
};

export default function Xbox360ThemeReplica() {
  const [activeTab, setActiveTab] = React.useState<number>(2); // Default to My Channel
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const tabs = ["Friends", "Study Sessions", "My Channel"];

  return (
    <div className="fixed inset-0 bg-[#243d15] flex items-center justify-center overflow-hidden font-sans select-none z-[9999]">
      <main 
        className="relative shrink-0 overflow-hidden shadow-2xl [background:radial-gradient(50%_50%_at_76%_49%,rgba(36,61,21,1)_0%,rgba(56,88,23,1)_13%,rgba(95,143,32,1)_26%,rgba(138,171,104,1)_45%,rgba(205,229,186,1)_67%)]"
        style={{
          width: '2393px',
          height: '1406px',
          transform: `scale(${typeof window !== 'undefined' ? Math.min(window.innerWidth / 2393, window.innerHeight / 1406) : 1})`,
        }}
      >
        {/* Bokeh Overlays */}
        <div className="absolute top-[-108px] left-[784px] w-[1769px] h-[1016px] [background:radial-gradient(50%_50%_at_75%_50%,rgba(0,0,0,0.64)_0%,rgba(0,0,0,0.03)_46%,rgba(0,0,0,0)_63%)]" aria-hidden="true" />
        
        {/* Profile Section */}
        <div className="absolute top-32 left-[1812px] flex flex-col items-end gap-2 z-50">
          <div className="flex items-center gap-6">
             <div className="text-right">
                <div className="[text-shadow:0px_4px_4px_#00000040] font-normal text-white text-6xl tracking-tight lowercase">whatNot</div>
                <div className="flex items-center justify-end gap-3 mt-2">
                  <div className="[text-shadow:0px_4px_4px_#00000040] font-normal text-[#dddddd] text-[50px] tracking-wide">700</div>
                  <div className="w-[49px] h-[47px] bg-[#d9d9d9] rounded-full shadow-[0px_4px_4px_#00000040] flex items-center justify-center">
                    <span className="text-[#6e8f55] text-[40px] font-bold">G</span>
                  </div>
                </div>
             </div>
             <div className="relative">
                <img className="w-[147px] h-[147px] rounded-[9px] border-[5px] border-[#ACBB68] object-cover" alt="avatar" src="https://picsum.photos/seed/xboxava/200/200" />
                <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 w-[42px] h-[43px] rounded-full border-2 border-[#8DD590] bg-gradient-to-b from-[#6CBF4B] to-[#8EC158] flex items-center justify-center">
                   <div className="w-[33px] h-[12px] rounded-full bg-white/30 blur-[2px]" />
                </div>
             </div>
          </div>
        </div>

        {/* Floor Reflections & Stages */}
        <div className="absolute top-[465px] left-0 w-[2393px] h-[941px] bg-[url('https://picsum.photos/seed/floor/2393/941')] opacity-20 blur-xl mix-blend-overlay" />
        <div className="absolute top-[822px] left-0 w-[2393px] h-[584px] bg-[linear-gradient(180deg,rgba(217,217,217,0)_0%,rgba(191,190,190,0.08)_14%,rgba(16,11,11,0.59)_100%)]" />
        <div className="absolute top-[878px] left-[-35px] w-[1562px] h-[370px] rounded-full [background:radial-gradient(50%_50%_at_50%_50%,rgba(217,217,217,1)_0%,rgba(115,115,115,0)_100%)] opacity-40" />
        <div className="absolute top-[794px] left-[720px] w-[1281px] h-[353px] rounded-full [background:radial-gradient(50%_50%_at_50%_50%,rgba(217,217,217,1)_0%,rgba(115,115,115,0)_100%)] opacity-40" />

        {/* Navigation Sidebar */}
        <nav className="absolute top-[134px] left-[134px] z-50 flex flex-col gap-2 items-start">
          {tabs.map((tab, idx) => (
            <div 
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={cn(
                "transition-all duration-500 cursor-pointer font-headline lowercase font-medium",
                activeTab === idx ? "text-white text-[64px] ml-0" : "text-white/30 text-[35px] ml-24"
              )}
            >
              {activeTab === idx && <span className="mr-4">•</span>}
              {tab}
            </div>
          ))}
        </nav>

        {/* Interactive Blade Stack */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Featured Main Blade (Open Tray) */}
          <section className={cn("absolute top-[419px] left-[375px] w-[856px] h-[959px] transition-all duration-700 pointer-events-auto", activeTab === 2 ? "translate-x-0" : "-translate-x-[600px] opacity-40 grayscale-[0.5]")}>
            <div className="absolute inset-0">
              <div className="absolute w-full h-[62.57%] top-0 left-0 rounded-[11px] shadow-[36px_4px_22.4px_-24px_#0000006b] [background:radial-gradient(50%_50%_at_74%_49%,rgba(247,255,153,1)_0%,rgba(230,254,100,1)_18%,rgba(222,252,67,1)_33%,rgba(200,239,53,1)_45%,rgba(159,221,33,1)_70%,rgba(141,209,25,1)_100%)]" />
              <div className="absolute w-full h-[34.20%] top-[64.75%] left-0 rounded-[11px] [background:radial-gradient(50%_50%_at_74%_50%,rgba(129,129,129,0.01)_70%,rgba(92,92,91,0.31)_100%)]" />
              <div className="absolute w-full h-[29.41%] top-[33.16%] left-0 rounded-b-[11px] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.62)_67%,rgba(0,0,0,0.82)_100%)]" />
            </div>
            <div className="absolute top-[489px] left-12 [text-shadow:0px_4px_4px_#00000040] font-headline text-white text-[50px] lowercase">Open Tray</div>
            <div className="absolute bottom-[320px] left-0 font-normal text-black/40 text-3xl px-12">1 of 8</div>
            <img className="absolute top-[118px] left-[30%] w-[500px] h-[400px] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" alt="tray" src="https://picsum.photos/seed/discbox/800/800" />
            <div className="absolute bottom-[400px] left-[30%] w-[500px] h-[100px] bg-black/20 blur-2xl rounded-full" />
          </section>

          {/* Secondary Blade (Status/Activity) */}
          <GradientCard
            isActive={activeTab === 2}
            className={cn("top-[486px] left-[1212px] w-[636px] h-[762px] pointer-events-auto", activeTab === 2 ? "translate-x-0" : "translate-x-[-400px]")}
            title="whatnot"
            subtitle="20 hours"
            activityTitle="Latest Activities"
            activityText="whoosh.. theres nothing here!"
          />

          {/* Tertiary Blade (Controllers) */}
          <section className={cn("absolute top-[522px] left-[1721px] w-[538px] h-[659px] transition-all duration-700 pointer-events-auto", activeTab === 2 ? "translate-x-0" : "translate-x-[400px]")}>
            <div className="absolute inset-0">
              <div className="absolute w-full h-[62.57%] top-0 left-0 rounded-[11px] shadow-[36px_4px_22.4px_-24px_#0000006b] [background:radial-gradient(50%_50%_at_74%_49%,rgba(247,255,153,1)_0%,rgba(230,254,100,1)_18%,rgba(222,252,67,1)_33%,rgba(200,239,53,1)_45%,rgba(159,221,33,1)_70%,rgba(141,209,25,1)_100%)]" />
              <div className="absolute w-full h-[34.20%] top-[64.75%] left-0 rounded-[11px] [background:radial-gradient(50%_50%_at_74%_50%,rgba(129,129,129,0.01)_70%,rgba(92,92,91,0.31)_100%)]" />
              <div className="absolute w-full h-[29.41%] top-[33.16%] left-0 rounded-b-[11px] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.62)_67%,rgba(0,0,0,0.82)_100%)]" />
            </div>
            <div className="absolute top-[347px] left-12 font-headline text-white text-[35px] lowercase">Controllers</div>
            <img className="absolute top-[80px] left-[10%] w-[400px] h-[300px] object-contain" alt="controllers" src="https://picsum.photos/seed/controllers/600/400" />
          </section>

          {/* Character Illustration (Floating) */}
          <div className={cn("absolute top-[480px] left-[1500px] transition-all duration-1000 z-[60]", activeTab === 2 ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-90")}>
             <img src="https://picsum.photos/seed/avatarpose/800/1200" className="h-[900px] object-contain drop-shadow-2xl" alt="avatar" />
          </div>
        </div>

        {/* Footer Nav Controls */}
        <div className="absolute bottom-[100px] left-[134px] z-50 flex items-center gap-8">
           <div className="flex items-center gap-4">
             <div className="w-[50px] h-[50px] bg-green-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg">A</div>
             <span className="text-white text-3xl lowercase font-medium">select</span>
           </div>
           <div className="flex items-center gap-4">
             <div className="w-[50px] h-[50px] bg-red-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg">B</div>
             <span className="text-white text-3xl lowercase font-medium">back</span>
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
      `}</style>
    </div>
  );
}
