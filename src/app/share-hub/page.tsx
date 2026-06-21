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
} from "firebase/firestore"
import { 
  Share2, 
  Plus, 
  Loader2,
  Download,
  Trash2,
  BadgeCheck
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"

export default function ShareHubPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [isPostDialogOpen, setIsPostOpen] = React.useState(false)
  const [postType, setPostType] = React.useState<'flashcardSet' | 'notebook' | 'thought'>('thought')
  const [thoughtText, setThoughtText] = React.useState("")
  const [selectedItem, setSelectedItem] = React.useState<any>(null)
  const [isPosting, setIsPosting] = React.useState(false)

  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'profile', 'settings') : null, [user, db])
  const { data: profile } = useDoc(profileRef)

  const postsQuery = useMemoFirebase(() => query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20)), [db])
  const { data: posts, isLoading: isPostsLoading } = useCollection(postsQuery)

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
        createdAt: new Date().toISOString(),
        isOfficial: profile.isGukoMode === true,
        isAdmin: profile.isAdmin === true
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

  const handleDeletePost = (postId: string) => {
    if (!db) return
    deleteDocumentNonBlocking(doc(db, "posts", postId))
    toast({ title: "post removed" })
  }

  return (
    <div className="space-y-8 animate-smooth-slow pb-20 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground lowercase">share hub</h1>
          <p className="text-muted-foreground mt-2 text-lg lowercase">discover materials and thoughts from the guko community.</p>
        </div>
        
        <Dialog open={isPostDialogOpen} onOpenChange={setIsPostOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-14 px-8 font-bold gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all lowercase">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

function PostCard({ post, isOwner, onDelete }: { post: any, isOwner: boolean, onDelete: () => void }) {
  const isThought = post.type === 'thought'
  const postVerb = isThought ? "posted a thought" : `shared a ${post.type === 'flashcardSet' ? 'flashcard deck' : post.type}`
  const isOfficial = post.isOfficial === true || post.authorUsername === 'guko';
  const isAdmin = post.isAdmin === true;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group border border-black/5">
      <div className="p-6 flex flex-col flex-1 gap-6">
        <div className="flex items-start justify-between">
          <Link href={`/u/${post.authorUsername}`} className="flex items-center gap-3 group/author">
            <Avatar className="h-10 w-10 border border-black/5 shadow-sm rounded-none">
              <AvatarImage src={post.authorPhotoUrl} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{post.authorDisplayName[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
               <div className="flex items-center gap-1.5">
                  <h4 className={cn(
                    "font-bold text-sm lowercase leading-tight truncate group-hover/author:text-primary transition-colors",
                    isOfficial && "italic font-black"
                  )}>
                    {post.authorDisplayName}
                  </h4>
                  {(isOfficial || isAdmin) && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
               </div>
               <p className="text-[10px] text-muted-foreground lowercase">@{post.authorUsername}</p>
            </div>
          </Link>
          {isOwner && (
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 rounded-full text-destructive/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-4 flex-1">
          <div className="text-[11px] font-mono text-black/40 lowercase">
            {postVerb}
          </div>
          {isThought ? (
            <p className="text-xl leading-relaxed lowercase text-black/80 font-medium italic line-clamp-6">"{post.content}"</p>
          ) : (
            <div className="space-y-3">
               <h3 className="font-bold text-xl lowercase leading-tight">{post.itemData?.name || post.itemData?.title}</h3>
               <div className="w-full aspect-video bg-[#F0F0F0] rounded-sm flex items-center justify-center p-4 border border-black/5">
                  <span className="text-xs font-bold text-black/30 lowercase">preview available on profile</span>
               </div>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-between items-center opacity-30 text-[9px] font-bold uppercase tracking-widest border-t border-black/5">
           <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}
