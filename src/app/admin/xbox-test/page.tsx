
"use client"

import * as React from "react"
import { Disc, Gamepad2, Film, Music, Grid3X3, User } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Xbox360ThemeReplica() {
  const [activeBladeIndex, setActiveBladeIndex] = React.useState(1) // Default to Player1
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const blades = [
    { title: "Open Tray", subtitle: "tray empty", icon: <DiscIcon /> },
    { title: "Player1", subtitle: "0 G", icon: <AvatarPlaceholder />, special: "avatar" },
    { title: "Games", subtitle: "latest titles", icon: <GamepadIcon /> },
    { title: "Videos", subtitle: "video library", icon: <VideoIcon /> },
    { title: "Music", subtitle: "music library", icon: <MusicIcon /> },
    { title: "Apps", subtitle: "social apps", icon: <GridIcon /> },
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
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden font-sans select-none z-[9999]">
      {/* 
        Scaling Container 
        Figma dimensions: 2393 x 1406
      */}
      <div 
        className="relative shrink-0 overflow-hidden shadow-2xl"
        style={{
          width: '2393px',
          height: '1406px',
          background: 'radial-gradient(ellipse 173.24% 228.65% at 17.13% -29.45%, #243D15 0%, #385817 13%, #5F8F20 26%, #8AAB68 45%, #CDE5BA 67%)',
          transform: `scale(${typeof window !== 'undefined' ? Math.min(window.innerWidth / 2393, window.innerHeight / 1406) : 1})`,
        }}
      >
        {/* Top Dark Shadow Gradient (Bokeh) */}
        <div 
          className="pointer-events-none"
          style={{
            width: '1769px',
            height: '1016px',
            left: '784px',
            top: '-108px',
            position: 'absolute',
            background: 'radial-gradient(ellipse 106.52% 186.07% at 68.66% -0.00%, rgba(0, 0, 0, 0.64) 0%, rgba(0, 0, 0, 0.03) 46%, rgba(0, 0, 0, 0) 63%)'
          }} 
        />

        {/* Gray Floor Stage (Massive Circle) */}
        <div 
          className="absolute"
          style={{
            width: '5962px',
            height: '1604px',
            left: '-1785px',
            top: '703px',
            background: 'linear-gradient(180deg, #686868 0%, #939393 100%)',
            boxShadow: '0px -103px 118.8px 12px rgba(255, 255, 255, 0.44)',
            borderRadius: '9999px',
            outline: '4px white solid'
          }} 
        />

        {/* Floor Reflections */}
        <div 
          className="absolute"
          style={{
            width: '2393px',
            height: '584px',
            left: '0px',
            top: '822px',
            background: 'linear-gradient(180deg, rgba(217, 217, 217, 0) 0%, rgba(190.55, 190, 190, 0.08) 14%, rgba(15.53, 11.30, 11.30, 0.59) 100%)'
          }} 
        />
        
        {/* Soft floor highlights */}
        <div className="absolute left-[-35px] top-[878px] w-[1562px] h-[370px] rounded-full opacity-50" style={{ background: 'radial-gradient(ellipse 51.44% 50.00% at 50.00% 50.00%, #D9D9D9 0%, rgba(115, 115, 115, 0) 100%)' }} />
        <div className="absolute left-[720px] top-[794px] w-[1281px] h-[353px] rounded-full opacity-50" style={{ background: 'radial-gradient(ellipse 51.44% 50.00% at 50.00% 50.00%, #D9D9D9 0%, rgba(115, 115, 115, 0) 100%)' }} />

        {/* Profile Section (Top Right) */}
        <div className="absolute top-[124px] right-[200px] flex items-start gap-12 z-50">
          <div className="text-right mt-2">
            <div className="text-[60px] font-medium text-white lowercase leading-none" style={{ fontFamily: 'Roboto, sans-serif', textShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)' }}>whatNot</div>
            <div className="flex items-center justify-end gap-3 mt-4">
              <span className="text-[50px] font-normal text-[#DDDDDD]" style={{ fontFamily: 'Roboto, sans-serif', textShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)' }}>700</span>
              <div className="w-[48px] h-[47px] bg-[#D9D9D9] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-[40px] text-[#6E8F55] font-bold leading-none mb-1">G</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="w-[139px] h-[139px] bg-[#222] rounded-[9px] border-[5px] border-[#ACBB68] shadow-2xl overflow-hidden">
               <img src="https://picsum.photos/seed/xboxexact/200/200" className="w-full h-full object-cover" alt="avatar" />
            </div>
            {/* Status dot */}
            <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 w-[42px] h-[43px] rounded-full border-2 border-[#8DD590] shadow-md bg-gradient-to-b from-[#6CBF4B] to-[#8EC158]">
              <div className="absolute inset-1 rounded-full bg-gradient-to-b from-white/30 to-transparent" />
            </div>
          </div>
        </div>

        {/* Vertical Menu (Left) */}
        <div className="absolute top-[134px] left-[134px] z-50 flex flex-col gap-6 items-start">
           {menuItems.map((item, i) => {
             const distance = Math.abs(i - selectedMenuIndex);
             const scale = Math.max(0.7, 1 - distance * 0.1);
             const opacity = Math.max(0.3, 1 - distance * 0.2);
             const isActive = i === selectedMenuIndex;
             
             return (
               <div 
                key={i} 
                className={cn(
                  "transition-all duration-500 lowercase font-medium",
                  isActive ? "text-white text-[64px]" : "text-white/30 text-[35px]"
                )}
                style={{ 
                  fontFamily: 'Cabin, sans-serif',
                  transformOrigin: 'left center',
                  transform: `scale(${scale})`,
                  opacity: opacity,
                  marginTop: isActive ? '20px' : '0'
                }}
               >
                 {item}
               </div>
             )
           })}
        </div>

        {/* Main Blades Container */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-full flex items-center justify-start left-[20%]">
            {blades.map((blade, i) => {
              const relativeIndex = i - activeBladeIndex
              const isVisible = relativeIndex >= -1
              const isActive = relativeIndex === 0

              return (
                <div
                  key={i}
                  onClick={() => setActiveBladeIndex(i)}
                  className={cn(
                    "absolute transition-all duration-700 ease-out cursor-pointer pointer-events-auto",
                    isActive ? "z-[60]" : relativeIndex < 0 ? `z-[${40 + i}]` : `z-[${50 - i}]`
                  )}
                  style={{
                    transform: `
                      translateX(${relativeIndex * 550}px) 
                      rotateY(${isActive ? 0 : -35}deg)
                      translateZ(${isActive ? 200 : -200 - Math.abs(relativeIndex) * 200}px)
                    `,
                    opacity: isVisible ? 1 : 0,
                  }}
                >
                  <div className="relative">
                    {/* Active Blade Card Style From Figma */}
                    <div 
                      className={cn(
                        "relative rounded-[11px] transition-all duration-500 overflow-hidden",
                        isActive ? "w-[538px] h-[659px]" : "w-[403px] h-[550px] opacity-70 grayscale-[0.3]"
                      )}
                    >
                      {/* Main Color Gradient */}
                      <div 
                        className="absolute inset-0 top-0 bottom-[35%] rounded-t-[11px]"
                        style={{ 
                          background: 'radial-gradient(ellipse 95.17% 95.37% at 46.12% 4.91%, #F7FF99 0%, #E6FE64 18%, #DEFC43 33%, #C8EF35 45%, #9FDD21 70%, #8DD119 100%)',
                          boxShadow: '36px 4px 22.4px -24px rgba(0, 0, 0, 0.42)'
                        }}
                      />
                      
                      {/* Bottom Info Area Overlay */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-[60%] flex flex-col justify-end p-12"
                        style={{ background: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.62) 67%, rgba(0, 0, 0, 0.82) 100%)' }}
                      >
                         <div className="text-white text-[50px] font-medium lowercase mb-2" style={{ fontFamily: 'Cabin, sans-serif' }}>
                           {blade.title}
                         </div>
                         <div className="text-white/60 text-[25px] font-normal lowercase tracking-[1.25px]" style={{ fontFamily: 'Cabin, sans-serif' }}>
                           {blade.subtitle}
                         </div>
                      </div>

                      {/* Icon/Avatar Area */}
                      <div className="relative h-full flex items-center justify-center pb-[20%]">
                        <div className={isActive ? "scale-[2.5]" : "scale-[1.5]"}>
                          {blade.icon}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer Nav Controls */}
        <div className="absolute bottom-[100px] left-[134px] z-50 flex items-center gap-8">
           <div className="flex items-center gap-4">
             <div className="w-[50px] h-[50px] bg-green-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg">A</div>
             <span className="text-white text-3xl lowercase font-medium" style={{ fontFamily: 'Cabin, sans-serif' }}>select</span>
           </div>
           <div className="flex items-center gap-4">
             <div className="w-[50px] h-[50px] bg-red-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg">B</div>
             <span className="text-white text-3xl lowercase font-medium" style={{ fontFamily: 'Cabin, sans-serif' }}>back</span>
           </div>
        </div>
      </div>

      <style jsx global>{`
        body {
          background: #243D15 !important;
        }
      `}</style>
    </div>
  )
}

function DiscIcon() {
  return (
    <div className="w-[100px] h-[100px] rounded-full border-4 border-white/20 bg-white/10 relative flex items-center justify-center">
      <div className="w-[60px] h-[60px] rounded-full border-2 border-white/40 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-white/80" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rotate-45" />
    </div>
  )
}

function AvatarPlaceholder() {
  return (
    <div className="relative w-[120px] h-[160px] flex items-center justify-center">
       <div className="absolute top-0 w-24 h-24 rounded-full bg-zinc-900 border-4 border-white/20 shadow-xl overflow-hidden">
          <img src="https://picsum.photos/seed/avatar1/100/100" className="w-full h-full object-cover" alt="" />
       </div>
       <div className="absolute bottom-0 w-full h-24 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-t-[30px] border-t border-white/10" />
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
