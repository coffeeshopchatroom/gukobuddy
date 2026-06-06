"use client"

import * as React from "react"
import { ArrowLeft, ChevronRight, Disc, ShoppingBag, Sun, Newspaper, Home, Mail } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function WiiThemeReplica() {
  const [time, setTime] = React.useState<Date | null>(null)

  React.useEffect(() => {
    // Set initial time and start interval only after hydration
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Only generate strings if time is set (client-side)
  const formattedTime = time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : ""
  const formattedDate = time ? time.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' }) : ""

  return (
    <div className="fixed inset-0 z-[100] bg-[#eef2f4] overflow-hidden flex flex-col font-sans select-none items-center justify-center">
      {/* Background scanline-like subtle texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

      {/* Channel Grid */}
      <div className="relative w-full max-w-6xl aspect-[16/9] px-12 md:px-24 flex items-center justify-center mt-[-40px]">
        <div className="grid grid-cols-4 grid-rows-3 gap-x-2 gap-y-1 w-full h-full p-8">
          <WiiChannel icon={<Disc className="h-14 w-14 text-slate-300" />} type="disc" />
          <WiiChannel imageUrl="https://picsum.photos/seed/mii/300/200" />
          <WiiChannel imageUrl="https://picsum.photos/seed/photos/300/200" />
          <WiiChannel icon={<ShoppingBag className="h-14 w-14 text-white" />} bgColor="bg-[#7fb5d1]" />
          
          <WiiChannel icon={<Sun className="h-14 w-14 text-yellow-400 fill-yellow-400" />} bgColor="bg-gradient-to-b from-[#0091ff] to-[#0066cc]" />
          <WiiChannel icon={<Newspaper className="h-14 w-14 text-white/50" />} bgColor="bg-gradient-to-b from-[#4caf50] to-[#2e7d32]" />
          <WiiChannel empty />
          <WiiChannel empty />
          
          <WiiChannel imageUrl="https://picsum.photos/seed/mario64/300/200" />
          <WiiChannel imageUrl="https://picsum.photos/seed/mariobros/300/200" />
          <WiiChannel empty />
          <WiiChannel bgColor="bg-gradient-to-b from-[#00bcd4] to-[#0097a7]" icon={<Home className="h-14 w-14 text-white" />} />
        </div>

        {/* Right Navigation Arrow */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 group cursor-pointer">
            <div className="h-20 w-10 bg-white/40 border border-slate-300 rounded-lg flex items-center justify-center hover:bg-white/80 transition-all shadow-sm">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[15px] border-l-[#00d0ff] border-b-[10px] border-b-transparent ml-1" />
            </div>
        </div>
      </div>

      {/* Floating Time (Repositioned above the footer curve) */}
      <div className="absolute bottom-[160px] left-1/2 -translate-x-1/2 flex flex-col items-center min-h-[72px]">
        {time && (
          <div className="text-[72px] font-light tracking-[0.2em] text-slate-400/80 font-mono leading-none flex items-baseline animate-in fade-in duration-500">
            {formattedTime.split(' ')[0]} <span className="text-xl ml-4 font-sans tracking-normal opacity-60">{formattedTime.split(' ')[1]}</span>
          </div>
        )}
      </div>

      {/* Bottom Interface Container */}
      <div className="absolute bottom-0 left-0 w-full h-[180px] pointer-events-none">
        {/* The Wave Shape Overlay */}
        <div className="absolute inset-0 flex items-end">
            <svg viewBox="0 0 1440 180" className="w-full h-full fill-white drop-shadow-[0_-5px_15px_rgba(0,208,255,0.25)]">
                <path d="M0,100 C240,40 480,40 720,100 C960,160 1200,160 1440,100 V180 H0 Z" />
                <path d="M0,100 C240,40 480,40 720,100 C960,160 1200,160 1440,100" fill="none" stroke="#00d0ff" strokeWidth="2" strokeOpacity="0.4" />
            </svg>
        </div>

        {/* Floating Date (Inside/Below the wave) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-3xl font-medium text-slate-400 tracking-tight min-h-[36px]">
            {time && <span className="animate-in fade-in duration-500">{formattedDate}</span>}
        </div>

        {/* Interactive Buttons (Positioned over the wave) */}
        <div className="absolute bottom-10 left-0 w-full px-12 md:px-24 flex items-center justify-between max-w-7xl mx-auto pointer-events-auto">
          <div className="flex items-center gap-6">
             {/* Wii Button */}
             <div className="flex flex-col items-center gap-2">
                <button className="h-20 w-20 rounded-full bg-white border-2 border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.05)] flex items-center justify-center hover:scale-105 transition-transform active:scale-95 group">
                    <span className="text-[#00d0ff] font-bold text-2xl tracking-tighter opacity-70 group-hover:opacity-100">Wii</span>
                </button>
             </div>
             
             {/* SD Card Icon */}
             <div className="h-12 w-10 bg-white/80 border border-slate-300 rounded-md flex items-center justify-center shadow-sm cursor-pointer hover:bg-white transition-colors">
                <div className="w-5 h-7 border border-slate-400 rounded-sm relative overflow-hidden flex flex-col items-center justify-center">
                    <div className="absolute top-[-2px] right-[-2px] w-2 h-2 bg-slate-300 rotate-45" />
                    <span className="text-[6px] font-bold text-slate-500 mt-1">SD</span>
                </div>
             </div>
          </div>

          {/* Mail Button */}
          <button className="h-20 w-20 rounded-full bg-white border-2 border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.05)] flex items-center justify-center hover:scale-105 transition-transform active:scale-95 group">
              <Mail className="h-8 w-8 text-slate-300 group-hover:text-slate-400" />
          </button>
        </div>
      </div>

      <Link href="/" className="absolute bottom-4 left-4 flex items-center gap-2 text-slate-300 hover:text-slate-500 transition-colors z-[200]">
          <ArrowLeft className="h-4 w-4" /> 
          <span className="text-xs font-bold uppercase tracking-widest">exit testing</span>
      </Link>

      <style jsx global>{`
        body {
          background-color: #eef2f4 !important;
        }
        .wii-bulge {
          clip-path: ellipse(98% 100% at 50% 50%);
        }
      `}</style>
    </div>
  )
}

function WiiChannel({ icon, imageUrl, bgColor, empty = false, type }: { icon?: React.ReactNode, imageUrl?: string, bgColor?: string, empty?: boolean, type?: string }) {
  if (empty) {
    return (
      <div className="wii-bulge bg-[#dce1e4]/40 border-2 border-white/50 rounded-[12px] shadow-[inset_0_0_15px_rgba(255,255,255,0.5)] flex items-center justify-center h-full aspect-[4/3] mx-auto">
        <div className="text-[10px] font-bold text-slate-300 opacity-20 tracking-tighter">Wii</div>
      </div>
    )
  }

  return (
    <div className={cn(
      "wii-bulge group relative overflow-hidden rounded-[12px] bg-white border-4 border-white shadow-[0_8px_15px_rgba(0,0,0,0.08)] cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_12px_25px_rgba(0,0,0,0.12)] flex flex-col items-center justify-center h-full aspect-[4/3] mx-auto",
      bgColor
    )}>
      {/* Background Image */}
      {imageUrl && (
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
      )}

      {/* Icon */}
      {!imageUrl && icon && (
        <div className="relative z-10">{icon}</div>
      )}

      {/* Disc Channel Inner Decoration */}
      {type === 'disc' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-24 w-24 rounded-full border-[6px] border-slate-100 opacity-20" />
            <div className="h-6 w-6 rounded-full bg-slate-100 absolute opacity-10" />
        </div>
      )}

      {/* Glassy Overlay / CRT Shine */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/5 pointer-events-none" />
      
      {/* Blue Selection Halo */}
      <div className="absolute inset-0 border-0 group-hover:border-[4px] border-[#00d0ff] transition-all duration-200 pointer-events-none" />
    </div>
  )
}
