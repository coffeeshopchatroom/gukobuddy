
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  Plus, 
  Settings, 
  Trash2, 
  FileText,
  Clock,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  Smile,
  ChevronRight,
  ChevronDown,
  History,
  Home,
  Layout,
  Download,
  MoreHorizontal,
  ChevronLeft,
  Loader2
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
import { ScrollArea } from "@/components/ui/scroll-area"

export default function NotebooksPage() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
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
        placeholder: 'press enter to start with an empty page',
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

  if (!mounted || isUserLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[100]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-white z-[100] flex overflow-hidden font-sans selection:bg-[#c1e2ff]">
      {/* Sidebar - Notion Authentic Style */}
      <aside className="w-[240px] flex flex-col bg-[#fbfbfa] border-r border-[#efefef] group/sidebar select-none">
        {/* Workspace Header */}
        <div className="p-3 pb-0 flex flex-col gap-0.5">
          <button className="flex items-center gap-2 p-1.5 rounded-md hover:bg-[#efefef] transition-colors w-full group/ws text-left">
            <div className="h-5 w-5 rounded bg-[#37352f] text-white flex items-center justify-center text-[10px] font-bold">G</div>
            <span className="text-[14px] font-medium text-[#37352f] truncate flex-1 lowercase">guko inc.</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/ws:opacity-100" />
          </button>

          <div className="mt-2 flex flex-col">
            <SidebarItem icon={<Search size={16} />} label="quick find" />
            <SidebarItem icon={<History size={16} />} label="all updates" />
            <SidebarItem icon={<Settings size={16} />} label="settings & members" />
          </div>
        </div>

        <ScrollArea className="flex-1 mt-4">
          <div className="px-3 pb-8 space-y-6">
            {/* Sections */}
            <SidebarSection label="workspace">
              {isNotesLoading ? (
                <div className="py-2 px-2 text-[13px] text-muted-foreground italic lowercase">loading...</div>
              ) : filteredNotes.map(note => (
                <SidebarNoteItem 
                  key={note.id}
                  note={note}
                  isActive={selectedNoteId === note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  onDelete={(e) => handleDeleteNote(e, note.id)}
                />
              ))}
              <SidebarItem icon={<Plus size={16} />} label="add a page" onClick={handleCreateNote} className="text-muted-foreground/60" />
            </SidebarSection>

            <SidebarSection label="shared" />
            <SidebarSection label="private" />

            <div className="mt-auto pt-4 border-t border-transparent">
              <SidebarItem icon={<Layout size={16} />} label="templates" />
              <SidebarItem icon={<Download size={16} />} label="import" />
              <SidebarItem icon={<Trash2 size={16} />} label="trash" />
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-white relative overflow-hidden">
        {/* Top Breadcrumb Bar */}
        <header className="h-11 flex items-center justify-between px-4 shrink-0 bg-white/80 backdrop-blur-sm z-50">
          <div className="flex items-center gap-2 overflow-hidden">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#efefef] transition-colors text-[#37352f] group"
            >
              <Home size={14} className="text-muted-foreground group-hover:text-[#37352f]" />
              <span className="text-[14px] lowercase font-medium">home</span>
            </button>
            <span className="text-[#37352f]/20 font-light">/</span>
            {selectedNote && (
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[14px]">{selectedNote.icon || '📄'}</span>
                <span className="text-[14px] text-[#37352f] truncate lowercase">{selectedNote.title || 'untitled'}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
             <span className="text-[12px] text-muted-foreground lowercase opacity-0 group-hover:opacity-100 transition-opacity">edited {selectedNote && new Date(selectedNote.updatedAt).toLocaleDateString()}</span>
             <button className="p-1 hover:bg-[#efefef] rounded"><MoreHorizontal size={18} className="text-muted-foreground" /></button>
          </div>
        </header>

        {selectedNote ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-[720px] mx-auto px-12 md:px-24 pt-20 pb-40">
              {/* Notion Header Style */}
              <div className="group/page-header mb-8">
                {/* Large Icon */}
                <div className="text-7xl mb-4 cursor-default w-fit group/icon transition-transform hover:scale-110">
                  {selectedNote.icon || '📄'}
                </div>

                {/* Notion Title */}
                <textarea
                  value={selectedNote.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full text-5xl font-bold text-[#37352f] bg-transparent border-none focus:outline-none focus:ring-0 !lowercase placeholder:text-[#37352f]/10 resize-none overflow-hidden h-auto"
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
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
            <div className="text-8xl opacity-10">📄</div>
            <div className="space-y-1">
              <h3 className="text-xl font-medium text-[#37352f]/40 lowercase">select a page or create a new one</h3>
              <p className="text-sm text-muted-foreground lowercase">capture your thoughts in a distraction-free space.</p>
            </div>
            <Button 
              onClick={handleCreateNote} 
              variant="outline" 
              className="rounded-md border-[#efefef] hover:bg-[#efefef] text-[#37352f]/60 h-9 px-4 lowercase shadow-none"
            >
              <Plus className="h-4 w-4 mr-2" /> new page
            </Button>
          </div>
        )}

        {/* Dynamic Toolbar (visible on selection/hover) */}
        {selectedNote && editor && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-white border border-[#efefef] shadow-xl rounded-lg animate-in slide-in-from-bottom-2 duration-300">
             <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} icon={<Bold size={15} />} />
             <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} icon={<Italic size={15} />} />
             <div className="w-[1px] h-4 bg-[#efefef] mx-0.5" />
             <ToolbarButton active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} icon={<Heading1 size={15} />} />
             <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={<Heading2 size={15} />} />
             <div className="w-[1px] h-4 bg-[#efefef] mx-0.5" />
             <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<List size={15} />} />
          </div>
        )}
      </main>

      <style jsx global>{`
        .notion-tiptap-container .ProseMirror {
          font-size: 16px;
          line-height: 1.5;
          color: #37352f;
        }
        .notion-tiptap-container .ProseMirror p {
          margin: 1px 0;
          min-height: 1.5em;
        }
        .notion-tiptap-container .ProseMirror h1 {
          font-size: 1.875em;
          font-weight: 600;
          margin-top: 2em;
          margin-bottom: 4px;
        }
        .notion-tiptap-container .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin-top: 1.4em;
          margin-bottom: 1px;
        }
        .notion-tiptap-container .ProseMirror ul {
          padding-left: 26px;
          list-style-type: disc;
          margin: 8px 0;
        }
        .notion-tiptap-container .ProseMirror .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #37352f20;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  )
}

function SidebarItem({ icon, label, onClick, className }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 p-1 px-1.5 rounded-md hover:bg-[#efefef] transition-colors w-full text-[#37352f]/70 text-[14px] lowercase",
        className
      )}
    >
      <span className="opacity-60">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  )
}

function SidebarSection({ label, children }: any) {
  return (
    <div className="space-y-1">
      <div className="px-2 mb-1 flex items-center gap-1 group/section">
        <ChevronRight size={14} className="text-muted-foreground/40 group-hover/section:text-[#37352f] cursor-pointer" />
        <span className="text-[11px] font-bold text-[#37352f]/40 uppercase tracking-widest">{label}</span>
        <Plus size={14} className="ml-auto text-muted-foreground/40 opacity-0 group-hover/section:opacity-100 cursor-pointer" />
      </div>
      <div className="space-y-[1px]">
        {children}
      </div>
    </div>
  )
}

function SidebarNoteItem({ note, isActive, onClick, onDelete }: any) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-all duration-150 text-[14px] lowercase",
        isActive ? "bg-[#efefef] text-[#37352f] font-medium" : "hover:bg-[#efefef] text-[#37352f]/70"
      )}
    >
      <div className="flex items-center gap-2 flex-1 truncate">
        <ChevronRight size={14} className="opacity-0 group-hover:opacity-40" />
        <span>{note.icon || '📄'}</span>
        <span className="truncate">{note.title || 'untitled'}</span>
      </div>
      <button 
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity p-0.5"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function ToolbarButton({ active, onClick, icon }: { active?: boolean, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-7 w-7 flex items-center justify-center rounded transition-all",
        active ? "bg-[#efefef] text-[#37352f]" : "hover:bg-[#efefef] text-[#37352f]/40"
      )}
    >
      {icon}
    </button>
  )
}
