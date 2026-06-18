
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  Users, 
  UserPlus, 
  MessageSquare, 
  Share2, 
  Check, 
  X, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  GraduationCap,
  BookOpen,
  CheckSquare,
  Layers,
  AlertCircle,
  UserCircle2,
  ArrowLeft,
  Plus,
  Clock,
  UserCheck,
  Bell
} from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { collection, query, where, getDocs, doc, collectionGroup, orderBy } from "firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const PORTAL_BASE_W = 600;
const PORTAL_BASE_H = 400;

const DEFAULT_PROFILE_LAYOUT = {
  banner: { x: 0, y: 0, w: 600, h: 80, zIndex: 0 },
  pfp: { x: 24, y: 40, w: 96, h: 96, zIndex: 2 },
  name: { x: 136, y: 50, w: 280, h: 48, zIndex: 2 },
  username: { x: 136, y: 98, w: 150, h: 24, zIndex: 2 },
  bio: { x: 24, y: 200, w: 300, h: 60, zIndex: 2 },
  addBtn: { x: 440, y: 50, w: 130, h: 44, zIndex: 2 },
  aboutHeader: { x: 24, y: 175, w: 100, h: 20, zIndex: 2 }
};

export default function FriendsPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<any[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null)
  const [hasSearched, setHasSearched] = React.useState(false)

  // Current User's Profile (for sending name/photo in requests)
  const myProfileQuery = useMemoFirebase(() => user ? query(collection(db, 'users', user.uid, 'profile')) : null, [user, db])
  const { data: myProfile } = useCollection(myProfileQuery)
  const actualMyProfile = myProfile?.find(p => p.id === 'settings')

  // Friends query (includes pending)
  const allFriendsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "users", user.uid, "friends"))
  }, [user, db])
  const { data: allFriendDocs, isLoading: isFriendsLoading } = useCollection(allFriendsQuery)

  const acceptedFriends = allFriendDocs?.filter(f => f.status === 'accepted') || []
  const incomingRequests = allFriendDocs?.filter(f => f.status === 'pending_in') || []

  // Auto-show requests if they exist
  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);
  
  React.useEffect(() => {
    if (incomingRequests.length > 0) {
      setIsRequestModalOpen(true);
    }
  }, [incomingRequests.length]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" />
      </div>
    )
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || !db) return
    setIsSearching(true)
    setHasSearched(true)
    setSearchResults([]) 

    try {
      const q = query(
        collectionGroup(db, "profile"),
        where("username", "==", searchQuery.toLowerCase().trim())
      )
      
      const querySnapshot = await getDocs(q)
      const results = querySnapshot.docs
        .map(doc => ({ 
          ...doc.data(), 
          uid: doc.ref.parent.parent?.id 
        }))
        .filter(u => u.uid !== user?.uid)

      setSearchResults(results)
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: 'profile (collection group)',
        })
        errorEmitter.emit('permission-error', contextualError);
      } else {
        toast({
          variant: "destructive",
          title: "search error",
          description: e.message || "could not complete search."
        })
      }
    } finally {
      setIsSearching(false)
    }
  }

  const sendRequest = (targetUser: any) => {
    if (!user || !db) return
    
    // Check if already requested or friends
    const existing = allFriendDocs?.find(f => f.uid === targetUser.uid)
    if (existing) {
      toast({ title: "already pending", description: "a request is already being processed for this student." })
      return
    }

    // 1. Write to MY friends list (Pending Out)
    const myFriendRef = doc(db, "users", user.uid, "friends", targetUser.uid)
    setDocumentNonBlocking(myFriendRef, {
      uid: targetUser.uid,
      username: targetUser.username,
      displayName: targetUser.displayName,
      photoUrl: targetUser.photoUrl,
      status: 'pending_out',
      createdAt: new Date().toISOString()
    }, { merge: true })

    // 2. Write to THEIR friends list (Pending In)
    const theirFriendRef = doc(db, "users", targetUser.uid, "friends", user.uid)
    setDocumentNonBlocking(theirFriendRef, {
      uid: user.uid,
      username: actualMyProfile?.username || user.displayName?.split(' ')[0] || user.email?.split('@')[0] || "student",
      displayName: actualMyProfile?.displayName || user.displayName || 'guko student',
      photoUrl: actualMyProfile?.photoUrl || user.photoURL || '',
      status: 'pending_in',
      createdAt: new Date().toISOString()
    }, { merge: true })

    toast({
      title: "request sent!",
      description: `friend request sent to ${targetUser.displayName}.`,
    })
  }

  const handleAcceptRequest = (request: any) => {
    if (!user || !db) return

    // 1. Update MY record to accepted
    const myRef = doc(db, "users", user.uid, "friends", request.uid)
    updateDocumentNonBlocking(myRef, { status: 'accepted' })

    // 2. Update THEIR record to accepted
    const theirRef = doc(db, "users", request.uid, "friends", user.uid)
    updateDocumentNonBlocking(theirRef, { status: 'accepted' })

    toast({ title: "request accepted!", description: `you are now friends with ${request.displayName}.` })
    if (incomingRequests.length <= 1) setIsRequestModalOpen(false)
  }

  const handleDeclineRequest = (request: any) => {
    if (!user || !db) return
    const myRef = doc(db, "users", user.uid, "friends", request.uid)
    const theirRef = doc(db, "users", request.uid, "friends", user.uid)
    deleteDocumentNonBlocking(myRef)
    deleteDocumentNonBlocking(theirRef)
    toast({ title: "request declined", description: "friend request removed." })
    if (incomingRequests.length <= 1) setIsRequestModalOpen(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-smooth-slow pb-20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground lowercase">friends hub</h1>
            <p className="text-muted-foreground mt-1 text-lg lowercase">connect and collaborate with your classmates.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Friends List */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm rounded-[40px] bg-card overflow-hidden h-fit">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xl lowercase flex items-center gap-2 text-foreground">
                  <Users className="h-5 w-5 text-primary" /> my friends
                </h3>
                <Badge variant="secondary" className="rounded-full">{acceptedFriends.length}</Badge>
              </div>

              <div className="space-y-3">
                {isFriendsLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : acceptedFriends.length > 0 ? (
                  acceptedFriends.map(friend => (
                    <FriendItem key={friend.uid} friend={friend} />
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground lowercase italic text-sm">
                    you haven't added any friends yet. search for classmates to get started!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Search & Profile Preview */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="relative group flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="search by username..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-12 h-16 rounded-2xl bg-card border-none text-xl lowercase no-focus-ring shadow-sm"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchQuery.trim()}
                className="h-16 px-10 rounded-2xl font-bold text-lg lowercase shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                {isSearching ? <Loader2 className="h-6 w-6 animate-spin" /> : "search"}
              </Button>
            </div>

            {/* Results or Selection */}
            {!selectedUser ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {searchResults.map((res) => (
                  <UserSearchCard key={res.uid} user={res} onClick={() => setSelectedUser(res)} />
                ))}
                {hasSearched && searchResults.length === 0 && !isSearching && (
                  <div className="col-span-full py-20 flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in">
                    <AlertCircle className="h-12 w-12 opacity-20" />
                    <p className="text-lg lowercase">no students found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" onClick={() => setSelectedUser(null)} className="rounded-xl lowercase text-muted-foreground hover:text-foreground h-8">
                    <ChevronLeft size={16} className="mr-1" /> back to search results
                  </Button>
                </div>
                
                <div className="relative">
                  <ImmersiveProfilePreview 
                    profile={selectedUser} 
                    onAction={() => sendRequest(selectedUser)} 
                    relationshipStatus={allFriendDocs?.find(f => f.uid === selectedUser.uid)?.status}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Incoming Requests Dialog */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[40px] border-none shadow-3xl bg-card overflow-hidden p-0">
          <DialogHeader className="p-8 bg-primary/10 text-left border-b">
             <DialogTitle className="font-headline text-3xl font-bold flex items-center gap-3 lowercase text-foreground">
               <Bell className="h-7 w-7 text-primary animate-pulse" /> classmate requests
             </DialogTitle>
             <DialogDescription className="lowercase text-lg mt-2">
               the following students want to connect with you.
             </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            {incomingRequests.map(req => (
              <div key={req.uid} className="flex items-center justify-between p-5 rounded-3xl bg-muted/30 border border-border/50 shadow-sm hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-4 border-white shadow-md group-hover:scale-110 transition-transform">
                    <AvatarImage src={req.photoUrl} className="object-cover" />
                    <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">{req.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h4 className="font-bold text-lg lowercase truncate text-foreground">{req.displayName}</h4>
                    <p className="text-xs opacity-60 lowercase">@{req.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <Button size="icon" onClick={() => handleAcceptRequest(req)} className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:scale-110 transition-transform">
                     <Check className="h-5 w-5" />
                   </Button>
                   <Button size="icon" variant="ghost" onClick={() => handleDeclineRequest(req)} className="h-10 w-10 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 hover:scale-110 transition-transform">
                     <X className="h-5 w-5" />
                   </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 pt-0 flex justify-center">
             <Button variant="ghost" onClick={() => setIsRequestModalOpen(false)} className="rounded-xl lowercase text-muted-foreground font-medium">review later</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  )
}

function UserSearchCard({ user, onClick }: { user: any, onClick: () => void }) {
  const primary = user.theme?.customColors?.primary || '#A7C4A0'
  const background = user.theme?.customColors?.background || '#FFFFFF'
  
  return (
    <div 
      onClick={onClick}
      className="group relative h-56 rounded-[32px] overflow-hidden border border-border/10 cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 bg-card"
    >
      {/* Vertical Split: Top Banner / Bottom Background */}
      <div className="absolute inset-0 flex flex-col">
        <div className="h-1/2 bg-cover bg-center relative" style={{ backgroundImage: `url(${user.bannerUrl})`, backgroundColor: primary }}>
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="h-1/2" style={{ backgroundColor: background }} />
      </div>

      <div className="relative h-full flex flex-col items-center justify-center gap-3">
        <div className="h-20 w-20 rounded-[20px] overflow-hidden border-4 border-white shadow-xl bg-white shrink-0 group-hover:scale-110 transition-transform mt-4">
          {user.photoUrl ? (
            <img src={user.photoUrl} className="w-full h-full object-cover" alt="avatar" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
              {user.displayName?.[0]}
            </div>
          )}
        </div>
        <div className="text-center px-4 w-full">
          <h4 className="font-bold text-base lowercase truncate drop-shadow-sm text-foreground">{user.displayName}</h4>
          <p className="text-[11px] lowercase truncate opacity-60 text-foreground">@{user.username}</p>
        </div>
      </div>
      
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all">
        <div className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <ChevronRight size={20} className="text-primary" />
        </div>
      </div>
    </div>
  )
}

function ImmersiveProfilePreview({ profile, onAction, relationshipStatus }: { profile: any, onAction: () => void, relationshipStatus?: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setScale(width / PORTAL_BASE_W);
      }
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const theme = profile.theme || {}
  const layout = profile.layout || DEFAULT_PROFILE_LAYOUT;
  const stickers = profile.stickers || []
  const customColors = theme.customColors || { primary: '#A7C4A0', background: '#FFFFFF', foreground: '#1a1c19' }

  const getColorStyle = (val: any) => {
    if (!val) return 'transparent';
    if (typeof val === 'string') return val;
    if (val.type === 'solid') return val.solid;
    const stops = [...(val.gradient || [])].sort((a, b) => a.offset - b.offset);
    const rotation = val.rotation ?? 90;
    return `linear-gradient(${rotation}deg, ${stops.map((s: any) => `${s.color} ${s.offset}%`).join(', ')})`;
  };

  const getTargetBorderStyle = (target: string, itemBg: string) => {
    const isSelected = profile.borderTargets?.includes(target);
    const width = profile.borderWidth || 0;
    const color = profile.targetColors?.[target] || theme.border || { type: 'solid', solid: '#ffffff33' };

    if (!isSelected || width <= 0) return { border: 'none' };

    if (color.type === 'solid') {
      return { border: `${width}px solid ${color.solid}` };
    } else {
      const gradient = getColorStyle(color);
      return {
        border: `${width}px solid transparent`,
        backgroundImage: `linear-gradient(${itemBg}, ${itemBg}), ${gradient}`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box'
      };
    }
  };

  const pfpBg = profile.photoUrl ? 'transparent' : 'rgba(0,0,0,0.1)';
  const cornerRadius = `${profile.cornerRounding ?? 16}px`;

  const getActionLabel = () => {
    if (relationshipStatus === 'accepted') return 'Friends';
    if (relationshipStatus === 'pending_out') return 'Requested!';
    if (relationshipStatus === 'pending_in') return 'Accept Request';
    return 'Add Friend';
  };

  const isAlreadyActioned = relationshipStatus === 'accepted' || relationshipStatus === 'pending_out';

  return (
    <div 
      ref={containerRef}
      className="w-full relative overflow-hidden bg-muted/10 shadow-2xl border border-border"
      style={{ 
        height: PORTAL_BASE_H * scale,
        borderRadius: cornerRadius,
      }}
    >
      <div 
        className="absolute top-0 left-0 origin-top-left"
        style={{ 
          width: PORTAL_BASE_W, 
          height: PORTAL_BASE_H,
          transform: `scale(${scale})`,
          background: getColorStyle(theme.body || customColors.background),
          fontFamily: profile.font || 'Plus Jakarta Sans',
        }}
      >
        {/* Banner */}
        <div 
          className="absolute"
          style={{ 
            left: layout.banner?.x ?? 0, 
            top: layout.banner?.y ?? 0,
            width: layout.banner?.w ?? '100%',
            height: layout.banner?.h ?? 120,
            zIndex: layout.banner?.zIndex ?? 0
          }}
        >
          {profile.bannerUrl ? (
            <img src={profile.bannerUrl} className="w-full h-full object-cover" alt="banner" />
          ) : (
            <div className="w-full h-full bg-black/10" />
          )}
        </div>
        
        {/* PFP */}
        <div 
          className="absolute overflow-hidden flex items-center justify-center transition-all"
          style={{ 
            left: layout.pfp?.x ?? 40, 
            top: layout.pfp?.y ?? 80,
            width: layout.pfp?.w ?? 140,
            height: layout.pfp?.h ?? 140,
            borderRadius: cornerRadius,
            zIndex: layout.pfp?.zIndex ?? 2,
            ...getTargetBorderStyle('profile', pfpBg),
            backgroundColor: pfpBg
          }}
        >
          {profile.photoUrl ? (
            <img src={profile.photoUrl} className="w-full h-full object-cover" alt="pfp" />
          ) : (
            <UserCircle2 className="w-1/2 h-1/2 opacity-20" />
          )}
        </div>

        {/* Name */}
        <div 
          className="absolute flex flex-col justify-center"
          style={{ 
            left: layout.name?.x ?? 200, 
            top: layout.name?.y ?? 100,
            width: layout.name?.w ?? 400,
            height: layout.name?.h ?? 60,
            zIndex: layout.name?.zIndex ?? 2,
            color: getColorStyle(theme.text || customColors.foreground)
          }}
        >
          <h4 className="text-3xl font-bold leading-tight lowercase drop-shadow-sm">{profile.displayName || 'student'}</h4>
        </div>

        {/* Username */}
        <div 
          className="absolute"
          style={{ 
            left: layout.username?.x ?? 200, 
            top: layout.username?.y ?? 160,
            width: layout.username?.w ?? 200,
            height: layout.username?.h ?? 30,
            zIndex: layout.username?.zIndex ?? 2,
            color: getColorStyle(theme.text || customColors.foreground),
            opacity: 0.6
          }}
        >
          <p className="text-xl lowercase truncate">@{profile.username}</p>
        </div>

        {/* Add Friend Button */}
        <div 
          className="absolute"
          style={{ 
            left: layout.addBtn?.x ?? 440, 
            top: layout.addBtn?.y ?? 100,
            width: layout.addBtn?.w ?? 140,
            height: layout.addBtn?.h ?? 50,
            zIndex: layout.addBtn?.zIndex ?? 2
          }}
        >
          <Button 
            onClick={(e) => { e.stopPropagation(); onAction(); }}
            disabled={isAlreadyActioned}
            className={cn(
              "w-full h-full p-0 font-bold lowercase border-none shadow-xl transition-all",
              !isAlreadyActioned && "hover:scale-105 active:scale-95"
            )}
            style={{ 
              background: getColorStyle(theme.buttons || customColors.primary),
              color: 'white',
              borderRadius: cornerRadius,
              opacity: isAlreadyActioned ? 0.6 : 1,
              ...getTargetBorderStyle('add', getColorStyle(theme.buttons || customColors.primary))
            }}
          >
            {relationshipStatus === 'accepted' && <UserCheck className="mr-2 h-4 w-4" />}
            {getActionLabel()}
          </Button>
        </div>

        {/* About Me Label */}
        <div 
          className="absolute"
          style={{ 
            left: layout.aboutHeader?.x ?? 40, 
            top: layout.aboutHeader?.y ?? 230,
            width: layout.aboutHeader?.w ?? 100,
            height: layout.aboutHeader?.h ?? 20,
            zIndex: layout.aboutHeader?.zIndex ?? 2,
            color: getColorStyle(theme.text || customColors.foreground),
            opacity: 0.4
          }}
        >
          <h5 className="text-[12px] font-bold uppercase tracking-widest">about me</h5>
        </div>

        {/* Bio */}
        <div 
          className="absolute"
          style={{ 
            left: layout.bio?.x ?? 40, 
            top: layout.bio?.y ?? 250,
            width: layout.bio?.w ?? 500,
            height: layout.bio?.h ?? 100,
            zIndex: layout.bio?.zIndex ?? 2,
            color: getColorStyle(theme.text || customColors.foreground),
          }}
        >
          <p className="text-lg leading-relaxed lowercase opacity-90 italic line-clamp-4">
            {profile.bio || 'this student has not shared a bio yet.'}
          </p>
        </div>

        {/* Stickers */}
        {stickers.map((sticker: any) => (
          <div 
            key={sticker.id}
            className="absolute transition-all pointer-events-none"
            style={{
              left: sticker.x, top: sticker.y, width: sticker.w, height: sticker.h,
              zIndex: sticker.zIndex,
              transform: `rotate(${sticker.rotation || 0}deg)`
            }}
          >
            <img src={sticker.url} className="w-full h-full object-fill" alt="sticker" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FriendItem({ friend }: { friend: any }) {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [showSharePicker, setShowSharePicker] = React.useState(false)
  const [shareCategory, setShareCategory] = React.useState<'flashcardSet' | 'notebook' | 'task' | null>(null)
  const [selectedItem, setSelectedItem] = React.useState<any>(null)
  const [showSharingModal, setShowSharingModal] = React.useState(false)

  // Data fetching for sharing
  const coursesQuery = useMemoFirebase(() => user ? query(collection(db, "users", user.uid, "courses")) : null, [user, db])
  const { data: courses } = useCollection(coursesQuery)
  
  const flashcardSetsQuery = useMemoFirebase(() => {
    if (!user || !courses || courses.length === 0) return null
    return query(collection(db, "users", user.uid, "courses", courses[0].id, "flashcardSets"))
  }, [user, db, courses])
  const { data: decks } = useCollection(flashcardSetsQuery)

  const notesQuery = useMemoFirebase(() => user ? query(collection(db, "users", user.uid, "notes"), orderBy("updatedAt", "desc")) : null, [user, db])
  const { data: notes } = useCollection(notesQuery)

  const tasksQuery = useMemoFirebase(() => user ? query(collection(db, "users", user.uid, "tasks"), orderBy("dueDate", "asc")) : null, [user, db])
  const { data: tasks } = useCollection(tasksQuery)

  const handleShare = (mode: 'copy' | 'collaborate') => {
    if (!user || !db || !selectedItem) return
    
    const shareId = doc(collection(db, "temp")).id
    const shareRef = doc(db, "sharedItems", shareId)
    
    setDocumentNonBlocking(shareRef, {
      id: shareId,
      fromUid: user.uid,
      toUid: friend.uid,
      itemType: shareCategory,
      itemId: selectedItem.id,
      itemData: selectedItem, 
      mode,
      createdAt: new Date().toISOString()
    }, { merge: true })

    toast({
      title: "item shared!",
      description: `successfully shared ${selectedItem.title || selectedItem.name} with ${friend.displayName}.`,
    })
    
    setShowSharingModal(false)
    setSelectedItem(null)
    setShareCategory(null)
  }

  const getItemsForCategory = () => {
    if (shareCategory === 'flashcardSet') return decks || []
    if (shareCategory === 'notebook') return notes || []
    if (shareCategory === 'task') return tasks || []
    return []
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-[32px] bg-card border border-border shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-primary/20">
          <AvatarImage src={friend.photoUrl} className="object-cover" />
          <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">{friend.displayName?.[0]}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h4 className="font-bold text-xs lowercase truncate text-foreground">{friend.displayName}</h4>
          <p className="text-[9px] opacity-40 lowercase text-foreground">@{friend.username}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 px-3 rounded-lg lowercase text-[11px] gap-1.5 border-2 border-primary/10 hover:bg-primary/5"
          onClick={() => setShowSharePicker(true)}
        >
          <Share2 size={12} className="text-primary" /> share
        </Button>
      </div>

      <Dialog open={showSharePicker} onOpenChange={setShowSharePicker}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl bg-card p-8 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl lowercase">share with {friend.displayName}</DialogTitle>
            <DialogDescription className="lowercase">
              {!shareCategory ? "what would you like to share?" : `select a ${shareCategory === 'flashcardSet' ? 'deck' : shareCategory}`}
            </DialogDescription>
          </DialogHeader>

          {!shareCategory ? (
            <div className="grid grid-cols-1 gap-3 py-6">
              <ShareCategoryRow icon={<Layers />} label="flashcard decks" onClick={() => setShareCategory('flashcardSet')} />
              <ShareCategoryRow icon={<BookOpen />} label="notebook pages" onClick={() => setShareCategory('notebook')} />
              <ShareCategoryRow icon={<CheckSquare />} label="assigned tasks" onClick={() => setShareCategory('task')} />
            </div>
          ) : (
            <div className="py-4 space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setShareCategory(null)} className="rounded-xl h-8 px-2 lowercase text-muted-foreground">
                <ChevronLeft size={16} className="mr-1" /> change category
              </Button>
              <ScrollArea className="h-64 pr-4">
                <div className="space-y-2">
                  {getItemsForCategory().map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setShowSharingModal(true);
                        setShowSharePicker(false);
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20 text-left group"
                    >
                      <span className="font-bold text-sm lowercase truncate">{item.title || item.name}</span>
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showSharingModal} onOpenChange={setShowSharingModal}>
        <DialogContent className="rounded-[40px] border-none shadow-3xl bg-background p-10 max-w-md text-center">
          <DialogHeader className="space-y-4">
            <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto animate-bounce">
              <Share2 className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="font-headline text-3xl lowercase">sharing mode</DialogTitle>
            <DialogDescription className="lowercase text-lg">how should {friend.displayName} receive "{selectedItem?.title || selectedItem?.name}"?</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-8">
            <Button 
              onClick={() => handleShare('copy')}
              className="h-24 rounded-3xl flex flex-col items-center justify-center gap-1 border-2 border-muted hover:border-primary transition-all bg-card text-foreground group"
            >
              <span className="font-bold text-lg lowercase group-hover:text-primary transition-colors">send a copy</span>
              <span className="text-[10px] opacity-40 lowercase">they get their own version to edit separately</span>
            </Button>
            <Button 
              onClick={() => handleShare('collaborate')}
              className="h-24 rounded-3xl flex flex-col items-center justify-center gap-1 border-2 border-muted hover:border-accent transition-all bg-card text-foreground group"
            >
              <span className="font-bold text-lg lowercase group-hover:text-accent-foreground transition-colors">collaborate</span>
              <span className="text-[10px] opacity-40 lowercase">you will both work on the same exact file</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ShareCategoryRow({ icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all text-left group"
    >
      <div className="p-2 rounded-xl bg-white border border-border shadow-sm group-hover:text-primary transition-colors text-muted-foreground">
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <span className="font-bold text-sm lowercase flex-1 text-foreground">{label}</span>
      <ChevronRight size={16} className="text-muted-foreground opacity-40 group-hover:opacity-100" />
    </button>
  )
}
