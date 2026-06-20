
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
  limit, 
  orderBy,
  doc,
  collectionGroup
} from "firebase/firestore"
import { 
  Loader2, 
  ArrowLeft, 
  Share2, 
  MessageSquare, 
  UserPlus, 
  Clock, 
  Layers, 
  BookOpen, 
  MessageCircle,
  Download,
  ShieldCheck,
  Star,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

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

export default function PublicProfilePage() {
  const { username } = useParams()
  const { user: currentUser } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const [profile, setProfile] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [scale, setScale] = React.useState(1)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    async function resolveProfile() {
      if (!db || !username) return
      setIsLoading(true)
      try {
        // Correct lookup: Search the profile collection group for the username
        const q = query(
          collectionGroup(db, "profile"),
          where("username", "==", (username as string).toLowerCase())
        )
        
        const result = await getDocs(q)
        if (!result.empty) {
          const profileDoc = result.docs[0]
          // Parent of 'profile' is the userId document
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
      username: currentUser.displayName || 'student', // fallback
      displayName: currentUser.displayName || 'student',
      photoUrl: currentUser.photoURL || '',
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
         <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <ArrowLeft className="h-10 w-10" />
         </div>
         <h1 className="text-3xl font-bold font-headline lowercase">student not found</h1>
         <Button onClick={() => router.push('/share-hub')} variant="outline" className="rounded-xl lowercase">back to hub</Button>
      </div>
    )
  }

  const theme = profile.theme || {}
  const layout = profile.layout || DEFAULT_PROFILE_LAYOUT;
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
    if (color.type === 'solid') return { border: `${width}px solid ${color.solid}` };
    const gradient = getColorStyle(color);
    return {
      border: `${width}px solid transparent`,
      backgroundImage: `linear-gradient(${itemBg}, ${itemBg}), ${gradient}`,
      backgroundOrigin: 'border-box',
      backgroundClip: 'padding-box, border-box'
    };
  };

  const cornerRadius = `${profile.cornerRounding ?? 16}px`;

  return (
    <div className="min-h-screen space-y-12 animate-smooth-slow pb-40">
      <div className="max-w-4xl mx-auto px-6 pt-12">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-xl h-10 px-4 mb-8 lowercase gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} /> back
        </Button>

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
            <div className="absolute" style={{ 
              left: layout.banner?.x ?? 0, top: layout.banner?.y ?? 0, 
              width: layout.banner?.w ?? '100%', height: layout.banner?.h ?? 120, 
              zIndex: layout.banner?.zIndex ?? 0 
            }}>
              {profile.bannerUrl ? (
                <img src={profile.bannerUrl} className="w-full h-full object-cover" alt="banner" />
              ) : (
                <div className="w-full h-full bg-black/10" />
              )}
            </div>
            
            {/* PFP */}
            <div className="absolute overflow-hidden flex items-center justify-center" style={{ 
              left: layout.pfp?.x ?? 40, top: layout.pfp?.y ?? 80,
              width: layout.pfp?.w ?? 140, height: layout.pfp?.h ?? 140,
              borderRadius: cornerRadius, zIndex: layout.pfp?.zIndex ?? 2,
              ...getTargetBorderStyle('profile', 'rgba(0,0,0,0.1)'),
              backgroundColor: 'rgba(0,0,0,0.1)'
            }}>
              {profile.photoUrl ? (
                <img src={profile.photoUrl} className="w-full h-full object-cover" alt="pfp" />
              ) : (
                <div className="w-1/2 h-1/2 opacity-20 bg-muted rounded-full" />
              )}
            </div>

            {/* Name */}
            <div className="absolute flex flex-col justify-center" style={{ 
              left: layout.name?.x ?? 200, top: layout.name?.y ?? 100,
              width: layout.name?.w ?? 400, height: layout.name?.h ?? 60,
              zIndex: layout.name?.zIndex ?? 2,
              color: getColorStyle(theme.text || customColors.foreground)
            }}>
              <h4 className="text-3xl font-bold leading-tight lowercase truncate">{profile.displayName || 'student'}</h4>
            </div>

            {/* Username */}
            <div className="absolute" style={{ 
              left: layout.username?.x ?? 200, top: layout.username?.y ?? 160,
              width: layout.username?.w ?? 200, height: layout.username?.h ?? 30,
              zIndex: layout.username?.zIndex ?? 2,
              color: getColorStyle(theme.text || customColors.foreground), opacity: 0.6
            }}>
              <p className="text-xl lowercase">@{profile.username}</p>
            </div>

            {/* Actions */}
            <div className="absolute flex gap-3" style={{ 
              left: layout.addBtn?.x ?? 440, top: layout.addBtn?.y ?? 100,
              width: layout.addBtn?.w ?? 200, height: layout.addBtn?.h ?? 50,
              zIndex: layout.addBtn?.zIndex ?? 2
            }}>
              <Button 
                onClick={sendRequest}
                className="flex-1 h-full font-bold lowercase border-none shadow-xl transition-all"
                style={{ 
                  background: getColorStyle(theme.buttons || customColors.primary),
                  color: 'white', borderRadius: cornerRadius,
                  ...getTargetBorderStyle('add', getColorStyle(theme.buttons || customColors.primary))
                }}
              >
                add friend
              </Button>
            </div>

            {/* Bio */}
            <div className="absolute" style={{ 
              left: layout.bio?.x ?? 40, top: layout.bio?.y ?? 250,
              width: layout.bio?.w ?? 500, height: layout.bio?.h ?? 100,
              zIndex: layout.bio?.zIndex ?? 2,
              color: getColorStyle(theme.text || customColors.foreground),
            }}>
              <p className="text-lg leading-relaxed lowercase opacity-90 italic line-clamp-4">
                {profile.bio || 'this student has not shared a bio yet.'}
              </p>
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
      </div>

      <div className="max-w-4xl mx-auto px-6 space-y-12">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-3xl font-headline font-bold lowercase flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> student logs
          </h2>
          <Badge variant="secondary" className="rounded-full px-4 font-bold lowercase">
            {userPosts?.length || 0} posts
          </Badge>
        </div>

        <div className="grid gap-8">
           {userPosts?.map(post => (
             <ProfilePostItem key={post.id} post={post} />
           ))}
           {userPosts?.length === 0 && (
             <div className="py-20 text-center text-muted-foreground italic lowercase border-2 border-dashed rounded-[32px]">
               no posts published to the hub yet.
             </div>
           )}
        </div>
      </div>
    </div>
  )
}

