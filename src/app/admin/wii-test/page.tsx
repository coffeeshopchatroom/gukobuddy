
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, Mail, Home, Disc, Grid3X3, Settings, User } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function WiiThemeReplica() {
  const [mounted, setMounted] = React.useState(false)
  const [time, setTime] = React.useState(new Date())

  React.useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!mounted) return null

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
  
  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric'
  }).replace(',', '').toLowerCase()

  // High-fidelity "Barrel Distortion" path
  // Curves all four sides outward while maintaining rounded corners
  const channelClipPath = "path('M 15,4 C 50,-2 138,-2 173,4 C 185,6 188,14 188,14 C 194,50 194,62 188,98 C 188,98 185,106 173,108 C 138,114 50,114 15,108 C 3,106 0,98 0,98 C -6,62 -6,50 0,14 C 0,14 3,6 15,4 Z')"

  const channels = [
    { type: 'disc', color: 'bg-slate-100', icon: <DiscIcon /> },
    { type: 'mii', color: 'bg-orange-50', image: 'https://picsum.photos/seed/mii/200/120' },
    { type: 'photo', color: 'bg-amber-50', image: 'https://picsum.photos/seed/photo/200/120' },
    { type: 'shop', color: 'bg-emerald-50', icon: <ShopIcon /> },
    { type: 'forecast', color: 'bg-sky-500', icon: <SunIcon /> },
    { type: 'news', color: 'bg-green-600', name: 'news' },
    { type: 'empty', color: 'bg-slate-200/30' },
    { type: 'empty', color: 'bg-slate-200/30' },
    { type: 'mario64', color: 'bg-black', image: 'https://picsum.photos/seed/sm64/200/120' },
    { type: 'mariobros', color: 'bg-sky-100', image: 'https://picsum.photos/seed/smb/200/120' },
    { type: 'empty', color: 'bg-slate-200/30' },
    { type: 'homebrew', color: 'bg-cyan-500', icon: <WaveIcon /> },
  ]

  return (
    <div className="fixed inset-0 bg-[#f2f2f2] flex flex-col items-center justify-center overflow-hidden font-sans select-none z-[9999]">
      {/* Pink Sidebar (Left Gutter) */}
      <div className="absolute left-0 top-0 bottom-0 w-14 bg-[#fce4e4] border-r border-red-100 z-50 flex flex-col items-center py-8 gap-10">
         <Home className="h-5 w-5 text-red-300" />
         <Grid3X3 className="h-5 w-5 text-red-300" />
         <User className="h-5 w-5 text-red-300" />
         <Settings className="h-5 w-5 text-red-300" />
         <div className="mt-auto h-8 w-8 rounded-full bg-red-200/50 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">N</span>
         </div>
      </div>

      {/* Top light bar / Glow */}
      <div className="absolute top-0 left-0 w-full h-[15%] bg-gradient-to-b from-white to-transparent opacity-60" />

      {/* Channel Grid */}
      <div className="grid grid-cols-4 gap-x-6 gap-y-5 z-10 scale-90 md:scale-100 -translate-y-24 ml-14">
        {channels.map((channel, i) => (
          <div
            key={i}
            className={cn(
              "relative w-[188px] h-[112px] transition-all duration-200 hover:scale-110 hover:z-20 cursor-pointer group shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
              channel.color
            )}
            style={{ clipPath: channelClipPath }}
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/10 z-10" />
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-0">
              {channel.image ? (
                <img src={channel.image} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="text-white drop-shadow-md">
                  {channel.icon}
                </div>
              )}
            </div>

            {/* Selection Border (Cyan Glow) */}
            <div className="absolute inset-0 border-[8px] border-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-[24px] pointer-events-none" style={{ clipPath: channelClipPath }} />
          </div>
        ))}
      </div>

      {/* Navigation Arrow */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 z-10">
        <button className="h-14 w-10 bg-cyan-400 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95" style={{ clipPath: "polygon(0% 0%, 100% 50%, 0% 100%)" }}>
          <ChevronRight className="text-white h-8 w-8 ml-[-6px]" />
        </button>
      </div>

      {/* Large Digital Clock (Positioned in the valley) */}
      <div className="absolute bottom-[160px] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center ml-7">
        <div className="text-[84px] font-light tracking-[0.3em] text-slate-400/70 font-mono leading-none flex items-baseline">
          {formattedTime.split(' ')[0]} 
          <span className="text-2xl ml-4 font-sans tracking-normal opacity-40 uppercase">{formattedTime.split(' ')[1]}</span>
        </div>
      </div>

      {/* Bottom Footer Wave */}
      <div className="absolute bottom-0 left-0 w-full h-[200px] z-10">
        <svg viewBox="0 0 1000 200" className="w-full h-full drop-shadow-[0_-5px_15px_rgba(0,240,255,0.15)]">
          {/* Neon cyan edge path */}
          <path 
            d="M0,200 V100 Q250,130 500,70 Q750,130 1000,100 V200 Z" 
            fill="white" 
            stroke="#00f0ff" 
            strokeWidth="1.5"
          />
        </svg>

        {/* Date Display (Inside the white wave) */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-3xl font-medium text-slate-500/40 tracking-[0.4em] ml-7">
          {formattedDate}
        </div>

        {/* Footer Buttons */}
        <div className="absolute bottom-10 left-24 flex items-end gap-10">
          {/* Wii Button */}
          <Link href="/">
            <div className="relative h-20 w-20 rounded-full bg-white border border-slate-200 shadow-xl flex items-center justify-center group cursor-pointer active:scale-95 transition-transform">
              <div className="absolute inset-0 border-2 border-cyan-400/20 rounded-full animate-pulse" />
              <span className="text-xl font-bold text-slate-300 group-hover:text-cyan-500 transition-colors uppercase tracking-tight">Wii</span>
            </div>
          </Link>

          {/* SD Card slot */}
          <div className="h-14 w-10 bg-white border border-slate-200 rounded-md shadow-lg flex flex-col items-center justify-center p-1 cursor-not-allowed opacity-60 mb-2">
             <div className="w-full h-1 bg-slate-200 mb-auto rounded-full" />
             <div className="text-[6px] font-bold text-slate-300 uppercase tracking-tighter">SD</div>
             <div className="w-5 h-7 border border-slate-100 rounded-sm mt-1" />
          </div>
        </div>

        <div className="absolute bottom-10 right-20">
          {/* Message Button */}
          <div className="h-20 w-20 rounded-full bg-white border border-slate-200 shadow-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors active:scale-95 group">
            <Mail className="h-10 w-10 text-slate-200 group-hover:text-cyan-400 transition-colors" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        body {
          background: #f2f2f2 !important;
        }
        [style*="clipPath"] {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </div>
  )
}

function DiscIcon() {
  return (
    <div className="w-20 h-20 rounded-full border-4 border-white/20 bg-slate-100/10 relative flex items-center justify-center">
      <div className="w-16 h-16 rounded-full border-2 border-white/40 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border border-white/20" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45" />
    </div>
  )
}

function ShopIcon() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-16 bg-sky-100 rounded-t-lg relative border border-sky-200">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-white/40 rounded-sm" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-sky-400">Wii</div>
      </div>
    </div>
  )
}

function SunIcon() {
  return (
    <div className="w-12 h-12 rounded-full bg-yellow-400 shadow-[0_0_20px_rgba(255,255,0,0.5)] relative">
      {[...Array(8)].map((_, i) => (
        <div 
          key={i} 
          className="absolute w-1 h-3 bg-yellow-300 left-1/2 -translate-x-1/2 origin-[50%_24px]" 
          style={{ transform: `translateX(-50%) rotate(${i * 45}deg)` }}
        />
      ))}
    </div>
  )
}

function WaveIcon() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 opacity-80">
      <div className="w-16 h-2 bg-white/40 rounded-full" />
      <div className="w-20 h-2 bg-white/60 rounded-full" />
      <div className="w-16 h-2 bg-white/40 rounded-full" />
    </div>
  )
}
