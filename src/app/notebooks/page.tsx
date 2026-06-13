
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
  Search,
  ChevronLeft,
  Settings,
  ChevronsUpDown,
  FileText,
  SquareCheck,
  Type,
  ChevronRight,
  Columns as ColumnsIcon,
  Image as ImageFileIcon,
  Upload
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
import { Node, mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import ImageExtension from '@tiptap/extension-image'

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
import { STOCK_COVERS, LUCIDE_ICONS, EMOJIS } from "@/lib/notebook-constants"
import { Clock } from "lucide-react"

// --- CUSTOM NODES ---

const Details = Node.create({
  name: 'details',
  group: 'block',
  content: 'summary block+',
  defining: true,
  addAttributes() {
    return {
      open: {
        default: false,
        parseHTML: element => element.hasAttribute('open'),
        renderHTML: attributes => {
          if (attributes.open) {
            return { open: '' };
          }
          return {};
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: 'details' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['details', mergeAttributes(HTMLAttributes, { class: 'notion-toggle' }), 0];
  },
});

const Summary = Node.create({
  name: 'summary',
  content: 'inline*',
  parseHTML() {
    return [{ tag: 'summary' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['summary', mergeAttributes(HTMLAttributes), 0];
  },
});

const Column = Node.create({
  name: 'column',
  content: 'block+',
  renderHTML() {
    return ['div', { class: 'notion-column' }, 0]
  },
  parseHTML() {
    return [{ tag: 'div.notion-column' }]
  },
})

const Columns = Node.create({
  name: 'columns',
  group: 'block',
  content: 'column{2,}',
  renderHTML() {
    return ['div', { class: 'notion-columns' }, 0]
  },
  parseHTML() {
    return [{ tag: 'div.notion-columns' }]
  },
})

// Custom Page Link Node (Atom - Non-editable block)
const PageLinkNode = Node.create({
  name: 'pageLink',
  group: 'block',
  content: '',
  selectable: true,
  draggable: true,
  atom: true,
  addAttributes() {
    return {
      id: { default: null },
      title: { default: 'untitled' },
      icon: { default: 'file-text' },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-page-link]' }]
  },
  renderHTML({ node }) {
    const icon = node.attrs.icon;
    let iconHtml = '📄';
    
    if (icon && !LUCIDE_ICONS[icon] && !icon.startsWith('http') && !icon.startsWith('data:')) {
      iconHtml = icon;
    }

    return [
      'div',
      {
        'data-page-link': '',
        'data-id': node.attrs.id,
        class: 'subpage-link block-link cursor-pointer flex items-center gap-2 p-2 hover:bg-[#0000000a] rounded-md transition-colors border border-transparent mb-1 w-full',
      },
      ['span', { class: 'shrink-0 opacity-70 emoji-font' }, iconHtml],
      ['span', { class: 'truncate lowercase font-medium text-[#37352f]' }, node.attrs.title],
    ]
  },
})

export default function NotebooksPage() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(null)
  const [isMediaPickerOpen, setIsMediaPickerOpen] = React.useState(false)
  const [pickerType, setPickerType] = React.useState<'cover' | 'icon'>('cover')
  const [isUploading, setIsUploading] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [isSlashMenuOpen, setIsSlashMenuOpen] = React.useState(false)
  const [slashQuery, setSlashQuery] = React.useState("")

  React.useEffect(() => setMounted(true), [])

  const notesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "users", user.uid, "notes"), orderBy("updatedAt", "desc"))
  }, [db, user])

  const { data: notes, isLoading: isNotesLoading } = useCollection(notesQuery)
  const selectedNote = notes?.find(n => n.id === selectedNoteId)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        heading: { levels: [1, 2] },
      }),
      Placeholder.configure({
        placeholder: ({ node, editor }) => {
          if (node.type.name === 'summary' && node.content.size === 0) {
            return 'Toggle title';
          }
          if (editor.isEmpty) {
            return "type '/' for commands...";
          }
          return null;
        },
      }),
      TaskList.configure({
        HTMLAttributes: { class: 'notion-task-list' },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: 'notion-task-item' },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'notion-image',
        },
      }),
      Details,
      Summary,
      Columns,
      Column,
      PageLinkNode,
    ],
    content: selectedNote?.content || '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Escape') {
          setIsSlashMenuOpen(false)
        }
        return false
      },
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;
        
        // 1. Handle Page Links (the button-like blocks)
        const pageLink = target.closest('[data-page-link]');
        if (pageLink) {
          event.preventDefault();
          event.stopPropagation();
          const noteId = pageLink.getAttribute('data-id');
          if (noteId) {
            setSelectedNoteId(noteId);
          }
          return true;
        }

        // 2. Handle Toggles
        const summary = target.closest('summary');
        if (summary && summary.parentElement?.matches('.notion-toggle')) {
          event.preventDefault();
          const { doc, tr } = view.state;
          const $pos = doc.resolve(pos);
          for (let i = $pos.depth; i > 0; i--) {
            const node = $pos.node(i);
            if (node.type.name === 'details') {
              view.dispatch(
                tr.setNodeMarkup($pos.before(i), undefined, {
                  ...node.attrs,
                  open: !node.attrs.open,
                })
              );
              return true;
            }
          }
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (selectedNoteId && user && db) {
        const html = editor.getHTML()
        const noteRef = doc(db, "users", user.uid, "notes", selectedNoteId)
        updateDocumentNonBlocking(noteRef, { 
          content: html,
          updatedAt: new Date().toISOString()
        })
      }

      const { selection } = editor.state;
      if (selection.empty) {
        const { $from } = selection;
        const text = $from.parent.textContent.substring(0, $from.parentOffset);
        const slashMatch = text.match(/^\/([a-zA-Z0-9_]*)/);

        if (slashMatch && !text.includes(' ')) {
          setIsSlashMenuOpen(true);
          setSlashQuery(slashMatch[1]);
        } else {
          setIsSlashMenuOpen(false);
          setSlashQuery('');
        }
      } else {
        setIsSlashMenuOpen(false);
        setSlashQuery('');
      }
    },
  }, [selectedNoteId])

  React.useEffect(() => {
    if (editor && selectedNote && !editor.isFocused) {
      const currentHtml = editor.getHTML()
      if (currentHtml !== selectedNote.content) {
        editor.commands.setContent(selectedNote.content)
      }
    }
  }, [selectedNoteId, editor, selectedNote?.content])

  const handleCreateNote = () => {
    if (!user || !db) return
    const noteId = doc(collection(db, "temp")).id
    const noteRef = doc(db, "users", user.uid, "notes", noteId)
    const newNote = {
      id: noteId,
      title: "untitled",
      content: "<p></p>",
      icon: "file-text",
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'icon' | 'inline-image') => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setIsUploading(true)
    const filename = `notebooks/${user.uid}/${type}-${Date.now()}-${file.name}`
    try {
      const response = await fetch(`/api/upload?filename=${filename}`, { method: 'POST', body: file })
      const blob = await response.json()
      
      if (type === 'inline-image') {
        editor?.chain().focus().setImage({ src: blob.url }).run()
      } else {
        updateMedia(blob.url, type)
      }
    } catch (error) {
      console.error("upload failed", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleApplyCommand = (command: string, params?: any) => {
    if (!editor) return

    const { from } = editor.state.selection;
    const range = {
      from: from - (slashQuery.length + 1),
      to: from,
    };

    editor.chain().focus().deleteRange(range).run()

    switch (command) {
      case 'h1': editor.chain().focus().toggleHeading({ level: 1 }).run(); break;
      case 'h2': editor.chain().focus().toggleHeading({ level: 2 }).run(); break;
      case 'bullet': editor.chain().focus().toggleBulletList().run(); break;
      case 'number': editor.chain().focus().toggleOrderedList().run(); break;
      case 'task': editor.chain().focus().toggleTaskList().run(); break;
      case 'toggle': 
        editor.chain().focus().insertContent('<details open><summary></summary><p></p></details><p></p>').run(); 
        break;
      case 'columns':
        editor.chain().focus().insertContent('<div class="notion-columns"><div class="notion-column"><p></p></div><div class="notion-column"><p></p></div></div><p></p>').run();
        break;
      case 'image':
        document.getElementById('inline-image-upload')?.click();
        break;
      case 'subpage': 
        if (params?.id) {
          // Insert the custom non-editable PageLinkNode
          editor.chain().focus().insertContent({
            type: 'pageLink',
            attrs: {
              id: params.id,
              title: params.title || 'untitled',
              icon: params.icon || 'file-text'
            }
          }).run();
          editor.chain().focus().insertContent('<p></p>').run();
        }
        break;
      default: break;
    }
    setIsSlashMenuOpen(false)
  }

  if (!mounted || isUserLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[9999]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const displayName = user?.isAnonymous ? "guest" : (user?.displayName || user?.email?.split('@')[0] || 'guko');

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans selection:bg-[#c1e2ff]">
      <input 
        id="inline-image-upload" 
        type="file" 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => handleFileUpload(e, 'inline-image')} 
      />

      <aside className="w-[240px] flex flex-col shrink-0 bg-[#fbfbfa] border-r border-[#0000000f] h-full overflow-hidden group/sidebar">
        <div className="p-4 flex items-center justify-between hover:bg-[#0000000a] transition-colors cursor-pointer group">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center shrink-0">
               <span className="text-[10px] font-bold text-primary">{displayName[0]}</span>
            </div>
            <span className="text-sm font-semibold truncate lowercase text-[#37352f]">{displayName}'s workspace</span>
          </div>
          <ChevronsUpDown size={14} className="text-[#37352f]/40 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

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

        <div className="px-2 mt-6">
          <SidebarAction 
            icon={<Home size={16} />} 
            label="return to dashboard" 
            onClick={() => router.push('/')}
            className="text-primary font-bold"
          />
        </div>

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

      <main className="flex-1 relative flex flex-col bg-white overflow-hidden">
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
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <IconRenderer icon={selectedNote.icon} className="w-full h-full" />
                  </div>
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

              <div className="max-w-[800px] mx-auto w-full px-12 pb-40 relative">
                <div className="relative group -mt-16 mb-8 w-fit">
                  <div 
                    onClick={() => { setPickerType('icon'); setIsMediaPickerOpen(true); }}
                    className="text-8xl cursor-pointer hover:bg-[#0000000a] p-2 rounded-3xl transition-all flex items-center justify-center min-w-[128px] min-h-[128px] emoji-font"
                  >
                    <IconRenderer icon={selectedNote.icon} className="w-24 h-24" />
                  </div>
                </div>

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

                <div className="notion-tiptap-container min-h-[500px]">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          ) : null}

          {selectedNote && isSlashMenuOpen && editor && (
             <SlashCommandMenu 
                editor={editor} 
                onApply={handleApplyCommand} 
                notes={notes || []}
                onClose={() => setIsSlashMenuOpen(false)}
                query={slashQuery}
             />
          )}

          {selectedNote && editor && !isSlashMenuOpen && (
            <div className="fixed bottom-12 left-[calc(50%+120px)] -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-white border border-[#0000001a] shadow-[0_12px_24px_rgba(0,0,0,0.08)] rounded-2xl animate-in slide-in-from-bottom-4 duration-300 z-50">
               <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} icon={<Bold size={18} />} />
               <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} icon={<Italic size={18} />} />
               <div className="w-[1px] h-5 bg-border/40 mx-1" />
               <ToolbarButton active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} icon={<Heading1 size={18} />} />
               <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={<Heading2 size={18} />} />
               <div className="w-[1px] h-5 bg-border/40 mx-1" />
               <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<List size={18} />} />
               <ToolbarButton active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} icon={<SquareCheck size={18} />} />
            </div>
          )}
        </div>
      </main>

      <Dialog open={isMediaPickerOpen} onOpenChange={setIsMediaPickerOpen}>
        <DialogContent className="max-w-2xl p-0 border-none bg-white shadow-3xl overflow-hidden rounded-[32px]">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold lowercase text-[#37352f]">change {pickerType}</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="library" className="w-full">
            <div className="px-6 border-b border-border/10">
              <TabsList className="bg-transparent gap-6 p-0 h-12 w-full justify-start border-none">
                <TabsTrigger value="library" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#37352f] data-[state=active]:bg-transparent shadow-none px-0 lowercase h-12 text-sm">library</TabsTrigger>
                <TabsTrigger value="emoji" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#37352f] data-[state=active]:bg-transparent shadow-none px-0 lowercase h-12 text-sm">emoji</TabsTrigger>
                <TabsTrigger value="custom" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#37352f] data-[state=active]:bg-transparent shadow-none px-0 lowercase h-12 text-sm">custom</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
              <TabsContent value="library" className="m-0 mt-0">
                {pickerType === 'icon' ? (
                  <div className="grid grid-cols-8 gap-2">
                    {Object.keys(LUCIDE_ICONS).map((iconName) => (
                      <button 
                        key={iconName} 
                        onClick={() => updateMedia(iconName, 'icon')}
                        className="aspect-square flex items-center justify-center p-2 rounded-xl hover:bg-muted/10 transition-all border border-transparent hover:border-border/40 group"
                        title={iconName}
                      >
                        <IconRenderer icon={iconName} className="w-full h-full text-[#37352f]/60 group-hover:text-[#37352f]" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {STOCK_COVERS.map((item, i) => (
                      <button 
                        key={i} 
                        onClick={() => updateMedia(item, 'cover')}
                        className="relative aspect-video rounded-xl overflow-hidden hover:opacity-80 transition-all border-2 border-transparent hover:border-[#37352f]/20"
                      >
                        <img src={item} className="w-full h-full object-cover" alt="stock" />
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="emoji" className="m-0 mt-0">
                <div className="grid grid-cols-8 gap-2">
                  {EMOJIS.map((emoji, i) => (
                    <button 
                      key={i} 
                      onClick={() => updateMedia(emoji, 'icon')}
                      className="aspect-square flex items-center justify-center text-2xl rounded-xl hover:bg-muted/10 transition-all border border-transparent hover:border-border/40 emoji-font"
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
                    <p className="text-sm font-bold lowercase text-[#37352f]">upload {pickerType === 'icon' ? 'an icon' : 'a banner'}</p>
                    <p className="text-xs text-muted-foreground lowercase">recommended for {pickerType === 'icon' ? 'square aspect' : 'wide aspect'}</p>
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
                    <input 
                      placeholder="https://..." 
                      className="flex h-10 w-full rounded-xl border border-border/40 bg-muted/5 px-3 py-2 text-sm lowercase focus:outline-none" 
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
    </div>
  )
}

function SlashCommandMenu({ editor, onApply, notes, onClose, query }: { editor: any, onApply: (cmd: string, params?: any) => void, notes: any[], onClose: () => void, query: string }) {
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [showSubpagePicker, setShowSubpagePicker] = React.useState(false)

  const allCommands = React.useMemo(() => [
    { id: 'text', label: 'text', desc: 'start writing with plain text.', icon: <Type size={16} />, action: () => onApply('text') },
    { id: 'h1', label: 'heading 1', desc: 'large section heading.', icon: <Heading1 size={16} />, action: () => onApply('h1') },
    { id: 'h2', label: 'heading 2', desc: 'medium section heading.', icon: <Heading2 size={16} />, action: () => onApply('h2') },
    { id: 'bullet', label: 'bulleted list', desc: 'create a simple bulleted list.', icon: <List size={16} />, action: () => onApply('bullet') },
    { id: 'number', label: 'numbered list', desc: 'create a list with numbering.', icon: <List size={16} className="rotate-180" />, action: () => onApply('number') },
    { id: 'task', label: 'check list', desc: 'track tasks with checkboxes.', icon: <SquareCheck size={16} />, action: () => onApply('task') },
    { id: 'toggle', label: 'toggle list', desc: 'toggles can hide content inside.', icon: <ChevronRight size={16} />, action: () => onApply('toggle') },
    { id: 'columns', label: 'columns', desc: 'divide page into two blocks.', icon: <ColumnsIcon size={16} />, action: () => onApply('columns') },
    { id: 'image', label: 'image', desc: 'upload or insert a picture.', icon: <ImageFileIcon size={16} />, action: () => onApply('image') },
    { id: 'subpage', label: 'link to page', desc: 'reference another page here.', icon: <FileText size={16} />, action: () => setShowSubpagePicker(true) },
  ], [onApply]);

  const filteredCommands = React.useMemo(() => 
    allCommands.filter(cmd => 
      cmd.label.toLowerCase().includes(query.toLowerCase())
    ), 
    [query, allCommands]
  );

  React.useEffect(() => {
    const menu = menuRef.current;
    if (editor && menu && query !== undefined) {
      const { from } = editor.state.selection;
      const { top, left, bottom } = editor.view.coordsAtPos(from);
      const menuHeight = menu.offsetHeight;
      
      const enoughSpaceAbove = top > menuHeight + 20;

      menu.style.left = `${left}px`;
      
      if (enoughSpaceAbove) {
        menu.style.top = `${top - 10}px`;
        menu.style.transform = 'translateY(-100%)';
      } else {
        menu.style.top = `${bottom + 10}px`;
        menu.style.transform = 'translateY(0)';
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editor, query, onClose]);

  return (
    <div 
      ref={menuRef}
      className="fixed z-[999] bg-white border border-[#0000001a] shadow-[0_12px_24px_rgba(0,0,0,0.08)] rounded-2xl w-72 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {!showSubpagePicker ? (
        <div className="p-1 max-h-80 overflow-y-auto custom-scrollbar">
          {filteredCommands.length > 0 ? (
            <>
              <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">basic blocks</div>
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className="w-full flex items-center gap-3 p-2 hover:bg-[#0000000a] transition-colors rounded-xl group text-left"
                >
                  <div className="h-10 w-10 shrink-0 bg-white border border-border shadow-sm rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    {cmd.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#37352f] lowercase">{cmd.label}</div>
                    <div className="text-[10px] text-muted-foreground lowercase truncate">{cmd.desc}</div>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className="p-4 text-sm text-center text-muted-foreground">no matching commands.</div>
          )}
        </div>
      ) : (
        <div className="p-1">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/10 mb-1">
             <button onClick={() => setShowSubpagePicker(false)} className="p-1 hover:bg-muted rounded"><ChevronLeft size={14} /></button>
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">link to page</span>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {notes.map(note => (
              <button
                key={note.id}
                onClick={() => onApply('subpage', { id: note.id, title: note.title, icon: note.icon })}
                className="w-full flex items-center gap-2 p-2 hover:bg-[#0000000a] transition-colors rounded-xl text-left"
              >
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                  <IconRenderer icon={note.icon} className="w-full h-full opacity-60" />
                </div>
                <span className="text-sm text-[#37352f] truncate lowercase">{note.title || 'untitled'}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function IconRenderer({ icon, className }: { icon: string, className?: string }) {
  if (!icon) return <FileText className={className} />;
  const LucideIcon = LUCIDE_ICONS[icon];
  if (LucideIcon) return <LucideIcon className={className} />;
  if (icon.startsWith('http') || icon.startsWith('data:')) return <img src={icon} className={cn("object-cover", className)} alt="icon" />;
  return <span className={cn("leading-none emoji-font", className)}>{icon}</span>;
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
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          <IconRenderer icon={note.icon} className="w-full h-full opacity-70" />
        </div>
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
        <div className="absolute -top-8 left-6 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-3xl group-hover:scale-110 transition-transform p-3">
          <IconRenderer icon={note.icon} className="w-full h-full" />
        </div>
        <div className="mt-4 space-y-1">
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
