
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Search, Plus, StickyNote, MoreVertical, BookOpen, Clock, Tag } from "lucide-react"

export default function NotebooksPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-8 animate-smooth-slow">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground lowercase">digital notebooks</h1>
          <p className="text-muted-foreground mt-2 text-lg lowercase">capture your ideas and lecture notes in one organized place.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-8 rounded-2xl shadow-lg transition-all hover:scale-105 lowercase">
          <Plus className="h-5 w-5 mr-2" /> create new note
        </Button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Sidebar for Notes List */}
        <aside className="w-80 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="search notes..." className="pl-10 rounded-xl bg-card border-border shadow-sm lowercase" />
          </div>
          
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-2 py-2">
              <NoteCard 
                title="cell biology: chapter 12" 
                preview="in this chapter we discussed the various phases of the cell cycle including interphase..." 
                date="today" 
                active={true}
                tag="biology"
              />
              <NoteCard 
                title="linear algebra: eigenvalues" 
                preview="definition of an eigenvector: a non-zero vector v such that av = λv..." 
                date="yesterday" 
                active={false}
                tag="math"
              />
              <NoteCard 
                title="european history: renaissance" 
                preview="the renaissance was a fervent period of european cultural, artistic, political and economic rebirth..." 
                date="may 10" 
                active={false}
                tag="history"
              />
              <NoteCard 
                title="capstone project brainstorming" 
                preview="focusing on user-centric design for students to manage academic pressure..." 
                date="may 08" 
                active={false}
                tag="project"
              />
              <NoteCard 
                title="modern literature: kafka" 
                preview="themes of alienation and existential dread in the metamorphosis..." 
                date="may 05" 
                active={false}
                tag="lit"
              />
            </div>
          </ScrollArea>
        </aside>

        {/* Note Editor Area */}
        <main className="flex-1 flex flex-col bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <header className="px-8 py-6 border-b border-border flex items-center justify-between bg-primary/5">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="font-headline text-2xl font-bold text-foreground lowercase">cell biology: chapter 12</h2>
                <Badge className="rounded-full bg-primary/20 text-primary-foreground border-none lowercase">biology</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> last edited 2 hours ago</span>
                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> 1,200 words</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-xl"><Tag className="h-5 w-5 text-muted-foreground" /></Button>
              <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="h-5 w-5 text-muted-foreground" /></Button>
            </div>
          </header>
          
          <div className="flex-1 p-8">
            <Textarea 
              className="w-full h-full resize-none border-none focus-visible:ring-0 text-lg leading-relaxed text-foreground p-0 bg-transparent lowercase"
              placeholder="start writing your masterpiece..."
              defaultValue={`# chapter 12: cell cycle and division

the cell cycle is an ordered series of events involving cell growth and cell division that produces two new daughter cells. cells on the path to cell division proceed through a series of precisely timed and carefully regulated stages.

## phases of the cell cycle
the cell cycle consists of two major phases:
1. interphase: the cell grows and dna is replicated.
2. mitotic phase: the replicated dna and cytoplasmic contents are separated and the cell divides.

### interphase
- g1 phase (first gap): the cell is quite active at the biochemical level.
- s phase (synthesis phase): dna replication results in the formation of two identical copies of each chromosome.
- g2 phase (second gap): the cell replenishes its energy stores and synthesizes the proteins necessary for chromosome manipulation.`}
            />
          </div>

          <footer className="px-8 py-4 border-t border-border flex justify-between items-center bg-muted/20">
            <div className="flex gap-2">
              <button className="h-8 px-3 rounded-lg bg-card border border-border text-sm font-bold hover:bg-muted lowercase">b</button>
              <button className="h-8 px-3 rounded-lg bg-card border border-border text-sm italic font-serif hover:bg-muted lowercase">i</button>
              <button className="h-8 px-3 rounded-lg bg-card border border-border text-sm underline hover:bg-muted lowercase">u</button>
            </div>
            <div className="flex gap-4">
              <span className="text-xs text-muted-foreground lowercase">auto-saved to cloud</span>
              <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-lg px-6 font-bold lowercase">save final</Button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

function NoteCard({ title, preview, date, active, tag }: { title: string, preview: string, date: string, active: boolean, tag: string }) {
  return (
    <div className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${active ? 'bg-primary/10 border-primary' : 'bg-transparent border-transparent hover:bg-muted/50'}`}>
      <div className="flex justify-between items-start mb-1">
        <h4 className={`font-bold text-sm truncate pr-2 lowercase ${active ? 'text-primary-foreground' : 'text-foreground'}`}>{title}</h4>
        <span className="text-[10px] text-muted-foreground font-bold whitespace-nowrap lowercase">{date}</span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2 lowercase">{preview}</p>
      <Badge variant="outline" className={`text-[9px] px-2 py-0 rounded-full font-bold uppercase tracking-wider lowercase ${active ? 'border-primary text-primary-foreground' : 'text-muted-foreground'}`}>
        {tag}
      </Badge>
    </div>
  )
}
