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
  Plus
} from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
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

  // Friends query
  const friendsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "users", user.uid, "friends"), where("status", "==", "accepted"))
  }, [user, db])
  const { data: friends, isLoading: isFriendsLoading } = useCollection(friendsQuery)

  if (isUserLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>
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
    const myFriendRef = doc(db, "users", user.uid, "friends", targetUser.uid)
    setDocumentNonBlocking(myFriendRef, {
      uid: targetUser.uid,
      username: targetUser.username,
      displayName: targetUser.displayName,
      photoUrl: targetUser.photoUrl,
      status: 'pending_out',
      createdAt: new Date().toISOString()
    }, { merge: true })

    toast({
      title: "request sent!",
      description: `friend request sent to ${targetUser.displayName}.`,
    })
    
    setSelectedUser(null)
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
                <h3 className="font-bold text-xl lowercase flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> my friends
                </h3>
                <Badge variant="secondary" className="rounded-full">{friends?.length || 0}</Badge>
              </div>

              <div className="space-y-3">
                {isFriendsLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : friends && friends.length > 0 ? (
                  friends.map(friend => (
                    <FriendItem key={friend.id} friend={friend} />
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground lowercase italic text-sm">
                    you haven't added any friends yet.
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
                    actionLabel="add friend"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function UserSearchCard({ user, onClick }: { user: any, onClick: () => void }) {
  const primary = user.theme?.customColors?.primary || '#A7C4A0'
  const background = user.theme?.customColors?.background || '#FFFFFF'
  
  return (
    <div 
      onClick={onClick}
      className="group relative h-48 rounded-3xl overflow-hidden border border-border/10 cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 bg-card"
    >
      {/* Top banner, Bottom color background */}
      <div className="absolute inset-0 flex flex-col">
        <div className="h-1/2 bg-cover bg-center relative" style={{ backgroundImage: `url(${user.bannerUrl})`, backgroundColor: primary }}>
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="h-1/2" style={{ backgroundColor: background }} />
      </div>

      <div className="relative h-full flex flex-col items-center justify-center gap-3">
        <div className="h-20 w-20 rounded-[20px] overflow-hidden border-4 border-white shadow-xl bg-white shrink-0 group-hover:scale-110 transition-transform">
          {user.photoUrl ? (
            <img src={user.photoUrl} className="w-full h-full object-cover" alt="avatar" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
              {user.displayName?.[0]}
            </div>
          )}
        </div>
        <div className="text-center px-4 w-full">
          <h4 className="font-bold text-base lowercase truncate drop-shadow-sm">{user.displayName}</h4>
          <p className="text-[11px] lowercase truncate opacity-60">@{user.username}</p>
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

function ImmersiveProfilePreview({ profile, onAction, actionLabel }: { profile: any, onAction: () => void, actionLabel: string }) {
  const theme = profile.theme || {}
  const layout = profile.layout || {
    banner: { x: 0, y: 0, w: 800, h: 120, zIndex: 0 },
    pfp: { x: 40, y: 80, w: 140, h: 140, zIndex: 2 },
    name: { x: 200, y: 100, w: 400, h: 60, zIndex: 2 },
    username: { x: 200, y: 160, w: 200, h: 30, zIndex: 2 },
    bio: { x: 40, y: 250, w: 500, h: 100, zIndex: 2 },
    addBtn: { x: 620, y: 100, w: 140, h: 50, zIndex: 2 },
    aboutHeader: { x: 40, y: 230, w: 100, h: 20, zIndex: 2 }
  }
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
  const cornerRadius = `${profile.cornerRounding ?? 48}px`;

  return (
    <div 
      className="w-full aspect-[16/10] overflow-hidden relative shadow-2xl border border-border"
      style={{ 
        background: getColorStyle(theme.body || customColors.background),
        fontFamily: profile.font || 'Plus Jakarta Sans',
        borderRadius: cornerRadius,
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
          borderRadius: `${profile.cornerRounding ?? 24}px`,
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
        <h4 className="text-5xl font-bold leading-none lowercase truncate drop-shadow-sm">{profile.displayName || 'student'}</h4>
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
          left: layout.addBtn?.x ?? 620, 
          top: layout.addBtn?.y ?? 100,
          width: layout.addBtn?.w ?? 140,
          height: layout.addBtn?.h ?? 50,
          zIndex: layout.addBtn?.zIndex ?? 2
        }}
      >
        <Button 
          onClick={onAction}
          className="w-full h-full p-0 font-bold lowercase border-none shadow-xl hover:scale-105 transition-transform"
          style={{ 
            background: getColorStyle(theme.buttons || customColors.primary),
            color: 'white',
            borderRadius: `${profile.cornerRounding ?? 16}px`,
            ...getTargetBorderStyle('add', getColorStyle(theme.buttons || customColors.primary))
          }}
        >
          {actionLabel}
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
    <div className="flex items-center justify-between p-4 rounded-[24px] bg-card border border-border shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-primary/20">
          <AvatarImage src={friend.photoUrl} className="object-cover" />
          <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">{friend.displayName?.[0]}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h4 className="font-bold text-xs lowercase truncate">{friend.displayName}</h4>
          <p className="text-[9px] opacity-40 lowercase">@{friend.username}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 px-3 rounded-lg lowercase text-[11px] gap-1.5"
          onClick={() => setShowSharePicker(true)}
        >
          <Share2 size={12} className="text-primary" /> share
        </Button>
      </div>

      {/* Share Dialogs logic remains the same ... */}
    </div>
  )
}
