
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
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">Digital Notebooks</h1>
          <p className="text-muted-foreground mt-2 text-lg">Capture your ideas and lecture notes in one organized place.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-8 rounded-2xl shadow-lg transition-all hover:scale-105">
          <Plus className="h-5 w-5 mr-2" /> Create New Note
        </Button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Sidebar for Notes List */}
        <aside className="w-80 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search notes..." className="pl-10 rounded-xl bg-white border-border shadow-sm" />
          </div>
          
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-2 py-2">
              <NoteCard 
                title="Cell Biology: Chapter 12" 
                preview="In this chapter we discussed the various phases of the cell cycle including interphase..." 
                date="Today" 
                active={true}
                tag="Biology"
              />
              <NoteCard 
                title="Linear Algebra: Eigenvalues" 
                preview="Definition of an eigenvector: A non-zero vector v such that Av = λv..." 
                date="Yesterday" 
                active={false}
                tag="Math"
              />
              <NoteCard 
                title="European History: Renaissance" 
                preview="The Renaissance was a fervent period of European cultural, artistic, political and economic rebirth..." 
                date="May 10" 
                active={false}
                tag="History"
              />
              <NoteCard 
                title="Capstone Project Brainstorming" 
                preview="Focusing on user-centric design for students to manage academic pressure..." 
                date="May 08" 
                active={false}
                tag="Project"
              />
              <NoteCard 
                title="Modern Literature: Kafka" 
                preview="Themes of alienation and existential dread in The Metamorphosis..." 
                date="May 05" 
                active={false}
                tag="Lit"
              />
            </div>
          </ScrollArea>
        </aside>

        {/* Note Editor Area */}
        <main className="flex-1 flex flex-col bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
          <header className="px-8 py-6 border-b border-border flex items-center justify-between bg-primary/5">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="font-headline text-2xl font-bold text-foreground">Cell Biology: Chapter 12</h2>
                <Badge className="rounded-full bg-primary/20 text-primary-foreground border-none">Biology</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Last edited 2 hours ago</span>
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
              className="w-full h-full resize-none border-none focus-visible:ring-0 text-lg leading-relaxed text-foreground p-0"
              placeholder="Start writing your masterpiece..."
              defaultValue={`# Chapter 12: Cell Cycle and Division

The cell cycle is an ordered series of events involving cell growth and cell division that produces two new daughter cells. Cells on the path to cell division proceed through a series of precisely timed and carefully regulated stages.

## Phases of the Cell Cycle
The cell cycle consists of two major phases:
1. **Interphase**: The cell grows and DNA is replicated.
2. **Mitotic Phase**: The replicated DNA and cytoplasmic contents are separated and the cell divides.

### Interphase
- **G1 Phase** (First Gap): The cell is quite active at the biochemical level.
- **S Phase** (Synthesis Phase): DNA replication results in the formation of two identical copies of each chromosome.
- **G2 Phase** (Second Gap): The cell replenishes its energy stores and synthesizes the proteins necessary for chromosome manipulation.`}
            />
          </div>

          <footer className="px-8 py-4 border-t border-border flex justify-between items-center bg-muted/20">
            <div className="flex gap-2">
              <button className="h-8 px-3 rounded-lg bg-white border border-border text-sm font-bold hover:bg-muted">B</button>
              <button className="h-8 px-3 rounded-lg bg-white border border-border text-sm italic font-serif hover:bg-muted">I</button>
              <button className="h-8 px-3 rounded-lg bg-white border border-border text-sm underline hover:bg-muted">U</button>
            </div>
            <div className="flex gap-4">
              <span className="text-xs text-muted-foreground">Auto-saved to Cloud</span>
              <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-lg px-6 font-bold">Save Final</Button>
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
        <h4 className={`font-bold text-sm truncate pr-2 ${active ? 'text-primary-foreground' : 'text-foreground'}`}>{title}</h4>
        <span className="text-[10px] text-muted-foreground font-bold whitespace-nowrap">{date}</span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{preview}</p>
      <Badge variant="outline" className={`text-[9px] px-2 py-0 rounded-full font-bold uppercase tracking-wider ${active ? 'border-primary text-primary-foreground' : 'text-muted-foreground'}`}>
        {tag}
      </Badge>
    </div>
  )
}
