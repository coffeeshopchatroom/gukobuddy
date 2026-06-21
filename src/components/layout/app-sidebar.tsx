"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CheckSquare,
  StickyNote,
  Layers,
  GraduationCap,
  LogOut,
  LogIn,
  Shield,
  Terminal,
  Clock,
  Coffee,
  ChevronDown,
  Brain,
  Palette,
  ClipboardCheck,
  Bell,
  Radio,
  Settings,
  Gamepad2,
  UserCircle2,
  Wind,
  Users,
  UserPlus,
  Share2,
  BadgeCheck,
  RefreshCw
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { signOut, updateProfile } from "firebase/auth"
import { doc, collection, query, orderBy, where, setDoc, getDocs, collectionGroup } from 'firebase/firestore'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileCustomizer } from "@/components/profile/ProfileCustomizer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { addDays, isPast, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useCollection } from "@/firebase/firestore/use-collection"

export function AppSidebar() {
  const pathname = usePathname()
  const { auth, firestore } = useFirebase();
  const { user } = useUser();
  const profileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'profile', 'settings') : null, [user, firestore]);
  const { data: profile } = useDoc(profileRef);

  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = React.useState(false);
  
  const isGukoMode = profile?.isGukoMode === true;
  
  const isTaskRelated = pathname.startsWith('/tasks') || pathname === '/pomodoro' || pathname === '/study-session';
  const isNotebookRelated = pathname.startsWith('/notebooks');
  const isFlashcardRelated = pathname.startsWith('/flashcards');

  const [isTasksOpen, setIsTasksOpen] = React.useState(isTaskRelated);
  const [isNotebooksOpen, setIsNotebooksOpen] = React.useState(isNotebookRelated);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = React.useState(isFlashcardRelated);

  React.useEffect(() => {
    if (isTaskRelated) setIsTasksOpen(true);
    if (isNotebookRelated) setIsNotebooksOpen(true);
    if (isFlashcardRelated) setIsFlashcardsOpen(true);
  }, [pathname, isTaskRelated, isNotebookRelated, isFlashcardRelated]);

  // Ensure Guko is friended for existing users
  React.useEffect(() => {
    if (user && firestore && !isGukoMode) {
       // We only check once per session to avoid heavy querying
       const hasCheckedGuko = sessionStorage.getItem(`guko-checked-${user.uid}`);
       if (hasCheckedGuko) return;

       async function ensureGukoFriend() {
         try {
           const gukoQuery = query(collectionGroup(firestore, "profile"), where("username", "==", "guko"));
           const snap = await getDocs(gukoQuery);
           if (!snap.empty) {
             const gukoUid = snap.docs[0].ref.parent.parent?.id;
             if (gukoUid && gukoUid !== user.uid) {
               const myFriendRef = doc(firestore, "users", user.uid, "friends", gukoUid);
               
               // Check if already friended
               const friendDoc = await doc(firestore, "users", user.uid, "friends", gukoUid);
               
               setDoc(myFriendRef, {
                 uid: gukoUid,
                 username: 'guko',
                 displayName: 'guko',
                 photoUrl: '/devmade-icons/gukologo.png',
                 status: 'accepted',
                 createdAt: new Date().toISOString()
               }, { merge: true }).catch(err => console.warn("Failed to auto-friend Guko", err));

               sessionStorage.setItem(`guko-checked-${user.uid}`, 'true');
             }
           }
         } catch (e) {
           console.warn("Guko auto-friend check skipped", e);
         }
       }
       ensureGukoFriend();
    }
  }, [user, firestore, isGukoMode]);

  const handleSignOut = () => {
    if(auth) {
        signOut(auth);
    }
  }

  const isHighSchool = profile?.studentType === 'high-school';
  const trackerLabel = isHighSchool ? "class tracker" : "course tracker";
  const focus = profile?.focus || 'all';

  const userName = user?.isAnonymous ? "guest" : (profile?.displayName || user?.displayName || user?.email?.split('@')[0] || "student");
  const userPhoto = profile?.photoUrl || user?.photoURL || "";
  const userRole = user?.isAnonymous ? "guest session" : (profile?.studentType?.replace('-', ' ') || "student");
  const isAdmin = profile?.isAdmin === true;

  return (
    <Sidebar className="border-r border-sidebar-border" collapsible="icon">
      <SidebarHeader className="px-4 py-8 flex flex-row items-center justify-between group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center p-1 flex-shrink-0 overflow-hidden">
              <img 
                src="/devmade-icons/gukologo.png" 
                alt="guko logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-headline text-xl font-bold tracking-tight text-foreground lowercase whitespace-nowrap group-data-[collapsible=icon]:hidden">guko buddy</span>
        </Link>
        <SidebarTrigger className="hidden md:flex h-8 w-8 rounded-lg hover:bg-muted group-data-[collapsible=icon]:flex" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-6 mb-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
            <SidebarGroupLabel className="p-0 text-[10px] uppercase tracking-widest font-bold opacity-30 group-data-[collapsible=icon]:hidden">menu</SidebarGroupLabel>
            
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
              {user && !user.isAnonymous && (
                <>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-primary">
                        <Radio size={16} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" align="end" className="w-48 p-4 rounded-2xl border-none shadow-xl bg-card">
                      <p className="text-xs font-bold lowercase text-center">radio coming soon.</p>
                    </PopoverContent>
                  </Popover>

                  <Link href="/friends">
                    <button className={cn(
                      "p-1 rounded-full transition-all text-muted-foreground hover:text-primary relative",
                      pathname === '/friends' ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    )}>
                      <Users size={16} />
                    </button>
                  </Link>
                  
                  <NotificationCenter user={user} firestore={firestore} />
                </>
              )}
            </div>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="px-4 py-2 group-data-[collapsible=icon]:px-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/"}
                  tooltip="dashboard"
                  className="flex items-center gap-3 px-4 py-6 rounded-xl transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lowercase group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                >
                  <Link href="/">
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="font-medium group-data-[collapsible=icon]:hidden">dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Hide focus features if in Guko mode (commercial) */}
              {!isGukoMode && (
                <>
                  {(focus === 'all' || focus === 'tasks') && (
                    <Collapsible 
                      open={isTasksOpen} 
                      onOpenChange={setIsTasksOpen}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            isActive={pathname.startsWith('/tasks')}
                            tooltip="tasks"
                            className="flex items-center gap-3 px-4 py-6 rounded-xl transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lowercase group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                          >
                            <CheckSquare className="h-5 w-5" />
                            <span className="font-medium group-data-[collapsible=icon]:hidden">tasks</span>
                            <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform duration-200 group-data-[collapsible=icon]:hidden", isTasksOpen && "rotate-180")} />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up group-data-[collapsible=icon]:hidden">
                          <SidebarMenuSub className="py-1">
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={pathname === '/tasks'}>
                                <Link href="/tasks">
                                  <span className="lowercase">all tasks</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={pathname === '/pomodoro'}>
                                <Link href="/pomodoro">
                                  <span className="flex items-center gap-2 lowercase">
                                    <Clock className="h-3 w-3" /> pomodoro
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={pathname === '/study-session'}>
                                <Link href="/study-session">
                                  <span className="flex items-center gap-2 lowercase">
                                    <Coffee className="h-3 w-3" /> study session
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )}

                  {(focus === 'all' || focus === 'notebooks') && (
                    <Collapsible 
                      open={isNotebooksOpen} 
                      onOpenChange={setIsNotebooksOpen}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            isActive={pathname === "/notebooks"}
                            tooltip="notebooks"
                            className="flex items-center gap-3 px-4 py-6 rounded-xl transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lowercase group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                          >
                            <StickyNote className="h-5 w-5" />
                            <span className="font-medium group-data-[collapsible=icon]:hidden">notebooks</span>
                            <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform duration-200 group-data-[collapsible=icon]:hidden", isNotebooksOpen && "rotate-180")} />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up group-data-[collapsible=icon]:hidden">
                          <SidebarMenuSub className="py-1">
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={pathname === '/notebooks'}>
                                <Link href="/notebooks">
                                  <span className="lowercase">all notes</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={pathname === '/notebooks/mind-maps'}>
                                <Link href="/notebooks/mind-maps">
                                  <span className="flex items-center gap-2 lowercase">
                                    <Brain className="h-3 w-3" /> mind maps
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={pathname === '/notebooks/whiteboard'}>
                                <Link href="/notebooks/whiteboard">
                                  <span className="flex items-center gap-2 lowercase">
                                    <Palette className="h-3 w-3" /> whiteboard
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )}

                  {(focus === 'all' || focus === 'flashcards') && (
                    <Collapsible 
                      open={isFlashcardsOpen} 
                      onOpenChange={setIsFlashcardsOpen}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            isActive={pathname === "/flashcards"}
                            tooltip="flashcards"
                            className="flex items-center gap-3 px-4 py-6 rounded-xl transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lowercase group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                          >
                            <Layers className="h-5 w-5" />
                            <span className="font-medium group-data-[collapsible=icon]:hidden">flashcards</span>
                            <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform duration-200 group-data-[collapsible=icon]:hidden", isFlashcardsOpen && "rotate-180")} />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up group-data-[collapsible=icon]:hidden">
                          <SidebarMenuSub className="py-1">
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={pathname === '/flashcards'}>
                                <Link href="/flashcards">
                                  <span className="lowercase">all decks</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={pathname === '/flashcards/quiz'}>
                                <Link href="/flashcards/quiz">
                                  <span className="flex items-center gap-2 lowercase">
                                    <ClipboardCheck className="h-3 w-3" /> create quiz
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )}

                  {profile?.studentType !== 'hobbyist' && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === "/tracker"}
                        tooltip={trackerLabel}
                        className="flex items-center gap-3 px-4 py-6 rounded-xl transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lowercase group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                      >
                        <Link href="/tracker">
                          < GraduationCap className="h-5 w-5" />
                          <span className="font-medium group-data-[collapsible=icon]:hidden">{trackerLabel}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-6 mb-2 text-[10px] uppercase tracking-widest font-bold opacity-30 group-data-[collapsible=icon]:hidden">online</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-4 space-y-2 group-data-[collapsible=icon]:px-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/share-hub"}
                  tooltip="share hub"
                  className="flex items-center gap-3 px-4 py-6 rounded-xl transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lowercase group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                >
                  <Link href="/share-hub">
                    <Share2 className="h-5 w-5" />
                    <span className="font-medium group-data-[collapsible=icon]:hidden">share hub</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/channel"}
                  tooltip="guko channel"
                  className="flex items-center gap-3 px-4 py-7 rounded-2xl transition-colors bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 shadow-sm lowercase group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                >
                  <Link href="/channel">
                    <Radio className="h-5 w-5 animate-pulse" />
                    <span className="font-bold text-sm group-data-[collapsible=icon]:hidden">guko channel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center">
        {user && (
          <SidebarMenu className="px-0 py-0">
              <SidebarMenuItem>
                  <SidebarMenuButton
                      onClick={handleSignOut}
                      tooltip="sign out"
                      className="flex items-center gap-3 px-4 py-6 rounded-xl transition-colors hover:bg-destructive/10 hover:text-destructive group lowercase group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                  >
                      <LogOut className="h-5 w-5 text-muted-foreground group-hover:text-destructive" />
                      <span className="font-medium group-data-[collapsible=icon]:hidden">sign out</span>
                  </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarMenu>
        )}

        {user ? (
          <div className="flex flex-col gap-2 p-1 group-data-[collapsible=icon]:p-0 w-full">
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <div className="flex-1 group-data-[collapsible=icon]:flex-none">
                <ProfileCustomizer open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                  <div 
                    onClick={() => setIsProfileOpen(true)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-secondary/50 backdrop-blur-sm border border-border/30 hover:bg-secondary/70 transition-all group cursor-pointer group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:justify-center"
                  >
                    <Avatar className="h-9 w-9 border border-primary/20 shadow-sm group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                      <AvatarImage src={userPhoto} className="object-cover" />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                        {userName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-0 group-data-[collapsible=icon]:hidden">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-sm font-semibold truncate lowercase", isGukoMode && "italic font-bold")}>{userName}</span>
                        {isGukoMode && <BadgeCheck className="h-3 w-3 text-primary" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter truncate lowercase">{isGukoMode ? 'official' : userRole}</span>
                    </div>
                  </div>
                </ProfileCustomizer>
              </div>

              <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  asChild
                  className={cn(
                    "h-10 w-10 rounded-xl transition-all",
                    pathname === '/settings' ? "bg-accent text-accent-foreground" : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  <Link href="/settings">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                  </Link>
                </Button>

                {isAdmin && (
                  <AdminPanelDialog 
                    open={isAdminPanelOpen} 
                    onOpenChange={setIsAdminPanelOpen}
                    profile={profile}
                    user={user}
                    firestore={firestore}
                  >
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsAdminPanelOpen(true)}
                      className="h-10 w-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                    >
                      <Shield className="h-5 w-5" />
                    </Button>
                  </AdminPanelDialog>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Button asChild className="w-full rounded-2xl py-6 font-bold gap-2 lowercase group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:justify-center">
            <Link href="/login"><LogIn className="h-4 w-4" /> <span className="group-data-[collapsible=icon]:hidden">sign in</span></Link>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

function AdminPanelDialog({ children, open, onOpenChange, profile, user, firestore }: any) {
  const { toast } = useToast()
  const isGukoMode = profile?.isGukoMode === true;

  const handleTestNotification = () => {
    if (!("Notification" in window)) {
      toast({
        variant: "destructive",
        title: "unsupported",
        description: "browser doesn't support notifications."
      })
      return
    }

    if (Notification.permission === "granted") {
      new Notification("guko admin: test alert", {
        body: "this is a test notification to verify your system is working. good job!",
        icon: "/devmade-icons/gukologo.png",
      })
      toast({
        title: "test sent",
        description: "check your desktop for the notification."
      })
    } else {
      toast({
        variant: "destructive",
        title: "permission required",
        description: "please enable notifications in task settings first."
      })
    }
  }

  const handleToggleGukoMode = async () => {
    if (!user || !firestore || !profile) return;
    const userRef = doc(firestore, 'users', user.uid, 'profile', 'settings');
    
    if (isGukoMode) {
      // Restore everything from backup
      const backup = profile.personalBackup || {};
      await setDoc(userRef, {
        ...backup,
        isGukoMode: false,
        personalBackup: null,
        isAdmin: true, // Preserve admin status
        id: user.uid
      }, { merge: false });
      
      await updateProfile(user, {
        displayName: backup.displayName || 'student',
        photoURL: backup.photoUrl || ''
      });

      toast({ title: "returned to personal account" });
    } else {
      // Backup full current state
      const backup = {
        displayName: profile.displayName || '',
        username: profile.username || '',
        photoUrl: profile.photoUrl || '',
        bannerUrl: profile.bannerUrl || '',
        bio: profile.bio || '',
        theme: profile.theme || null,
        layout: profile.layout || null,
        stickers: profile.stickers || [],
        cornerRounding: profile.cornerRounding ?? 16,
        borderWidth: profile.borderWidth ?? 1,
        borderTargets: profile.borderTargets || [],
        targetColors: profile.targetColors || {},
        font: profile.font || '',
        focus: profile.focus || 'all',
        studentType: profile.studentType || 'college'
      };
      
      const gukoTheme = {
        activeTheme: 'classic',
        customColors: { primary: '#A7C4A0', background: '#FFFFFF', accent: '#FFF0F0', foreground: '#1a1c19', muted: '#71717a' },
        backgroundImage: '',
        bgOpacity: 20,
        bgBlur: 0,
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 'base'
      };

      const gukoLayout = {
         banner: { x: 0, y: 0, w: 600, h: 120, zIndex: 0 },
         pfp: { x: 40, y: 80, w: 120, h: 120, zIndex: 10 },
         name: { x: 180, y: 130, w: 300, h: 48, zIndex: 10 },
         username: { x: 180, y: 170, w: 200, h: 24, zIndex: 10 },
         bio: { x: 40, y: 220, w: 520, h: 80, zIndex: 10 },
         addBtn: { x: 440, y: 130, w: 130, h: 44, zIndex: 10 },
         aboutHeader: { x: 40, y: 200, w: 100, h: 20, zIndex: 10 }
      };

      await setDoc(userRef, {
        id: user.uid,
        isAdmin: true,
        isGukoMode: true,
        displayName: 'guko',
        username: 'guko',
        photoUrl: '/devmade-icons/gukologo.png',
        bannerUrl: 'https://picsum.photos/seed/guko-banner/1200/400',
        bio: 'the official guko buddy account. here to help you study better.',
        theme: gukoTheme,
        layout: gukoLayout,
        stickers: [],
        cornerRounding: 16,
        borderWidth: 2,
        borderTargets: ['profile', 'add'],
        targetColors: {},
        font: 'Plus Jakarta Sans',
        personalBackup: backup
      }, { merge: false });

      await updateProfile(user, {
        displayName: 'guko',
        photoURL: '/devmade-icons/gukologo.png'
      });

      toast({ title: "switched to official guko account" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="rounded-[32px] border-none shadow-2xl sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="font-headline text-2xl font-bold flex items-center gap-2 lowercase">
            <Shield className="h-6 w-6 text-primary" /> admin controls
          </DialogTitle>
          <DialogDescription className="lowercase">
            internal tools for guko buddy developers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">identity management</h4>
            <Button 
              onClick={handleToggleGukoMode}
              className={cn(
                "w-full h-14 rounded-2xl font-bold gap-2 shadow-lg lowercase transition-all",
                isGukoMode ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
              )}
            >
              <RefreshCw className="h-5 w-5" /> 
              {isGukoMode ? "switch to personal account" : "switch to guko account"}
            </Button>

            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">system diagnostics</h4>
            <div className="grid grid-cols-1 gap-3">
              <Button 
                onClick={handleTestNotification}
                className="w-full h-14 rounded-2xl font-bold gap-2 shadow-lg shadow-primary/10 lowercase"
              >
                <Terminal className="h-5 w-5" /> test task notification
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  asChild
                  className="w-full h-14 rounded-2xl font-bold gap-2 border-2 border-primary/20 hover:bg-primary/5 shadow-sm lowercase"
                >
                  <Link href="/admin/wii-test">
                    <Gamepad2 className="h-5 w-5 text-primary" /> wii theme
                  </Link>
                </Button>
                <Button 
                  variant="outline"
                  asChild
                  className="w-full h-14 rounded-2xl font-bold gap-2 border-2 border-indigo-200 hover:bg-indigo-50 shadow-sm lowercase"
                >
                  <Link href="/admin/xbox-test">
                    <Gamepad2 className="h-5 w-5 text-indigo-500" /> xbox theme
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  asChild
                  className="w-full h-14 rounded-2xl font-bold gap-2 border-2 border-primary hover:bg-primary/5 shadow-sm lowercase"
                >
                  <Link href="/admin/avatar-picker">
                    <UserCircle2 className="h-5 w-5 text-primary" /> avatar picker
                  </Link>
                </Button>
                <Button 
                  variant="outline"
                  asChild
                  className="w-full h-14 rounded-2xl font-bold gap-2 border-2 border-orange-200 hover:bg-orange-50 shadow-sm lowercase"
                >
                  <Link href="/admin/animation-testing">
                    <Wind className="h-5 w-5 text-orange-500" /> motion lab
                  </Link>
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center lowercase px-4">
              these tools are for internal testing of experimental global themes, animations, and notifications.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function NotificationCenter({ user, firestore }: any) {
  // 1. Task query
  const tasksQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null
    return query(
      collection(firestore, "users", user.uid, "tasks"), 
      orderBy("dueDate", "asc")
    )
  }, [user, firestore])
  const { data: tasks } = useCollection(tasksQuery)

  // 2. Incoming Friend Requests query
  const requestsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null
    return query(
      collection(firestore, "users", user.uid, "friends"),
      where("status", "==", "pending_in")
    )
  }, [user, firestore])
  const { data: requests } = useCollection(requestsQuery)

  const upcomingTasks = React.useMemo(() => {
    if (!tasks) return []
    const now = new Date()
    const threshold = addDays(now, 2)
    return tasks.filter(t => {
      const due = parseISO(t.dueDate)
      return !t.completed && due <= threshold
    })
  }, [tasks])

  const notificationCount = upcomingTasks.length + (requests?.length || 0)

  if (notificationCount === 0) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground group">
            <Bell className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-8 rounded-3xl border-none shadow-2xl bg-white text-center" align="start" side="right" sideOffset={10}>
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Bell className="h-5 w-5 text-muted-foreground/30" />
            </div>
            <p className="text-xs text-muted-foreground lowercase">all caught up!</p>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-1 hover:bg-muted rounded-full transition-colors group">
          <Bell className={cn("h-4 w-4 text-muted-foreground group-hover:text-primary", notificationCount > 0 && "animate-pulse")} />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-destructive rounded-full border border-white animate-ping" />
          )}
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-[8px] font-bold text-white rounded-full border-2 border-white flex items-center justify-center">
            {notificationCount}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-3xl border-none shadow-2xl bg-white overflow-hidden" align="start" side="right" sideOffset={10}>
        <div className="p-6 bg-primary/10 border-b">
          <h3 className="font-headline font-bold text-lg lowercase">notifications</h3>
          <p className="text-xs text-muted-foreground lowercase">updates regarding your classes and classmates.</p>
        </div>
        <ScrollArea className="max-h-[350px]">
          {/* Friend Requests Section */}
          {requests && requests.length > 0 && (
            <div className="p-2 bg-accent/5 border-b">
              <span className="text-[9px] font-bold uppercase tracking-widest text-accent-foreground/50 px-2 py-1">friend requests</span>
              {requests.map(req => (
                <Link href="/friends" key={req.uid}>
                  <div className="p-3 rounded-2xl hover:bg-white transition-all flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-accent-foreground overflow-hidden border border-accent/20">
                      {req.photoUrl ? (
                        <img src={req.photoUrl} className="w-full h-full object-cover" alt="request" />
                      ) : (
                        <UserPlus className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate lowercase">{req.displayName} sent a request</p>
                      <p className="text-[10px] text-muted-foreground lowercase">click to view and accept</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Tasks Section */}
          <div className="p-2">
            {upcomingTasks.length > 0 && <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1">due soon</span>}
            {upcomingTasks.map((task) => {
              const isOverdue = isPast(parseISO(task.dueDate))
              return (
                <div key={task.id} className="p-3 rounded-2xl hover:bg-muted/30 transition-all flex items-start gap-3">
                  <div className={cn(
                    "mt-1.5 h-1.5 w-1.5 rounded-full shrink-0",
                    isOverdue ? "bg-destructive" : "bg-primary"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs lowercase truncate">{task.title}</p>
                    <p className={cn(
                      "text-[9px] font-bold uppercase tracking-tighter opacity-60",
                      isOverdue ? "text-destructive" : "text-primary"
                    )}>
                      {isOverdue ? "overdue" : "approaching"}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
        <div className="p-4 bg-muted/20 text-center">
          <Link href="/friends" className="text-xs font-bold text-primary hover:underline lowercase">
            manage workspace
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
