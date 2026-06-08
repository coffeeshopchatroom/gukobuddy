"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { 
  Play, 
  RotateCcw, 
  ArrowLeft, 
  Settings2, 
  Activity, 
  Layers, 
  Maximize2,
  Copy,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type BezierPoint = { x: number; y: number }

const PRESETS = [
  { name: 'Linear', value: [0, 0, 1, 1], description: 'constant speed' },
  { name: 'Ease In', value: [0.42, 0, 1, 1], description: 'starts slow' },
  { name: 'Ease Out', value: [0, 0, 0.58, 1], description: 'ends slow' },
  { name: 'Ease In Out', value: [0.42, 0, 0.58, 1], description: 'slow start & end' },
  { name: 'Xbox Elastic', value: [0.34, 1.56, 0.64, 1], description: 'snappy & physical' },
  { name: 'Smooth Flow', value: [0.4, 0, 0.2, 1], description: 'gentle & organic' },
]

export default function AnimationTestingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [mounted, setMounted] = React.useState(false)
  
  // Animation State
  const [p1, setP1] = React.useState<BezierPoint>({ x: 0.42, y: 0 })
  const [p2, setP2] = React.useState<BezierPoint>({ x: 0.58, y: 1 })
  const [duration, setDuration] = React.useState(0.6)
  const [delay, setDelay] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [key, setKey] = React.useState(0) // Used to force-restart animations
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const bezierString = `cubic-bezier(${p1.x.toFixed(2)}, ${p1.y.toFixed(2)}, ${p2.x.toFixed(2)}, ${p2.y.toFixed(2)})`

  const handleCopy = () => {
    navigator.clipboard.writeText(bezierString)
    setCopied(true)
    toast({ title: "copied!", description: "css cubic-bezier value copied to clipboard." })
    setTimeout(() => setCopied(false), 2000)
  }

  const restartAnimation = () => {
    setIsPlaying(false)
    setTimeout(() => {
      setKey(prev => prev + 1)
      setIsPlaying(true)
    }, 10)
  }

  if (!mounted) return null

  return (
    <div className="space-y-8 animate-smooth-slow pb-20 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground lowercase">motion lab</h1>
          <p className="text-muted-foreground mt-1 text-lg lowercase">design and test custom animation curves.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Editor & Controls */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-none shadow-sm rounded-[40px] bg-card overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="font-headline text-2xl lowercase flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" /> graph editor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-8">
              {/* Bezier Graph */}
              <div className="relative aspect-square bg-muted/20 rounded-3xl border-2 border-border overflow-hidden group">
                <BezierGraph 
                  p1={p1} 
                  p2={p2} 
                  onChangeP1={setP1} 
                  onChangeP2={setP2} 
                />
              </div>

              {/* Timing Controls */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">duration</Label>
                    <span className="text-xs font-mono">{duration}s</span>
                  </div>
                  <Slider value={[duration]} min={0.1} max={3} step={0.1} onValueChange={(v) => setDuration(v[0])} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">delay</Label>
                    <span className="text-xs font-mono">{delay}s</span>
                  </div>
                  <Slider value={[delay]} min={0} max={2} step={0.1} onValueChange={(v) => setDelay(v[0])} />
                </div>
              </div>

              {/* Output */}
              <div className="bg-muted/30 p-4 rounded-2xl border border-border flex items-center justify-between group">
                <code className="text-xs font-mono opacity-70 truncate mr-4">{bezierString}</code>
                <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8 rounded-lg">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Presets */}
          <Card className="border-none shadow-sm rounded-[40px] bg-card overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="font-headline text-xl lowercase opacity-70">presets</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="grid grid-cols-2 gap-3">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setP1({ x: preset.value[0], y: preset.value[1] })
                      setP2({ x: preset.value[2], y: preset.value[3] })
                    }}
                    className="flex flex-col items-start gap-1 p-4 rounded-2xl border-2 border-muted hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                  >
                    <span className="font-bold text-sm lowercase group-hover:text-primary transition-colors">{preset.name}</span>
                    <span className="text-[10px] opacity-40 lowercase">{preset.description}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-none shadow-2xl rounded-[48px] bg-card overflow-hidden h-full min-h-[600px] flex flex-col relative">
            <div className="absolute inset-0 bg-primary/5 opacity-40 pointer-events-none" />
            
            <CardHeader className="p-10 pb-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-3xl lowercase">live testing</CardTitle>
                  <CardDescription className="lowercase">visualizing the curve in real-time.</CardDescription>
                </div>
                <Button onClick={restartAnimation} className="rounded-2xl h-14 px-8 font-bold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 lowercase">
                  <RotateCcw className="h-5 w-5" /> restart
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-10 flex flex-col gap-10 justify-center z-10">
              {/* Motion Preview */}
              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">translation (move)</Label>
                <div className="h-32 bg-muted/20 rounded-3xl border border-border relative flex items-center px-8 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-around opacity-5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="w-px h-full bg-foreground" />)}
                  </div>
                  <div 
                    key={`motion-${key}`}
                    className="h-16 w-16 bg-primary rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center text-white"
                    style={{
                      animation: isPlaying ? `move-preview ${duration}s ${bezierString} ${delay}s infinite alternate` : 'none'
                    }}
                  >
                    <Play className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Fading Preview */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">opacity (fade)</Label>
                  <div className="h-48 bg-muted/20 rounded-3xl border border-border flex items-center justify-center">
                    <div 
                      key={`fade-${key}`}
                      className="h-24 w-24 bg-accent rounded-[32px] shadow-xl shadow-accent/20"
                      style={{
                        animation: isPlaying ? `fade-preview ${duration}s ${bezierString} ${delay}s infinite alternate` : 'none'
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">scaling (pop)</Label>
                  <div className="h-48 bg-muted/20 rounded-3xl border border-border flex items-center justify-center">
                    <div 
                      key={`scale-${key}`}
                      className="h-24 w-24 bg-indigo-500 rounded-full shadow-xl shadow-indigo-500/20"
                      style={{
                        animation: isPlaying ? `scale-preview ${duration}s ${bezierString} ${delay}s infinite alternate` : 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>

            <div className="p-10 pt-0 text-center opacity-40 lowercase text-xs z-10 italic">
              * previews use the "infinite alternate" loop to show behavior in both directions.
            </div>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        @keyframes move-preview {
          from { transform: translateX(0); }
          to { transform: translateX(calc(100% * 6)); }
        }
        @keyframes fade-preview {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-preview {
          from { transform: scale(0.5); opacity: 0.5; }
          to { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function BezierGraph({ p1, p2, onChangeP1, onChangeP2 }: { 
  p1: BezierPoint, 
  p2: BezierPoint, 
  onChangeP1: (p: BezierPoint) => void,
  onChangeP2: (p: BezierPoint) => void
}) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const [activeHandle, setActiveHandle] = React.useState<1 | 2 | null>(null)

  const handlePointerDown = (id: 1 | 2) => (e: React.PointerEvent) => {
    e.stopPropagation()
    setActiveHandle(id)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle || !svgRef.current) return

    const rect = svgRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = 1 - (e.clientY - rect.top) / rect.height // Invert for Y-axis (0 at bottom)

    if (activeHandle === 1) onChangeP1({ x, y })
    else onChangeP2({ x, y })
  }

  const handlePointerUp = () => setActiveHandle(null)

  // Map 0-1 to SVG coordinates (assume 300x300 viewBox)
  const toSvg = (p: BezierPoint) => ({ x: p.x * 300, y: 300 - p.y * 300 })

  const s1 = toSvg(p1)
  const s2 = toSvg(p2)

  return (
    <svg 
      ref={svgRef}
      viewBox="0 0 300 300" 
      className="w-full h-full cursor-crosshair select-none touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Grid */}
      <line x1="0" y1="0" x2="300" y2="0" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
      <line x1="0" y1="150" x2="300" y2="150" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
      <line x1="150" y1="0" x2="150" y2="300" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />

      {/* Helper Lines */}
      <line x1="0" y1="300" x2={s1.x} y2={s1.y} stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4 2" opacity="0.4" />
      <line x1="300" y1="0" x2={s2.x} y2={s2.y} stroke="hsl(var(--indigo-500))" strokeWidth="2" strokeDasharray="4 2" opacity="0.4" />

      {/* The Curve */}
      <path 
        d={`M 0 300 C ${s1.x} ${s1.y}, ${s2.x} ${s2.y}, 300 0`} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="4" 
      />

      {/* Handle 1 */}
      <circle 
        cx={s1.x} cy={s1.y} r="8" 
        fill="hsl(var(--primary))" 
        className="cursor-move drop-shadow-md"
        onPointerDown={handlePointerDown(1)}
      />
      
      {/* Handle 2 */}
      <circle 
        cx={s2.x} cy={s2.y} r="8" 
        fill="hsl(var(--indigo-500))" 
        className="cursor-move drop-shadow-md"
        onPointerDown={handlePointerDown(2)}
      />
    </svg>
  )
}
