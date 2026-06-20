
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking,
  useUser
} from "@/firebase"
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  doc,
  collectionGroup
} from "firebase/firestore"
import { 
  Loader2, 
  ArrowLeft, 
  UserPlus, 
  Bell,
  Layers, 
  BookOpen, 
  MessageCircle,
  Download,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type ProfileTab = 'all' | 'notebooks' | 'flashcards' | 'thoughts'

export default function PublicProfilePage() {
  const { username } = useParams()
  const { user: currentUser } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const [profile, setProfile] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<ProfileTab>('all')

  React.useEffect(() => {
    async function resolveProfile() {
      if (!db || !username) return
      setIsLoading(true)
      try {
        const q = query(
          collectionGroup(db, "profile"),
          where("username", "==", (username as string).toLowerCase())
        )
        
        const result = await getDocs(q)
        if (!result.empty) {
          const profileDoc = result.docs[0]
          const uid = profileDoc.ref.parent.parent?.id
          setProfile({ ...profileDoc.data(), uid })
        }
      } catch (e) {
        console.error("Resolve error", e)
      } finally {
        setIsLoading(false)
      }
    }

    resolveProfile()
  }, [username, db])

  const postsQuery = useMemoFirebase(() => {
    if (!profile?.uid || !db) return null
    return query(collection(db, "posts"), where("authorUid", "==", profile.uid), orderBy("createdAt", "desc"))
  }, [profile?.uid, db])
  const { data: userPosts } = useCollection(postsQuery)

  const filteredPosts = React.useMemo(() => {
    if (!userPosts) return []
    if (activeTab === 'all') return userPosts
    if (activeTab === 'notebooks') return userPosts.filter(p => p.type === 'notebook')
    if (activeTab === 'flashcards') return userPosts.filter(p => p.type === 'flashcardSet')
    if (activeTab === 'thoughts') return userPosts.filter(p => p.type === 'thought')
    return userPosts
  }, [userPosts, activeTab])

  const sendRequest = () => {
    if (!currentUser || !profile || !db) return
    const myFriendRef = doc(db, "users", currentUser.uid, "friends", profile.uid)
    const theirFriendRef = doc(db, "users", profile.uid, "friends", currentUser.uid)

    setDocumentNonBlocking(myFriendRef, {
      uid: profile.uid,
      username: profile.username,
      displayName: profile.displayName,
      photoUrl: profile.photoUrl,
      status: 'pending_out',
      createdAt: new Date().toISOString()
    }, { merge: true })

    setDocumentNonBlocking(theirFriendRef, {
      uid: currentUser.uid,
      username: currentUser.displayName || 'student',
      displayName: currentUser.displayName || 'student',
      photoUrl: currentUser.photoURL || '',
      status: 'pending_in',
      createdAt: new Date().toISOString()
    }, { merge: true })

    toast({ title: "request sent!" })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
         <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <ArrowLeft className="h-10 w-10" />
         </div>
         <h1 className="text-3xl font-bold font-headline lowercase">student not found</h1>
         <Button onClick={() => router.push('/share-hub')} variant="outline" className="rounded-xl lowercase">back to hub</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header Section (Banner & PFP) */}
      <div className="relative w-full">
        {/* Banner */}
        <div className="w-full h-[220px] bg-sky-100 overflow-hidden">
          {profile.bannerUrl ? (
            <img src={profile.bannerUrl} className="w-full h-full object-cover" alt="banner" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-sky-400 via-white to-sky-400" />
          )}
        </div>

        {/* Profile Info Row */}
        <div className="max-w-[1200px] mx-auto px-10 relative">
          {/* Overlapping Square PFP */}
          <div className="absolute top-[-80px] left-10 w-44 h-44 bg-white p-1.5 shadow-lg z-10 border border-black/5">
            <div className="w-full h-full overflow-hidden bg-muted">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} className="w-full h-full object-cover" alt="pfp" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold opacity-10">?</div>
              )}
            </div>
          </div>

          {/* Identity & Actions */}
          <div className="pt-4 pl-52 flex items-center justify-between min-h-[80px]">
            <div className="space-y-0.5">
              <h1 className="text-2xl font-bold lowercase leading-none">{profile.displayName || profile.username}</h1>
              <p className="text-sm text-muted-foreground lowercase">via</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={sendRequest}
                className="px-8 py-2 bg-[#A8B9C8] border border-[#7A8A99] text-black text-sm font-medium hover:brightness-95 transition-all shadow-sm"
              >
                add friend
              </button>
              <button className="p-2 bg-white border border-border rounded-sm hover:bg-muted transition-colors shadow-sm">
                <Bell size={18} className="text-black/60" />
              </button>
            </div>
          </div>

          {/* About Me Section */}
          <div className="mt-8 mb-10 space-y-4">
             <div className="space-y-1">
               <span className="text-[10px] font-bold uppercase tracking-tight text-black opacity-80">about me:</span>
               <p className="text-base leading-relaxed text-black max-w-2xl lowercase">
                 {profile.bio || 'i sorta like made this app.. or whatever.. no its fine i dont care either'}
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="w-full bg-[#B0C4DE] border-y border-black/10">
        <div className="max-w-[1200px] mx-auto flex">
          <TabItem active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="ALL POSTS" />
          <TabItem active={activeTab === 'notebooks'} onClick={() => setActiveTab('notebooks')} label="NOTEBOOKS" />
          <TabItem active={activeTab === 'flashcards'} onClick={() => setActiveTab('flashcards')} label="FLASHCARDS" />
          <TabItem active={activeTab === 'thoughts'} onClick={() => setActiveTab('thoughts')} label="THOUGHTS" />
        </div>
      </div>

      {/* Main Feed Content Area */}
      <div className="flex-1 w-full bg-gradient-to-b from-[#6B9AC4] via-[#A8C5DA] to-[#DCDCDC] pb-40">
        <div className="max-w-[1200px] mx-auto px-10 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
             {filteredPosts.map(post => (
               <FeedCard key={post.id} post={post} profile={profile} onCopy={() => handleCopyToLibrary(post, currentUser, db, toast)} />
             ))}
             {filteredPosts.length === 0 && (
               <div className="col-span-full py-40 text-center">
                 <p className="text-white/60 font-bold text-xl lowercase">no posts found in this section.</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TabItem({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-4 text-sm font-bold tracking-widest transition-all",
        active ? "bg-black/5 text-black" : "text-black/60 hover:text-black hover:bg-black/5"
      )}
    >
      {label}
    </button>
  )
}

