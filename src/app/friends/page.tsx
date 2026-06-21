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
  UserCircle2,
  ArrowLeft,
  Bell,
  Send,
  Plus,
  Layers,
  BookOpen,
  CheckSquare,
  Smile,
  Paperclip,
  ImageIcon,
  BadgeCheck,
  Megaphone,
  Star
} from "lucide-react"
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  setDocumentNonBlocking, 
  deleteDocumentNonBlocking, 
  updateDocumentNonBlocking 
} from "@/firebase"
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc, 
  collectionGroup, 
  orderBy, 
  limit, 
  setDoc,
  serverTimestamp 
} from "firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { GiphyPicker } from "@/components/friends/GiphyPicker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import Link from "next/link"

const PORTAL_BASE_W = 600;
const PORTAL_BASE_H = 400;

const DEFAULT_PROFILE_LAYOUT = {
  banner: { x: 0, y: 0, w: 600, h: 80, zIndex: 0 },
  pfp: { x: 24, y: 40, w: 140, h: 140, zIndex: 2 },
  name: { x: 180, y: 100, w: 280, h: 48, zIndex: 2, fontSize: 32, fontWeight: 'bold' },
  username: { x: 180, y: 140, w: 150, h: 24, zIndex: 2, fontSize: 14, fontWeight: 'normal' },
  bio: { x: 24, y: 240, w: 552, h: 140, zIndex: 2, fontSize: 12, fontWeight: 'normal' },
  addBtn: { x: 440, y: 100, w: 130, h: 44, zIndex: 2 },
  aboutHeader: { x: 24, y: 210, w: 100, h: 20, zIndex: 2, fontSize: 10, fontWeight: 'bold' }
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
  const [activeFriend, setActiveFriend] = React.useState<any | null>(null)
  const [viewMode, setViewMode] = React.useState<'discovery' | 'chat'>('discovery')

  const [broadcastText, setBroadcastText] = React.useState("")
  const [isBroadcasting, setIsBroadcasting] = React.useState(false)

  const myProfileQuery = useMemoFirebase(() => user ? query(collection(db, 'users', user.uid, 'profile')) : null, [user, db])
  const { data: myProfile } = useCollection(myProfileQuery)
  const actualMyProfile = myProfile?.[0]
  const isGukoMode = actualMyProfile?.isGukoMode === true;
  const effectiveUid = isGukoMode ? 'guko' : (user?.uid || '');

  const acceptedFriendsQuery = useMemoFirebase(() => {
    if (!user || !db || isGukoMode) return null
    return query(collection(db, "users", user.uid, "friends"), where("status", "==", "accepted"))
  }, [user, db, isGukoMode])
  const { data: acceptedFriends, isLoading: isFriendsLoading } = useCollection(acceptedFriendsQuery)

  const allUsersQuery = useMemoFirebase(() => {
    if (!user || !db || !isGukoMode) return null
    return query(collectionGroup(db, "profile"), limit(200))
  }, [user, db, isGukoMode])
  const { data: allUsers } = useCollection(allUsersQuery)

  const incomingRequestsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "users", effectiveUid, "friends"), where("status", "==", "pending_in"))
  }, [user, db, effectiveUid])
  const { data: incomingRequests } = useCollection(incomingRequestsQuery)

  const myRequestsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "users", effectiveUid, "friends"))
  }, [user, db, effectiveUid])
  const { data: allMyFriends } = useCollection(myRequestsQuery)

  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);
  
  React.useEffect(() => {
    if (incomingRequests && incomingRequests.length > 0) {
      setIsRequestModalOpen(true);
    }
  }, [incomingRequests?.length]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !db) return
    setIsSearching(true)
    setHasSearched(true)
    setSearchResults([]) 
    setSelectedUser(null)
    setViewMode('discovery')

    try {
      const q = query(
        collectionGroup(db, "profile"),
        where("username", "==", searchQuery.toLowerCase().trim())
      )
      
      const querySnapshot = await getDocs(q)
      const results = querySnapshot.docs
        .map(doc => ({ 
          ...doc.data(), 
          uid: doc.data().id || doc.ref.parent.parent?.id 
        }))
        .filter(u => u.uid !== user?.uid && u.uid !== 'guko')

      setSearchResults(results)
    } catch (e: any) {
      console.error("search error", e)
    } finally {
      setIsSearching(false)
    }
  }

  const sendRequest = (targetUser: any) => {
    if (!user || !db) return
    const myFriendRef = doc(db, "users", effectiveUid, "friends", targetUser.uid)
    const theirFriendRef = doc(db, "users", targetUser.uid, "friends", effectiveUid)

    setDocumentNonBlocking(myFriendRef, {
      uid: targetUser.uid,
      username: targetUser.username,
      displayName: targetUser.displayName || targetUser.username,
      photoUrl: targetUser.photoUrl || '',
      status: 'pending_out',
      createdAt: new Date().toISOString()
    }, { merge: true })

    setDocumentNonBlocking(theirFriendRef, {
      uid: effectiveUid,
      username: actualMyProfile?.username || "student",
      displayName: actualMyProfile?.displayName || user.displayName || 'guko student',
      photoUrl: actualMyProfile?.photoUrl || user.photoURL || '',
      status: 'pending_in',
      createdAt: new Date().toISOString()
    }, { merge: true })

    toast({ title: "request sent!" })
  }

  const handleAcceptRequest = (request: any) => {
    if (!user || !db) return
    const myRef = doc(db, "users", effectiveUid, "friends", request.uid)
    const theirRef = doc(db, "users", request.uid, "friends", effectiveUid)

    updateDocumentNonBlocking(myRef, { status: 'accepted' })
    updateDocumentNonBlocking(theirRef, { status: 'accepted' })

    toast({ title: "request accepted!" })
    if (incomingRequests && incomingRequests.length <= 1) setIsRequestModalOpen(false)
  }

  const handleDeclineRequest = (request: any) => {
    if (!user || !db) return
    deleteDocumentNonBlocking(doc(db, "users", effectiveUid, "friends", request.uid))
    deleteDocumentNonBlocking(doc(db, "users", request.uid, "friends", effectiveUid))
    if (incomingRequests && incomingRequests.length <= 1) setIsRequestModalOpen(false)
  }

  const handleBroadcast = async () => {
    if (!user || !db || !broadcastText.trim()) return;
    setIsBroadcasting(true);

    try {
      const allProfiles = await getDocs(query(collectionGroup(db, "profile"), limit(200)));
      const now = new Date().toISOString();

      for (const profileDoc of allProfiles.docs) {
        const targetUid = profileDoc.data().id || profileDoc.ref.parent.parent?.id;
        if (!targetUid || targetUid === 'guko') continue;

        const chatId = ['guko', targetUid].sort().join('_');
        
        const chatRef = doc(db, "chats", chatId);
        setDocumentNonBlocking(chatRef, {
          participants: ['guko', targetUid],
          lastMessage: broadcastText,
          updatedAt: now
        }, { merge: true });

        const msgId = doc(collection(db, "temp")).id;
        const msgRef = doc(db, "chats", chatId, "messages", msgId);
        setDocumentNonBlocking(msgRef, {
          id: msgId,
          senderId: 'guko',
          type: 'text',
          text: broadcastText,
          createdAt: now,
          isBroadcast: true
        }, { merge: true });
      }

      setBroadcastText("");
      toast({ title: "broadcast sent successfully" });
    } catch (e) {
      console.error("Broadcast failed", e);
      toast({ variant: "destructive", title: "failed to send broadcast" });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const rawClassmates = React.useMemo(() => {
    if (isGukoMode) {
      if (!allUsers) return [];
      return allUsers
        .filter(u => u.username && u.displayName) 
        .map(u => ({ 
          ...u, 
          uid: u.id && u.id !== 'settings' ? u.id : (u as any).uid || u.username 
        }));
    }
    return acceptedFriends || [];
  }, [allUsers, acceptedFriends, isGukoMode]);

  const officialGuko = rawClassmates.find(c => c.uid === 'guko' || c.username === 'guko');
  const otherClassmates = rawClassmates.filter(c => 
    c.uid !== 'guko' && 
    c.username !== 'guko' && 
    c.uid !== user?.uid 
  );

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col animate-smooth-slow overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-xl">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="font-headline text-4xl font-bold tracking-tight lowercase">friends hub</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden pb-4">
        <Card className="col-span-12 lg:col-span-4 border-none shadow-sm rounded-[40px] bg-card flex flex-col overflow-hidden">
          <div className="p-6 border-b space-y-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="search classmates..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 h-14 rounded-2xl bg-muted/30 border-none lowercase no-focus-ring"
              />
            </div>
            
            <Button 
              variant="outline" 
              className="w-full h-14 rounded-2xl font-bold lowercase border-2 border-primary/10 hover:bg-primary/5"
              onClick={() => { setViewMode('discovery'); setActiveFriend(null); }}
            >
              <UserPlus className="h-5 w-5 mr-2" /> discover students
            </Button>
          </div>

          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-4">
              {isGukoMode && (
                <div className="p-4 bg-primary/5 rounded-[32px] border border-primary/10 mb-6 space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Megaphone size={16} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Global Broadcast</span>
                  </div>
                  <Textarea 
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="Message all students..."
                    className="min-h-[100px] rounded-2xl border-none bg-background lowercase p-4 text-sm"
                  />
                  <Button 
                    onClick={handleBroadcast} 
                    disabled={isBroadcasting || !broadcastText.trim()}
                    className="w-full rounded-xl font-bold lowercase shadow-lg shadow-primary/20"
                  >
                    {isBroadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Broadcast message
                  </Button>
                </div>
              )}

              {!isGukoMode && officialGuko && (
                <div className="mb-6 space-y-2">
                   <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2">Verified Official</h3>
                   <ClassmateItem 
                    friend={officialGuko} 
                    isActive={activeFriend?.uid === officialGuko.uid} 
                    onClick={() => { setActiveFriend(officialGuko); setViewMode('chat'); setSelectedUser(null); }}
                   />
                </div>
              )}

              <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50 mb-2">
                {isGukoMode ? "Global Classmates" : "My Classmates"}
              </h3>
              
              {isFriendsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary/30" /></div>
              ) : otherClassmates.length > 0 ? (
                otherClassmates.map(friend => (
                  <ClassmateItem 
                    key={friend.uid}
                    friend={friend} 
                    isActive={activeFriend?.uid === friend.uid} 
                    onClick={() => { setActiveFriend(friend); setViewMode('chat'); setSelectedUser(null); }}
                  />
                ))
              ) : (
                <div className="px-4 py-10 text-center text-xs text-muted-foreground italic lowercase">no classmates found.</div>
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className="col-span-12 lg:col-span-8 border-none shadow-sm rounded-[40px] bg-card overflow-hidden flex flex-col">
          {viewMode === 'discovery' ? (
            <div className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar bg-muted/10">
              {!selectedUser ? (
                <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {searchResults.map(res => (
                      <UserSearchCardMini key={res.uid} user={res} onClick={() => setSelectedUser(res)} />
                    ))}
                  </div>
                  {hasSearched && searchResults.length === 0 && !isSearching && (
                    <div className="flex flex-col items-center justify-center py-40 gap-4 text-muted-foreground">
                      <UserPlus className="h-12 w-12 opacity-10" />
                      <p className="lowercase">no students found matching "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                  <div className="w-full flex items-center justify-between mb-4 px-4">
                    <Button variant="ghost" onClick={() => setSelectedUser(null)} className="rounded-xl lowercase text-muted-foreground">
                      <ChevronLeft className="h-4 w-4 mr-1" /> back to search
                    </Button>
                  </div>
                  <ImmersiveProfilePreview 
                    profile={selectedUser} 
                    onAction={() => sendRequest(selectedUser)} 
                    relationshipStatus={allMyFriends?.find(f => f.uid === selectedUser.uid)?.status}
                  />
                </div>
              )}
            </div>
          ) : activeFriend ? (
            <ChatInterface friend={activeFriend} user={user} db={db} actualMyProfile={actualMyProfile} effectiveUid={effectiveUid} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 opacity-10 mb-4" />
              <p className="lowercase">select a classmate to start messaging.</p>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[40px] border-none shadow-3xl bg-card overflow-hidden p-0">
          <DialogHeader className="p-8 bg-primary/10 text-left border-b">
             <DialogTitle className="font-headline text-3xl font-bold flex items-center gap-3 lowercase text-foreground">
               <Bell className="h-7 w-7 text-primary animate-pulse" /> classmate requests
             </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            {incomingRequests?.map(req => {
              const isGuko = req.username === 'guko' || req.isGukoMode === true;
              return (
                <div key={req.uid} className="flex items-center justify-between p-5 rounded-3xl bg-muted/30 border border-border/50 shadow-sm hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-4 border-white shadow-md group-hover:scale-110 transition-transform">
                      <AvatarImage src={req.photoUrl} className="object-cover" />
                      <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">{req.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className={cn("font-bold text-lg lowercase truncate text-foreground", isGuko && "italic font-black")}>{req.displayName}</h4>
                        {(isGuko || req.isAdmin) && <BadgeCheck className="h-4 w-4 text-primary" />}
                      </div>
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
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ClassmateItem({ friend, isActive, onClick }: { friend: any, isActive: boolean, onClick: () => void }) {
  const isGuko = friend.username === 'guko' || friend.isGukoMode === true || friend.uid === 'guko';
  const isAdmin = friend.isAdmin === true;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-3xl transition-all group",
        isActive ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]" : "hover:bg-muted"
      )}
    >
      <div className="flex items-center gap-4 overflow-hidden">
        <Avatar className="h-10 w-10 border-2 border-white/20">
          <AvatarImage src={friend.photoUrl} className="object-cover" />
          <AvatarFallback className="bg-primary/20 text-[10px] font-bold">{friend.displayName?.[0]}</AvatarFallback>
        </Avatar>
        <div className="text-left min-w-0">
          <div className="flex items-center gap-1">
             <p className={cn("font-bold text-sm truncate lowercase", isGuko && "italic font-black")}>{friend.displayName}</p>
             {(isGuko || isAdmin) && <BadgeCheck className="h-3 w-3" />}
          </div>
          <p className={cn("text-[10px] lowercase truncate opacity-60", isActive ? "text-primary-foreground" : "text-muted-foreground")}>@{friend.username}</p>
        </div>
      </div>
      {isActive ? (
        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
      ) : isGuko && (
        <Star className="h-3 w-3 text-primary fill-primary/20" />
      )}
    </button>
  )
}

function UserSearchCardMini({ user, onClick }: { user: any, onClick: () => void }) {
  const theme = {
    primary: user.theme?.customColors?.primary || '#A7C4A0',
    background: user.theme?.customColors?.background || '#FFFFFF'
  }
  const isGuko = user.username === 'guko' || user.isGukoMode === true;
  const isAdmin = user.isAdmin === true;
  
  return (
    <div 
      onClick={onClick}
      className="group relative h-48 rounded-[32px] overflow-hidden border border-border/10 cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 bg-card"
    >
      <div className="absolute inset-0 flex flex-col">
        <div className="h-1/2 bg-cover bg-center" style={{ backgroundImage: `url(${user.bannerUrl})`, backgroundColor: theme.primary }}>
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="h-1/2" style={{ backgroundColor: theme.background }} />
      </div>

      <div className="relative h-full flex flex-col items-center justify-center gap-2">
        <div className="h-16 w-16 rounded-[20px] overflow-hidden border-4 border-white shadow-xl bg-white shrink-0 group-hover:scale-110 transition-transform mt-2">
          {user.photoUrl ? (
            <img src={user.photoUrl} className="w-full h-full object-cover" alt="avatar" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
              {user.displayName?.[0]}
            </div>
          )}
        </div>
        <div className="text-center px-4 w-full">
          <div className="flex items-center justify-center gap-1">
             <h4 className={cn("font-bold text-sm lowercase truncate text-foreground", isGuko && "italic font-black")}>{user.displayName}</h4>
             {(isGuko || isAdmin) && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
          </div>
          <p className="text-[10px] lowercase truncate opacity-40 text-foreground">@{user.username}</p>
        </div>
      </div>
      
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
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
  const customColors = theme.customColors || { primary: '#A7C4A0', background: '#FFFFFF', foreground: '#1a1c19' }
  const isGuko = profile.username === 'guko' || profile.isGukoMode === true;
  const isAdmin = profile.isAdmin === true;

  const getColorStyle = (val: any) => {
    if (!val) return 'transparent';
    if (typeof val === 'string') return val;
    if (val.type === 'solid') return val.solid;
    const stops = [...(val.gradient || [])].sort((a, b) => a.offset - b.offset);
    const rotation = val.rotation ?? 90;
    return `linear-gradient(${rotation}deg, ${stops.map((s: any) => `${s.color} ${s.offset}%`).join(', ')})`;
  };

  const cornerRadius = `${profile.cornerRounding ?? 16}px`;

  return (
    <div className="w-full flex flex-col gap-6">
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
          <div className="absolute" style={{ 
            left: layout.banner?.x ?? 0, top: layout.banner?.y ?? 0,
            width: layout.banner?.w ?? '100%', height: layout.banner?.h ?? 80,
            zIndex: layout.banner?.zIndex ?? 0
          }}>
            {profile.bannerUrl ? (
              <img src={profile.bannerUrl} className="w-full h-full object-cover" alt="banner" />
            ) : (
              <div className="w-full h-full bg-black/10" />
            )}
          </div>
          
          <div className="absolute overflow-hidden flex items-center justify-center" style={{ 
            left: layout.pfp?.x ?? 24, top: layout.pfp?.y ?? 40,
            width: layout.pfp?.w ?? 140, height: layout.pfp?.h ?? 140,
            borderRadius: cornerRadius, zIndex: layout.pfp?.zIndex ?? 2,
            backgroundColor: 'rgba(0,0,0,0.1)'
          }}>
            {profile.photoUrl ? (
              <img src={profile.photoUrl} className="w-full h-full object-cover" alt="pfp" />
            ) : (
              <UserCircle2 className="w-1/2 h-1/2 opacity-20" />
            )}
          </div>

          <div className="absolute flex flex-col justify-center" style={{ 
            left: layout.name?.x ?? 180, top: layout.name?.y ?? 100,
            width: layout.name?.w ?? 400, height: layout.name?.h ?? 48,
            zIndex: layout.name?.zIndex ?? 2,
            color: getColorStyle(theme.text || customColors.foreground),
            fontSize: layout.name?.fontSize ? `${layout.name.fontSize}px` : '32px',
            fontWeight: layout.name?.fontWeight || 'bold'
          }}>
            <div className="flex items-center gap-2">
              <h4 className={cn("leading-tight lowercase truncate", isGuko && "italic font-black")}>{profile.displayName || 'student'}</h4>
              {(isGuko || isAdmin) && <BadgeCheck size={layout.name?.fontSize ? layout.name.fontSize : 32} className="text-primary" />}
            </div>
          </div>

          <div className="absolute" style={{ 
            left: layout.username?.x ?? 180, top: layout.username?.y ?? 145,
            width: layout.username?.w ?? 200, height: layout.username?.h ?? 24,
            zIndex: layout.username?.zIndex ?? 2,
            color: getColorStyle(theme.text || customColors.foreground), opacity: 0.6,
            fontSize: layout.username?.fontSize ? `${layout.username.fontSize}px` : '18px',
            fontWeight: layout.username?.fontWeight || 'normal'
          }}>
            <p className="lowercase">@{profile.username}</p>
          </div>

          <div className="absolute" style={{ 
            left: layout.addBtn?.x ?? 440, top: layout.addBtn?.y ?? 100,
            width: layout.addBtn?.w ?? 140, height: layout.addBtn?.h ?? 44,
            zIndex: layout.addBtn?.zIndex ?? 2
          }}>
            <Button 
              onClick={(e) => { e.stopPropagation(); onAction(); }}
              disabled={relationshipStatus !== undefined}
              className="w-full h-full font-bold lowercase border-none shadow-xl transition-all"
              style={{ 
                background: getColorStyle(theme.buttons || customColors.primary),
                color: 'white', borderRadius: cornerRadius
              }}
            >
              {relationshipStatus === 'accepted' ? 'friends' : (relationshipStatus === 'pending_out' || relationshipStatus === 'pending_in') ? 'requested!' : 'add friend'}
            </Button>
          </div>

          <div className="absolute" style={{ 
            left: layout.aboutHeader?.x ?? 24, top: layout.aboutHeader?.y ?? 210,
            width: layout.aboutHeader?.w ?? 100, height: layout.aboutHeader?.h ?? 20,
            zIndex: layout.aboutHeader?.zIndex ?? 2,
            color: getColorStyle(theme.text || customColors.foreground), opacity: 0.8,
            fontSize: layout.aboutHeader?.fontSize ? `${layout.aboutHeader.fontSize}px` : '14px',
            fontWeight: layout.aboutHeader?.fontWeight || 'bold'
          }}>
             <span className="lowercase">about me:</span>
          </div>

          <div className="absolute" style={{ 
            left: layout.bio?.x ?? 24, top: layout.bio?.y ?? 240,
            width: layout.bio?.w ?? 552, height: layout.bio?.h ?? 140,
            zIndex: layout.bio?.zIndex ?? 2,
            color: getColorStyle(theme.text || customColors.foreground),
            fontSize: layout.bio?.fontSize ? `${layout.bio.fontSize}px` : '18px',
            fontWeight: layout.bio?.fontWeight || 'normal'
          }}>
            <p className="leading-relaxed lowercase opacity-90 italic line-clamp-4">
              {profile.bio || 'this student has not shared a bio yet.'}
            </p>
          </div>

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
      
      <Button asChild className="w-full h-16 rounded-[24px] font-bold lowercase gap-2 shadow-xl shadow-primary/20">
        <Link href={`/u/${profile.username}`}>view full profile & logs</Link>
      </Button>
    </div>
  );
}

function ChatInterface({ friend, user, db, actualMyProfile, effectiveUid }: any) {
  const { toast } = useToast();
  const [inputText, setInputText] = React.useState("")
  const [showSharePicker, setShowSharePicker] = React.useState(false)
  const [shareCategory, setShareCategory] = React.useState<'flashcardSet' | 'notebook' | 'task' | null>(null)
  const [selectedItem, setSelectedItem] = React.useState<any>(null)
  const [showConfirmModal, setShowConfirmModal] = React.useState(false)
  const [isAccepting, setIsAccepting] = React.useState<string | null>(null);
  const [isSharing, setIsSharing] = React.useState(false);
  const [showGiphyPicker, setShowGiphyPicker] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const chatId = [effectiveUid, friend.uid].sort().join('_')
  const messagesQuery = useMemoFirebase(() => query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc")), [chatId, db])
  const { data: messages } = useCollection(messagesQuery)

  const coursesQuery = useMemoFirebase(() => query(collection(db, "users", effectiveUid, "courses")), [effectiveUid, db])
  const { data: courses } = useCollection(coursesQuery)
  const notesQuery = useMemoFirebase(() => query(collection(db, "users", effectiveUid, "notes"), orderBy("updatedAt", "desc")), [effectiveUid, db])
  const { data: notes } = useCollection(notesQuery)
  const tasksQuery = useMemoFirebase(() => query(collection(db, "users", effectiveUid, "tasks"), orderBy("dueDate", "asc")), [effectiveUid, db])
  const { data: tasks } = useCollection(tasksQuery)

  const flashcardSetsQuery = useMemoFirebase(() => {
    if (!courses || courses.length === 0) return null
    return query(collection(db, "users", effectiveUid, "courses", courses[0].id, "flashcardSets"))
  }, [effectiveUid, db, courses])
  const { data: decks } = useCollection(flashcardSetsQuery)

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (type: 'text' | 'share-invite' | 'gif' = 'text', content?: any) => {
    if (type === 'text' && !inputText.trim()) return;

    const chatRef = doc(db, "chats", chatId);
    setDocumentNonBlocking(chatRef, {
      participants: [effectiveUid, friend.uid],
      lastMessage: type === 'text' ? inputText : type === 'gif' ? 'Sent a GIF' : `shared a ${content.itemType}`,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const msgId = doc(collection(db, "temp")).id;
    const msgRef = doc(db, "chats", chatId, "messages", msgId);

    let messageData: any = {
      id: msgId,
      senderId: effectiveUid,
      type,
      createdAt: new Date().toISOString()
    };

    if (type === 'text') {
      messageData.text = inputText;
    } else if (type === 'gif') {
      messageData.text = content;
    } else if (type === 'share-invite') {
      messageData.shareData = content;
      messageData.text = "";
    }

    setDocumentNonBlocking(msgRef, messageData, { merge: true });
    if (type === 'text') setInputText("");
  };

  const handleSelectGif = (url: string) => {
    handleSendMessage('gif', url);
    setShowGiphyPicker(false);
  };

  const handleConfirmShare = async (mode: 'copy' | 'collaborate') => {
    if (!user || !db || !selectedItem) return;
    setIsSharing(true);

    try {
      const shareId = doc(collection(db, "temp")).id;
      const shareRef = doc(db, "sharedItems", shareId);

      let itemDataWithChildren = { ...selectedItem };

      if (shareCategory === 'flashcardSet') {
        const cardsRef = collection(db, "users", effectiveUid, "courses", selectedItem.courseId, "flashcardSets", selectedItem.id, "flashcards")
        const cardsSnap = await getDocs(cardsRef);
        itemDataWithChildren.cards = cardsSnap.docs.map(d => ({ ...d.data(), id: d.id }));
      }

      const shareData = {
        itemType: shareCategory,
        itemId: selectedItem.id,
        itemName: selectedItem.title || selectedItem.name,
        mode,
        shareId
      };

      setDocumentNonBlocking(shareRef, {
        id: shareId,
        fromUid: effectiveUid,
        toUid: friend.uid,
        itemType: shareCategory,
        itemId: selectedItem.id,
        itemData: itemDataWithChildren, 
        mode,
        createdAt: new Date().toISOString()
      }, { merge: true });

      handleSendMessage('share-invite', shareData);
      setShowConfirmModal(false);
      setSelectedItem(null);
      setShareCategory(null);
    } catch (e) {
      console.error("Failed to share", e);
      toast({ variant: "destructive", title: "Share failed", description: "Could not prepare shared data." });
    } finally {
      setIsSharing(false);
    }
  }

  const handleAcceptInvite = async (msg: any) => {
    if (!user || !db || !msg.shareData?.shareId) return;
    setIsAccepting(msg.id);

    try {
      const shareRef = doc(db, "sharedItems", msg.shareData.shareId);
      const shareSnap = await getDoc(shareRef);

      if (!shareSnap.exists()) {
        toast({ variant: "destructive", title: "Invite expired", description: "This resource is no longer available." });
        return;
      }

      const shareInfo = shareSnap.data();

      if (msg.shareData.mode === 'copy') {
        if (msg.shareData.itemType === 'notebook') {
          const newNoteId = doc(collection(db, "temp")).id;
          const newNoteRef = doc(db, "users", effectiveUid, "notes", newNoteId);
          setDocumentNonBlocking(newNoteRef, {
            ...shareInfo.itemData,
            id: newNoteId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
          toast({ title: "Page added!" });
        } else if (msg.shareData.itemType === 'task') {
          const newTaskId = doc(collection(db, "temp")).id;
          const newTaskRef = doc(db, "users", effectiveUid, "tasks", newTaskId);
          setDocumentNonBlocking(newTaskRef, {
            ...shareInfo.itemData,
            id: newTaskId,
            createdAt: new Date().toISOString()
          }, { merge: true });
          toast({ title: "Task added!" });
        } else if (msg.shareData.itemType === 'flashcardSet') {
          const coursesRef = collection(db, "users", effectiveUid, "courses");
          const coursesSnap = await getDocs(query(coursesRef, limit(1)));
          let courseId = coursesSnap.docs[0]?.id;
          
          if (!courseId) {
            courseId = doc(collection(db, "temp")).id;
            setDocumentNonBlocking(doc(db, "users", effectiveUid, "courses", courseId), {
              id: courseId,
              name: "shared studies",
              createdAt: new Date().toISOString()
            }, { merge: true });
          }

          const newDeckId = doc(collection(db, "temp")).id;
          const deckRef = doc(db, "users", effectiveUid, "courses", courseId, "flashcardSets", newDeckId);
          
          setDocumentNonBlocking(deckRef, {
            ...shareInfo.itemData,
            id: newDeckId,
            courseId,
            createdAt: new Date().toISOString()
          }, { merge: true });

          if (shareInfo.itemData.cards && Array.isArray(shareInfo.itemData.cards)) {
            shareInfo.itemData.cards.forEach((card: any) => {
               const newCardId = doc(collection(db, "temp")).id;
               const cardRef = doc(db, "users", effectiveUid, "courses", courseId, "flashcardSets", newDeckId, "flashcards", newCardId);
               setDocumentNonBlocking(cardRef, {
                 ...card,
                 id: newCardId,
                 flashcardSetId: newDeckId
               }, { merge: true });
            });
          }
          toast({ title: "Deck copied!" });
        }
      } else {
        toast({ title: "Joined collaboration!" });
      }
    } catch (error) {
      console.error("Failed to accept invite", error);
      toast({ variant: "destructive", title: "Action failed" });
    } finally {
      setIsAccepting(null);
    }
  }

  const getItems = () => {
    if (shareCategory === 'flashcardSet') return decks || []
    if (shareCategory === 'notebook') return notes || []
    if (shareCategory === 'task') return tasks || []
    return []
  }

  const isFriendGuko = friend.username === 'guko' || friend.uid === 'guko';
  const isFriendAdmin = friend.isAdmin === true;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b flex items-center gap-4 bg-muted/5">
        <Link href={`/u/${friend.username}`} className="flex items-center gap-4 group/author">
          <Avatar className="h-10 w-10 border-2 border-primary/20 group-hover/author:scale-110 transition-transform">
            <AvatarImage src={friend.photoUrl} className="object-cover" />
            <AvatarFallback className="bg-primary/20 font-bold">{friend.displayName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
               <h4 className={cn("font-bold text-lg lowercase group-hover/author:text-primary transition-colors", isFriendGuko && "italic font-black")}>{friend.displayName}</h4>
               {(isFriendGuko || isFriendAdmin) && <BadgeCheck size={18} className="text-primary" />}
            </div>
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest">online</span>
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          {messages?.map(msg => (
            <div key={msg.id} className={cn("flex", msg.senderId === effectiveUid ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] rounded-[24px] overflow-hidden shadow-sm",
                msg.type === 'gif' ? '' : (msg.senderId === effectiveUid ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")
              )}>
                {msg.type === 'text' ? (
                  <div className="p-4 px-6 text-sm leading-relaxed lowercase">{msg.text}</div>
                ) : msg.type === 'gif' ? (
                  <img src={msg.text} alt="gif" className="rounded-[24px] max-w-[200px] h-auto" />
                ) : (
                  <div className="p-6 space-y-4 bg-card border-2 border-primary/10 min-w-[280px]">
                    <div className="flex items-center gap-3 text-foreground">
                       <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          {msg.shareData.itemType === 'notebook' ? <BookOpen size={20} /> : msg.shareData.itemType === 'flashcardSet' ? <Layers size={20} /> : <CheckSquare size={20} />}
                       </div>
                       <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 leading-none mb-1">
                             {msg.shareData.mode === 'collaborate' ? 'collaboration' : 'shared resource'}
                          </p>
                          <h5 className="font-bold text-sm truncate lowercase">{msg.shareData.itemName}</h5>
                       </div>
                    </div>
                    {msg.senderId !== effectiveUid && (
                      <Button 
                        disabled={isAccepting === msg.id}
                        onClick={() => handleAcceptInvite(msg)}
                        className="w-full rounded-xl h-10 font-bold lowercase bg-primary text-primary-foreground shadow-lg"
                      >
                        {isAccepting === msg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'accept invite'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-6 bg-muted/5 border-t">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-none bg-muted/50 hover:bg-primary/20 transition-all shrink-0" onClick={() => setShowSharePicker(true)}>
            <Plus className="h-6 w-6" />
          </Button>
          <Popover open={showGiphyPicker} onOpenChange={setShowGiphyPicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-none bg-muted/50 hover:bg-primary/20 transition-all shrink-0">
                <ImageIcon className="h-6 w-6" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 border-none">
              <GiphyPicker onSelectGif={handleSelectGif} />
            </PopoverContent>
          </Popover>
          <div className="relative flex-1">
            <Input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage('text', inputText)}
              placeholder="type a message..." 
              className="h-12 rounded-2xl bg-muted/50 border-none px-6 lowercase no-focus-ring"
            />
          </div>
          <Button onClick={() => handleSendMessage('text', inputText)} className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground shadow-lg shrink-0">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Dialog open={showSharePicker} onOpenChange={setShowSharePicker}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl bg-card p-8 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl lowercase">share to chat</DialogTitle>
          </DialogHeader>
          {!shareCategory ? (
            <div className="grid gap-3 py-6">
              <ShareCategoryRow icon={<Layers />} label="flashcard decks" onClick={() => setShareCategory('flashcardSet')} />
              <ShareCategoryRow icon={<BookOpen />} label="notebook pages" onClick={() => setShareCategory('notebook')} />
              <ShareCategoryRow icon={<CheckSquare />} label="tasks" onClick={() => setShareCategory('task')} />
            </div>
          ) : (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setShareCategory(null)} className="mb-2 lowercase text-[10px] hover:bg-muted"><ChevronLeft className="h-3 w-3" /> back</Button>
              <ScrollArea className="h-64 pr-4">
                <div className="space-y-2">
                  {getItems().map(item => (
                    <button key={item.id} onClick={() => { setSelectedItem(item); setShowConfirmModal(true); setShowSharePicker(false); }} className="w-full text-left p-4 rounded-2xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all lowercase text-sm font-bold truncate">
                      {item.title || item.name}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="rounded-[40px] border-none shadow-3xl bg-background p-10 max-w-md text-center">
          <DialogHeader className="space-y-4">
            <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto animate-bounce">
              {isSharing ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Share2 className="h-8 w-8 text-primary" />}
            </div>
            <DialogTitle className="font-headline text-3xl lowercase">sharing mode</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-8">
            <Button disabled={isSharing} onClick={() => handleConfirmShare('copy')} className="h-24 rounded-3xl flex flex-col gap-1 border-2 border-muted hover:border-primary transition-all bg-card text-foreground group">
              <span className="font-bold text-lg lowercase group-hover:text-primary">send a copy</span>
            </Button>
            <Button disabled={isSharing} onClick={() => handleConfirmShare('collaborate')} className="h-24 rounded-3xl flex flex-col gap-1 border-2 border-muted hover:border-accent transition-all bg-card text-foreground group">
              <span className="font-bold text-lg lowercase group-hover:text-accent-foreground">collaborate</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ShareCategoryRow({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-primary/5 transition-all text-left group">
      <div className="p-2 rounded-xl bg-white border border-border shadow-sm group-hover:text-primary transition-colors">{React.cloneElement(icon, { size: 18 })}</div>
      <span className="font-bold text-sm lowercase flex-1">{label}</span>
      <ChevronRight size={16} className="text-muted-foreground opacity-40" />
    </button>
  )
}
