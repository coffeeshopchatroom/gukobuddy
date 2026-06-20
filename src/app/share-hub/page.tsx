
"use client"

import * as React from "react"
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useDoc
} from "@/firebase"
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  doc, 
  getDocs,
  where
} from "firebase/firestore"
import { 
  Share2, 
  Plus, 
  Layers, 
  BookOpen, 
  MessageCircle, 
  Clock, 
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Trash2,
  Download,
  Loader2,
  Sparkles,
  ArrowRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ShareHubPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [isPostDialogOpen, setIsPostOpen] = React.useState(false)
  const [postType, setPostType] = React.useState<'flashcardSet' | 'notebook' | 'thought'>('thought')
  const [thoughtText, setThoughtText] = React.useState("")
  const [selectedItem, setSelectedItem] = React.useState<any>(null)
  const [isPosting, setIsPosting] = React.useState(false)

  // Profile data
  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'profile', 'settings') : null, [user, db])
  const { data: profile } = useDoc(profileRef)

  // Posts Feed
  const postsQuery = useMemoFirebase(() => query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20)), [db])
  const { data: posts, isLoading: isPostsLoading } = useCollection(postsQuery)

  // Personal data for sharing
  const coursesQuery = useMemoFirebase(() => user ? query(collection(db, "users", user.uid, "courses")) : null, [user, db])
  const { data: courses } = useCollection(coursesQuery)
  
  const flashcardSetsQuery = useMemoFirebase(() => {
    if (!user || !courses || courses.length === 0) return null
    return query(collection(db, "users", user.uid, "courses", courses[0].id, "flashcardSets"))
  }, [user, db, courses])
  const { data: decks } = useCollection(flashcardSetsQuery)

  const notesQuery = useMemoFirebase(() => user ? query(collection(db, "users", user.uid, "notes"), orderBy("updatedAt", "desc")) : null, [user, db])
  const { data: notes } = useCollection(notesQuery)

  const handlePost = async () => {
    if (!user || !profile || !db) return
    setIsPosting(true)

    try {
      const postId = doc(collection(db, "temp")).id
      const postRef = doc(db, "posts", postId)

      let itemData = null
      if (postType === 'flashcardSet' && selectedItem) {
        const cardsRef = collection(db, "users", user.uid, "courses", selectedItem.courseId, "flashcardSets", selectedItem.id, "flashcards")
        const cardsSnap = await getDocs(cardsRef)
        itemData = { ...selectedItem, cards: cardsSnap.docs.map(d => ({ ...d.data(), id: d.id })) }
      } else if (postType === 'notebook' && selectedItem) {
        itemData = selectedItem
      }

      const postData = {
        id: postId,
        authorUid: user.uid,
        authorUsername: profile.username || "student",
        authorDisplayName: profile.displayName || user.displayName || "guko student",
        authorPhotoUrl: profile.photoUrl || user.photoURL || "",
        type: postType,
        content: thoughtText,
        itemData: itemData,
        createdAt: new Date().toISOString()
      }

      setDocumentNonBlocking(postRef, postData, { merge: true })
      
      setThoughtText("")
      setSelectedItem(null)
      setIsPostOpen(false)
      toast({ title: "posted to hub!" })
    } catch (e) {
      console.error("Post failed", e)
      toast({ variant: "destructive", title: "failed to share" })
    } finally {
      setIsPosting(false)
    }
  }

  const handleCopyToLibrary = async (post: any) => {
    if (!user || !db) return
    
    try {
      if (post.type === 'notebook') {
        const noteId = doc(collection(db, "temp")).id
        const noteRef = doc(db, "users", user.uid, "notes", noteId)
        setDocumentNonBlocking(noteRef, {
          ...post.itemData,
          id: noteId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true })
        toast({ title: "page added to workspace" })
      } else if (post.type === 'flashcardSet') {
        const coursesRef = collection(db, "users", user.uid, "courses")
        const coursesSnap = await getDocs(query(coursesRef, limit(1)))
        let courseId = coursesSnap.docs[0]?.id
        
        if (!courseId) {
          courseId = doc(collection(db, "temp")).id
          setDocumentNonBlocking(doc(db, "users", user.uid, "courses", courseId), {
            id: courseId,
            name: "shared studies",
            createdAt: new Date().toISOString()
          }, { merge: true })
        }

        const newDeckId = doc(collection(db, "temp")).id
        const deckRef = doc(db, "users", user.uid, "courses", courseId, "flashcardSets", newDeckId)
        setDocumentNonBlocking(deckRef, {
          ...post.itemData,
          id: newDeckId,
          courseId,
          createdAt: new Date().toISOString()
        }, { merge: true })

        if (post.itemData.cards) {
          post.itemData.cards.forEach((card: any) => {
            const newCardId = doc(collection(db, "temp")).id
            const cardRef = doc(db, "users", user.uid, "courses", courseId, "flashcardSets", newDeckId, "flashcards", newCardId)
            setDocumentNonBlocking(cardRef, { ...card, id: newCardId, flashcardSetId: newDeckId }, { merge: true })
          })
        }
        toast({ title: "deck added to library" })
      }
    } catch (e) {
      console.error("Copy failed", e)
    }
  }

  const handleDeletePost = (postId: string) => {
    if (!db) return
    deleteDocumentNonBlocking(doc(db, "posts", postId))
    toast({ title: "post removed" })
  }

  return (
    <div className="space-y-8 animate-smooth-slow pb-20 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground lowercase">share hub</h1>
          <p className="text-muted-foreground mt-2 text-lg lowercase">discover materials and thoughts from the guko community.</p>
        </div>
        
        <Dialog open={isPostDialogOpen} onOpenChange={setIsPostOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-[24px] h-14 px-8 font-bold gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all lowercase">
              <Plus className="h-5 w-5" /> share something
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[40px] border-none shadow-3xl bg-card p-0 overflow-hidden sm:max-w-xl">
            <DialogHeader className="p-8 pb-4 bg-primary/5 text-left border-b">
               <DialogTitle className="font-headline text-2xl font-bold flex items-center gap-2 lowercase text-foreground">
                 <Share2 className="h-6 w-6 text-primary" /> publish to hub
               </DialogTitle>
               <DialogDescription className="lowercase">share your knowledge with fellow students.</DialogDescription>
            </DialogHeader>

            <div className="p-8 space-y-6">
              <div className="flex gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border/50">
                 {['thought', 'flashcardSet', 'notebook'].map((type) => (
                   <button
                    key={type}
                    onClick={() => { setPostType(type as any); setSelectedItem(null); }}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all lowercase",
                      postType === type ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                   >
                     {type === 'flashcardSet' ? 'deck' : type}
                   </button>
                 ))}
              </div>

              {postType === 'thought' ? (
                <div className="space-y-4">
                  <Textarea 
                    placeholder="what's on your mind?..." 
                    value={thoughtText}
                    onChange={(e) => setThoughtText(e.target.value)}
                    className="rounded-[24px] min-h-[150px] bg-muted/20 border-none no-focus-ring lowercase p-6 text-lg"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">select item to share</Label>
                  <ScrollArea className="h-64 rounded-3xl border border-border/50 bg-muted/10 p-2">
                    <div className="grid gap-2">
                      {(postType === 'flashcardSet' ? decks : notes)?.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className={cn(
                            "w-full text-left p-4 rounded-2xl transition-all border-2 lowercase font-bold truncate",
                            selectedItem?.id === item.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"
                          )}
                        >
                          {item.name || item.title || "untitled"}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <Button 
                disabled={isPosting || (postType === 'thought' ? !thoughtText : !selectedItem)}
                onClick={handlePost}
                className="w-full h-16 rounded-[24px] text-xl font-bold lowercase shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all"
              >
                {isPosting ? <Loader2 className="animate-spin h-6 w-6" /> : "publish to community"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isPostsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-64 rounded-[32px] animate-pulse bg-muted/20 border-none" />
          ))
        ) : posts?.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            isOwner={user?.uid === post.authorUid}
            onDelete={() => handleDeletePost(post.id)}
            onCopy={() => handleCopyToLibrary(post)}
          />
        ))}
      </div>

      {!isPostsLoading && posts?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-40 text-center gap-6">
          <div className="h-24 w-24 rounded-[40px] bg-muted/30 flex items-center justify-center opacity-20">
            <Share2 className="h-12 w-12" />
          </div>
          <div>
            <h3 className="text-2xl font-bold lowercase">hub is quiet</h3>
            <p className="text-muted-foreground lowercase mt-1">be the first to share your learning materials!</p>
          </div>
        </div>
      )}
    </div>
  )
}

