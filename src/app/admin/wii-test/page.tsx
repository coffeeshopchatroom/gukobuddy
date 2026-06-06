"use client"

import * as React from "react"
import { ArrowLeft, Disc, ShoppingBag, Sun, Newspaper, Home, Mail } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

/**
 * @fileOverview A pixel-perfect replica of the Wii Home Menu.
 * Features the signature "bulging" channels, specific wave footer, and real-time clock.
 */
export default function WiiThemeReplica() {
  const [time, setTime] = React.useState<Date | null>(null)

  React.useEffect(() => {
    // Prevent hydration mismatch
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedTime = time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : ""
  const formattedDate = time ? time.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' }) : ""

  return (
    <div className="fixed inset-0 z-[100] bg-[#f0f4f6] overflow-hidden flex flex-col font-sans select-none items-center justify-center">
      {/* Background CRT Scanline overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_3px,3px_100%]" />

      {/* Main Channel Grid */}
      <div className="relative w-full max-w-7xl aspect-[16/9] px-16 md:px-32 flex flex-col items-center justify-start pt-12 pb-32">
        <div className="grid grid-cols-4 grid-rows-3 gap-x-12 gap-y-10 w-full h-full">
          <WiiChannel icon={<Disc className="h-14 w-14 text-slate-300" />} type="disc" />
          <WiiChannel imageUrl="https://picsum.photos/seed/mii/400/300" />
          <WiiChannel imageUrl="https://picsum.photos/seed/photos/400/300" />
          <WiiChannel icon={<ShoppingBag className="h-14 w-14 text-white" />} bgColor="bg-[#7fb5d1]" />
          
          <WiiChannel icon={<Sun className="h-14 w-14 text-yellow-400 fill-yellow-400" />} bgColor="bg-gradient-to-b from-[#00b0ff] to-[#0070cc]" />
          <WiiChannel icon={<Newspaper className="h-14 w-14 text-white/70" />} bgColor="bg-gradient-to-b from-[#4caf50] to-[#2e7d32]" />
          <WiiChannel empty />
          <WiiChannel empty />
          
          <WiiChannel imageUrl="https://picsum.photos/seed/mario64/400/300" />
          <WiiChannel imageUrl="https://picsum.photos/seed/mariobros/400/300" />
          <WiiChannel empty />
          <WiiChannel bgColor="bg-gradient-to-b from-[#00d0e0] to-[#0090a0]" icon={<Home className="h-14 w-14 text-white" />} />
        </div>

        {/* Right Navigation Arrow */}
        <div className="absolute right-6 top-[40%] group cursor-pointer pointer-events-auto">
            <div className="h-24 w-12 bg-white/60 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-white transition-all shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[18px] border-l-[#00c0ff] border-b-[12px] border-b-transparent ml-1" />
            </div>
        </div>
      </div>

      {/* Repositioned System Clock (Above footer wave) */}
      <div className="absolute bottom-[230px] left-1/2 -translate-x-1/2 flex flex-col items-center min-h-[80px]">
        {time && (
          <div className="text-[96px] font-light tracking-[0.15em] text-slate-400/60 font-mono leading-none flex items-baseline animate-in fade-in duration-700">
            {formattedTime.split(' ')[0]} <span className="text-xl ml-4 font-sans tracking-normal opacity-50 font-bold uppercase">{formattedTime.split(' ')[1]}</span>
          </div>
        )}
      </div>

      {/* Bottom Dashboard Interface */}
      <div className="absolute bottom-0 left-0 w-full h-[260px] pointer-events-none">
        {/* The Signature Wave SVG */}
        <div className="absolute inset-0 flex items-end">
            <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className="w-full h-full fill-white drop-shadow-[0_-10px_25px_rgba(0,200,255,0.1)]">
                <path d="M0,180 C360,80 1080,80 1440,180 V260 H0 Z" />
                <path d="M0,180 C360,80 1080,80 1440,180" fill="none" stroke="#00c0ff" strokeWidth="4" strokeOpacity="0.25" />
            </svg>
        </div>

        {/* System Date (Low on the wave) */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-4xl font-medium text-slate-300/80 tracking-tight lowercase">
            {time && <span className="animate-in fade-in duration-700">{formattedDate}</span>}
        </div>

        {/* Interactive Bottom Buttons */}
        <div className="absolute bottom-10 left-0 w-full px-16 md:px-32 flex items-center justify-between max-w-8xl mx-auto pointer-events-auto">
          <div className="flex items-center gap-10">
             {/* Main Wii Menu Button */}
             <button className="h-32 w-32 rounded-full bg-white border-[6px] border-[#f8f8f8] shadow-[inset_0_4px_10px_rgba(0,0,0,0.02),0_15px_35px_rgba(0,0,0,0.08)] flex items-center justify-center hover:scale-105 transition-transform active:scale-95 group">
                <span className="text-[#00c0ff] font-bold text-5xl tracking-tighter opacity-80 group-hover:opacity-100">Wii</span>
             </button>
             
             {/* SD Card Slot */}
             <div className="h-20 w-16 bg-white border-2 border-[#f0f0f0] rounded-xl flex items-center justify-center shadow-lg cursor-pointer hover:bg-slate-50 transition-colors relative group">
                <div className="w-10 h-13 border-2 border-slate-200 rounded-sm relative overflow-hidden flex flex-col items-center justify-center bg-slate-50/50">
                    <div className="absolute top-[-4px] right-[-4px] w-6 h-6 bg-[#f0f0f0] rotate-45" />
                    <span className="text-[10px] font-black text-slate-300 mt-2 tracking-tighter">SD</span>
                </div>
                <div className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-[#00c0ff] shadow-[0_0_8px_#00c0ff] opacity-40 group-hover:opacity-100" />
             </div>
          </div>

          {/* Mail / Message Button */}
          <button className="h-32 w-32 rounded-full bg-white border-[6px] border-[#f8f8f8] shadow-[inset_0_4px_10px_rgba(0,0,0,0.02),0_15px_35px_rgba(0,0,0,0.08)] flex items-center justify-center hover:scale-105 transition-transform active:scale-95 group">
              <Mail className="h-14 w-14 text-slate-200 group-hover:text-slate-300" />
          </button>
        </div>
      </div>

      {/* Exit testing helper */}
      <Link href="/" className="absolute bottom-8 left-8 flex items-center gap-2 text-slate-300 hover:text-slate-500 transition-colors z-[200]">
          <ArrowLeft className="h-4 w-4" /> 
          <span className="text-xs font-bold uppercase tracking-widest">exit test</span>
      </Link>

      <style jsx global>{`
        body {
          background-color: #f0f4f6 !important;
        }
      `}</style>
    </div>
  )
}

/**
 * Individual Wii Menu Channel component.
 * Uses a normalized SVG path to create the exact bulging CRT edge geometry.
 */
function WiiChannel({ icon, imageUrl, bgColor, empty = false, type }: { icon?: React.ReactNode, imageUrl?: string, bgColor?: string, empty?: boolean, type?: string }) {
  // Cubic Bezier path for a rectangle where sides curve OUTWARDS (Barrel Distortion)
  // M (start) -> C (cubic curve top) -> C (right) -> C (bottom) -> C (left)
  const barrelPath = "M45,15 C150,-10 250,-10 355,15 C410,100 410,200 355,285 C250,310 150,310 45,285 C-10,200 -10,100 45,15 Z";

  return (
    <div className="relative group w-full aspect-[4/3] transition-all duration-500">
      {/* Visual Shadow Layer (True Drop Shadow on Path) */}
      <svg className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-[1.03] group-active:scale-[0.98]" viewBox="0 0 400 300" style={{ filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.1))' }}>
        <path 
          d={barrelPath} 
          fill={empty ? "#e2e6e9" : "white"} 
          fillOpacity={empty ? "0.3" : "1"}
          className={cn(!imageUrl && bgColor ? "fill-transparent" : "")}
        />
        
        {/* Handles background colors/gradients inside the SVG path */}
        {!imageUrl && bgColor && (
          <foreignObject x="0" y="0" width="400" height="300" clipPath={`path('${barrelPath}')`}>
            <div className={cn("w-full h-full", bgColor)} />
          </foreignObject>
        )}
      </svg>

      {/* Channel Content (Clipped to the barrel shape) */}
      <div 
        className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.03] group-active:scale-[0.98] overflow-hidden"
        style={{ clipPath: `path('${barrelPath}')` }}
      >
        {imageUrl && (
          <img src={imageUrl} alt="" className="w-full h-full object-cover group-hover:opacity-95 transition-opacity" />
        )}
        {!imageUrl && icon && (
          <div className="relative z-10 transform scale-[1.4] opacity-80 group-hover:opacity-100 transition-opacity">{icon}</div>
        )}

        {/* Disc Channel Inner Decoration */}
        {type === 'disc' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
              <div className="h-48 w-48 rounded-full border-[15px] border-slate-900" />
              <div className="h-12 w-12 rounded-full bg-slate-900 absolute" />
          </div>
        )}

        {/* CRT Gloss / Shine Effect overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.4)_0%,transparent_50%,rgba(0,0,0,0.05)_100%)] pointer-events-none" />
        
        {/* Active Selection Outline (Blue glow on hover) */}
        <div className="absolute inset-0 border-0 group-hover:border-[10px] border-[#00c0ff] transition-all duration-150 pointer-events-none" />
      </div>

      {/* Subtle empty channel text */}
      {empty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="text-[10px] font-bold text-slate-400 opacity-10 tracking-[0.3em] uppercase">Wii</div>
        </div>
      )}
    </div>
  )
}
