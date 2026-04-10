"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  Layers, 
  Play, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Loader2, 
  LogIn, 
  ChevronLeft, 
  ChevronRight,
  Search, 
  GraduationCap,
  Image as ImageIcon,
  BookOpen,
  RotateCcw,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Smile,
  Settings2,
  CheckCircle2,
  XCircle,
  Trophy,
  Activity,
  RefreshCw
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { 
  useUser, 
  useFirestore, 
  useAuth, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
  initiateAnonymousSignIn
} from "@/firebase"
import { collection, doc, query, orderBy, serverTimestamp } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { cn } from "@/lib/utils"

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

type StudyMode = 'classic' | 'tracking' | null

export default function FlashcardsPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  
  const [selectedDeckId, setSelectedDeckId] = React.useState<string | null>(null)
  const [activeStudyMode, setActiveStudyMode] = React.useState<StudyMode>(null)
  const [isModeSelectorOpen, setIsModeSelectorOpen] = React.useState(false)
  const [isCreateDeckOpen, setIsCreateDeckOpen] = React.useState(false)
  const [isCreateCardOpen, setIsCreateCardOpen] = React.useState(false)
  const [newDeckName, setNewDeckName] = React.useState("")
  
  // Card form image state
  const [cardImageUrl, setCardImageUrl] = React.useState("")
  const [cardAnswerImageUrl, setCardAnswerImageUrl] = React.useState("")

  // Tiptap editors
  const questionEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Type your question here...' }),
    ],
    content: '',
  })

  const answerEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Type the answer here...' }),
    ],
    content: '',
  })

  // Fetch courses first
  const coursesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "users", user.uid, "courses"))
  }, [db, user])

  const { data: courses, isLoading: isCoursesLoading } = useCollection(coursesQuery)
  const activeCourse = courses?.[0]

  // Decks query
  const decksQuery = useMemoFirebase(() => {
    if (!db || !user || !activeCourse) return null
    return query(
      collection(db, "users", user.uid, "courses", activeCourse.id, "flashcardSets"),
      orderBy("createdAt", "desc")
    )
  }, [db, user, activeCourse])

  const { data: decks, isLoading: isDecksLoading } = useCollection(decksQuery)
  const selectedDeck = decks?.find(d => d.id === selectedDeckId)

  // Cards query for selected deck
  const cardsQuery = useMemoFirebase(() => {
    if (!db || !user || !activeCourse || !selectedDeckId) return null
    return query(
      collection(db, "users", user.uid, "courses", activeCourse.id, "flashcardSets", selectedDeckId, "flashcards"),
      orderBy("createdAt", "desc")
    )
  }, [db, user, activeCourse, selectedDeckId])

  const { data: cards, isLoading: isCardsLoading } = useCollection(cardsQuery)

  const handleCreateDeck = () => {
    if (!user || !db || !newDeckName.trim()) return

    let courseIdToUse = activeCourse?.id
    
    if (!courseIdToUse) {
      courseIdToUse = doc(collection(db, "temp")).id
      const courseRef = doc(db, "users", user.uid, "courses", courseIdToUse)
      setDocumentNonBlocking(courseRef, {
        id: courseIdToUse,
        name: "General Studies",
        description: "Default course for your flashcards",
      }, { merge: true })
    }

    const deckId = doc(collection(db, "temp")).id
    const deckRef = doc(db, "users", user.uid, "courses", courseIdToUse, "flashcardSets", deckId)
    setDocumentNonBlocking(deckRef, {
      id: deckId,
      name: newDeckName,
      courseId: courseIdToUse,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true })

    setNewDeckName("")
    setIsCreateDeckOpen(false)
  }

  const handleDeleteDeck = (deckId: string) => {
    if (!user || !db || !activeCourse) return
    const deckRef = doc(db, "users", user.uid, "courses", activeCourse.id, "flashcardSets", deckId)
    deleteDocumentNonBlocking(deckRef)
    if (selectedDeckId === deckId) {
      setSelectedDeckId(null)
      setActiveStudyMode(null)
    }
  }

  const handleAddCard = () => {
    if (!user || !db || !activeCourse || !selectedDeckId || !questionEditor || !answerEditor) return
    
    const questionHtml = questionEditor.getHTML()
    const answerHtml = answerEditor.getHTML()

    if (questionEditor.isEmpty || answerEditor.isEmpty) return

    const cardId = doc(collection(db, "temp")).id
    const cardRef = doc(db, "users", user.uid, "courses", activeCourse.id, "flashcardSets", selectedDeckId, "flashcards", cardId)
    
    setDocumentNonBlocking(cardRef, {
      id: cardId,
      flashcardSetId: selectedDeckId,
      question: questionHtml,
      answer: answerHtml,
      imageUrl: cardImageUrl.trim() || null,
      answerImageUrl: cardAnswerImageUrl.trim() || null,
      lastReviewedAt: new Date().toISOString(),
      reviewCount: 0,
      easeFactor: 2.5,
      nextReviewAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true })

    questionEditor.commands.clearContent()
    answerEditor.commands.clearContent()
    setCardImageUrl("")
    setCardAnswerImageUrl("")
    setIsCreateCardOpen(false)
  }

  const handleDeleteCard = (cardId: string) => {
    if (!user || !db || !activeCourse || !selectedDeckId) return
    const cardRef = doc(db, "users", user.uid, "courses", activeCourse.id, "flashcardSets", selectedDeckId, "flashcards", cardId)
    deleteDocumentNonBlocking(cardRef)
  }

  const handleStartStudy = (mode: StudyMode) => {
    setActiveStudyMode(mode)
    setIsModeSelectorOpen(false)
  }

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="p-6 bg-primary/10 rounded-full">
          <Layers className="h-12 w-12 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold font-headline">Flashcard Central</h2>
          <p className="text-muted-foreground mt-2 text-lg">Sign in to start creating your study decks.</p>
        </div>
        <Button onClick={() => initiateAnonymousSignIn(auth)} className="rounded-2xl py-6 px-8 font-bold gap-2">
          <LogIn className="h-5 w-5" /> Start Studying (Guest)
        </Button>
      </div>
    )
  }

  if (selectedDeckId && selectedDeck && activeStudyMode) {
    return (
      <StudyView 
        deckName={selectedDeck.name} 
        cards={cards || []} 
        mode={activeStudyMode}
        isLoading={isCardsLoading}
        onExit={() => setActiveStudyMode(null)}
        onCardAction={(cardId, correct) => {
          if (!db || !user || !activeCourse) return;
          const cardRef = doc(db, "users", user.uid, "courses", activeCourse.id, "flashcardSets", selectedDeckId, "flashcards", cardId);
          updateDocumentNonBlocking(cardRef, {
            reviewCount: (cards?.find(c => c.id === cardId)?.reviewCount || 0) + 1,
            lastReviewedAt: new Date().toISOString(),
            easeFactor: correct ? 3.0 : 1.5
          });
        }}
      />
    )
  }

  if (selectedDeckId && selectedDeck && !activeStudyMode) {
    return (
      <div className="space-y-8 animate-smooth-slow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDeckId(null)} className="rounded-xl">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground">{selectedDeck.name}</h1>
              <p className="text-muted-foreground mt-1">
                Editing {cards?.length || 0} cards in this deck
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Dialog open={isModeSelectorOpen} onOpenChange={setIsModeSelectorOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary text-primary-foreground font-bold py-6 px-8 rounded-2xl shadow-lg transition-all hover:scale-105"
                >
                  <Play className="h-5 w-5 mr-2" /> Study Now
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[32px] sm:max-w-md border-none bg-background shadow-2xl p-8">
                <DialogHeader className="text-left mb-6">
                  <DialogTitle className="font-headline text-2xl font-bold">Select Study Mode</DialogTitle>
                  <DialogDescription>Choose how you want to learn today.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <Button 
                    variant="outline" 
                    className="flex items-center justify-between p-6 h-auto rounded-2xl border-2 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                    onClick={() => handleStartStudy('classic')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-muted group-hover:bg-primary/20 transition-colors">
                        <RotateCcw className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <div>
                        <div className="font-bold text-lg">Classic Mode</div>
                        <div className="text-sm text-muted-foreground">Standard flip and review.</div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex items-center justify-between p-6 h-auto rounded-2xl border-2 hover:border-accent hover:bg-accent/5 transition-all text-left group"
                    onClick={() => handleStartStudy('tracking')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-muted group-hover:bg-accent/20 transition-colors">
                        <Activity className="h-6 w-6 text-muted-foreground group-hover:text-accent-foreground" />
                      </div>
                      <div>
                        <div className="font-bold text-lg">Tracking Mode</div>
                        <div className="text-sm text-muted-foreground">Track mastery with Got it/Need Review.</div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateCardOpen} onOpenChange={setIsCreateCardOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="font-bold py-6 px-8 rounded-2xl shadow-sm transition-all hover:bg-muted">
                  <Plus className="h-5 w-5 mr-2" /> Add Card
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[32px] sm:max-w-2xl p-0 max-h-[90vh] overflow-hidden flex flex-col border-none bg-background shadow-2xl">
                <DialogHeader className="p-8 pb-0 text-left shrink-0">
                  <DialogTitle className="font-headline text-2xl font-bold">Create Flashcard</DialogTitle>
                  <DialogDescription className="text-base">
                    Type and format your card directly.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
                  <div className="space-y-8 pb-4">
                    {/* Question Section */}
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Question / Front</Label>
                      {cardImageUrl && (
                        <div className="relative w-full rounded-2xl overflow-hidden border mb-3">
                          <img src={cardImageUrl} alt="Front Visual" className="w-full h-auto max-h-[250px] object-contain block mx-auto" />
                          <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg" onClick={() => setCardImageUrl("")}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <div className="border rounded-2xl bg-white p-6 shadow-sm transition-all">
                        <EditorContent editor={questionEditor} className="tiptap-editor min-h-[100px]" />
                        <RichFormattingToolbar 
                          editor={questionEditor} 
                          imageUrl={cardImageUrl} 
                          onSetImageUrl={setCardImageUrl} 
                          label="Front Image" 
                        />
                      </div>
                    </div>

                    {/* Answer Section */}
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Answer / Back</Label>
                      {cardAnswerImageUrl && (
                        <div className="relative w-full rounded-2xl overflow-hidden border mb-3">
                          <img src={cardAnswerImageUrl} alt="Back Visual" className="w-full h-auto max-h-[250px] object-contain block mx-auto" />
                          <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg" onClick={() => setCardAnswerImageUrl("")}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <div className="border rounded-2xl bg-white p-6 shadow-sm transition-all">
                        <EditorContent editor={answerEditor} className="tiptap-editor min-h-[100px]" />
                        <RichFormattingToolbar 
                          editor={answerEditor} 
                          imageUrl={cardAnswerImageUrl} 
                          onSetImageUrl={setCardAnswerImageUrl} 
                          label="Back Image" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-8 pt-6 border-t shrink-0 gap-3 sm:justify-end bg-muted/5">
                  <Button variant="ghost" onClick={() => setIsCreateCardOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                  <Button onClick={handleAddCard} disabled={questionEditor?.isEmpty || answerEditor?.isEmpty} className="rounded-xl bg-primary px-8 font-bold text-primary-foreground shadow-lg shadow-primary/20">Create Card</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isCardsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : cards && cards.length > 0 ? (
          <div className="grid gap-4">
            {cards.map((card) => (
              <Card key={card.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group bg-white">
                <CardContent className="p-6 flex items-center justify-between gap-6">
                  <div className="flex-1 grid md:grid-cols-2 gap-6 items-center">
                    <div className="border-r border-border/50 pr-6 flex gap-4 items-start">
                      {card.imageUrl && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-border bg-muted/10">
                          <Image src={card.imageUrl} alt="Flashcard visual" fill unoptimized className="object-contain" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Question</span>
                        <div className="font-medium text-lg leading-tight line-clamp-2">
                          <HtmlContent html={card.question} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      {card.answerImageUrl && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-border bg-muted/10">
                          <Image src={card.answerImageUrl} alt="Answer visual" fill unoptimized className="object-contain" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Answer</span>
                        <div className="text-muted-foreground leading-snug line-clamp-2">
                          <HtmlContent html={card.answer} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCard(card.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl bg-muted/5">
            <Plus className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-bold font-headline">No cards yet</h3>
            <p className="text-muted-foreground mt-2">Start adding cards to this deck to begin studying.</p>
            <Button onClick={() => setIsCreateCardOpen(true)} className="mt-6 rounded-xl">Add First Card</Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-smooth-slow">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">Flashcard Decks</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {activeCourse ? `Course: ${activeCourse.name}` : "Master your subjects with active recall."}
          </p>
        </div>
        <div className="flex gap-4">
          <Dialog open={isCreateDeckOpen} onOpenChange={setIsCreateDeckOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-6 px-8 rounded-2xl shadow-lg transition-all hover:scale-105">
                <Plus className="h-5 w-5 mr-2" /> New Deck
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">Create New Deck</DialogTitle>
                <DialogDescription>
                  Organize your cards into topics or chapters.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Deck Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. History: The Industrial Revolution" 
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    className="rounded-xl no-focus-ring"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDeckOpen(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={handleCreateDeck} className="rounded-xl">Create Deck</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(isDecksLoading || isCoursesLoading) ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-64 animate-pulse bg-muted/20 border-none rounded-3xl" />
          ))}
        </div>
      ) : decks && decks.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <DeckCard 
              key={deck.id}
              deck={deck}
              onDelete={() => handleDeleteDeck(deck.id)}
              onEdit={() => {
                setSelectedDeckId(deck.id)
                setActiveStudyMode(null)
              }}
              onStudy={() => {
                setSelectedDeckId(deck.id)
                setIsModeSelectorOpen(true)
              }}
            />
          ))}
          <Card 
            onClick={() => setIsCreateDeckOpen(true)}
            className="border-2 border-dashed border-muted flex flex-col items-center justify-center p-8 bg-transparent hover:bg-muted/30 transition-all cursor-pointer rounded-3xl group"
          >
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-headline text-xl font-bold text-muted-foreground">Create New Deck</p>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl bg-muted/5">
          <Layers className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-xl font-bold font-headline">No decks yet</h3>
          <p className="text-muted-foreground mt-2">Create your first flashcard deck to start studying.</p>
          <Button 
            onClick={() => setIsCreateDeckOpen(true)}
            variant="outline" 
            className="mt-6 rounded-xl border-primary text-primary"
          >
            <Plus className="h-4 w-4 mr-2" /> Create First Deck
          </Button>
        </div>
      )}
    </div>
  )
}

function HtmlContent({ html, className }: { html: string, className?: string }) {
  return (
    <div 
      className={cn("tiptap-content", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function RichFormattingToolbar({ 
  editor, 
  imageUrl, 
  onSetImageUrl, 
  label 
}: { 
  editor: any, 
  imageUrl: string, 
  onSetImageUrl: (url: string) => void,
  label: string
}) {
  const [showImageUrl, setShowImageUrl] = React.useState(false)

  if (!editor) return null

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex items-center gap-1.5 p-1 bg-muted/30 border rounded-full w-fit shadow-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={editor.isActive('bold') ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8 rounded-full" 
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={editor.isActive('italic') ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8 rounded-full" 
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8 rounded-full" 
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              >
                <Heading1 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 1</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8 rounded-full" 
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                <Heading2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 2</TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowImageUrl(!showImageUrl)}>
                <ImageIcon className={cn("h-4 w-4", imageUrl && "text-primary")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => editor.chain().focus().insertContent('😊').run()}>
                <Smile className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Emoji</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {showImageUrl && (
        <div className="animate-in slide-in-from-top-1 fade-in duration-200 flex gap-2">
          <Input 
            placeholder={`Enter ${label.toLowerCase()} URL...`}
            value={imageUrl}
            onChange={(e) => onSetImageUrl(e.target.value)}
            className="rounded-xl h-10 border-primary/20 focus:border-primary flex-1 no-focus-ring"
          />
          <Button size="icon" variant="ghost" className="rounded-xl" onClick={() => setShowImageUrl(false)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

function StudyView({ 
  deckName, 
  cards, 
  mode, 
  isLoading, 
  onExit,
  onCardAction 
}: { 
  deckName: string, 
  cards: any[], 
  mode: StudyMode, 
  isLoading: boolean, 
  onExit: () => void,
  onCardAction?: (cardId: string, correct: boolean) => void
}) {
  const [sessionCards, setSessionCards] = React.useState<any[]>([])
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isFlipped, setIsFlipped] = React.useState(false)
  const [isFinished, setIsFinished] = React.useState(false)
  const [masteredIds, setMasteredIds] = React.useState<Set<string>>(new Set())
  const [missedIds, setMissedIds] = React.useState<Set<string>>(new Set())
  const [hasInitialized, setHasInitialized] = React.useState(false)

  // Initialize session cards only once when cards are available
  React.useEffect(() => {
    if (!hasInitialized && cards.length > 0) {
      setSessionCards([...cards])
      setHasInitialized(true)
    }
  }, [cards, hasInitialized])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading cards...</p>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground opacity-20" />
        <div>
          <h2 className="text-2xl font-bold font-headline">No cards to study</h2>
          <p className="text-muted-foreground mt-2">Add some cards to this deck first.</p>
        </div>
        <Button onClick={onExit} variant="outline" className="rounded-xl">Go Back</Button>
      </div>
    )
  }

  if (isFinished) {
    const totalInPass = sessionCards.length;
    const masteredInPass = masteredIds.size;
    const masteryPercent = totalInPass > 0 ? Math.round((masteredInPass / totalInPass) * 100) : 0;
    const missedCards = sessionCards.filter(c => missedIds.has(c.id));

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-in fade-in zoom-in duration-500 text-center max-w-md mx-auto relative z-10">
        <div className="p-8 bg-primary/20 rounded-full">
          <Trophy className="h-16 w-16 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-bold font-headline">{masteryPercent}% Mastered</h2>
          <p className="text-muted-foreground text-lg">
            {masteredInPass === totalInPass 
              ? "Perfect! You've mastered all cards in this pass." 
              : `You mastered ${masteredInPass} out of ${totalInPass} cards.`}
          </p>
        </div>
        
        <Card className="w-full border-none bg-muted/30 p-6 rounded-[32px]">
          <div className="flex justify-around items-center">
            <div>
              <div className="text-3xl font-bold text-primary">{masteredInPass}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mastered</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-3xl font-bold text-destructive">{missedCards.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reviewing</div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-3 w-full">
          {missedCards.length > 0 && (
            <Button 
              onClick={() => {
                setSessionCards(missedCards);
                setCurrentIndex(0);
                setIsFinished(false);
                setMasteredIds(new Set());
                setMissedIds(new Set());
                setIsFlipped(false);
              }} 
              className="w-full rounded-2xl py-6 font-bold bg-accent text-accent-foreground"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Study Remaining ({missedCards.length})
            </Button>
          )}
          <Button 
            onClick={() => {
              setSessionCards([...cards]);
              setCurrentIndex(0);
              setIsFinished(false);
              setMasteredIds(new Set());
              setMissedIds(new Set());
              setIsFlipped(false);
            }} 
            variant="outline"
            className="w-full rounded-2xl py-6 font-bold"
          >
            Restart Full Deck
          </Button>
          <Button onClick={onExit} variant="ghost" className="w-full rounded-2xl py-6 font-bold text-muted-foreground">
            Close Session
          </Button>
        </div>
      </div>
    )
  }

  const currentCard = sessionCards[currentIndex]

  const handleNext = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % sessionCards.length)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + sessionCards.length) % sessionCards.length)
  }

  const handleTrackingAction = (correct: boolean) => {
    if (!currentCard) return;

    const cardId = currentCard.id
    onCardAction?.(cardId, correct)

    if (correct) {
      setMasteredIds(prev => new Set(prev).add(cardId))
    } else {
      setMissedIds(prev => new Set(prev).add(cardId))
    }

    if (currentIndex < sessionCards.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setIsFlipped(false)
    } else {
      setIsFinished(true)
    }
  }

  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden rounded-[48px]">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/15 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-20 -right-20 w-96 h-96 bg-accent/15 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-40 w-96 h-96 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-3xl w-full space-y-8 animate-smooth-slow relative z-10 px-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onExit} className="rounded-xl gap-2 font-bold text-muted-foreground hover:text-foreground bg-white/50 backdrop-blur-sm">
            <ChevronLeft className="h-4 w-4" /> Exit Study
          </Button>
          <div className="text-center">
            <h2 className="font-headline text-xl font-bold">{deckName}</h2>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0">
                {mode}
              </Badge>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {currentIndex + 1} / {sessionCards.length}
              </p>
            </div>
          </div>
          <div className="w-24" /> 
        </div>

        <div className="flex flex-col items-center justify-center gap-12">
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative w-full aspect-[3/2] max-h-[500px] cursor-pointer perspective-1000 group"
          >
            <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front Side */}
              <Card className={`absolute inset-0 backface-hidden border-none shadow-2xl rounded-[32px] flex flex-col items-center justify-center p-12 bg-white ${isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 overflow-hidden">
                  {currentCard?.imageUrl && (
                    <div className="w-full flex-1 min-h-0 relative">
                      <img src={currentCard.imageUrl} alt="Card visual" className="w-full h-full object-contain block mx-auto" />
                    </div>
                  )}
                  <div className={cn("font-headline font-bold text-center leading-tight w-full", currentCard?.imageUrl ? "text-2xl" : "text-4xl")}>
                    <HtmlContent html={currentCard?.question || ''} />
                  </div>
                </div>
                <p className="absolute bottom-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  Click to reveal answer
                </p>
              </Card>

              {/* Back Side */}
              <Card className={`absolute inset-0 backface-hidden border-none shadow-2xl rounded-[32px] flex flex-col items-center justify-center p-12 bg-primary/10 rotate-y-180 backdrop-blur-sm ${!isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary block text-center">Answer</span>
                  {currentCard?.answerImageUrl && (
                    <div className="w-full flex-1 min-h-0 relative">
                      <img src={currentCard.answerImageUrl} alt="Answer visual" className="w-full h-full object-contain block mx-auto" />
                    </div>
                  )}
                  <div className={cn("font-medium text-center leading-relaxed w-full", currentCard?.answerImageUrl ? "text-xl" : "text-3xl")}>
                    <HtmlContent html={currentCard?.answer || ''} />
                  </div>
                </div>
                <p className="absolute bottom-6 text-[10px] font-bold uppercase tracking-widest text-primary">
                  Click to flip back
                </p>
              </Card>
            </div>
          </div>

          {mode === 'classic' ? (
            <div className="flex items-center gap-6">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handlePrev}
                className="h-14 w-14 rounded-full border-none shadow-md hover:scale-110 transition-transform bg-white"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setIsFlipped(!isFlipped)}
                className="h-16 w-16 rounded-full border-none shadow-lg hover:scale-110 transition-transform bg-accent text-accent-foreground"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>

              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleNext}
                className="h-14 w-14 rounded-full border-none shadow-md hover:scale-110 transition-transform bg-white"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <Button 
                onClick={() => handleTrackingAction(false)}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-2xl py-8 px-10 shadow-lg shadow-destructive/20 flex flex-col gap-1 transition-all hover:scale-105"
              >
                <XCircle className="h-6 w-6" />
                <span className="text-[10px] uppercase tracking-widest">Need Review</span>
              </Button>

              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setIsFlipped(!isFlipped)}
                className="h-14 w-14 rounded-full border-none shadow-md hover:scale-110 transition-transform bg-white/80 backdrop-blur-sm"
              >
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
              </Button>

              <Button 
                onClick={() => handleTrackingAction(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl py-8 px-10 shadow-lg shadow-primary/20 flex flex-col gap-1 transition-all hover:scale-105"
              >
                <CheckCircle2 className="h-6 w-6" />
                <span className="text-[10px] uppercase tracking-widest">Got it</span>
              </Button>
            </div>
          )}
        </div>
        
        <div className="pt-8">
          <div className="h-2 w-full bg-white/30 backdrop-blur-sm rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${((currentIndex + 1) / sessionCards.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function DeckCard({ deck, onDelete, onEdit, onStudy }: { deck: any, onDelete: () => void, onEdit: () => void, onStudy: () => void }) {
  const mastery = 0; 
  
  return (
    <Card className="group border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[32px] overflow-hidden bg-white flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="p-3 rounded-2xl bg-primary/10">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onEdit}>
                <Settings2 className="h-4 w-4" /> Manage Cards
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="gap-2 cursor-pointer text-destructive focus:text-destructive" 
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" /> Delete Deck
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="font-headline text-2xl mt-4 leading-tight truncate cursor-pointer hover:text-primary transition-colors" onClick={onStudy}>
          {deck.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-4 flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between text-sm items-center">
            <div className="flex flex-col">
              <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Created</span>
              <span className="text-muted-foreground font-medium">
                {new Date(deck.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
              <span>Mastery</span>
              <span>{mastery}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out" 
                style={{ width: `${mastery}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={onStudy} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl py-7 w-full shadow-lg shadow-primary/10 flex items-center justify-center gap-2 group/btn">
            <Play className="h-5 w-5 fill-current transition-transform group-hover/btn:scale-110" /> Study Deck
          </Button>
          <Button variant="outline" onClick={onEdit} className="border-border hover:bg-muted font-bold rounded-2xl py-7 w-full flex items-center justify-center gap-2">
            <Edit2 className="h-4 w-4" /> Edit Cards
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}