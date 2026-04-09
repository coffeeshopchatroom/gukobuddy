
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Layers, Play, MoreVertical, Edit2, Trash2, Loader2, LogIn, ChevronLeft, Search, GraduationCap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { 
  useUser, 
  useFirestore, 
  useAuth, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  initiateAnonymousSignIn
} from "@/firebase"
import { collection, doc, query, where, orderBy, Timestamp } from "firebase/firestore"
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
import { Textarea } from "@/components/ui/textarea"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

export default function FlashcardsPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const auth = useAuth()
  
  const [selectedDeckId, setSelectedDeckId] = React.useState<string | null>(null)
  const [isCreateDeckOpen, setIsCreateDeckOpen] = React.useState(false)
  const [isCreateCardOpen, setIsCreateCardOpen] = React.useState(false)
  const [newDeckName, setNewDeckName] = React.useState("")
  
  // Card form state
  const [cardQuestion, setCardQuestion] = React.useState("")
  const [cardAnswer, setCardAnswer] = React.useState("")

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
    if (selectedDeckId === deckId) setSelectedDeckId(null)
  }

  const handleAddCard = () => {
    if (!user || !db || !activeCourse || !selectedDeckId || !cardQuestion.trim() || !cardAnswer.trim()) return

    const cardId = doc(collection(db, "temp")).id
    const cardRef = doc(db, "users", user.uid, "courses", activeCourse.id, "flashcardSets", selectedDeckId, "flashcards", cardId)
    
    setDocumentNonBlocking(cardRef, {
      id: cardId,
      flashcardSetId: selectedDeckId,
      question: cardQuestion,
      answer: cardAnswer,
      lastReviewedAt: new Date().toISOString(),
      reviewCount: 0,
      easeFactor: 2.5,
      nextReviewAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true })

    setCardQuestion("")
    setCardAnswer("")
    setIsCreateCardOpen(false)
  }

  const handleDeleteCard = (cardId: string) => {
    if (!user || !db || !activeCourse || !selectedDeckId) return
    const cardRef = doc(db, "users", user.uid, "courses", activeCourse.id, "flashcardSets", selectedDeckId, "flashcards", cardId)
    deleteDocumentNonBlocking(cardRef)
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

  if (selectedDeckId && selectedDeck) {
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
                {cards?.length || 0} cards in this deck
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Dialog open={isCreateCardOpen} onOpenChange={setIsCreateCardOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground font-bold py-6 px-8 rounded-2xl shadow-lg transition-all hover:scale-105">
                  <Plus className="h-5 w-5 mr-2" /> Add Card
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-headline text-2xl">Add New Card</DialogTitle>
                  <DialogDescription>
                    Create a question and answer pair for active recall.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">Question / Front</Label>
                    <Textarea 
                      id="question" 
                      placeholder="e.g. What is the powerhouse of the cell?" 
                      value={cardQuestion}
                      onChange={(e) => setCardQuestion(e.target.value)}
                      className="rounded-xl min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="answer">Answer / Back</Label>
                    <Textarea 
                      id="answer" 
                      placeholder="e.g. Mitochondria" 
                      value={cardAnswer}
                      onChange={(e) => setCardAnswer(e.target.value)}
                      className="rounded-xl min-h-[100px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateCardOpen(false)} className="rounded-xl">Cancel</Button>
                  <Button onClick={handleAddCard} className="rounded-xl">Add Card</Button>
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
              <Card key={card.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
                <CardContent className="p-6 flex items-center justify-between gap-6">
                  <div className="flex-1 grid md:grid-cols-2 gap-6 items-center">
                    <div className="border-r border-border/50 pr-6">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Question</span>
                      <p className="font-medium text-lg">{card.question}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Answer</span>
                      <p className="text-muted-foreground">{card.answer}</p>
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
            <DialogContent className="rounded-3xl">
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
                    className="rounded-xl"
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
              onOpen={() => setSelectedDeckId(deck.id)}
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

function DeckCard({ deck, onDelete, onOpen }: { deck: any, onDelete: () => void, onOpen: () => void }) {
  const mastery = 0; 
  
  return (
    <Card className="group border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-3xl overflow-hidden bg-white">
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
              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onOpen}>
                <Edit2 className="h-4 w-4" /> Manage Cards
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
        <CardTitle className="font-headline text-2xl mt-4 leading-tight truncate cursor-pointer hover:text-primary transition-colors" onClick={onOpen}>
          {deck.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-4 space-y-6">
        <div className="flex justify-between text-sm items-center">
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Added</span>
            <span className="text-muted-foreground font-medium">
              {new Date(deck.createdAt).toLocaleDateString()}
            </span>
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
          <Button onClick={onOpen} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl py-6 flex items-center justify-center gap-2">
            <Play className="h-4 w-4 fill-current" /> Study & Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
