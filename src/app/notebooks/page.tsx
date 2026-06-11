
"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Plus, 
  StickyNote, 
  MoreVertical, 
  BookOpen, 
  Clock, 
  Trash2, 
  FileText,
  ChevronLeft,
  Loader2,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  Smile
} from "lucide-react"
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking 
} from "@/firebase"
import { collection, doc, query, orderBy } from "firebase/firestore"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from "@/lib/utils"

export default function NotebooksPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")

  // Fetch Notes
  const notesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "users", user.uid, "notes"), orderBy("updatedAt", "desc"))
  }, [db, user])

  const { data: notes, isLoading: isNotesLoading } = useCollection(notesQuery)
  
  const selectedNote = notes?.find(n => n.id === selectedNoteId)

  // Editor setup
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'start typing...',
      }),
    ],
    content: selectedNote?.content || '',
    onUpdate: ({ editor }) => {
      if (selectedNoteId && user && db) {
        const html = editor.getHTML()
        const noteRef = doc(db, "users", user.uid, "notes", selectedNoteId)
        updateDocumentNonBlocking(noteRef, { 
          content: html,
          updatedAt: new Date().toISOString()
        })
      }
    },
  }, [selectedNoteId])

  // Sync editor content when selected note changes
  React.useEffect(() => {
    if (editor && selectedNote && editor.getHTML() !== selectedNote.content) {
      editor.commands.setContent(selectedNote.content)
    }
  }, [selectedNoteId, editor])

  const handleCreateNote = () => {
    if (!user || !db) return
    const noteId = doc(collection(db, "temp")).id
    const noteRef = doc(db, "users", user.uid, "notes", noteId)
    const newNote = {
      id: noteId,
      title: "untitled",
      content: "<p></p>",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setDocumentNonBlocking(noteRef, newNote, { merge: true })
    setSelectedNoteId(noteId)
  }

  const handleDeleteNote = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation()
    if (!user || !db) return
    const noteRef = doc(db, "users", user.uid, "notes", noteId)
    deleteDocumentNonBlocking(noteRef)
    if (selectedNoteId === noteId) setSelectedNoteId(null)
  }

  const handleTitleChange = (newTitle: string) => {
    if (!selectedNoteId || !user || !db) return
    const noteRef = doc(db, "users", user.uid, "notes", selectedNoteId)
    updateDocumentNonBlocking(noteRef, { title: newTitle, updatedAt: new Date().toISOString() })
  }

  const filteredNotes = notes?.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase())) || []

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-0 overflow-hidden animate-smooth-slow bg-background border rounded-[40px] shadow-sm">
      {/* Sidebar: Notion Style */}
      <aside className="w-80 flex flex-col bg-muted/20 border-r border-border/50">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-xl font-bold lowercase tracking-tight opacity-70">notebooks</h2>
            <Button variant="ghost" size="icon" onClick={handleCreateNote} className="h-8 w-8 rounded-full hover:bg-muted">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-40 group-focus-within:opacity-100 transition-opacity" />
            <Input 
              placeholder="quick find..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/40 border-transparent focus-visible:bg-background focus-visible:ring-0 text-sm lowercase" 
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 py-2">
            {isNotesLoading ? (
              [1,2,3].map(i => <div key={i} className="h-10 mx-3 rounded-lg bg-muted/40 animate-pulse mb-2" />)
            ) : filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <div 
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
                    selectedNoteId === note.id 
                      ? "bg-primary/10 text-primary-foreground font-bold shadow-sm" 
                      : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileText className={cn("h-4 w-4 shrink-0", selectedNoteId === note.id ? "text-primary" : "opacity-40")} />
                  <span className="flex-1 truncate text-sm lowercase">{note.title || 'untitled'}</span>
                  <button 
                    onClick={(e) => handleDeleteNote(e, note.id)}
                    className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 px-6">
                <p className="text-xs text-muted-foreground opacity-40 lowercase">no notes found.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Editor Area */}
      <main className="flex-1 flex flex-col bg-background relative overflow-hidden">
        {selectedNote ? (
          <>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="max-w-3xl mx-auto px-12 pt-24 pb-32 space-y-10">
                {/* Minimal Header */}
                <div className="space-y-2 group/header">
                  <Input
                    value={selectedNote.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="text-5xl font-bold font-headline p-0 h-auto border-none bg-transparent focus-visible:ring-0 !lowercase placeholder:opacity-20"
                    placeholder="untitled"
                  />
                  <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40 opacity-0 group-hover/header:opacity-100 transition-opacity">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> updated {new Date(selectedNote.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Tiptap Editor */}
                <div className="tiptap-editor-notion prose prose-sm max-w-none">
                  <EditorContent editor={editor} className="min-h-[500px] outline-none" />
                </div>
              </div>
            </div>

            {/* Float Toolbar: Notion Style (Bottom Center) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 bg-background/80 backdrop-blur-xl border border-border shadow-2xl rounded-2xl animate-in slide-in-from-bottom-2 duration-300">
               <ToolbarButton active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} icon={<Bold className="h-4 w-4" />} label="bold" />
               <ToolbarButton active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} icon={<Italic className="h-4 w-4" />} label="italic" />
               <div className="w-px h-4 bg-border mx-1" />
               <ToolbarButton active={editor?.isActive('heading', { level: 1 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} icon={<Heading1 className="h-4 w-4" />} label="h1" />
               <ToolbarButton active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} icon={<Heading2 className="h-4 w-4" />} label="h2" />
               <ToolbarButton active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} icon={<List className="h-4 w-4" />} label="list" />
               <div className="w-px h-4 bg-border mx-1" />
               <ToolbarButton onClick={() => editor?.chain().focus().insertContent('😊').run()} icon={<Smile className="h-4 w-4" />} label="emoji" />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
            <div className="h-20 w-20 rounded-[32px] bg-muted/30 flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-muted-foreground opacity-20" />
            </div>
            <div className="space-y-2">
              <h3 className="font-headline text-2xl font-bold lowercase opacity-40">select or create a note</h3>
              <p className="text-muted-foreground text-sm lowercase max-w-xs mx-auto">choose a note from the sidebar or start a fresh page to capture your thoughts.</p>
            </div>
            <Button onClick={handleCreateNote} variant="outline" className="rounded-2xl h-12 px-8 font-bold border-2 hover:bg-muted transition-all lowercase">
              <Plus className="h-4 w-4 mr-2" /> new page
            </Button>
          </div>
        )}
      </main>

      <style jsx global>{`
        .tiptap-editor-notion .ProseMirror {
          font-size: 1.125rem;
          line-height: 1.7;
          color: hsl(var(--foreground));
        }
        .tiptap-editor-notion .ProseMirror p {
          margin-bottom: 1.25rem;
        }
        .tiptap-editor-notion .ProseMirror h1 {
          font-size: 2.25rem;
          font-weight: 800;
          margin-top: 2rem;
          margin-bottom: 1rem;
          letter-spacing: -0.025em;
        }
        .tiptap-editor-notion .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          opacity: 0.8;
        }
        .tiptap-editor-notion .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .tiptap-editor-notion .ProseMirror .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
          opacity: 0.4;
        }
      `}</style>
    </div>
  )
}

function ToolbarButton({ active, onClick, icon, label }: { active?: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "h-9 w-9 rounded-xl transition-all",
        active ? "bg-primary/10 text-primary shadow-inner" : "hover:bg-muted text-muted-foreground"
      )}
      title={label}
    >
      {icon}
    </Button>
  )
}
