
"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, ChevronRight, Sun, Disc, Users, Camera, ShoppingBag, Newspaper, Home } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function WiiThemeReplica() {
  const [time, setTime] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const formattedDate = time.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' })

  return (
    <div className="fixed inset-0 z-[100] bg-[#f0f3f5] overflow-hidden flex flex-col font-sans select-none">
      {/* Background soft blue curves/gradients would go here, using a CSS approximation */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

      {/* Top Header/Margin Spacer */}
      <div className="h-12 shrink-0" />

      {/* Channel Grid */}
      <div className="flex-1 px-12 md:px-24 flex items-center justify-center">
        <div className="grid grid-cols-4 grid-rows-3 gap-4 w-full max-w-6xl aspect-[16/9]">
          <WiiChannel label="Disc Channel" icon={<Disc className="h-16 w-16 text-slate-300" />} type="disc" />
          <WiiChannel label="Mii Channel" imageUrl="https://picsum.photos/seed/mii/300/200" type="mii" />
          <WiiChannel label="Photo Channel" imageUrl="https://picsum.photos/seed/photos/300/200" type="photo" />
          <WiiChannel label="Wii Shop Channel" icon={<ShoppingBag className="h-16 w-16 text-white" />} bgColor="bg-[#7fb5d1]" type="shop" />
          
          <WiiChannel label="Forecast Channel" icon={<Sun className="h-16 w-16 text-yellow-400 fill-yellow-400" />} bgColor="bg-gradient-to-b from-[#0091ff] to-[#0066cc]" type="forecast" />
          <WiiChannel label="News Channel" icon={<Newspaper className="h-16 w-16 text-white/50" />} bgColor="bg-gradient-to-b from-[#4caf50] to-[#2e7d32]" type="news" />
          <WiiChannel label="" empty />
          <WiiChannel label="" empty />
          
          <WiiChannel label="Super Mario 64" imageUrl="https://picsum.photos/seed/mario64/300/200" type="game" />
          <WiiChannel label="Super Mario Bros." imageUrl="https://picsum.photos/seed/mariobros/300/200" type="game" />
          <WiiChannel label="" empty />
          <WiiChannel label="The Homebrew Channel" bgColor="bg-gradient-to-b from-[#00bcd4] to-[#0097a7]" icon={<Home className="h-16 w-16 text-white" />} type="homebrew" />
        </div>

        {/* Right Navigation Arrow */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <div className="h-16 w-12 bg-white/50 border-2 border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/80 transition-all shadow-sm">
                <ChevronRight className="h-10 w-10 text-[#00d0ff]" />
            </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="h-40 shrink-0 relative flex flex-col items-center justify-end pb-8">
        {/* Wave border effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#00d0ff]/30 shadow-[0_4px_10px_rgba(0,208,255,0.2)]" />
        
        <div className="w-full px-12 md:px-24 flex items-center justify-between max-w-7xl">
          {/* Left: Wii Button */}
          <div className="group flex flex-col items-center gap-1">
            <button className="h-24 w-24 rounded-full bg-white border-2 border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.05)] flex items-center justify-center hover:scale-105 transition-transform active:scale-95">
                <span className="text-[#00d0ff] font-bold text-3xl tracking-tighter opacity-80">Wii</span>
            </button>
            <div className="h-4 w-12 bg-slate-200 rounded-full opacity-20 group-hover:opacity-40" />
          </div>

          {/* Center: Clock & Date */}
          <div className="flex flex-col items-center">
            <div className="text-6xl font-light tracking-widest text-slate-400 font-mono">
              {formattedTime.split(' ')[0]} <span className="text-xl uppercase">{formattedTime.split(' ')[1]}</span>
            </div>
            <div className="text-3xl font-medium text-slate-300 tracking-tight mt-1">
              {formattedDate.replace('/', '/')}
            </div>
          </div>

          {/* Right: Message Button */}
          <div className="group flex flex-col items-center gap-1">
            <button className="h-24 w-24 rounded-full bg-white border-2 border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.05)] flex items-center justify-center hover:scale-105 transition-transform active:scale-95">
                <Mail className="h-10 w-10 text-slate-300" />
            </button>
            <div className="h-4 w-12 bg-slate-200 rounded-full opacity-20 group-hover:opacity-40" />
          </div>
        </div>

        <Link href="/" className="absolute bottom-4 left-4 flex items-center gap-2 text-slate-300 hover:text-slate-500 transition-colors">
            <ArrowLeft className="h-4 w-4" /> 
            <span className="text-xs font-bold uppercase tracking-widest">exit testing</span>
        </Link>
      </div>

      <style jsx global>{`
        @font-face {
          font-family: 'WiiFont';
          src: local('Arial'); /* Placeholder for specific Wii font logic if needed */
        }
        body {
          background-color: #f0f3f5 !important;
        }
      `}</style>
    </div>
  )
}

function WiiChannel({ label, icon, imageUrl, bgColor, empty = false, type }: { label: string, icon?: React.ReactNode, imageUrl?: string, bgColor?: string, empty?: boolean, type?: string }) {
  if (empty) {
    return (
      <div className="bg-slate-200/20 border-2 border-white/50 rounded-[20px] shadow-[inset_0_0_15px_rgba(255,255,255,0.5)] flex flex-col items-center justify-center">
        <div className="text-[10px] font-bold text-slate-300 opacity-20 tracking-tighter">Wii</div>
      </div>
    )
  }

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-[20px] bg-white border-4 border-white shadow-[0_10px_20px_rgba(0,0,0,0.1)] cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center",
      bgColor
    )}>
      {/* Background Image / Placeholder */}
      {imageUrl && (
        <img src={imageUrl} alt={label} className="absolute inset-0 w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
      )}

      {/* Icon */}
      {!imageUrl && icon && (
        <div className="relative z-10">{icon}</div>
      )}

      {/* Disc Channel Specific hole */}
      {type === 'disc' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-32 w-32 rounded-full border-[10px] border-slate-100 opacity-20" />
        </div>
      )}

      {/* Channel Title Overlay */}
      {label && (
        <div className="absolute bottom-0 left-0 w-full p-3 text-center bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
          <span className="text-[14px] font-bold text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] leading-none whitespace-nowrap">
            {label}
          </span>
        </div>
      )}

      {/* Glassy reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
      
      {/* Blue selection halo on hover */}
      <div className="absolute inset-0 border-0 group-hover:border-[4px] border-[#00d0ff] transition-all duration-200 pointer-events-none" />
    </div>
  )
}
