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
  Image as ImageIcon,
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
  RefreshCw,
  HelpCircle,
  Check,
  X,
  FileText,
  Puzzle,
  Sparkles,
  Upload,
  BookOpen
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { 
  useUser, 
  useFirestore, 
  useAuth, 
  useCollection, 
  useDoc,
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
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

// AI Flow imports
import { generateQuiz, evaluateAnswer, type QuizQuestion } from "@/ai/flows/quiz-flow"
import { generateFlashcardsFromFile, type GeneratedCard } from "@/ai/flows/generate-flashcards-flow"
import { generateCardImage } from "@/ai/flows/generate-card-image-flow"
import { Progress } from "@/components/ui/progress"

type StudyMode = 'classic' | 'tracking' | 'quiz' | 'matching' | null

export default function FlashcardsPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  
  const [selectedDeckId, setSelectedDeckId] = React.useState<string | null>(null)
  const [activeStudyMode, setActiveStudyMode] = React.useState<StudyMode>(null)
  const [isModeSelectorOpen, setIsModeSelectorOpen] = React.useState(false)
  const [isCreateDeckOpen, setIsCreateDeckOpen] = React.useState(false)
  const [isCreateCardOpen, setIsCreateCardOpen] = React.useState(false)
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = React.useState(false)
  const [newDeckName, setNewDeckName] = React.useState("")
  
  const [cardImageUrl, setCardImageUrl] = React.useState("")
  const [cardAnswerImageUrl, setCardAnswerImageUrl] = React.useState("")
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [answerUploadProgress, setAnswerUploadProgress] = React.useState<number | null>(null);

  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'profile', 'settings') : null, [user, db]);
  const { data: profile } = useDoc(profileRef);
  const isHighSchool = profile?.studentType === 'high-school';

  const questionEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'type your question here...' }),
    ],
    content: '',
  })

  const answerEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'type the answer here...' }),
    ],
    content: '',
  })

  const coursesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "users", user.uid, "courses"))
  }, [db, user])

  const { data: courses, isLoading: isCoursesLoading } = useCollection(coursesQuery)
  const activeCourse = courses?.[0]

  const decksQuery = useMemoFirebase(() => {
    if (!db || !user || !activeCourse) return null
    return query(
      collection(db, "users", user.uid, "courses", activeCourse.id, "flashcardSets"),
      orderBy("createdAt", "desc")
    )
  }, [db, user, activeCourse])

  const { data: decks, isLoading: isDecksLoading } = useCollection(decksQuery)
  const selectedDeck = decks?.find(d => d.id === selectedDeckId)

  const cardsQuery = useMemoFirebase(() => {
    if (!db || !user || !activeCourse || !selectedDeckId) return null
    return query(
      collection(db, "users", user.uid, "courses", activeCourse.id, "flashcardSets", selectedDeckId, "flashcards"),
      orderBy("createdAt", "desc")
    )
  }, [db, user, activeCourse, selectedDeckId])

  const { data: cards, isLoading: isCardsLoading } = useCollection(cardsQuery)

  const handleImageUpload = async (file: File, type: 'question' | 'answer') => {
    if (!user || !selectedDeckId) return;

    const setProgress = type === 'question' ? setUploadProgress : setAnswerUploadProgress;
    const setUrl = type === 'question' ? setCardImageUrl : setCardAnswerImageUrl;
    
    setProgress(0);
    const filename = `flashcard_images/${user.uid}/${selectedDeckId}/${Date.now()}-${file.name}`;

    try {
      const response = await fetch(`/api/upload?filename=${filename}`, {
        method: 'POST',
        body: file,
      });

      const newBlob = await response.json();
      setUrl(newBlob.url);

    } catch (error) {
        console.error("image upload failed", error);
    } finally {
        setProgress(null);
    }
  };

  const handleCreateDeck = () => {
    if (!user || !db || !newDeckName.trim()) return

    let courseIdToUse = activeCourse?.id
    
    if (!courseIdToUse) {
      courseIdToUse = doc(collection(db, "temp")).id
      const courseRef = doc(db, "users", user.uid, "courses", courseIdToUse)
      setDocumentNonBlocking(courseRef, {
        id: courseIdToUse,
        name: isHighSchool ? "general classes" : "general studies",
        description: "default course for your flashcards",
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
          <h2 className="text-3xl font-bold font-headline">flashcard central</h2>
          <p className="text-muted-foreground mt-2 text-lg">sign in to start creating your study decks.</p>
        </div>
        <Button onClick={() => initiateAnonymousSignIn(auth)} className="rounded-2xl py-6 px-8 font-bold gap-2">
          <LogIn className="h-5 w-5" /> start studying (guest)
        </Button>
      </div>
    )
  }

  if (selectedDeckId && selectedDeck && activeStudyMode) {
    if (activeStudyMode === 'quiz') {
      return (
        <QuizView 
          deckName={selectedDeck.name}
          cards={cards || []}
          onExit={() => setActiveStudyMode(null)}
        />
      )
    }

    if (activeStudyMode === 'matching') {
      return (
        <MatchingView 
          deckName={selectedDeck.name}
          cards={cards || []}
          onExit={() => setActiveStudyMode(null)}
        />
      )
    }

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
              <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground lowercase">{selectedDeck.name}</h1>
              <p className="text-muted-foreground mt-1 lowercase">
                editing {cards?.length || 0} cards in this deck
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Dialog open={isModeSelectorOpen} onOpenChange={setIsModeSelectorOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary text-primary-foreground font-bold py-6 px-8 rounded-2xl shadow-lg transition-all hover:scale-105"
                >
                  <Play className="h-5 w-5 mr-2" /> study now
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[32px] sm:max-w-md border-none bg-background shadow-2xl p-8">
                <DialogHeader className="text-left mb-6">
                  <DialogTitle className="font-headline text-2xl font-bold lowercase">select study mode</DialogTitle>
                  <DialogDescription className="lowercase">choose how you want to learn today.</DialogDescription>
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
                        <div className="font-bold text-lg lowercase">classic mode</div>
                        <div className="text-sm text-muted-foreground lowercase">standard flip and review.</div>
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
                        <div className="font-bold text-lg lowercase">tracking mode</div>
                        <div className="text-sm text-muted-foreground lowercase">track mastery with got it/need review.</div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex items-center justify-between p-6 h-auto rounded-2xl border-2 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                    onClick={() => handleStartStudy('quiz')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-muted group-hover:bg-indigo-100 transition-colors">
                        <FileText className="h-6 w-6 text-muted-foreground group-hover:text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-bold text-lg lowercase">quiz mode</div>
                        <div className="text-sm text-muted-foreground lowercase">test yourself with questions.</div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex items-center justify-between p-6 h-auto rounded-2xl border-2 hover:border-orange-500 hover:bg-orange-50 transition-all text-left group"
                    onClick={() => handleStartStudy('matching')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-muted group-hover:bg-orange-100 transition-colors">
                        <Puzzle className="h-6 w-6 text-muted-foreground group-hover:text-orange-600" />
                      </div>
                      <div>
                        <div className="font-bold text-lg lowercase">matching mode</div>
                        <div className="text-sm text-muted-foreground lowercase">pair questions with answers.</div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateCardOpen} onOpenChange={setIsCreateCardOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="font-bold py-6 px-8 rounded-2xl shadow-sm transition-all hover:bg-muted lowercase">
                  <Plus className="h-5 w-5 mr-2" /> add card
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[32px] sm:max-w-2xl p-0 max-h-[90vh] overflow-hidden flex flex-col border-none bg-background shadow-2xl">
                <DialogHeader className="p-8 pb-0 text-left shrink-0">
                  <DialogTitle className="font-headline text-2xl font-bold lowercase">create flashcard</DialogTitle>
                  <DialogDescription className="text-base lowercase">
                    type and format your card directly.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
                  <div className="space-y-8 pb-4">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">question / front</Label>
                      {cardImageUrl && (
                        <div className="relative w-full rounded-2xl overflow-hidden border mb-3">
                          <img src={cardImageUrl} alt="front visual" className="w-full h-auto max-h-[250px] object-contain block mx-auto" />
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
                          label="front image"
                          onFileUpload={(file) => handleImageUpload(file, 'question')}
                          uploadProgress={uploadProgress}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">answer / back</Label>
                      {cardAnswerImageUrl && (
                        <div className="relative w-full rounded-2xl overflow-hidden border mb-3">
                          <img src={cardAnswerImageUrl} alt="back visual" className="w-full h-auto max-h-[250px] object-contain block mx-auto" />
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
                          label="back image"
                          onFileUpload={(file) => handleImageUpload(file, 'answer')}
                          uploadProgress={answerUploadProgress}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-8 pt-6 border-t shrink-0 gap-3 sm:justify-end bg-muted/5">
                  <Button variant="ghost" onClick={() => setIsCreateCardOpen(false)} className="rounded-xl font-bold lowercase">cancel</Button>
                  <Button onClick={handleAddCard} disabled={questionEditor?.isEmpty || answerEditor?.isEmpty} className="rounded-xl bg-primary px-8 font-bold text-primary-foreground shadow-lg shadow-primary/20 lowercase">create card</Button>
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
                          <Image src={card.imageUrl} alt="flashcard visual" fill unoptimized className="object-contain" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">question</span>
                        <div className="font-medium text-lg leading-tight line-clamp-2">
                          <HtmlContent html={card.question} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      {card.answerImageUrl && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-border bg-muted/10">
                          <Image src={card.answerImageUrl} alt="answer visual" fill unoptimized className="object-contain" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">answer</span>
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
            <h3 className="text-xl font-bold font-headline lowercase">no cards yet</h3>
            <p className="text-muted-foreground mt-2 lowercase">start adding cards to this deck to begin studying.</p>
            <Button onClick={() => setIsCreateCardOpen(true)} className="mt-6 rounded-xl lowercase">add first card</Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-smooth-slow">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground lowercase">flashcard decks</h1>
          <p className="text-muted-foreground mt-2 text-lg lowercase">
            {activeCourse ? `${isHighSchool ? 'class' : 'course'}: ${activeCourse.name}` : "master your subjects with active recall."}
          </p>
        </div>
        <div className="flex gap-3">
          <AiGeneratorDialog 
            isOpen={isAiGeneratorOpen} 
            setIsOpen={setIsAiGeneratorOpen} 
            isHighSchool={isHighSchool}
            user={user}
            activeCourse={activeCourse}
            db={db}
          />
          
          <Dialog open={isCreateDeckOpen} onOpenChange={setIsCreateDeckOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-2 font-bold py-6 px-8 rounded-2xl shadow-sm transition-all hover:scale-105 lowercase">
                <Plus className="h-5 w-5 mr-2" /> new deck
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl lowercase">create new deck</DialogTitle>
                <DialogDescription className="lowercase">
                  organize your cards into topics or chapters.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="lowercase">deck name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. history: the industrial revolution" 
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    className="rounded-xl no-focus-ring lowercase"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDeckOpen(false)} className="rounded-xl lowercase">cancel</Button>
                <Button onClick={handleCreateDeck} className="rounded-xl lowercase">create deck</Button>
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
            <p className="font-headline text-xl font-bold text-muted-foreground lowercase">create new deck</p>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl bg-muted/5">
          <Layers className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-xl font-bold font-headline lowercase">no decks yet</h3>
          <p className="text-muted-foreground mt-2 lowercase">create your first flashcard deck or use ai to generate one.</p>
          <div className="flex gap-4 mt-6">
            <Button 
              onClick={() => setIsCreateDeckOpen(true)}
              variant="outline" 
              className="rounded-xl border-primary text-primary lowercase"
            >
              <Plus className="h-4 w-4 mr-2" /> create first deck
            </Button>
            <Button 
              onClick={() => setIsAiGeneratorOpen(true)}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white lowercase"
            >
              <Sparkles className="h-4 w-4 mr-2" /> generate with ai
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function AiGeneratorDialog({ isOpen, setIsOpen, isHighSchool, user, activeCourse, db }: any) {
  const [file, setFile] = React.useState<File | null>(null)
  const [deckName, setDeckName] = React.useState("")
  const [gradeLevel, setGradeLevel] = React.useState("")
  const [instructions, setInstructions] = React.useState("")
  const [includeImages, setIncludeImages] = React.useState(true)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [generationProgress, setGenerationProgress] = React.useState(0)
  const [statusMessage, setStatusMessage] = React.useState("")

  const handleGenerate = async () => {
    if (!user || !db || (!file && !instructions)) return

    setIsGenerating(true)
    setGenerationProgress(10)
    setStatusMessage("reading your materials...")

    try {
      let fileDataUri = ""
      if (file) {
        const reader = new FileReader()
        fileDataUri = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })
      }

      setGenerationProgress(30)
      setStatusMessage("ai is drafting your cards...")

      const output = await generateFlashcardsFromFile({
        fileDataUri: fileDataUri || undefined,
        deckName,
        educationLevel: gradeLevel || (isHighSchool ? "high school" : "college"),
        instructions,
      })

      setGenerationProgress(60)
      setStatusMessage(`generated ${output.cards.length} cards. creating deck...`)

      // 1. Create Course if needed
      let courseIdToUse = activeCourse?.id
      if (!courseIdToUse) {
        courseIdToUse = doc(collection(db, "temp")).id
        const courseRef = doc(db, "users", user.uid, "courses", courseIdToUse)
        setDocumentNonBlocking(courseRef, {
          id: courseIdToUse,
          name: isHighSchool ? "general classes" : "general studies",
          description: "default course for your flashcards",
        }, { merge: true })
      }

      // 2. Create Deck
      const deckId = doc(collection(db, "temp")).id
      const deckRef = doc(db, "users", user.uid, "courses", courseIdToUse, "flashcardSets", deckId)
      setDocumentNonBlocking(deckRef, {
        id: deckId,
        name: deckName || `ai generated: ${new Date().toLocaleDateString()}`,
        courseId: courseIdToUse,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true })

      // 3. Create Cards (and generate images if requested)
      setGenerationProgress(80)
      if (includeImages) {
        setStatusMessage("adding visual aids...")
      }

      for (let i = 0; i < output.cards.length; i++) {
        const cardData = output.cards[i]
        const cardId = doc(collection(db, "temp")).id
        const cardRef = doc(db, "users", user.uid, "courses", courseIdToUse, "flashcardSets", deckId, "flashcards", cardId)
        
        let imageUrl = null
        if (includeImages && cardData.imagePrompt) {
          try {
            const imgResult = await generateCardImage({ prompt: cardData.imagePrompt })
            imageUrl = imgResult.imageUrl
          } catch (e) {
            console.error("failed to generate card image", e)
          }
        }

        setDocumentNonBlocking(cardRef, {
          id: cardId,
          flashcardSetId: deckId,
          question: `<p>${cardData.question}</p>`,
          answer: `<p>${cardData.answer}</p>`,
          imageUrl: imageUrl,
          lastReviewedAt: new Date().toISOString(),
          reviewCount: 0,
          easeFactor: 2.5,
          nextReviewAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true })
      }

      setGenerationProgress(100)
      setStatusMessage("deck ready!")
      setTimeout(() => {
        setIsOpen(false)
        setIsGenerating(false)
        setGenerationProgress(0)
        setFile(null)
        setDeckName("")
        setInstructions("")
      }, 1000)

    } catch (e) {
      console.error("ai generation failed", e)
      setStatusMessage("generation failed. try again?")
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 px-8 rounded-2xl shadow-lg transition-all hover:scale-105 lowercase">
          <Sparkles className="h-5 w-5 mr-2" /> generate with ai
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[32px] sm:max-w-xl p-0 overflow-hidden border-none bg-background shadow-2xl">
        <DialogHeader className="p-8 pb-4 text-left bg-indigo-50/50">
          <DialogTitle className="font-headline text-2xl font-bold flex items-center gap-2 text-indigo-900 lowercase">
            <Sparkles className="h-6 w-6" /> ai deck builder
          </DialogTitle>
          <DialogDescription className="text-indigo-700 lowercase">
            upload notes or describe a topic to get a custom deck in seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {isGenerating ? (
            <div className="py-12 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
              <div className="relative">
                <div className="h-24 w-24 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                <Sparkles className="h-8 w-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-bold text-lg text-indigo-900 lowercase">{statusMessage}</h3>
                <Progress value={generationProgress} className="w-64 h-2 bg-indigo-100" />
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer hover:bg-indigo-50/50",
                    file ? "border-indigo-600 bg-indigo-50/30" : "border-muted"
                  )}
                  onClick={() => document.getElementById('ai-file-upload')?.click()}
                >
                  <input 
                    id="ai-file-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-10 w-10 text-indigo-600" />
                      <span className="font-bold text-sm text-indigo-900 truncate max-w-[200px] lowercase">{file.name}</span>
                      <Button variant="ghost" size="sm" className="text-xs lowercase text-muted-foreground" onClick={(e) => { e.stopPropagation(); setFile(null); }}>remove</Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-10 w-10 opacity-20" />
                      <span className="font-bold lowercase">drop your notes or click to upload</span>
                      <span className="text-xs lowercase">supports images and pdfs</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">deck name</Label>
                    <Input 
                      placeholder="e.g. biology: mitosis" 
                      value={deckName}
                      onChange={(e) => setDeckName(e.target.value)}
                      className="rounded-xl lowercase no-focus-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">grade/level</Label>
                    <Input 
                      placeholder={isHighSchool ? "e.g. 10th grade" : "e.g. college intro"} 
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="rounded-xl lowercase no-focus-ring"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">specific instructions (optional)</Label>
                  <Textarea 
                    placeholder="e.g. focus on key dates and events" 
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="rounded-2xl min-h-[80px] lowercase no-focus-ring"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl">
                  <Checkbox 
                    id="include-images" 
                    checked={includeImages} 
                    onCheckedChange={(v: any) => setIncludeImages(v)}
                    className="h-5 w-5 rounded-md"
                  />
                  <div className="flex-1">
                    <Label htmlFor="include-images" className="font-bold text-sm lowercase">generate visual aids with ai</Label>
                    <p className="text-[10px] text-muted-foreground lowercase">we'll use imagen to create helpful illustrations for your cards.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setIsOpen(false)} className="flex-1 rounded-2xl py-6 font-bold lowercase">cancel</Button>
                <Button 
                  disabled={!file && !instructions} 
                  onClick={handleGenerate}
                  className="flex-[2] rounded-2xl py-6 font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 lowercase"
                >
                  generate deck
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
  label,
  onFileUpload,
  uploadProgress
}: { 
  editor: any, 
  imageUrl: string, 
  onSetImageUrl: (url: string) => void,
  label: string,
  onFileUpload: (file: File) => void,
  uploadProgress: number | null
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  if (!editor) return null;

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
            <TooltipContent>bold</TooltipContent>
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
            <TooltipContent>italic</TooltipContent>
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
            <TooltipContent>heading 1</TooltipContent>
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
            <TooltipContent>heading 2</TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadProgress !== null}
              >
                <ImageIcon className={cn("h-4 w-4", imageUrl && "text-primary", uploadProgress !== null && "animate-pulse")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{uploadProgress !== null ? 'uploading...' : label}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => editor.chain().focus().insertContent('😊').run()}>
                <Smile className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>emoji</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {uploadProgress !== null && (
        <div className="animate-in slide-in-from-top-1 fade-in duration-200 flex items-center gap-2">
          <Progress value={uploadProgress} className="w-full h-1.5" />
          <span className="text-xs font-mono text-muted-foreground">{Math.round(uploadProgress)}%</span>
        </div>
      )}
    </div>
  )
}

function MatchingView({ deckName, cards, onExit }: { deckName: string, cards: any[], onExit: () => void }) {
  const [tiles, setTiles] = React.useState<any[]>([])
  const [selected, setSelected] = React.useState<string | null>(null)
  const [matched, setMatched] = React.useState<Set<string>>(new Set())
  const [incorrect, setIncorrect] = React.useState<Set<string>>(new Set())
  const [startTime] = React.useState(Date.now())
  const [endTime, setEndTime] = React.useState<number | null>(null)

  React.useEffect(() => {
    // select a subset of cards if many, but for simplicity let's use up to 8 cards (16 tiles)
    const sessionCards = [...cards].sort(() => 0.5 - Math.random()).slice(0, 8)
    
    const tileList: any[] = []
    sessionCards.forEach(card => {
      tileList.push({ id: `q-${card.id}`, cardId: card.id, content: card.question, type: 'question', imageUrl: card.imageUrl })
      tileList.push({ id: `a-${card.id}`, cardId: card.id, content: card.answer, type: 'answer', imageUrl: card.answerImageUrl })
    })

    setTiles(tileList.sort(() => 0.5 - Math.random()))
  }, [cards])

  const handleTileClick = (tileId: string) => {
    if (matched.has(tileId) || incorrect.has(tileId) || tileId === selected) return

    if (!selected) {
      setSelected(tileId)
      return
    }

    const selectedTile = tiles.find(t => t.id === selected)
    const currentTile = tiles.find(t => t.id === tileId)

    if (selectedTile.cardId === currentTile.cardId && selectedTile.type !== currentTile.type) {
      // match!
      setMatched(prev => new Set(prev).add(selected).add(tileId))
      setSelected(null)
      
      if (matched.size + 2 === tiles.length) {
        setEndTime(Date.now())
      }
    } else {
      // mismatch
      setIncorrect(new Set([selected, tileId]))
      setSelected(null)
      setTimeout(() => {
        setIncorrect(new Set())
      }, 800)
    }
  }

  if (endTime) {
    const totalTime = Math.round((endTime - startTime) / 1000)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-in fade-in duration-500 max-w-2xl mx-auto text-center">
        <div className="p-8 bg-orange-100 rounded-full">
          <Trophy className="h-16 w-16 text-orange-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-bold font-headline lowercase">deck matched!</h2>
          <p className="text-muted-foreground text-lg lowercase">
            you completed the matching set in {totalTime} seconds.
          </p>
        </div>
        <Button onClick={onExit} className="rounded-2xl py-6 px-12 font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-200 lowercase">
          back to decks
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl w-full mx-auto space-y-8 animate-smooth-slow px-4 py-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onExit} className="rounded-xl gap-2 font-bold text-muted-foreground lowercase">
          <ChevronLeft className="h-4 w-4" /> exit matching
        </Button>
        <div className="text-center">
          <h2 className="font-headline text-xl font-bold lowercase">matching: {deckName}</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {matched.size / 2} / {tiles.length / 2} paired
          </p>
        </div>
        <div className="w-24" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map((tile) => {
          const isSelected = selected === tile.id
          const isMatched = matched.has(tile.id)
          const isIncorrect = incorrect.has(tile.id)

          return (
            <Card
              key={tile.id}
              onClick={() => handleTileClick(tile.id)}
              className={cn(
                "h-48 cursor-pointer transition-all duration-300 border-2 rounded-[32px] overflow-hidden flex flex-col items-center justify-center p-6 text-center shadow-sm relative",
                isMatched && "opacity-0 scale-95 pointer-events-none",
                isSelected && "border-orange-500 bg-orange-50 ring-4 ring-orange-200",
                isIncorrect && "border-destructive bg-destructive/5 animate-shake",
                !isSelected && !isMatched && !isIncorrect && "hover:border-orange-200 hover:bg-muted/30"
              )}
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2">
                <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-tighter opacity-30">
                  {tile.type}
                </Badge>
              </div>
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 overflow-hidden">
                {tile.imageUrl && (
                  <div className="relative w-full h-20 shrink-0">
                    <img src={tile.imageUrl} alt="tile visual" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className={cn("font-medium line-clamp-4 leading-tight lowercase", tile.imageUrl ? "text-sm" : "text-base")}>
                  <HtmlContent html={tile.content} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function QuizView({ 
  deckName, 
  cards, 
  onExit 
}: { 
  deckName: string, 
  cards: any[], 
  onExit: () => void 
}) {
  const [questions, setQuestions] = React.useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isGenerating, setIsGenerating] = React.useState(true)
  const [isEvaluating, setIsEvaluating] = React.useState(false)
  const [userAnswer, setUserAnswer] = React.useState("")
  const [results, setResults] = React.useState<{ cardId: string, isCorrect: boolean, feedback: string }[]>([])
  const [isFinished, setIsFinished] = React.useState(false)

  React.useEffect(() => {
    async function initQuiz() {
      try {
        const simpleCards = cards.map(c => ({
          id: c.id,
          question: c.question.replace(/<[^>]*>?/gm, ''), // strip html for ai
          answer: c.answer.replace(/<[^>]*>?/gm, ''),
          imageUrl: c.imageUrl
        }))
        const output = await generateQuiz({ deckName, cards: simpleCards })
        setQuestions(output.questions)
      } catch (e) {
        console.error("quiz generation failed", e)
      } finally {
        setIsGenerating(false)
      }
    }
    initQuiz()
  }, [cards, deckName])

  const handleNext = async () => {
    const current = questions[currentIndex]
    setIsEvaluating(true)

    try {
      let isCorrect = false
      let feedback = ""

      if (current.type === 'open-ended') {
        const evalResult = await evaluateAnswer({
          userAnswer,
          correctAnswer: current.correctAnswer,
          contextQuestion: current.prompt
        })
        isCorrect = evalResult.isCorrect
        feedback = evalResult.feedback
      } else {
        isCorrect = userAnswer.toLowerCase() === current.correctAnswer.toLowerCase()
        feedback = isCorrect ? "correct!" : `incorrect. the correct answer was: ${current.correctAnswer}`
      }

      setResults(prev => [...prev, { cardId: current.cardId, isCorrect, feedback }])
      
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setUserAnswer("")
      } else {
        setIsFinished(true)
      }
    } catch (e) {
      console.error("evaluation failed", e)
    } finally {
      setIsEvaluating(false)
    }
  }

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="p-8 bg-indigo-100 rounded-full animate-bounce">
          <FileText className="h-16 w-16 text-indigo-600" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold font-headline lowercase">creating quiz..</h2>
          <p className="text-muted-foreground mt-2 lowercase">preparing your personal quiz from this deck.</p>
        </div>
      </div>
    )
  }

  if (isFinished) {
    const score = results.filter(r => r.isCorrect).length
    const percent = Math.round((score / questions.length) * 100)

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 max-w-2xl mx-auto text-center px-4">
        <div className="p-8 bg-primary/20 rounded-full">
          <Trophy className="h-16 w-16 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-bold font-headline lowercase">{percent}% quiz score</h2>
          <p className="text-muted-foreground text-lg lowercase">
            you got {score} out of {questions.length} questions correct!
          </p>
        </div>

        <div className="w-full grid gap-3 text-left">
          {results.map((res, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white border border-border flex items-start gap-4">
              <div className={cn("p-2 rounded-full", res.isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
                {res.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-medium lowercase">{res.feedback}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button onClick={onExit} className="rounded-2xl py-6 font-bold shadow-lg lowercase">back to decks</Button>
        </div>
      </div>
    )
  }

  const current = questions[currentIndex]
  const card = cards.find(c => c.id === current.cardId)

  return (
    <div className="max-w-3xl w-full mx-auto space-y-8 animate-smooth-slow px-4 py-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onExit} className="rounded-xl gap-2 font-bold text-muted-foreground lowercase">
          <ChevronLeft className="h-4 w-4" /> exit quiz
        </Button>
        <div className="text-center">
          <h2 className="font-headline text-xl font-bold lowercase">quiz: {deckName}</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            question {currentIndex + 1} / {questions.length}
          </p>
        </div>
        <div className="w-24" />
      </div>

      <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-white p-10 md:p-16">
        <div className="space-y-10">
          <div className="space-y-6">
            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
              {current.type.replace('-', ' ')}
            </Badge>
            
            <div className="space-y-6">
              {current.type === 'image-selection' && card?.imageUrl && (
                <div className="w-full h-48 md:h-64 relative rounded-3xl overflow-hidden border bg-muted/5">
                  <img src={card.imageUrl} alt="identify this" className="w-full h-full object-contain" />
                </div>
              )}
              <h3 className="text-2xl md:text-3xl font-bold leading-tight lowercase">
                {current.prompt}
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            {current.type === 'open-ended' ? (
              <div className="space-y-4">
                <Input 
                  placeholder="type your answer here..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="rounded-2xl h-16 text-lg px-6 no-focus-ring border-2 border-muted hover:border-indigo-200 transition-all lowercase"
                  onKeyDown={(e) => e.key === 'Enter' && !isEvaluating && handleNext()}
                />
                <p className="text-xs text-muted-foreground text-center italic lowercase">
                  your answer will be evaluated based on the core concept.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {current.options?.map((option, i) => (
                  <Button
                    key={i}
                    variant={userAnswer === option ? 'secondary' : 'outline'}
                    className={cn(
                      "h-auto py-5 px-8 rounded-2xl text-left justify-start text-lg transition-all",
                      userAnswer === option ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-2 hover:border-indigo-200"
                    )}
                    onClick={() => setUserAnswer(option)}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className={cn(
                        "h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0",
                        userAnswer === option ? "border-indigo-600 bg-indigo-600 text-white" : "border-muted text-muted-foreground"
                      )}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="flex-1 lowercase">{option}</span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          <Button 
            disabled={!userAnswer || isEvaluating} 
            onClick={handleNext}
            className="w-full rounded-2xl py-8 text-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 group lowercase"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                checking...
              </>
            ) : (
              <>
                submit answer
                <ChevronRight className="h-6 w-6 ml-2 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </div>
      </Card>
      
      {isEvaluating && (
        <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <RefreshCw className="h-12 w-12 text-indigo-600 animate-spin" />
            </div>
            <p className="font-bold text-indigo-900 tracking-tight lowercase">calculating results</p>
          </div>
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
        <p className="text-muted-foreground font-medium lowercase">loading cards...</p>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <HelpCircle className="h-16 w-16 text-muted-foreground opacity-20" />
        <div>
          <h2 className="text-2xl font-bold font-headline lowercase">no cards to study</h2>
          <p className="text-muted-foreground mt-2 lowercase">add some cards to this deck first.</p>
        </div>
        <Button onClick={onExit} variant="outline" className="rounded-xl lowercase">go back</Button>
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
          <h2 className="text-4xl font-bold font-headline lowercase">{masteryPercent}% mastered</h2>
          <p className="text-muted-foreground text-lg lowercase">
            {masteredInPass === totalInPass 
              ? "perfect! you've mastered all cards in this pass." 
              : `you mastered ${masteredInPass} out of ${totalInPass} cards.`}
          </p>
        </div>
        
        <Card className="w-full border-none bg-muted/30 p-6 rounded-[32px]">
          <div className="flex justify-around items-center">
            <div>
              <div className="text-3xl font-bold text-primary">{masteredInPass}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">mastered</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-3xl font-bold text-destructive">{missedCards.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">reviewing</div>
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
              className="w-full rounded-2xl py-6 font-bold bg-accent text-accent-foreground lowercase"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> study remaining ({missedCards.length})
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
            className="w-full rounded-2xl py-6 font-bold lowercase"
          >
            restart full deck
          </Button>
          <Button onClick={onExit} variant="ghost" className="w-full rounded-2xl py-6 font-bold text-muted-foreground lowercase">
            close session
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
      <div className="max-w-3xl w-full space-y-8 animate-smooth-slow relative z-10 px-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onExit} className="rounded-xl gap-2 font-bold text-muted-foreground hover:text-foreground bg-white/50 backdrop-blur-sm lowercase">
            <ChevronLeft className="h-4 w-4" /> exit study
          </Button>
          <div className="text-center">
            <h2 className="font-headline text-xl font-bold lowercase">{deckName}</h2>
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
              <Card className={`absolute inset-0 backface-hidden border-none shadow-2xl rounded-[32px] flex flex-col items-center justify-center p-12 bg-white ${isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 overflow-hidden">
                  {currentCard?.imageUrl && (
                    <div className="w-full flex-1 min-h-0 relative">
                      <img src={currentCard.imageUrl} alt="card visual" className="w-full h-full object-contain block mx-auto" />
                    </div>
                  )}
                  <div className={cn("font-headline font-bold text-center leading-tight w-full", currentCard?.imageUrl ? "text-2xl" : "text-4xl")}>
                    <HtmlContent html={currentCard?.question || ''} />
                  </div>
                </div>
                <p className="absolute bottom-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                  click to reveal answer
                </p>
              </Card>

              <Card className={`absolute inset-0 backface-hidden border-none shadow-2xl rounded-[32px] flex flex-col items-center justify-center p-12 bg-primary/10 rotate-y-180 backdrop-blur-sm ${!isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary block text-center">answer</span>
                  {currentCard?.answerImageUrl && (
                    <div className="w-full flex-1 min-h-0 relative">
                      <img src={currentCard.answerImageUrl} alt="answer visual" className="w-full h-full object-contain block mx-auto" />
                    </div>
                  )}
                  <div className={cn("font-medium text-center leading-relaxed w-full", currentCard?.answerImageUrl ? "text-xl" : "text-3xl")}>
                    <HtmlContent html={currentCard?.answer || ''} />
                  </div>
                </div>
                <p className="absolute bottom-6 text-[10px] font-bold uppercase tracking-widest text-primary">
                  click to flip back
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
                <span className="text-[10px] uppercase tracking-widest">need review</span>
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
                <span className="text-[10px] uppercase tracking-widest">got it</span>
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
              <DropdownMenuItem className="gap-2 cursor-pointer lowercase" onClick={onEdit}>
                <Settings2 className="h-4 w-4" /> manage cards
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="gap-2 cursor-pointer text-destructive focus:text-destructive lowercase" 
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" /> delete deck
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="font-headline text-2xl mt-4 leading-tight truncate cursor-pointer hover:text-primary transition-colors lowercase" onClick={onStudy}>
          {deck.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-4 flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between text-sm items-center">
            <div className="flex flex-col">
              <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">created</span>
              <span className="text-muted-foreground font-medium">
                {new Date(deck.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
              <span>mastery</span>
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
          <Button onClick={onStudy} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl py-7 w-full shadow-lg shadow-primary/10 flex items-center justify-center gap-2 group/btn lowercase">
            <Play className="h-5 w-5 fill-current transition-transform group-hover/btn:scale-110" /> study deck
          </Button>
          <Button variant="outline" onClick={onEdit} className="border-border hover:bg-muted font-bold rounded-2xl py-7 w-full flex items-center justify-center gap-2 lowercase">
            <Edit2 className="h-4 w-4" /> edit cards
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
