
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, Mail, Home } from "lucide-react"
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
  }).replace(',', '')

  // Custom SVG path for the "bulging" channel shape
  const channelClipPath = "path('M 12,2 C 50,-2 138,-2 176,2 C 188,4 188,14 188,14 C 192,50 192,62 188,98 C 188,98 188,108 176,110 C 138,114 50,114 12,110 C 0,108 0,98 0,98 C -4,62 -4,50 0,14 C 0,14 0,4 12,2 Z')"

  const channels = [
    { type: 'disc', color: 'bg-slate-100', icon: <DiscIcon /> },
    { type: 'mii', color: 'bg-orange-50', image: 'https://picsum.photos/seed/mii/200/120' },
    { type: 'photo', color: 'bg-amber-50', image: 'https://picsum.photos/seed/photo/200/120' },
    { type: 'shop', color: 'bg-emerald-50', icon: <ShopIcon /> },
    { type: 'forecast', color: 'bg-sky-500', name: 'forecast channel', icon: <SunIcon /> },
    { type: 'news', color: 'bg-green-600', name: 'news channel' },
    { type: 'empty', color: 'bg-slate-200/30' },
    { type: 'empty', color: 'bg-slate-200/30' },
    { type: 'mario64', color: 'bg-black', image: 'https://picsum.photos/seed/sm64/200/120', name: 'super mario 64' },
    { type: 'mariobros', color: 'bg-sky-100', image: 'https://picsum.photos/seed/smb/200/120', name: 'super mario bros.' },
    { type: 'empty', color: 'bg-slate-200/30' },
    { type: 'homebrew', color: 'bg-cyan-500', name: 'the homebrew channel', icon: <WaveIcon /> },
  ]

  return (
    <div className="fixed inset-0 bg-[#f2f2f2] flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      {/* Background soft gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/5 pointer-events-none" />
      
      {/* Top light bar */}
      <div className="absolute top-0 left-0 w-full h-[15%] bg-gradient-to-b from-white to-transparent opacity-60" />

      {/* Channel Grid */}
      <div className="grid grid-cols-4 gap-x-8 gap-y-6 z-10 scale-90 md:scale-100">
        {channels.map((channel, i) => (
          <div
            key={i}
            className={cn(
              "relative w-[188px] h-[112px] transition-all duration-200 hover:scale-110 hover:z-20 cursor-pointer group shadow-[0_4px_10px_rgba(0,0,0,0.1)]",
              channel.color
            )}
            style={{ clipPath: channelClipPath }}
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/10 z-10" />
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
              {channel.image ? (
                <img src={channel.image} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="text-white drop-shadow-md">
                  {channel.icon}
                </div>
              )}
              
              {channel.name && (
                <div className="absolute top-2 left-2 text-[10px] font-bold text-white drop-shadow-sm lowercase">
                  {channel.name}
                </div>
              )}
            </div>

            {/* Selection Border (Cyan Glow) */}
            <div className="absolute inset-0 border-4 border-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-[24px]" style={{ clipPath: channelClipPath }} />
          </div>
        ))}
      </div>

      {/* Navigation Arrow */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-10">
        <button className="h-12 w-8 bg-cyan-400 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95" style={{ clipPath: "polygon(0% 0%, 100% 50%, 0% 100%)" }}>
          <ChevronRight className="text-white h-6 w-6 ml-[-4px]" />
        </button>
      </div>

      {/* Clock Display (Repositioned precisely above wave) */}
      <div className="absolute bottom-[145px] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
        <div className="text-[64px] font-light tracking-[0.2em] text-slate-400 font-mono leading-none flex items-baseline">
          {formattedTime.split(' ')[0]} <span className="text-lg ml-3 font-sans tracking-normal opacity-60 uppercase">{formattedTime.split(' ')[1]}</span>
        </div>
      </div>

      {/* Bottom Footer Wave */}
      <div className="absolute bottom-0 left-0 w-full h-[180px] z-10">
        <svg viewBox="0 0 1000 180" className="w-full h-full drop-shadow-[0_-5px_15px_rgba(0,240,255,0.1)]">
          {/* Neon cyan edge path */}
          <path 
            d="M0,180 V80 Q250,110 500,50 Q750,110 1000,80 V180 Z" 
            fill="white" 
            stroke="#00f0ff" 
            strokeWidth="1.5"
          />
        </svg>

        {/* Date Display (Within the white area) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-2xl font-medium text-slate-500/80 tracking-widest lowercase">
          {formattedDate}
        </div>

        {/* Footer Buttons */}
        <div className="absolute bottom-6 left-8 flex items-end gap-6">
          {/* Wii Button */}
          <Link href="/">
            <div className="relative h-20 w-20 rounded-full bg-white border border-slate-200 shadow-xl flex items-center justify-center group cursor-pointer active:scale-95 transition-transform">
              <div className="absolute inset-0 border-2 border-cyan-400/30 rounded-full animate-pulse" />
              <span className="text-xl font-bold text-slate-400 group-hover:text-cyan-500 transition-colors">Wii</span>
            </div>
          </Link>

          {/* SD Card slot */}
          <div className="h-16 w-12 bg-white border border-slate-200 rounded-md shadow-lg flex flex-col items-center justify-center p-1 cursor-not-allowed opacity-80">
             <div className="w-full h-1 bg-slate-200 mb-auto rounded-full" />
             <div className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">SD</div>
             <div className="w-6 h-8 border border-slate-100 rounded-sm mt-1" />
          </div>
        </div>

        <div className="absolute bottom-6 right-8">
          {/* Message Button */}
          <div className="h-20 w-20 rounded-full bg-white border border-slate-200 shadow-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors active:scale-95 group">
            <Mail className="h-10 w-10 text-slate-300 group-hover:text-cyan-400 transition-colors" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @font-face {
          font-family: 'WiiFont';
          src: local('Arial');
        }
        body {
          background: #f2f2f2 !important;
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
      <div className="w-14 h-16 bg-sky-200 rounded-t-lg relative">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-white/40 rounded-sm" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-sky-700">Wii</div>
      </div>
      <span className="text-[10px] font-bold text-sky-600 mt-1">wii shop channel</span>
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
