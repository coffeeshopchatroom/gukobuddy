
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Layers, Play, MoreVertical, Edit2, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function FlashcardsPage() {
  return (
    <div className="space-y-8 animate-smooth-slow">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">Flashcard Decks</h1>
          <p className="text-muted-foreground mt-2 text-lg">Master your subjects with active recall.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/5 py-6 px-8 rounded-2xl font-bold transition-all">
            Import Cards
          </Button>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-6 px-8 rounded-2xl shadow-lg transition-all hover:scale-105">
            <Plus className="h-5 w-5 mr-2" /> New Deck
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DeckCard 
          title="Intro to Psychology" 
          cardsCount={124} 
          lastReviewed="2 days ago" 
          mastery={78} 
          tags={["Psychology", "Gen Ed"]}
        />
        <DeckCard 
          title="Organic Chemistry II" 
          cardsCount={250} 
          lastReviewed="Today" 
          mastery={45} 
          tags={["Chemistry", "Pre-med"]}
        />
        <DeckCard 
          title="World History: 1900s" 
          cardsCount={85} 
          lastReviewed="1 week ago" 
          mastery={92} 
          tags={["History"]}
        />
        <DeckCard 
          title="Data Structures & Algorithms" 
          cardsCount={156} 
          lastReviewed="Yesterday" 
          mastery={64} 
          tags={["CS", "Major"]}
        />
        <DeckCard 
          title="Calculus Theorems" 
          cardsCount={42} 
          lastReviewed="Never" 
          mastery={0} 
          tags={["Math"]}
        />
        <Card className="border-2 border-dashed border-muted flex flex-col items-center justify-center p-8 bg-transparent hover:bg-muted/30 transition-all cursor-pointer rounded-3xl group">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-headline text-xl font-bold text-muted-foreground">Create New Deck</p>
          <p className="text-sm text-muted-foreground text-center mt-2 px-6">Group your cards by subject or specific exam topics.</p>
        </Card>
      </div>
    </div>
  )
}

function DeckCard({ title, cardsCount, lastReviewed, mastery, tags }: { title: string, cardsCount: number, lastReviewed: string, mastery: number, tags: string[] }) {
  return (
    <Card className="group border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-3xl overflow-hidden bg-white">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="p-3 rounded-2xl bg-primary/10">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
        <CardTitle className="font-headline text-2xl mt-4 leading-tight">{title}</CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="bg-muted/50 text-muted-foreground hover:bg-muted/80 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="mt-4 space-y-6">
        <div className="flex justify-between text-sm items-center">
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Cards</span>
            <span className="font-bold text-lg">{cardsCount} total</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Review</span>
            <span className="text-muted-foreground font-medium">{lastReviewed}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
            <span>Mastery</span>
            <span className="text-primary">{mastery}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-out" 
              style={{ width: `${mastery}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl py-6 flex items-center gap-2">
            <Play className="h-4 w-4 fill-current" /> Study Now
          </Button>
          <Button variant="outline" className="rounded-2xl py-6 px-6 border-border hover:bg-muted">
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
