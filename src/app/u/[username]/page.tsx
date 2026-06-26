"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  useUser,
  useDoc
} from "@/firebase"
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc,
  collectionGroup
} from "firebase/firestore"
import { 
  Loader2, 
  ArrowLeft, 
  Bell,
  Layers, 
  BookOpen, 
  UserCircle2,
  AlertCircle,
  BadgeCheck,
  Edit2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { ProfileCustomizer } from "@/components/profile/ProfileCustomizer"

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
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

  // Resolve profile by username
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
          const uid = profileDoc.data().id || profileDoc.ref.parent.parent?.id
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

  // Current User's Profile for Admin/Guko checks
  const myProfileRef = useMemoFirebase(() => currentUser ? doc(db, 'users', currentUser.uid, 'profile', 'settings') : null, [currentUser?.uid, db]);
  const { data: myProfile } = useDoc(myProfileRef);
  const isAdmin = myProfile?.isAdmin === true;
  const isGukoMode = myProfile?.isGukoMode === true;
  const effectiveUid = isGukoMode ? 'guko' : (currentUser?.uid || '');

  // Relationship status
  const relationshipRef = useMemoFirebase(() => (currentUser && profile?.uid) ? doc(db, "users", effectiveUid, "friends", profile.uid) : null, [currentUser?.uid, effectiveUid, profile?.uid, db]);
  const { data: relationship, isLoading: isRelationshipLoading } = useDoc(relationshipRef);
  const relationshipStatus = relationship?.status;

  // Memoized Guko reference for admin editing
  const gukoProfileRef = useMemoFirebase(() => doc(db, 'users', 'guko', 'profile', 'settings'), [db]);

  // Fetch user posts
  const postsQuery = useMemoFirebase(() => {
    if (!profile?.uid || !db) return null
    return query(
      collection(db, "posts"), 
      where("authorUid", "==", profile.uid)
    )
  }, [profile?.uid, db])

  const { data: userPosts, error: postsError } = useCollection(postsQuery)

  const filteredPosts = React.useMemo(() => {
    if (!userPosts) return []
    
    const sorted = [...userPosts].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    if (activeTab === 'all') return sorted
    if (activeTab === 'notebooks') return sorted.filter(p => p.type === 'notebook')
    if (activeTab === 'flashcards') return sorted.filter(p => p.type === 'flashcardSet')
    if (activeTab === 'thoughts') return sorted.filter(p => p.type === 'thought')
    return sorted
  }, [userPosts, activeTab])

  const handleAction = () => {
    if (!currentUser) {
      router.push('/login')
      return
    }

    if (!profile || !db) return
    
    // Check relationship status and act accordingly
    if (relationshipStatus === 'accepted') {
      toast({ title: "you are already friends!" })
      return
    }

    if (relationshipStatus === 'pending_out') {
      toast({ title: "request already sent" })
      return
    }

    if (relationshipStatus === 'pending_in') {
      // Accept it
      const myRef = doc(db, "users", effectiveUid, "friends", profile.uid)
      const theirRef = doc(db, "users", profile.uid, "friends", effectiveUid)
      updateDocumentNonBlocking(myRef, { status: 'accepted' })
      updateDocumentNonBlocking(theirRef, { status: 'accepted' })
      toast({ title: "friend request accepted!" })
      return
    }

    // Send new request
    const myFriendRef = doc(db, "users", effectiveUid, "friends", profile.uid)
    const theirFriendRef = doc(db, "users", profile.uid, "friends", effectiveUid)

    setDocumentNonBlocking(myFriendRef, {
      uid: profile.uid,
      username: profile.username,
      displayName: profile.displayName || profile.username,
      photoUrl: profile.photoUrl || '',
      status: 'pending_out',
      createdAt: new Date().toISOString()
    }, { merge: true })

    setDocumentNonBlocking(theirFriendRef, {
      uid: effectiveUid,
      username: myProfile?.username || "student",
      displayName: myProfile?.displayName || currentUser.displayName || 'guko student',
      photoUrl: myProfile?.photoUrl || currentUser.photoURL || '',
      status: 'pending_in',
      createdAt: new Date().toISOString()
    }, { merge: true })

    toast({ title: "request sent!" })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-background">
         <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle className="h-10 w-10" />
         </div>
         <h1 className="text-3xl font-bold font-headline lowercase">student not found</h1>
         <Button onClick={() => router.push('/share-hub')} variant="outline" className="rounded-xl lowercase">back to hub</Button>
      </div>
    )
  }

  const theme = profile.theme || {}
  const layout = profile.layout || {}
  const customColors = theme.customColors || { primary: '#A7C4A0', background: '#FFFFFF', foreground: '#1a1c19' }
  const isOfficial = profile.isGukoMode === true || profile.username === 'guko';
  const isProfileAdmin = profile.isAdmin === true;
  
  const isSelf = effectiveUid === profile.uid;
  const canAdminEdit = isAdmin && isOfficial && !isGukoMode; // Admin viewing Guko while NOT in Guko mode

  const getColorStyle = (val: any) => {
    if (!val) return 'transparent';
    if (typeof val === 'string') return val;
    if (val.type === 'solid') return val.solid;
    const stops = [...(val.gradient || [])].sort((a, b) => a.offset - b.offset);
    const rotation = val.rotation ?? 90;
    return `linear-gradient(${rotation}deg, ${stops.map((s: any) => `${s.color} ${s.offset}%`).join(', ')})`;
  };

  const bodyBg = getColorStyle(theme.body || customColors.background)
  const textPrimary = getColorStyle(theme.text || customColors.foreground)
  const btnStyle = getColorStyle(theme.buttons || customColors.primary)
  const cornerRounding = `${profile.cornerRounding ?? 16}px`

  const getTargetBorderStyle = (target: string, itemBg: string) => {
    const isSelected = profile.borderTargets?.includes(target);
    const width = profile.borderWidth || 0;
    const color = profile.targetColors?.[target] || theme.border || { type: 'solid', solid: '#ffffff33' };

    if (!isSelected || width <= 0) return { border: 'none' };
    if (color.type === 'solid') return { border: `${width}px solid ${color.solid}` };
    const gradient = getColorStyle(color);
    const mask = itemBg.includes('gradient') ? itemBg : `linear-gradient(${itemBg}, ${itemBg})`;
    return {
      border: `${width}px solid transparent`,
      backgroundImage: `${mask}, ${gradient}`,
      backgroundOrigin: 'border-box',
      backgroundClip: 'padding-box, border-box'
    };
  };

  const actionButtonLabel = React.useMemo(() => {
    if (isRelationshipLoading) return <Loader2 className="animate-spin h-4 w-4" />;
    if (relationshipStatus === 'accepted') return 'friends';
    if (relationshipStatus === 'pending_out') return 'requested!';
    if (relationshipStatus === 'pending_in') return 'accept request';
    return 'add friend';
  }, [isRelationshipLoading, relationshipStatus]);

  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-700"
      style={{ 
        background: bodyBg,
        fontFamily: profile.font || 'Plus Jakarta Sans',
      }}
    >
      <div className="relative w-full min-h-[500px]">
        {/* Banner */}
        <div 
          className="absolute overflow-hidden" 
          style={{ 
            left: layout.banner?.x ?? 0, top: layout.banner?.y ?? 0,
            width: layout.banner?.w ?? '100%', height: layout.banner?.h ?? 220,
            zIndex: layout.banner?.zIndex ?? 0
          }}
        >
          {profile.bannerUrl ? (
            <img src={profile.bannerUrl} className="w-full h-full object-cover" alt="banner" />
          ) : (
            <div className="w-full h-full opacity-20" style={{ background: btnStyle }} />
          )}
        </div>

        <div className="w-full px-10 relative h-[500px]">
          {/* Profile Picture */}
          <div 
            className="absolute overflow-hidden flex items-center justify-center bg-muted" 
            style={{ 
              left: layout.pfp?.x ?? 40, top: layout.pfp?.y ?? 140,
              width: layout.pfp?.w ?? 176, height: layout.pfp?.h ?? 176,
              zIndex: layout.pfp?.zIndex ?? 10,
              borderRadius: cornerRounding,
              ...getTargetBorderStyle('profile', 'white'),
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
            }}
          >
            {profile.photoUrl ? (
              <img src={profile.photoUrl} className="w-full h-full object-cover" alt="pfp" />
            ) : (
              <UserCircle2 className="w-1/2 h-1/2 opacity-20" />
            )}
          </div>

          {/* Identity & Actions */}
          <div 
            className="absolute flex items-center justify-between"
            style={{ 
              left: layout.name?.x ?? 240, top: layout.name?.y ?? 230,
              width: `calc(100% - ${(layout.name?.x ?? 240) + 40}px)`,
              zIndex: layout.name?.zIndex ?? 10
            }}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 
                  className={cn("leading-none lowercase", isOfficial && "italic font-black")} 
                  style={{ 
                    color: textPrimary,
                    fontSize: layout.name?.fontSize ? `${layout.name.fontSize}px` : '36px',
                    fontWeight: isOfficial ? '900' : (layout.name?.fontWeight || 'bold')
                  }}
                >
                  {profile.displayName || profile.username}
                </h1>
                {(isOfficial || isProfileAdmin) && (
                  <BadgeCheck 
                    size={layout.name?.fontSize ? layout.name.fontSize * 0.8 : 32} 
                    className="text-primary fill-primary/10" 
                  />
                )}
              </div>
              <p 
                className="opacity-60 lowercase" 
                style={{ 
                  color: textPrimary,
                  fontSize: layout.username?.fontSize ? `${layout.username.fontSize}px` : '14px',
                  fontWeight: layout.username?.fontWeight || 'normal'
                }}
              >
                @{profile.username}
              </p>
            </div>
            
            <div className="flex items-center gap-3" style={{ zIndex: layout.addBtn?.zIndex ?? 10 }}>
              {isSelf ? (
                <ProfileCustomizer open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <button 
                    onClick={() => setIsEditDialogOpen(true)}
                    className="px-10 py-3 text-sm lowercase transition-all shadow-md hover:brightness-95 active:scale-95 flex items-center gap-2"
                    style={{ 
                      background: btnStyle, 
                      color: 'white',
                      borderRadius: cornerRounding,
                      fontSize: layout.addBtn?.fontSize ? `${layout.addBtn.fontSize}px` : '14px',
                      fontWeight: layout.addBtn?.fontWeight || 'bold',
                      ...getTargetBorderStyle('add', btnStyle)
                    }}
                  >
                    <Edit2 size={16} /> edit profile
                  </button>
                </ProfileCustomizer>
              ) : canAdminEdit ? (
                <ProfileCustomizer 
                  open={isEditDialogOpen} 
                  onOpenChange={setIsEditDialogOpen}
                  overrideProfileRef={gukoProfileRef}
                >
                  <button 
                    onClick={() => setIsEditDialogOpen(true)}
                    className="px-10 py-3 text-sm lowercase transition-all shadow-md hover:brightness-95 active:scale-95 flex items-center gap-2"
                    style={{ 
                      background: btnStyle, 
                      color: 'white',
                      borderRadius: cornerRounding,
                      fontSize: layout.addBtn?.fontSize ? `${layout.addBtn.fontSize}px` : '14px',
                      fontWeight: layout.addBtn?.fontWeight || 'bold',
                      ...getTargetBorderStyle('add', btnStyle)
                    }}
                  >
                    <Edit2 size={16} /> edit official profile
                  </button>
                </ProfileCustomizer>
              ) : (
                <button 
                  onClick={handleAction}
                  disabled={isRelationshipLoading || relationshipStatus === 'accepted'}
                  className={cn(
                    "px-10 py-3 text-sm lowercase transition-all shadow-md active:scale-95",
                    relationshipStatus === 'accepted' ? "opacity-50 cursor-default" : "hover:brightness-95"
                  )}
                  style={{ 
                    background: btnStyle, 
                    color: 'white',
                    borderRadius: cornerRounding,
                    fontSize: layout.addBtn?.fontSize ? `${layout.addBtn.fontSize}px` : '14px',
                    fontWeight: layout.addBtn?.fontWeight || 'bold',
                    ...getTargetBorderStyle('add', btnStyle)
                  }}
                >
                  {actionButtonLabel}
                </button>
              )}
              
              {!isSelf && (
                <button 
                  className="p-3 bg-white border border-border rounded-sm hover:bg-muted transition-colors shadow-sm"
                  style={{ borderRadius: cornerRounding }}
                >
                  <Bell size={20} className="text-black/60" />
                </button>
              )}
            </div>
          </div>

          {/* Bio Section */}
          <div 
            className="absolute"
            style={{ 
              left: layout.bio?.x ?? 40, top: layout.bio?.y ?? 340,
              width: layout.bio?.w ?? 600,
              zIndex: layout.bio?.zIndex ?? 10,
              color: textPrimary
            }}
          >
            <div className="space-y-2">
              <span 
                className="uppercase tracking-widest opacity-40"
                style={{ 
                  fontSize: layout.aboutHeader?.fontSize ? `${layout.aboutHeader.fontSize}px` : '10px',
                  fontWeight: layout.aboutHeader?.fontWeight || 'bold'
                }}
              >
                about me:
              </span>
              <p 
                className="leading-relaxed lowercase italic"
                style={{ 
                  fontSize: layout.bio?.fontSize ? `${layout.bio.fontSize}px` : '18px',
                  fontWeight: layout.bio?.fontWeight || 'normal'
                }}
              >
                {profile.bio || 'this student has not shared a bio yet.'}
              </p>
            </div>
          </div>

          {/* Stickers */}
          {(profile.stickers || []).map((sticker: any) => (
            <div key={sticker.id} className="absolute pointer-events-none" style={{
                left: sticker.x, top: sticker.y, width: sticker.w, height: sticker.h,
                zIndex: sticker.zIndex, transform: `rotate(${sticker.rotation || 0}deg)`
              }}>
                <img src={sticker.url} className="w-full h-full object-fill" alt="sticker" />
            </div>
          ))}
        </div>
      </div>

      <div 
        className="w-full sticky top-0 z-50 border-y border-black/5"
        style={{ background: btnStyle, opacity: 0.9, backdropBlur: '10px' }}
      >
        <div className="w-full flex">
          <TabItem active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="ALL POSTS" />
          <TabItem active={activeTab === 'notebooks'} onClick={() => setActiveTab('notebooks')} label="NOTEBOOKS" />
          <TabItem active={activeTab === 'flashcards'} onClick={() => setActiveTab('flashcards')} label="FLASHCARDS" />
          <TabItem active={activeTab === 'thoughts'} onClick={() => setActiveTab('thoughts')} label="THOUGHTS" />
        </div>
      </div>

      <div className="flex-1 w-full pb-40">
        <div className="max-w-[1200px] mx-auto px-10 py-12">
          {postsError ? (
            <div className="py-20 text-center space-y-4 opacity-50">
               <AlertCircle className="mx-auto h-12 w-12" style={{ color: textPrimary }} />
               <p className="font-bold lowercase" style={{ color: textPrimary }}>
                 something went wrong loading the log.
               </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
               {filteredPosts.map(post => (
                 <FeedCard 
                  key={post.id} 
                  post={post} 
                  profile={profile} 
                  onCopy={() => handleCopyToLibrary(post, currentUser, db, toast)} 
                  textPrimary={textPrimary}
                 />
               ))}
               {filteredPosts.length === 0 && (
                 <div className="col-span-full py-40 text-center opacity-30">
                   <p className="font-bold text-xl lowercase" style={{ color: textPrimary }}>no posts found in this section.</p>
                 </div>
               )}
            </div>
          )}
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
        "flex-1 py-5 text-xs font-black tracking-[0.2em] transition-all",
        active ? "bg-black/10 text-white" : "text-white/60 hover:text-white hover:bg-black/5"
      )}
    >
      {label}
    </button>
  )
}

