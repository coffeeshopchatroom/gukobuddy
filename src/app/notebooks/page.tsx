"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Plus, 
  Trash2, 
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  Home,
  MoreHorizontal,
  Loader2,
  ImageIcon,
  Smile,
  Upload,
  Search,
  Grid,
  ChevronLeft,
  ArrowLeft,
  Settings2,
  Library,
  Clock,
  Settings,
  ChevronsUpDown,
  FileText
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"

const STOCK_COVERS = [
  "https://picsum.photos/seed/cover1/1200/400",
  "https://picsum.photos/seed/cover2/1200/400",
  "https://picsum.photos/seed/cover3/1200/400",
  "https://picsum.photos/seed/cover4/1200/400",
  "https://picsum.photos/seed/cover5/1200/400",
  "https://picsum.photos/seed/cover6/1200/400",
]

const EMOJIS = ["📄", "📓", "💡", "🎯", "🚀", "📚", "🎨", "🧩", "🏠", "🔥", "🌈", "⭐", "🍀", "🌊", "🍄", "🥑", "🎮", "💻", "🧠", "✍️"]

export default function NotebooksPage() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(null)
  const [isMediaPickerOpen, setIsMediaPickerOpen] = React.useState(false)
  const [pickerType, setPickerType] = React.useState<'cover' | 'icon'>('cover')
  const [isUploading, setIsUploading] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

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
        placeholder: 'press enter to start writing...',
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
      title: "",
      content: "<p></p>",
      icon: "📄",
      coverImage: STOCK_COVERS[Math.floor(Math.random() * STOCK_COVERS.length)],
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

  const updateMedia = (value: string, type: 'cover' | 'icon') => {
    if (!selectedNoteId || !user || !db) return
    const noteRef = doc(db, "users", user.uid, "notes", selectedNoteId)
    updateDocumentNonBlocking(noteRef, { 
      [type === 'cover' ? 'coverImage' : 'icon']: value, 
      updatedAt: new Date().toISOString() 
    })
    setIsMediaPickerOpen(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'icon') => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setIsUploading(true)
    const filename = `notebooks/${user.uid}/${type}-${Date.now()}-${file.name}`
    try {
      const response = await fetch(`/api/upload?filename=${filename}`, { method: 'POST', body: file })
      const blob = await response.json()
      updateMedia(blob.url, type)
    } catch (error) {
      console.error("upload failed", error)
    } finally {
      setIsUploading(false)
    }
  }

  if (!mounted || isUserLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[9999]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex overflow-hidden font-sans selection:bg-[#c1e2ff]">
      {/* Notion-style Sidebar */}
      <aside className="w-[240px] flex flex-col shrink-0 bg-[#fbfbfa] border-r border-[#0000000f] h-full overflow-hidden group/sidebar">
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between hover:bg-[#0000000a] transition-colors cursor-pointer group">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center shrink-0">
               <span className="text-[10px] font-bold text-primary">{user?.email?.[0] || 'G'}</span>
            </div>
            <span className="text-sm font-semibold truncate lowercase text-[#37352f]">guko's workspace</span>
          </div>
          <ChevronsUpDown size={14} className="text-[#37352f]/40 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Top Actions */}
        <div className="px-2 mt-2 space-y-[2px]">
          <SidebarAction icon={<Search size={16} />} label="quick find" />
          <SidebarAction icon={<Clock size={16} />} label="all updates" />
          <SidebarAction icon={<Settings size={16} />} label="settings & members" />
          <SidebarAction 
            icon={<Plus size={16} />} 
            label="new page" 
            onClick={handleCreateNote} 
            className="text-[#37352f]/60"
          />
        </div>

        {/* Home Button back to Guko Buddy */}
        <div className="px-2 mt-6">
          <SidebarAction 
            icon={<Home size={16} />} 
            label="return to dashboard" 
            onClick={() => router.push('/')}
            className="text-primary font-bold"
          />
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto mt-6 custom-scrollbar px-2">
           <div className="px-2 mb-2">
             <span className="text-[11px] font-bold text-[#37352f]/40 uppercase tracking-widest">workspace</span>
           </div>
           
           <div className="space-y-[2px]">
             {isNotesLoading ? (
               <div className="px-2 py-4 space-y-4">
                 {[1,2,3].map(i => <div key={i} className="h-4 bg-muted/20 animate-pulse rounded" />)}
               </div>
             ) : notes && notes.length > 0 ? (
               notes.map(note => (
                 <SidebarNoteItem 
                    key={note.id}
                    note={note}
                    isActive={selectedNoteId === note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    onDelete={(e) => handleDeleteNote(e, note.id)}
                 />
               ))
             ) : (
               <div className="px-3 py-4 text-xs text-muted-foreground lowercase">no pages yet.</div>
             )}
           </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 relative flex flex-col bg-white overflow-hidden">
        {/* Notion Top Nav Area */}
        <header className="h-11 flex items-center justify-between px-4 shrink-0 bg-white/80 backdrop-blur-sm z-50 border-b border-[#0000000a]">
          <div className="flex items-center gap-2 overflow-hidden max-w-lg">
            <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => setSelectedNoteId(null)}
               className="h-7 px-2 hover:bg-[#0000000a] text-sm text-[#37352f]/60 lowercase"
            >
              all pages
            </Button>
            {selectedNote && (
              <>
                <span className="text-[#37352f]/30">/</span>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-sm shrink-0">{selectedNote.icon}</span>
                  <span className="text-sm font-medium truncate lowercase text-[#37352f]">{selectedNote.title || 'untitled'}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
             <span className="text-[11px] text-muted-foreground lowercase">edited {selectedNote ? new Date(selectedNote.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}</span>
             <button className="p-1 hover:bg-[#0000000a] rounded transition-colors">
               <MoreHorizontal size={18} className="text-[#37352f]/40" />
             </button>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative bg-white">
          {!selectedNoteId ? (
            <div className="max-w-6xl mx-auto w-full px-12 py-20 animate-in fade-in duration-700">
              <div className="mb-12 space-y-2">
                <h1 className="text-5xl font-bold text-[#37352f] tracking-tight lowercase">workspace</h1>
                <p className="text-lg text-muted-foreground/60 lowercase">organize your life and studies with minimalist pages.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {notes?.map(note => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    onClick={() => setSelectedNoteId(note.id)} 
                    onDelete={(e) => handleDeleteNote(e, note.id)}
                  />
                ))}
                <button 
                  onClick={handleCreateNote}
                  className="aspect-[4/3] rounded-3xl border-2 border-dashed border-muted/40 flex flex-col items-center justify-center gap-3 hover:bg-muted/10 hover:border-muted/60 transition-all group"
                >
                  <div className="h-12 w-12 rounded-2xl bg-muted/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-bold text-muted-foreground lowercase">new page</span>
                </button>
              </div>
            </div>
          ) : selectedNote ? (
            <div className="w-full flex-1 flex flex-col animate-in fade-in duration-500">
              {/* Cover Image Area */}
              <div className="relative group w-full h-[280px] bg-muted/10 overflow-hidden shrink-0">
                {selectedNote.coverImage ? (
                  <img src={selectedNote.coverImage} className="w-full h-full object-cover" alt="cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted/20 to-muted/10" />
                )}
                <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    onClick={() => { setPickerType('cover'); setIsMediaPickerOpen(true); }}
                    variant="secondary" 
                    size="sm" 
                    className="rounded-lg h-8 bg-white/90 backdrop-blur-sm text-[12px] font-bold lowercase hover:bg-white shadow-lg border border-black/5"
                  >
                    <ImageIcon size={14} className="mr-1.5" /> change cover
                  </Button>
                </div>
              </div>

              {/* Note Content Container */}
              <div className="max-w-[800px] mx-auto w-full px-12 pb-40 relative">
                {/* Floating Icon */}
                <div className="relative group -mt-16 mb-8 w-fit">
                  <div 
                    onClick={() => { setPickerType('icon'); setIsMediaPickerOpen(true); }}
                    className="text-8xl cursor-pointer hover:bg-[#0000000a] p-2 rounded-3xl transition-all"
                  >
                    {selectedNote.icon || '📄'}
                  </div>
                </div>

                {/* Title Section */}
                <div className="group/page-header mb-8">
                  <textarea
                    value={selectedNote.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full text-5xl font-bold text-[#37352f] bg-transparent border-none focus:outline-none focus:ring-0 !lowercase placeholder:text-[#37352f]/10 resize-none overflow-hidden h-auto leading-tight"
                    placeholder="untitled"
                    rows={1}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                  />
                </div>

                {/* Rich Text Body */}
                <div className="notion-tiptap-container min-h-[500px]">
                  <EditorContent editor={editor} className="outline-none" />
                </div>
              </div>
            </div>
          ) : null}

          {/* Dynamic Toolbar (visible on selection/hover) */}
          {selectedNote && editor && (
            <div className="fixed bottom-12 left-[calc(50%+120px)] -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-white border border-[#0000001a] shadow-[0_12px_24px_rgba(0,0,0,0.08)] rounded-2xl animate-in slide-in-from-bottom-4 duration-300 z-50">
               <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} icon={<Bold size={18} />} />
               <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} icon={<Italic size={18} />} />
               <div className="w-[1px] h-5 bg-border/40 mx-1" />
               <ToolbarButton active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} icon={<Heading1 size={18} />} />
               <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={<Heading2 size={18} />} />
               <div className="w-[1px] h-5 bg-border/40 mx-1" />
               <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<List size={18} />} />
            </div>
          )}
        </div>
      </main>

      {/* Media Picker Dialog */}
      <Dialog open={isMediaPickerOpen} onOpenChange={setIsMediaPickerOpen}>
        <DialogContent className="max-w-xl p-0 border-none bg-white shadow-3xl overflow-hidden rounded-[32px]">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold lowercase text-[#37352f]">change {pickerType}</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="image" className="w-full">
            <div className="px-6 border-b border-border/10">
              <TabsList className="bg-transparent gap-6 p-0 h-12 w-full justify-start border-none">
                <TabsTrigger value="image" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#37352f] data-[state=active]:bg-transparent shadow-none px-0 lowercase h-12 text-sm">library</TabsTrigger>
                <TabsTrigger value="emoji" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#37352f] data-[state=active]:bg-transparent shadow-none px-0 lowercase h-12 text-sm">emoji</TabsTrigger>
                <TabsTrigger value="custom" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#37352f] data-[state=active]:bg-transparent shadow-none px-0 lowercase h-12 text-sm">custom</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
              <TabsContent value="image" className="m-0 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  {(pickerType === 'cover' ? STOCK_COVERS : EMOJIS).map((item, i) => (
                    <button 
                      key={i} 
                      onClick={() => updateMedia(item, pickerType)}
                      className={cn(
                        "relative aspect-video rounded-xl overflow-hidden hover:opacity-80 transition-all border-2 border-transparent hover:border-[#37352f]/20",
                        pickerType === 'icon' && "aspect-square flex items-center justify-center text-4xl bg-muted/10"
                      )}
                    >
                      {pickerType === 'cover' ? <img src={item} className="w-full h-full object-cover" alt="stock" /> : item}
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="emoji" className="m-0 mt-0">
                <div className="grid grid-cols-6 gap-3">
                  {EMOJIS.map((emoji, i) => (
                    <button 
                      key={i} 
                      onClick={() => updateMedia(emoji, 'icon')}
                      className="aspect-square flex items-center justify-center text-4xl rounded-xl hover:bg-muted/10 transition-all border border-transparent hover:border-border/40"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="custom" className="m-0 mt-0 space-y-6">
                <div 
                  onClick={() => document.getElementById('media-upload')?.click()}
                  className="border-2 border-dashed border-muted rounded-[24px] py-12 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/5 hover:border-muted/60 transition-all"
                >
                  {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : <Upload className="h-8 w-8 text-muted-foreground/40" />}
                  <div className="text-center">
                    <p className="text-sm font-bold lowercase text-[#37352f]">upload an image</p>
                    <p className="text-xs text-muted-foreground lowercase">recommended size 1500x600px</p>
                  </div>
                  <input 
                    id="media-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, pickerType)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">or paste url</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="https://..." 
                      className="rounded-xl h-10 bg-muted/5 border-border/40 lowercase no-focus-ring" 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') updateMedia((e.target as HTMLInputElement).value, pickerType);
                      }}
                    />
                    <Button variant="outline" className="rounded-xl h-10 px-4 lowercase shadow-none">submit</Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .notion-tiptap-container .ProseMirror {
          font-size: 17px;
          line-height: 1.6;
          color: #37352f;
        }
        .notion-tiptap-container .ProseMirror p {
          margin: 0.4em 0;
          min-height: 1.5em;
        }
        .notion-tiptap-container .ProseMirror h1 {
          font-size: 2.2em;
          font-weight: 700;
          margin-top: 1.5em;
          margin-bottom: 0.2em;
        }
        .notion-tiptap-container .ProseMirror h2 {
          font-size: 1.6em;
          font-weight: 600;
          margin-top: 1.2em;
          margin-bottom: 0.2em;
        }
        .notion-tiptap-container .ProseMirror ul {
          padding-left: 28px;
          list-style-type: disc;
          margin: 12px 0;
        }
        .notion-tiptap-container .ProseMirror .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #37352f15;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  )
}

function SidebarNoteItem({ note, isActive, onClick, onDelete }: any) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors",
        isActive ? "bg-[#0000000a]" : "hover:bg-[#0000000a]"
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        <span className="text-sm shrink-0">{note.icon || '📄'}</span>
        <span className={cn(
          "text-sm truncate lowercase",
          isActive ? "font-semibold text-[#37352f]" : "text-[#37352f]/60"
        )}>
          {note.title || 'untitled'}
        </span>
      </div>
      <button 
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#0000000f] rounded text-muted-foreground/40 hover:text-destructive transition-all"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

function SidebarAction({ icon, label, onClick, className }: any) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#0000000a] cursor-pointer transition-colors",
        className
      )}
    >
      <span className="text-[#37352f]/40">{icon}</span>
      <span className="text-sm text-[#37352f]/60 lowercase font-medium">{label}</span>
    </div>
  )
}

function NoteCard({ note, onClick, onDelete }: any) {
  return (
    <div 
      onClick={onClick}
      className="group relative aspect-[4/3] rounded-[32px] bg-white border border-border/40 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden flex flex-col"
    >
      <div className="h-1/2 w-full overflow-hidden bg-muted/10 relative">
        {note.coverImage ? (
          <img src={note.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10" />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      </div>
      
      <div className="flex-1 p-6 flex flex-col justify-between relative bg-white">
        <div className="absolute -top-8 left-6 text-4xl group-hover:scale-110 transition-transform">
          {note.icon || '📄'}
        </div>
        <div className="mt-2 space-y-1">
          <h3 className="text-xl font-bold text-[#37352f] truncate lowercase">{note.title || 'untitled'}</h3>
          <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">
            edited {new Date(note.updatedAt).toLocaleDateString()}
          </p>
        </div>
        
        <button 
          onClick={onDelete}
          className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 text-destructive rounded-xl"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

function ToolbarButton({ active, onClick, icon }: { active?: boolean, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-9 w-9 flex items-center justify-center rounded-xl transition-all",
        active ? "bg-[#37352f] text-white" : "hover:bg-[#efefef] text-[#37352f]/60"
      )}
    >
      {icon}
    </button>
  )
}
