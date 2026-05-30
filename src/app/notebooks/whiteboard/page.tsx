"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Palette, ArrowLeft, Sparkles, MousePointer2, Eraser } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function WhiteboardPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-none shadow-2xl rounded-[48px] overflow-hidden bg-card text-center relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-orange-200 to-primary" />
        
        <CardContent className="p-16 space-y-8 flex flex-col items-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-[32px] bg-orange-50 flex items-center justify-center animate-pulse">
              <Palette className="h-12 w-12 text-orange-600" />
            </div>
            <Sparkles className="absolute -top-4 -right-4 h-8 w-8 text-primary animate-bounce" />
          </div>

          <div className="space-y-4">
            <h1 className="font-headline text-5xl font-bold tracking-tight lowercase">infinite whiteboard</h1>
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
              coming soon
            </Badge>
          </div>

          <p className="text-muted-foreground text-xl max-w-md leading-relaxed lowercase">
            an infinite canvas for your diagrams, sketches, and collaborative brainstorming sessions.
          </p>

          <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
            <div className="p-4 rounded-3xl bg-muted/30 flex flex-col items-center gap-2">
              <MousePointer2 className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">freehand drawing</span>
            </div>
            <div className="p-4 rounded-3xl bg-muted/30 flex flex-col items-center gap-2">
              <Eraser className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">smart cleanup</span>
            </div>
          </div>

          <Button asChild variant="outline" className="mt-8 rounded-2xl py-6 px-10 font-bold border-2 hover:bg-muted lowercase">
            <Link href="/notebooks"><ArrowLeft className="h-4 w-4 mr-2" /> back to notebooks</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