function FeedCard({ post, profile, onCopy, textPrimary }: { post: any, profile: any, onCopy: () => void, textPrimary: string }) {
  const isThought = post.type === 'thought'
  const postVerb = isThought ? "posted a thought" : `shared a ${post.type === 'flashcardSet' ? 'flashcard deck' : post.type}`
  const isOfficial = post.isOfficial === true || profile.username === 'guko';
  const isAdmin = post.isAdmin === true;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 border border-black/5 group">
      <div className="p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-1">
          <div className="flex items-center gap-1.5">
            <span className={cn("text-[10px] font-mono text-black/40 lowercase", isOfficial && "italic font-bold")}>
              {profile.displayName || profile.username} {postVerb}
            </span>
            {(isOfficial || isAdmin) && <BadgeCheck className="h-3 w-3 text-primary" />}
          </div>
        </div>

        {isThought ? (
          <div className="pt-2">
             <p className="text-xl md:text-2xl text-black leading-relaxed lowercase font-medium italic">
               "{post.content}"
             </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-black lowercase leading-tight">
              {post.itemData?.name || post.itemData?.title}
            </h3>
            
            <div className="w-full aspect-video bg-muted/30 rounded-xl flex items-center justify-center p-6 relative overflow-hidden border border-black/5">
               <span className="text-xs font-bold text-black/20 uppercase tracking-widest">
                 {post.type} preview
               </span>
               <div className="absolute bottom-0 left-0 w-full h-1 bg-black/5" />
            </div>

            <Button 
              onClick={onCopy}
              className="w-full rounded-xl border-none font-bold lowercase transition-all h-12 shadow-lg shadow-black/5"
            >
              save to library
            </Button>
          </div>
        )}

        <div className="pt-4 flex justify-between items-center opacity-20 text-[9px] font-bold uppercase tracking-widest border-t border-black/5">
           <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}

async function handleCopyToLibrary(post: any, user: any, db: any, toast: any) {
  if (!user) {
    window.location.href = '/login';
    return;
  }
  
  try {
    const { setDocumentNonBlocking } = await import("@/firebase")
    const { getDocs, query, collection, doc, orderBy } = await import("firebase/firestore")

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
      const coursesSnap = await getDocs(query(coursesRef, orderBy("createdAt", "desc")))
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
