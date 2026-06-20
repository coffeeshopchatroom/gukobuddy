
"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Radio, ArrowLeft, Sparkles, Globe, Database, UserCircle2, Settings2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

export default function GukoChannelPage() {
  const { user } = useUser()
  const db = useFirestore()
  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'profile', 'settings') : null, [user, db])
  const { data: profile } = useDoc(profileRef)

  const hasAvatar = !!profile?.selectedAvatar

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full border-none shadow-2xl rounded-[64px] overflow-hidden bg-card text-center relative">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-primary via-indigo-200 to-primary animate-pulse" />
        
        <CardContent className="p-12 md:p-24 space-y-10 flex flex-col items-center">
          <div className="relative">
            <div className="h-32 w-32 rounded-[40px] bg-primary/10 flex items-center justify-center">
              <Radio className="h-16 w-16 text-primary" />
            </div>
            <div className="absolute -top-6 -right-6 h-12 w-12 rounded-full bg-accent flex items-center justify-center shadow-lg animate-pulse">
              <Globe className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter lowercase">guko channel</h1>
            <div className="flex flex-col items-center gap-2">
              <Badge className="bg-primary/20 text-primary-foreground hover:bg-primary/20 border-none px-8 py-2 rounded-full text-sm font-bold uppercase tracking-[0.2em]">
                connecting now...
              </Badge>
              <p className="text-[10px] font-black text-destructive uppercase tracking-[0.3em] animate-pulse">this is still in beta!</p>
            </div>
          </div>

          <p className="text-muted-foreground text-xl md:text-2xl max-w-lg leading-relaxed lowercase font-medium">
            get ready to go online, share texts and learn together.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-xl">
            <div className="p-6 rounded-[32px] bg-muted/30 flex flex-col items-center gap-3 border border-transparent hover:border-primary/20 transition-colors">
              <Globe className="h-6 w-6 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">global plaza</span>
            </div>
            <div className="p-6 rounded-[32px] bg-muted/30 flex flex-col items-center gap-3 border border-transparent hover:border-primary/20 transition-colors">
              <Database className="h-6 w-6 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"> sessions with friends</span>
            </div>
            <div className="p-6 rounded-[32px] bg-muted/30 flex flex-col items-center gap-3 border border-transparent hover:border-primary/20 transition-colors">
              <Radio className="h-6 w-6 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">study sync</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-md mt-4">
            {!hasAvatar ? (
              <Button asChild className="rounded-[32px] py-10 text-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all lowercase">
                <Link href="/channel/pick-avatar">
                  <UserCircle2 className="h-6 w-6 mr-3" /> open my channel
                </Link>
              </Button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button asChild className="rounded-[32px] py-8 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all lowercase">
                  <Link href="/channel/my-channel">
                    <UserCircle2 className="h-5 w-5 mr-2" /> view my channel
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-[32px] py-8 text-lg font-bold border-2 hover:bg-muted transition-all hover:scale-105 lowercase">
                  <Link href="/channel/pick-avatar">
                    <Settings2 className="h-5 w-5 mr-2" /> change avatar
                  </Link>
                </Button>
              </div>
            )}
            
            <Button asChild variant="ghost" className="rounded-3xl py-6 text-muted-foreground hover:text-foreground lowercase">
              <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" /> return to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
