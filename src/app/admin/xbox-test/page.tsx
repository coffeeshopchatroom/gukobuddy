"use client"

import * as React from "react"
import { ChevronRight, Disc, Gamepad2, Film, Music, Grid3X3, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Xbox360ThemeReplica() {
  const [activeBladeIndex, setActiveBladeIndex] = React.useState(1) // Default to Player1
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const blades = [
    { title: "Open Tray", icon: <DiscIcon />, color: "from-[#96bd14] to-[#456b14]", subtitle: "tray empty" },
    { title: "Player1", icon: <AvatarPopout />, color: "from-[#bde754] to-[#7fb32a]", subtitle: "0 G", special: "avatar" },
    { title: "Games", icon: <GamepadIcon />, color: "from-[#ace41b] to-[#67a711]", subtitle: "latest titles" },
    { title: "Videos", icon: <VideoIcon />, color: "from-[#a2df1a] to-[#61a010]", subtitle: "video library" },
    { title: "Music", icon: <MusicIcon />, color: "from-[#98da19] to-[#5a9a0f]", subtitle: "music library" },
    { title: "Apps", icon: <GridIcon />, color: "from-[#8fd518] to-[#54930e]", subtitle: "social apps" },
  ]

  const menuItems = [
    "Inside Xbox",
    "Friends",
    "Video Marketplace",
    "Game Marketplace",
    "My Xbox"
  ]

  const selectedMenuIndex = 4 // "My Xbox"

  return (
    <div className="fixed inset-0 bg-[#456b14] flex flex-col items-center justify-center overflow-hidden font-sans select-none z-[9999] font-['Roboto',sans-serif]">
      {/* Background Gradient & Bokeh Circles */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#bde754] via-[#7fb32a] to-[#456b14] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-white/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-[#bde754]/20 blur-[150px] rounded-full" />
        
        {/* Bokeh Circles */}
        <div className="absolute top-[20%] left-[30%] w-32 h-32 border-[1px] border-white/5 rounded-full" />
        <div className="absolute top-[40%] left-[10%] w-64 h-64 border-[1px] border-white/5 rounded-full" />
        <div className="absolute bottom-[30%] right-[20%] w-48 h-48 border-[1px] border-white/10 rounded-full" />
      </div>

      {/* Gray Floor Stage (Half Circle) */}
      <div className="absolute bottom-[-45%] left-1/2 -translate-x-1/2 w-[150%] h-[80%] bg-gradient-to-b from-slate-300/40 to-slate-900/60 rounded-[50%] blur-[2px] border-t border-white/20" />

      {/* Floor Highlight / Selected Reflection */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/20 blur-[60px] rounded-[50%] transition-opacity duration-700" />

      {/* Vertical Side Menu (My Xbox etc) */}
      <div className="absolute top-20 left-24 z-50 flex flex-col gap-1 items-start">
        {menuItems.map((item, i) => {
          const distance = Math.abs(i - selectedMenuIndex);
          const scale = Math.max(0.7, 1 - distance * 0.1);
          const opacity = Math.max(0.2, 1 - distance * 0.2);
          const isActive = i === selectedMenuIndex;

          return (
            <div 
              key={i} 
              className={cn(
                "flex items-center gap-3 transition-all duration-500",
                isActive ? "text-white text-4xl font-bold" : "text-white/60 text-xl font-medium"
              )}
              style={{ 
                transform: `scale(${scale})`,
                opacity: opacity,
                marginLeft: isActive ? '0' : '10px'
              }}
            >
              {isActive && <div className="w-2 h-2 bg-white rotate-45 mr-1" />}
              <span className="lowercase">{item}</span>
            </div>
          )
        })}
      </div>

      {/* Profile/Gamertag Dimmer Halo (Top Right) */}
      <div className="absolute top-12 right-24 z-50 flex items-center gap-4">
        <div className="absolute -inset-8 bg-black/10 blur-2xl rounded-full" />
        <div className="relative text-right">
          <div className="text-3xl font-bold text-white lowercase drop-shadow-md">Player1</div>
          <div className="text-xl font-medium text-white/70 tracking-tight">0 <span className="text-xs uppercase align-top mt-1 inline-block">g</span></div>
        </div>
        <div className="relative w-20 h-20 bg-zinc-900 rounded-sm p-1 border border-white/20 shadow-2xl overflow-hidden">
          <img src="https://picsum.photos/seed/xboxpfp/200/200" className="w-full h-full object-cover opacity-90" alt="player" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
        </div>
      </div>

      {/* Main Blades Stack */}
      <div className="relative w-full h-full flex items-center justify-center perspective-[2000px] mt-12">
        <div className="relative flex items-center justify-start translate-x-[20%]">
          {blades.map((blade, i) => {
            const relativeIndex = i - activeBladeIndex
            const isVisible = relativeIndex >= -1 // Show one behind
            
            return (
              <div
                key={i}
                onClick={() => setActiveBladeIndex(i)}
                className={cn(
                  "absolute transition-all duration-700 ease-out cursor-pointer group",
                  relativeIndex === 0 ? "z-[60]" : relativeIndex < 0 ? `z-[${40 + i}]` : `z-[${50 - i}]`
                )}
                style={{
                  transform: `
                    translateX(${relativeIndex * 280}px) 
                    rotateY(${relativeIndex === 0 ? 0 : -35}deg)
                    translateZ(${relativeIndex === 0 ? 100 : -200 - Math.abs(relativeIndex) * 100}px)
                  `,
                  opacity: isVisible ? 1 : 0,
                  pointerEvents: isVisible ? 'auto' : 'none'
                }}
              >
                {/* Blade Reflection */}
                {relativeIndex === 0 && (
                  <div 
                    className="absolute top-[380px] left-0 w-full h-[120px] bg-white/10 blur-[40px] rounded-[50%] z-0"
                  />
                )}

                {/* Main Card Container */}
                <div className="relative group">
                  {/* Card Shadow on the one behind */}
                  <div className={cn(
                    "absolute inset-4 bg-black/40 blur-2xl transition-all duration-500",
                    relativeIndex === 0 ? "opacity-40" : "opacity-70 translate-x-4"
                  )} />

                  <div className={cn(
                    "relative w-[480px] h-[340px] rounded-xl bg-gradient-to-br p-10 overflow-visible transition-all duration-500",
                    blade.color,
                    relativeIndex === 0 ? "ring-2 ring-white/40 shadow-[0_40px_100px_rgba(0,0,0,0.6)]" : "opacity-90 grayscale-[0.2]"
                  )}>
                    {/* Darker Gradient Overlay for Icon Area */}
                    <div className="absolute top-0 left-0 w-full h-[60%] bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
                    
                    {/* Glossy Texture Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-60" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />

                    {/* Blade Content */}
                    <div className="relative h-full flex flex-col justify-between">
                      <div className="flex-1 flex items-center justify-center">
                        <div className={cn(
                          "transition-transform duration-500",
                          relativeIndex === 0 ? "scale-[2.8]" : "scale-[2]"
                        )}>
                          {blade.icon}
                        </div>
                      </div>
                      <div className="text-white drop-shadow-md">
                        <div className="text-4xl font-bold lowercase">{blade.title}</div>
                      </div>
                    </div>
                  </div>

                  {/* Subtitle Tracking Text (Below Card) */}
                  <div className={cn(
                    "mt-4 text-center transition-all duration-500",
                    relativeIndex === 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  )}>
                    <div className="text-white/60 text-lg font-medium lowercase tracking-wide">
                      {i + 1} of {blades.length} — {blade.subtitle}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Nav Controls */}
      <div className="absolute bottom-12 left-24 z-50 flex items-center gap-3">
        <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-[11px] text-white font-black shadow-lg">A</div>
        <span className="text-white/90 font-bold lowercase text-xl">Select</span>
        <div className="ml-4 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-[11px] text-white font-black shadow-lg">B</div>
        <span className="text-white/90 font-bold lowercase text-xl">Back</span>
      </div>

      <style jsx global>{`
        body {
          background: #456b14 !important;
        }
        .perspective-[2000px] {
          perspective: 2000px;
        }
      `}</style>
    </div>
  )
}

function DiscIcon() {
  return (
    <div className="w-24 h-24 rounded-full border-4 border-white/20 bg-white/10 relative flex items-center justify-center shadow-inner">
      <div className="w-16 h-16 rounded-full border-2 border-white/40 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-white/80" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rotate-45" />
    </div>
  )
}

function GamepadIcon() {
  return (
    <div className="w-32 h-20 bg-white/20 rounded-[32px] relative border-4 border-white/20 shadow-lg">
      <div className="absolute top-2 left-6 w-8 h-8 rounded-full bg-black/20" />
      <div className="absolute bottom-2 right-6 w-8 h-8 rounded-full bg-black/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/20" />
    </div>
  )
}

function VideoIcon() {
  return (
    <div className="w-24 h-16 bg-white/20 rounded-lg relative border-4 border-white/20 flex items-center justify-center shadow-lg">
      <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-2" />
    </div>
  )
}

function MusicIcon() {
  return (
    <div className="w-24 h-24 flex items-center justify-center drop-shadow-lg">
      <div className="w-8 h-16 border-l-8 border-t-8 border-white/60 rounded-tr-xl" />
      <div className="w-10 h-10 rounded-full bg-white/60 -mt-10 ml-[-5px]" />
    </div>
  )
}

function GridIcon() {
  return (
    <div className="grid grid-cols-3 gap-2 p-2 bg-white/5 rounded-xl border border-white/10">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="w-6 h-6 rounded-sm bg-white/30" />
      ))}
    </div>
  )
}

function AvatarPopout() {
  return (
    <div className="relative w-48 h-64 overflow-visible">
      {/* Pop-out silhouette that extends beyond the 48x64 bounds */}
      <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-zinc-900 border-4 border-[#bde754] shadow-2xl flex items-center justify-center overflow-hidden">
         <img src="https://picsum.photos/seed/pfp/100/100" className="w-full h-full object-cover" alt="" />
      </div>
      <div className="absolute top-[45px] left-[-20px] right-[-20px] bottom-0 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-t-[50px] rounded-b-[10px] shadow-2xl border-t border-white/10 flex items-center justify-center">
         <span className="text-[8px] font-black uppercase tracking-tighter opacity-20 text-white mt-12">player</span>
      </div>
      {/* Decorative pop-out elements */}
      <div className="absolute top-[60px] right-[-10px] w-6 h-12 bg-[#bde754] rounded-full blur-xl opacity-40 animate-pulse" />
    </div>
  )
}
