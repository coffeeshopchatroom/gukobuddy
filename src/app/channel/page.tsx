"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Radio, ArrowLeft, Sparkles, Globe, Zap, SmartphoneNfc, Database } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function GukoChannelPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full border-none shadow-2xl rounded-[64px] overflow-hidden bg-card text-center relative">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-primary via-indigo-200 to-primary animate-pulse" />
        
        <CardContent className="p-12 md:p-24 space-y-10 flex flex-col items-center">
          <div className="relative">
            <div className="h-32 w-32 rounded-[40px] bg-primary/10 flex items-center justify-center">
              <Radio className="h-16 w-16 text-primary" />
            </div>
            <div className="absolute -top-6 -right-6 h-12 w-12 rounded-full bg-accent flex items-center justify-center shadow-lg animate-pulse">
              <Globe className="h-6 w-6 text-accent-foreground" />
            </div>
            
          </div>

          <div className="space-y-4">
            <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter lowercase">guko channel</h1>
            <Badge className="bg-primary/20 text-primary-foreground hover:bg-primary/20 border-none px-8 py-2 rounded-full text-sm font-bold uppercase tracking-[0.2em]">
              connecting now...
            </Badge>
          </div>

          <p className="text-muted-foreground text-xl md:text-2xl max-w-lg leading-relaxed lowercase font-medium">
            get ready to go online, share texts and learn together.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-xl">
            <div className="p-6 rounded-[32px] bg-muted/30 flex flex-col items-center gap-3 border border-transparent hover:border-primary/20 transition-colors">
              <Globe className="h-6 w-6 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">global plaza</span>
            </div>
            <div className="p-6 rounded-[32px] bg-muted/30 flex flex-col items-center gap-3 border border-transparent hover:border-primary/20 transition-colors">
              <Database className="h-6 w-6 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"> sessions with friends</span>
            </div>
            <div className="p-6 rounded-[32px] bg-muted/30 flex flex-col items-center gap-3 border border-transparent hover:border-primary/20 transition-colors">
              <Radio className="h-6 w-6 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">study sync</span>
            </div>
          </div>

          <Button asChild variant="outline" className="mt-4 rounded-3xl py-8 px-12 text-lg font-bold border-2 hover:bg-muted transition-all hover:scale-105 active:scale-95 lowercase">
            <Link href="/"><ArrowLeft className="h-5 w-5 mr-3" /> return to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
      
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  )
}