function FeedCard({ post, profile, onCopy }: { post: any, profile: any, onCopy: () => void }) {
  const isThought = post.type === 'thought'
  const postVerb = isThought ? "posted a thought" : `shared a ${post.type === 'flashcardSet' ? 'flashcard deck' : post.type}`

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-1">
          <span className="text-sm font-mono text-black/60 lowercase">{profile.displayName || profile.username} {postVerb}</span>
        </div>

        {isThought ? (
          <div className="pt-4">
             <p className="text-xl md:text-2xl text-black leading-relaxed lowercase font-medium">
               {post.content}
             </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-black lowercase leading-tight">
              {post.itemData?.name || post.itemData?.title}
            </h3>
            
            {/* Visual Preview Placeholder */}
            <div className="w-full aspect-video bg-[#D9D9D9] flex items-center justify-center p-6 relative overflow-hidden">
               <span className="text-lg font-bold text-black/80 lowercase">
                 {post.type === 'flashcardSet' ? 'flashcard preview' : 'notebook preview'}
               </span>
               <div className="absolute bottom-0 left-0 w-full h-1 bg-black/5" />
            </div>

            <Button 
              onClick={onCopy}
              variant="outline" 
              className="w-full rounded-none border-2 border-black/10 font-bold lowercase hover:bg-black hover:text-white transition-all h-12"
            >
              <Download className="h-4 w-4 mr-2" /> save to library
            </Button>
          </div>
        )}

        <div className="pt-4 flex justify-between items-center opacity-20 text-[10px] font-bold uppercase tracking-widest">
           <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}

async function handleCopyToLibrary(post: any, user: any, db: any, toast: any) {
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
      const coursesSnap = await getDocs(query(coursesRef, orderBy("createdAt", "desc"), limit(1)))
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
    toast({ variant: "destructive", title: "failed to save" })
  }
}