function ProfilePostItem({ post }: { post: any }) {
  const isThought = post.type === 'thought'
  const date = new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-card transition-all hover:shadow-xl group">
      <CardContent className="p-8">
        <div className="flex items-start justify-between mb-6">
           <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                 {isThought ? <MessageCircle size={20} /> : post.type === 'flashcardSet' ? <Layers size={20} /> : <BookOpen size={20} />}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">{post.type === 'flashcardSet' ? 'flashcard deck' : post.type}</span>
                <p className="text-xs text-muted-foreground lowercase flex items-center gap-1.5 mt-0.5">
                   <Clock size={12} /> {date}
                </p>
              </div>
           </div>
           
           {!isThought && (
             <Button variant="outline" size="sm" className="rounded-xl lowercase gap-2 border-primary/10 hover:bg-primary hover:text-white transition-all">
                <Download size={14} /> save to library
             </Button>
           )}
        </div>

        {isThought ? (
          <p className="text-xl md:text-2xl leading-relaxed lowercase text-foreground/80 italic">"{post.content}"</p>
        ) : (
          <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 space-y-4">
             <h3 className="font-bold text-2xl lowercase">{post.itemData?.name || post.itemData?.title}</h3>
             <div className="flex gap-4">
                <Badge variant="outline" className="rounded-full px-3 text-[10px] font-bold lowercase bg-background border-none shadow-sm">
                   {post.itemData?.cards?.length || 0} items
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 text-[10px] font-bold lowercase bg-background border-none shadow-sm">
                   public
                </Badge>
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
