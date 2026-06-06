
"use client"

import * as React from "react"
import { ChevronRight, User, Disc, Users, Film, Music, Settings, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function Xbox360ThemeReplica() {
  const [activeBladeIndex, setActiveBladeIndex] = React.useState(0)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const blades = [
    { title: "Open Tray", subtitle: "1 of 8", icon: <DiscIcon />, color: "from-[#c6f021] to-[#7db212]" },
    { title: "Player1", subtitle: "0 G", icon: <UserSilhouette />, color: "from-[#b8e81d] to-[#6ead14]" },
    { title: "Games", subtitle: "latest games", icon: <GamepadIcon />, color: "from-[#ace41b] to-[#67a711]" },
    { title: "Videos", subtitle: "video library", icon: <VideoIcon />, color: "from-[#a2df1a] to-[#61a010]" },
    { title: "Music", subtitle: "music library", icon: <MusicIcon />, color: "from-[#98da19] to-[#5a9a0f]" },
    { title: "Apps", subtitle: "all apps", icon: <GridIcon />, color: "from-[#8fd518] to-[#54930e]" },
  ]

  const menuItems = [
    "Inside Xbox",
    "Friends",
    "Video & Music Marketplace",
    "Game Marketplace",
    "My Xbox"
  ]

  return (
    <div className="fixed inset-0 bg-[#7a9d51] flex flex-col items-center justify-center overflow-hidden font-sans select-none z-[9999]">
      {/* Background Gradient & Bokeh Circles */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#bde754] via-[#7fb32a] to-[#456b14] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-white/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-[#bde754]/30 blur-[150px] rounded-full" />
        
        {/* Bokeh Circles */}
        <div className="absolute top-[20%] left-[30%] w-32 h-32 border-[1px] border-white/10 rounded-full" />
        <div className="absolute top-[40%] left-[10%] w-64 h-64 border-[1px] border-white/5 rounded-full" />
        <div className="absolute bottom-[30%] right-[20%] w-48 h-48 border-[1px] border-white/10 rounded-full" />
        <div className="absolute top-[15%] right-[15%] w-24 h-24 border-[1px] border-white/20 rounded-full" />
      </div>

      {/* Horizon Line / Floor */}
      <div className="absolute bottom-0 left-0 w-full h-[35%] bg-gradient-to-b from-black/20 to-transparent backdrop-blur-md border-t border-white/10" />

      {/* Top Navigation Menu (Left) */}
      <div className="absolute top-12 left-20 z-50">
        <div className="space-y-0.5">
          {menuItems.map((item, i) => (
            <div key={i} className={cn(
              "text-lg font-bold transition-all lowercase",
              i === menuItems.length - 1 ? "text-white text-3xl flex items-center gap-2" : "text-white/40 text-xl"
            )}>
              {i === menuItems.length - 1 && <div className="w-1.5 h-1.5 bg-white rotate-45" />}
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Profile Section (Top Right) */}
      <div className="absolute top-10 right-20 z-50 flex items-center gap-4 text-right">
        <div className="space-y-0">
          <div className="text-2xl font-bold text-white lowercase">Player1</div>
          <div className="text-lg font-bold text-white/70">0 <span className="text-xs align-top inline-block mt-1">G</span></div>
        </div>
        <div className="w-16 h-16 bg-[#2a2a2a] rounded-sm p-0.5 shadow-2xl border border-white/20 relative overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-white/20 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
             <img src="https://picsum.photos/seed/xboxpfp/100/100" className="w-full h-full object-cover opacity-80" alt="player" />
          </div>
        </div>
      </div>

      {/* Blades Section (Center) */}
      <div className="relative w-full h-full flex items-center justify-center perspective-[1500px]">
        <div className="relative flex items-center justify-start translate-x-[15%]">
          {blades.map((blade, i) => {
            const relativeIndex = i - activeBladeIndex
            const isVisible = relativeIndex >= 0
            
            return (
              <div
                key={i}
                onClick={() => setActiveBladeIndex(i)}
                className={cn(
                  "absolute transition-all duration-700 ease-out cursor-pointer group",
                  relativeIndex === 0 ? "z-40 scale-100" : "z-30 scale-90"
                )}
                style={{
                  transform: `
                    translateX(${relativeIndex * 240}px) 
                    rotateY(${relativeIndex === 0 ? 0 : -35}deg)
                    translateZ(${relativeIndex === 0 ? 0 : -300}px)
                  `,
                  opacity: isVisible ? 1 : 0,
                  pointerEvents: isVisible ? 'auto' : 'none'
                }}
              >
                {/* Main Card */}
                <div className={cn(
                  "relative w-[480px] h-[340px] rounded-[10px] bg-gradient-to-br p-8 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] overflow-hidden transition-all",
                  blade.color,
                  relativeIndex === 0 ? "ring-2 ring-white/50" : "opacity-80"
                )}>
                  {/* Glossy Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2)_0%,transparent_60%)]" />

                  {/* Icon / Content */}
                  <div className="relative h-full flex flex-col justify-between">
                    <div className="flex-1 flex items-center justify-center">
                      <div className="scale-[2.5] text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.2)]">
                        {blade.icon}
                      </div>
                    </div>
                    <div className="space-y-0 text-white">
                      <div className="text-3xl font-bold lowercase">{blade.title}</div>
                      <div className="text-lg opacity-60 lowercase font-medium">{blade.subtitle}</div>
                    </div>
                  </div>
                </div>

                {/* Reflection */}
                <div 
                  className="absolute top-full mt-1 w-full h-[150px] opacity-20 pointer-events-none"
                  style={{
                    maskImage: 'linear-gradient(to bottom, black 0%, transparent 70%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 70%)',
                  }}
                >
                  <div className={cn(
                    "w-full h-full rounded-[10px] bg-gradient-to-br transform scale-y-[-1]",
                    blade.color
                  )} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Branding & Nexus Button */}
      <div className="absolute bottom-10 left-20 z-50 flex items-baseline gap-1 text-white/80 font-bold lowercase">
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-black shadow-lg shadow-green-900/50">A</div>
        <span className="ml-1 text-lg">Select</span>
      </div>

      <div className="absolute bottom-6 right-24 z-50 flex flex-col items-center">
        {/* Ripple Base */}
        <div className="absolute bottom-[-10px] w-48 h-12 bg-white/5 rounded-[100%] blur-sm border border-white/10" />
        <div className="absolute bottom-[-5px] w-32 h-8 bg-white/10 rounded-[100%] blur-[2px] border border-white/20" />
        
        {/* Nexus Button (Simplified SVG) */}
        <div className="relative w-16 h-16 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center justify-center overflow-hidden group hover:scale-110 transition-transform cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500" />
          <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] relative z-10 drop-shadow-md">
            <path d="M50 0 C22.4 0 0 22.4 0 50 C0 77.6 22.4 100 50 100 C77.6 100 100 77.6 100 50 C100 22.4 77.6 0 50 0 Z M50 90 C27.9 90 10 72.1 10 50 C10 27.9 27.9 10 50 10 C72.1 10 90 27.9 90 50 C90 72.1 72.1 90 50 90 Z" fill="#666" opacity="0.3" />
            <path d="M50 15 C69.3 15 85 30.7 85 50 C85 69.3 69.3 85 50 85 C30.7 85 15 69.3 15 50 C15 30.7 30.7 15 50 15 Z" fill="white" />
            {/* Xbox X Shape */}
            <path d="M25 35 L40 50 L25 65" stroke="#999" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M75 35 L60 50 L75 65" stroke="#999" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M35 25 L50 40 L65 25" stroke="#999" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M35 75 L50 60 L65 75" stroke="#999" strokeWidth="6" strokeLinecap="round" fill="none" />
            {/* Green glowing center */}
            <circle cx="50" cy="50" r="8" fill="#bde754" className="animate-pulse" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/20" />
        </div>
      </div>

      <style jsx global>{`
        body {
          background: #456b14 !important;
          overflow: hidden;
        }
        .perspective-[1500px] {
          perspective: 1500px;
        }
        .rotate-y-[-35deg] {
          transform: rotateY(-35deg);
        }
      `}</style>
    </div>
  )
}

function DiscIcon() {
  return (
    <div className="w-24 h-24 rounded-full border-4 border-white/40 bg-white/20 relative flex items-center justify-center">
      <div className="w-16 h-16 rounded-full border-2 border-white/60 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-white/80" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45" />
    </div>
  )
}

function UserSilhouette() {
  return (
    <div className="w-24 h-40 flex flex-col items-center">
      <div className="w-12 h-12 rounded-full bg-black/40 mb-1" />
      <div className="w-20 h-28 bg-black/40 rounded-t-[30px] rounded-b-[10px]" />
    </div>
  )
}

function GamepadIcon() {
  return (
    <div className="w-32 h-20 bg-white/30 rounded-[30px] relative border-4 border-white/20">
      <div className="absolute top-2 left-6 w-8 h-8 rounded-full bg-black/20" />
      <div className="absolute bottom-2 right-6 w-8 h-8 rounded-full bg-black/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/20" />
    </div>
  )
}

function VideoIcon() {
  return (
    <div className="w-24 h-16 bg-white/30 rounded-lg relative border-4 border-white/20 flex items-center justify-center">
      <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-2" />
    </div>
  )
}

function MusicIcon() {
  return (
    <div className="w-24 h-24 flex items-center justify-center">
      <div className="w-8 h-16 border-l-8 border-t-8 border-white/50 rounded-tr-lg" />
      <div className="w-8 h-8 rounded-full bg-white/50 -mt-8 ml-[-4px]" />
    </div>
  )
}

function GridIcon() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="w-6 h-6 rounded-sm bg-white/40" />
      ))}
    </div>
  )
}