function PostCard({ post, isOwner, onDelete, onCopy }: { post: any, isOwner: boolean, onDelete: () => void, onCopy: () => void }) {
  const isThought = post.type === 'thought'
  
  return (
    <Card className="group border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[32px] overflow-hidden bg-card flex flex-col h-full relative">
      <CardHeader className="p-6 pb-2">
        <div className="flex items-center justify-between">
          <Link href={`/u/${post.authorUsername}`} className="flex items-center gap-3 group/author">
            <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm transition-transform group-hover/author:scale-110">
              <AvatarImage src={post.authorPhotoUrl} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{post.authorDisplayName[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
               <h4 className="font-bold text-sm lowercase leading-tight truncate group-hover/author:text-primary transition-colors">{post.authorDisplayName}</h4>
               <p className="text-[10px] text-muted-foreground lowercase">@{post.authorUsername}</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-1">
             <Badge variant="secondary" className="rounded-full bg-muted/50 border-none text-[8px] font-bold uppercase tracking-widest px-2.5 py-0.5">
               {isThought ? <MessageCircle className="h-2 w-2 mr-1" /> : post.type === 'flashcardSet' ? <Layers className="h-2 w-2 mr-1" /> : <BookOpen className="h-2 w-2 mr-1" />}
               {post.type === 'flashcardSet' ? 'deck' : post.type}
             </Badge>
             {isOwner && (
               <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 rounded-full text-destructive/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Trash2 className="h-4 w-4" />
               </Button>
             )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-2 flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          {isThought ? (
            <p className="text-lg leading-relaxed lowercase text-foreground/80 italic line-clamp-6">"{post.content}"</p>
          ) : (
            <div className="space-y-3 p-5 rounded-2xl bg-muted/30 border border-border/50">
               <h3 className="font-bold text-xl lowercase leading-tight">{post.itemData?.name || post.itemData?.title}</h3>
               <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {post.itemData?.cards?.length || 0} cards</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> shared {new Date(post.createdAt).toLocaleDateString()}</span>
               </div>
            </div>
          )}
        </div>

        {!isThought && (
          <Button 
            onClick={onCopy}
            className="w-full rounded-2xl py-6 font-bold gap-2 bg-primary/10 text-primary hover:bg-primary shadow-none hover:text-white transition-all lowercase"
          >
            <Download className="h-4 w-4" /> save to my library
          </Button>
        )}

        <div className="pt-2 flex justify-between items-center opacity-30 text-[9px] font-bold uppercase tracking-widest">
           <span>{new Date(post.createdAt).toLocaleDateString()}</span>
           <Sparkles className="h-3 w-3 text-primary animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}
