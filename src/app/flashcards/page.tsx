
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Layers, Play, MoreVertical, Edit2, Trash2, Loader2, LogIn } from "lucide-react"
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [newDeckName, setNewDeckName] = React.useState("")

  // Fetch courses first, since flashcardSets are nested
  const coursesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "users", user.uid, "courses"))
  }, [db, user])

  const { data: courses, isLoading: isCoursesLoading } = useCollection(coursesQuery)

  // For simplicity in this view, we'll use the first course or a "Default" course
  const activeCourse = courses?.[0]

  const flashcardsQuery = useMemoFirebase(() => {
    if (!db || !user || !activeCourse) return null
    return query(
      collection(db, "users", user.uid, "courses", activeCourse.id, "flashcardSets"),
      orderBy("createdAt", "desc")
    )
  }, [db, user, activeCourse])

  const { data: decks, isLoading: isDecksLoading } = useCollection(flashcardsQuery)

  const handleCreateDeck = () => {
    if (!user || !db || !newDeckName.trim()) return

    // If no course exists, create a default one first
    if (!activeCourse) {
      const courseId = doc(collection(db, "temp")).id
      const courseRef = doc(db, "users", user.uid, "courses", courseId)
      const courseData = {
        id: courseId,
        name: "General Studies",
        description: "Default course for your flashcards",
      }
      
      // Use setDocumentNonBlocking to ensure the ID in path matches data.id
      setDocumentNonBlocking(courseRef, courseData, { merge: true })
      
      // We manually add the deck under the new course
      const deckId = doc(collection(db, "temp")).id
      const deckRef = doc(db, "users", user.uid, "courses", courseId, "flashcardSets", deckId)
      const deckData = {
        id: deckId,
        name: newDeckName,
        courseId: courseId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setDocumentNonBlocking(deckRef, deckData, { merge: true })
    } else {
      const deckId = doc(collection(db, "temp")).id
      const deckRef = doc(db, "users", user.uid, "courses", activeCourse.id, "flashcardSets", deckId)
      const deckData = {
        id: deckId,
        name: newDeckName,
        courseId: activeCourse.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setDocumentNonBlocking(deckRef, deckData, { merge: true })
    }

    setNewDeckName("")
    setIsCreateDialogOpen(false)
  }

  const handleDeleteDeck = (deckId: string) => {
    if (!user || !db || !activeCourse) return
    const deckRef = doc(db, "users", user.uid, "courses", activeCourse.id, "flashcardSets", deckId)
    deleteDocumentNonBlocking(deckRef)
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
          <p className="text-muted-foreground mt-2">Sign in to start creating your study decks.</p>
        </div>
        <Button onClick={() => initiateAnonymousSignIn(auth)} className="rounded-2xl py-6 px-8 font-bold gap-2">
          <LogIn className="h-5 w-5" /> Start Studying (Guest)
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-smooth-slow">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">Flashcard Decks</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {activeCourse ? `Current Course: ${activeCourse.name}` : "Master your subjects with active recall."}
          </p>
        </div>
        <div className="flex gap-4">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-6 px-8 rounded-2xl shadow-lg transition-all hover:scale-105">
                <Plus className="h-5 w-5 mr-2" /> New Deck
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">Create New Deck</DialogTitle>
                <DialogDescription>
                  Give your deck a name to help you identify it later.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Deck Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Chapter 5: Neurobiology" 
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={handleCreateDeck} className="rounded-xl bg-primary text-primary-foreground">Create Deck</Button>
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
            />
          ))}
          <Card 
            onClick={() => setIsCreateDialogOpen(true)}
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
            onClick={() => setIsCreateDialogOpen(true)}
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

function DeckCard({ deck, onDelete }: { deck: any, onDelete: () => void }) {
  const cardsCount = 0; 
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
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <Edit2 className="h-4 w-4" /> Edit Name
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
        <CardTitle className="font-headline text-2xl mt-4 leading-tight truncate">{deck.name}</CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="bg-muted/50 text-muted-foreground hover:bg-muted/80 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            {deck.courseName || "General"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="mt-4 space-y-6">
        <div className="flex justify-between text-sm items-center">
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Cards</span>
            <span className="font-bold text-lg">{cardsCount} total</span>
          </div>
          <div className="flex flex-col text-right">
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
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl py-6 flex items-center gap-2">
            <Play className="h-4 w-4 fill-current" /> Study Now
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
