"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Coffee, ArrowLeft, Sparkles, Clock, Star } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function StudySessionPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-none shadow-2xl rounded-[48px] overflow-hidden bg-card text-center relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary" />
        
        <CardContent className="p-16 space-y-8 flex flex-col items-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-[32px] bg-accent/10 flex items-center justify-center animate-pulse">
              <Coffee className="h-12 w-12 text-accent-foreground" />
            </div>
            <Sparkles className="absolute -top-4 -right-4 h-8 w-8 text-primary animate-bounce" />
          </div>

          <div className="space-y-4">
            <h1 className="font-headline text-5xl font-bold tracking-tight lowercase">study session</h1>
            <Badge className="bg-primary/20 text-primary-foreground hover:bg-primary/20 border-none px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
              coming soon
            </Badge>
          </div>

          <p className="text-muted-foreground text-xl max-w-md leading-relaxed lowercase">
            we're building a deeply immersive environment to help you stay in the flow state longer.
          </p>

          <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
            <div className="p-4 rounded-3xl bg-muted/30 flex flex-col items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">flow focus</span>
            </div>
            <div className="p-4 rounded-3xl bg-muted/30 flex flex-col items-center gap-2">
              <Star className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">deep metrics</span>
            </div>
          </div>

          <Button asChild variant="outline" className="mt-8 rounded-2xl py-6 px-10 font-bold border-2 hover:bg-muted lowercase">
            <Link href="/tasks"><ArrowLeft className="h-4 w-4 mr-2" /> back to tasks</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
      {children}
    </div>
  )
}
