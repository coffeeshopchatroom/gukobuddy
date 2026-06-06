"use client"

import * as React from "react"
import { ArrowLeft, Disc, ShoppingBag, Sun, Newspaper, Home, Mail } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

/**
 * @fileOverview A high-fidelity replica of the Wii Home Menu.
 * Features bulging CRT-style channels, a responsive bottom bar, and real-time clock.
 */
export default function WiiThemeReplica() {
  const [time, setTime] = React.useState<Date | null>(null)

  React.useEffect(() => {
    // Prevent hydration mismatch by setting time only on client mount
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedTime = time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : ""
  const formattedDate = time ? time.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' }) : ""

  return (
    <div className="fixed inset-0 z-[100] bg-[#eef2f4] overflow-hidden flex flex-col font-sans select-none items-center justify-center">
      {/* Background subtle CRT texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

      {/* Channel Grid Container */}
      <div className="relative w-full max-w-6xl aspect-[16/9] px-12 md:px-24 flex items-center justify-center mt-[-60px]">
        <div className="grid grid-cols-4 grid-rows-3 gap-x-8 gap-y-6 w-full h-full p-8">
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

        {/* Right Navigation Arrow Button */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 group cursor-pointer">
            <div className="h-20 w-10 bg-white/40 border border-slate-300 rounded-lg flex items-center justify-center hover:bg-white/80 transition-all shadow-sm">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[15px] border-l-[#00d0ff] border-b-[10px] border-b-transparent ml-1" />
            </div>
        </div>
      </div>

      {/* Floating Time Display (Repositioned above the footer wave) */}
      <div className="absolute bottom-[220px] left-1/2 -translate-x-1/2 flex flex-col items-center min-h-[72px]">
        {time && (
          <div className="text-[84px] font-light tracking-[0.2em] text-slate-400/70 font-mono leading-none flex items-baseline animate-in fade-in duration-500">
            {formattedTime.split(' ')[0]} <span className="text-xl ml-4 font-sans tracking-normal opacity-50 font-bold">{formattedTime.split(' ')[1]}</span>
          </div>
        )}
      </div>

      {/* Bottom Dashboard Interface */}
      <div className="absolute bottom-0 left-0 w-full h-[240px] pointer-events-none">
        {/* The Signature Wave SVG */}
        <div className="absolute inset-0 flex items-end">
            <svg viewBox="0 0 1440 240" preserveAspectRatio="none" className="w-full h-full fill-white drop-shadow-[0_-8px_20px_rgba(0,208,255,0.15)]">
                <path d="M0,160 C360,60 1080,60 1440,160 V240 H0 Z" />
                <path d="M0,160 C360,60 1080,60 1440,160" fill="none" stroke="#00d0ff" strokeWidth="4" strokeOpacity="0.3" />
            </svg>
        </div>

        {/* Floating System Date */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-4xl font-medium text-slate-400 tracking-tight min-h-[36px]">
            {time && <span className="animate-in fade-in duration-500 lowercase">{formattedDate}</span>}
        </div>

        {/* Interactive Bottom Buttons */}
        <div className="absolute bottom-12 left-0 w-full px-12 md:px-24 flex items-center justify-between max-w-7xl mx-auto pointer-events-auto">
          <div className="flex items-center gap-12">
             {/* Circular Wii Menu Button */}
             <button className="h-28 w-28 rounded-full bg-white border-4 border-slate-50 shadow-[inset_0_4px_8px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.08)] flex items-center justify-center hover:scale-105 transition-transform active:scale-95 group">
                <span className="text-[#00d0ff] font-bold text-4xl tracking-tighter opacity-80 group-hover:opacity-100">Wii</span>
             </button>
             
             {/* SD Card Slot Icon */}
             <div className="h-16 w-14 bg-white border-2 border-slate-100 rounded-lg flex items-center justify-center shadow-md cursor-pointer hover:bg-slate-50 transition-colors relative group">
                <div className="w-8 h-11 border-2 border-slate-200 rounded-sm relative overflow-hidden flex flex-col items-center justify-center">
                    <div className="absolute top-[-2px] right-[-2px] w-4 h-4 bg-slate-100 rotate-45" />
                    <span className="text-[8px] font-black text-slate-300 mt-2 tracking-tighter">SD</span>
                </div>
                <div className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#00d0ff] shadow-[0_0_5px_#00d0ff] opacity-40 group-hover:opacity-100" />
             </div>
          </div>

          {/* Mail / Message Button */}
          <button className="h-28 w-28 rounded-full bg-white border-4 border-slate-50 shadow-[inset_0_4px_8px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.08)] flex items-center justify-center hover:scale-105 transition-transform active:scale-95 group">
              <Mail className="h-12 w-12 text-slate-200 group-hover:text-slate-300" />
          </button>
        </div>
      </div>

      {/* Exit Button */}
      <Link href="/" className="absolute bottom-6 left-6 flex items-center gap-2 text-slate-300 hover:text-slate-500 transition-colors z-[200]">
          <ArrowLeft className="h-4 w-4" /> 
          <span className="text-xs font-bold uppercase tracking-widest">exit testing</span>
      </Link>

      <style jsx global>{`
        body {
          background-color: #eef2f4 !important;
        }
      `}</style>
    </div>
  )
}

/**
 * Individual channel component with specific "bulging" outward-curving geometry.
 */
function WiiChannel({ icon, imageUrl, bgColor, empty = false, type }: { icon?: React.ReactNode, imageUrl?: string, bgColor?: string, empty?: boolean, type?: string }) {
  // SVG path for a rectangle where all four sides curve outwards (Barrel Distortion)
  const bulgePath = "M40,10 C150,-15 250,-15 360,10 C410,100 410,200 360,290 C250,315 150,315 40,290 C-10,200 -10,100 40,10 Z";

  return (
    <div className="relative group w-full aspect-[4/3] transition-all duration-300">
      {/* Visual Shadow and Shape Layer */}
      <svg className="absolute inset-0 w-full h-full drop-shadow-[0_12px_20px_rgba(0,0,0,0.12)] transition-transform duration-300 group-hover:scale-[1.05]" viewBox="0 0 400 300">
        <path 
          d={bulgePath} 
          fill={empty ? "#dce1e4" : "white"} 
          fillOpacity={empty ? "0.4" : "1"}
          className={cn(!imageUrl && bgColor ? "fill-transparent" : "")}
        />
        
        {/* Support for custom background colors/gradients within the SVG path */}
        {!imageUrl && bgColor && (
          <foreignObject x="0" y="0" width="400" height="300" clipPath={`path('${bulgePath}')`}>
            <div className={cn("w-full h-full", bgColor)} />
          </foreignObject>
        )}
      </svg>

      {/* Content Overlay (Clipped precisely to the bulge shape) */}
      <div 
        className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.05] overflow-hidden"
        style={{ clipPath: `path('${bulgePath}')` }}
      >
        {imageUrl && (
          <img src={imageUrl} alt="" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
        )}
        {!imageUrl && icon && (
          <div className="relative z-10 transform scale-125">{icon}</div>
        )}

        {/* Disc Channel Decorative Elements */}
        {type === 'disc' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="h-40 w-40 rounded-full border-[10px] border-slate-100" />
              <div className="h-10 w-10 rounded-full bg-slate-100 absolute" />
          </div>
        )}

        {/* CRT Shine / Glassy Gradient Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.4)_0%,transparent_55%,rgba(0,0,0,0.08)_100%)] pointer-events-none" />
        
        {/* Selection Halo Glow (Active on hover) */}
        <div className="absolute inset-0 border-0 group-hover:border-[12px] border-[#00d0ff] transition-all duration-200 pointer-events-none" />
      </div>

      {/* Empty State Text */}
      {empty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="text-[10px] font-bold text-slate-400 opacity-20 tracking-[0.2em] uppercase">Wii</div>
        </div>
      )}
    </div>
  )
}
