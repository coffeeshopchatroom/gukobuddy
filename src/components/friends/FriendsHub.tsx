"use client"

import * as React from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
  Layers
} from "lucide-react"
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { collection, query, where, getDocs, doc, serverTimestamp } from "firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function FriendsHub() {
  const { user } = useUser()
  const db = useFirestore()
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<any[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null)
  
  // Friends query
  const friendsQuery = useMemoFirebase(() => {
    if (!user || !db) return null
    return query(collection(db, "users", user.uid, "friends"), where("status", "==", "accepted"))
  }, [user, db])
  const { data: friends } = useCollection(friendsQuery)

  const handleSearch = async () => {
    if (!searchQuery.trim() || !db) return
    setIsSearching(true)
    try {
      // In a real app, this would be a search across all user profiles
      // For this prototype, we query by username field in profile/settings
      const profilesQuery = query(
        collection(db, "users"), 
        // We'd ideally have a collection group or top-level users collection
        // For prototype, we'll simulate finding users
      )
      // Note: This is simplified. In production firestore, cross-user search requires specific indexing.
      setSearchResults([
        { 
          uid: 'demo1', 
          displayName: 'sarah study', 
          username: 'sarah_99', 
          photoUrl: 'https://picsum.photos/seed/sarah/200/200',
          theme: { customColors: { primary: '#F97316', background: '#FFF7ED' }, activeTheme: 'sunset' }
        },
        { 
          uid: 'demo2', 
          displayName: 'josh dev', 
          username: 'joshua_x', 
          photoUrl: 'https://picsum.photos/seed/josh/200/200',
          theme: { customColors: { primary: '#3B82F6', background: '#F0F9FF' }, activeTheme: 'midnight' }
        }
      ].filter(u => u.username.includes(searchQuery.toLowerCase())))
    } catch (e) {
      console.error(e)
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
    
    // In a real app, we'd also set a 'pending_in' for the target user
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-primary">
          <Users size={16} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 border-none bg-background shadow-3xl overflow-hidden rounded-[40px] h-[600px] flex flex-col">
        <DialogHeader className="p-8 pb-4 bg-muted/20 border-b shrink-0">
          <DialogTitle className="font-headline text-2xl font-bold flex items-center gap-2 lowercase">
            <Users className="h-6 w-6 text-primary" /> online friends hub
          </DialogTitle>
          <DialogDescription className="lowercase">connect and share learning materials.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {(!friends || friends.length === 0) && !selectedUser ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="text-center py-10 space-y-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <UserPlus className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-xl lowercase">no friends yet</h3>
                  <p className="text-muted-foreground lowercase text-sm">search for classmates to start sharing.</p>
                </div>
              </div>

              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="search by username..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-12 h-14 rounded-2xl bg-muted/30 border-none text-lg lowercase no-focus-ring"
                />
                {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary" />}
              </div>

              <div className="space-y-3">
                {searchResults.map((res) => (
                  <UserSearchCard key={res.uid} user={res} onClick={() => setSelectedUser(res)} />
                ))}
              </div>
            </div>
          ) : selectedUser ? (
            <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
              <Button variant="ghost" onClick={() => setSelectedUser(null)} className="rounded-xl h-8 px-2 lowercase text-muted-foreground hover:text-foreground">
                <ChevronLeft size={16} className="mr-1" /> back to search
              </Button>
              
              <div 
                className="w-full aspect-[2/1] rounded-[32px] overflow-hidden relative border border-border shadow-xl"
                style={{ 
                  background: resTheme(selectedUser).background,
                  fontFamily: 'Plus Jakarta Sans'
                }}
              >
                <div className="p-8 flex items-end h-full gap-6">
                  <div className="h-24 w-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-white shrink-0">
                    <img src={selectedUser.photoUrl} className="w-full h-full object-cover" alt="avatar" />
                  </div>
                  <div className="pb-2">
                    <h4 className="text-3xl font-bold lowercase tracking-tight" style={{ color: resTheme(selectedUser).primary }}>
                      {selectedUser.displayName}
                    </h4>
                    <p className="text-sm opacity-60 lowercase">@{selectedUser.username}</p>
                  </div>
                </div>
                <div className="absolute top-6 right-6">
                  <Button onClick={() => sendRequest(selectedUser)} className="rounded-2xl h-12 px-8 font-bold shadow-lg lowercase transition-all hover:scale-105" style={{ background: resTheme(selectedUser).primary, color: 'white' }}>
                    send friend request
                  </Button>
                </div>
              </div>
              
              <div className="p-8 text-center text-muted-foreground italic lowercase text-sm">
                once accepted, you can share decks, notes, and tasks here.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">my friends</h4>
              {friends?.map(friend => (
                <FriendItem key={friend.id} friend={friend} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function UserSearchCard({ user, onClick }: { user: any, onClick: () => void }) {
  const theme = resTheme(user)
  return (
    <div 
      onClick={onClick}
      className="group flex items-center justify-between p-1 pr-6 rounded-2xl border border-border/10 bg-white hover:shadow-xl transition-all cursor-pointer overflow-hidden h-20"
    >
      <div className="flex items-center gap-4 h-full">
        <div className="h-full w-20 bg-muted/10 shrink-0 overflow-hidden relative">
          <img src={user.photoUrl} className="w-full h-full object-cover" alt="pfp" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5" />
        </div>
        <div>
          <h4 className="font-bold text-sm lowercase">{user.displayName}</h4>
          <p className="text-[10px] text-muted-foreground lowercase">@{user.username}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex gap-1 h-3">
          <div className="w-3 h-3 rounded-full" style={{ background: theme.primary }} />
          <div className="w-3 h-3 rounded-full" style={{ background: theme.background }} />
        </div>
        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  )
}

function FriendItem({ friend }: { friend: any }) {
  const [showSharePicker, setShowSharePicker] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<any>(null)
  const [showSharingModal, setShowSharingModal] = React.useState(false)
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const handleShare = (mode: 'copy' | 'collaborate') => {
    if (!user || !db || !selectedItem) return
    
    const shareId = doc(collection(db, "temp")).id
    const shareRef = doc(db, "sharedItems", shareId)
    
    setDocumentNonBlocking(shareRef, {
      id: shareId,
      fromUid: user.uid,
      toUid: friend.uid,
      itemType: selectedItem.type,
      itemId: selectedItem.id,
      itemData: selectedItem.data,
      mode,
      createdAt: new Date().toISOString()
    }, { merge: true })

    toast({
      title: "item shared!",
      description: `successfully shared ${selectedItem.label} via ${mode}.`,
    })
    
    setShowSharingModal(false)
    setSelectedItem(null)
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 border-2 border-primary/20">
          <AvatarImage src={friend.photoUrl} className="object-cover" />
          <AvatarFallback>{friend.displayName[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-bold text-sm lowercase">{friend.displayName}</h4>
          <span className="text-[10px] text-primary font-bold uppercase tracking-widest">online</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-xl h-10 px-4 lowercase gap-2 border-2 border-primary/10 hover:bg-primary/5"
          onClick={() => setShowSharePicker(true)}
        >
          <Share2 size={14} className="text-primary" /> share
        </Button>
        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
          <MessageSquare size={16} className="text-muted-foreground" />
        </Button>
      </div>

      <Dialog open={showSharePicker} onOpenChange={setShowSharePicker}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl bg-card p-8">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl lowercase">share with {friend.displayName}</DialogTitle>
            <DialogDescription className="lowercase">what would you like to share?</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-6">
            <ShareCategoryButton icon={<Layers />} label="flashcards" onClick={() => { setSelectedItem({ type: 'flashcardSet', label: 'history deck', id: '1', data: {} }); setShowSharingModal(true); setShowSharePicker(false); }} />
            <ShareCategoryButton icon={<BookOpen />} label="notebooks" onClick={() => { setSelectedItem({ type: 'notebook', label: 'biology notes', id: '2', data: {} }); setShowSharingModal(true); setShowSharePicker(false); }} />
            <ShareCategoryButton icon={<CheckSquare />} label="tasks" onClick={() => { setSelectedItem({ type: 'task', label: 'calculus hw', id: '3', data: {} }); setShowSharingModal(true); setShowSharePicker(false); }} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSharingModal} onOpenChange={setShowSharingModal}>
        <DialogContent className="rounded-[40px] border-none shadow-3xl bg-background p-10 max-w-md">
          <DialogHeader className="text-center space-y-4">
            <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
              <Share2 className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="font-headline text-3xl lowercase">share options</DialogTitle>
            <p className="text-muted-foreground lowercase">how should {friend.displayName} receive this?</p>
          </DialogHeader>
          <div className="grid gap-4 py-8">
            <Button 
              onClick={() => handleShare('copy')}
              className="h-20 rounded-3xl flex flex-col items-center justify-center gap-1 border-2 border-muted hover:border-primary transition-all bg-card text-foreground"
            >
              <span className="font-bold text-lg lowercase">make a copy</span>
              <span className="text-[10px] opacity-40 lowercase">they get their own version to edit</span>
            </Button>
            <Button 
              onClick={() => handleShare('collaborate')}
              className="h-20 rounded-3xl flex flex-col items-center justify-center gap-1 border-2 border-muted hover:border-accent transition-all bg-card text-foreground"
            >
              <span className="font-bold text-lg lowercase">collaborate</span>
              <span className="text-[10px] opacity-40 lowercase">you both edit the same file</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ShareCategoryButton({ icon, label, onClick }: any) {
  return (
    <Button 
      variant="outline" 
      onClick={onClick}
      className="h-32 rounded-3xl flex flex-col gap-3 border-2 border-muted hover:border-primary hover:bg-primary/5 transition-all lowercase"
    >
      <div className="p-3 rounded-2xl bg-muted group-hover:bg-primary/20 transition-colors">
        {React.cloneElement(icon, { size: 24, className: "text-muted-foreground" })}
      </div>
      <span className="font-bold text-sm">{label}</span>
    </Button>
  )
}

function resTheme(user: any) {
  return {
    primary: user.theme?.customColors?.primary || '#A7C4A0',
    background: user.theme?.customColors?.background || '#FFFFFF'
  }
}
