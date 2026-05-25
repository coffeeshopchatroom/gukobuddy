
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  GraduationCap, 
  Plus, 
  FileText,
  Upload,
  Loader2,
  Trash2,
  School
} from "lucide-react"
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useDoc, 
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking 
} from "@/firebase"
import { collection, doc, query, orderBy } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { importGrades } from "@/ai/flows/import-grades-flow"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function TrackerPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'profile', 'settings') : null, [user, db]);
  const { data: profile } = useDoc(profileRef);
  const isHighSchool = profile?.studentType === 'high-school';

  const coursesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "users", user.uid, "courses"), orderBy("createdAt", "desc"))
  }, [db, user])

  const { data: courses, isLoading: isCoursesLoading } = useCollection(coursesQuery)

  const [isImportOpen, setIsImportOpen] = React.useState(false)
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  
  const totalCredits = React.useMemo(() => {
    return courses?.reduce((acc, c) => acc + (parseFloat(c.credits) || 0), 0) || 0
  }, [courses])

  const avgGrade = React.useMemo(() => {
    if (!courses || courses.length === 0) return 0
    const total = courses.reduce((acc, c) => acc + (parseFloat(c.grade) || 0), 0)
    return Math.round(total / courses.length)
  }, [courses])
  
  const gpa = React.useMemo(() => {
    if (!courses || courses.length === 0) return "0.00"
    const points: Record<string, number> = {
      'a+': 4.0, 'a': 4.0, 'a-': 3.7,
      'b+': 3.3, 'b': 3.0, 'b-': 2.7,
      'c+': 2.3, 'c': 2.0, 'c-': 1.7,
      'd+': 1.3, 'd': 1.0, 'f': 0.0
    }
    const totalPoints = courses.reduce((acc, c) => {
      const lg = (c.letterGrade || '').toLowerCase().trim()
      return acc + (points[lg] || 0)
    }, 0)
    return (totalPoints / courses.length).toFixed(2)
  }, [courses])

  const handleDeleteCourse = (courseId: string) => {
    if (!user || !db) return
    const courseRef = doc(db, "users", user.uid, "courses", courseId)
    deleteDocumentNonBlocking(courseRef)
  }

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-smooth-slow pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground lowercase">grade tracker</h1>
          <p className="text-muted-foreground mt-2 text-lg lowercase">
            monitor your academic performance {isHighSchool ? 'across your classes' : 'across your university courses'}.
          </p>
        </div>
        <div className="flex gap-3">
          <ImportGradesDialog 
            isOpen={isImportOpen} 
            setIsOpen={setIsImportOpen} 
            user={user} 
            db={db} 
          />
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white border-2 font-bold py-6 px-8 rounded-2xl shadow-sm transition-all hover:scale-105 lowercase">
                <Plus className="h-5 w-5 mr-2" /> add course
              </Button>
            </DialogTrigger>
            <AddCourseContent 
              onClose={() => setIsAddOpen(false)} 
              user={user} 
              db={db} 
            />
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-primary/10 rounded-[32px]">
          <CardHeader className="pb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70">cumulative gpa</span>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{gpa}</span>
              <span className="text-muted-foreground">/ 4.0</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-primary mt-2 font-bold lowercase">
              <TrendingUp className="h-4 w-4" /> tracking your potential
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-accent/10 rounded-[32px]">
          <CardHeader className="pb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent-foreground/70">average grade</span>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{avgGrade}%</span>
            </div>
            <div className="w-full bg-accent/20 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-accent h-full transition-all duration-1000" style={{ width: `${avgGrade}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-secondary/30 rounded-[32px]">
          <CardHeader className="pb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground/70">total credits</span>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{totalCredits}</span>
              <span className="text-muted-foreground lowercase">units</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2 font-medium lowercase">consistent progress is key.</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="font-headline text-2xl font-bold text-foreground lowercase">current {isHighSchool ? 'classes' : 'courses'}</h2>
        </div>
        
        {isCoursesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid gap-4">
            {courses.map((course) => (
              <CourseItem 
                key={course.id} 
                course={course} 
                onDelete={() => handleDeleteCourse(course.id)} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl bg-muted/5">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-bold font-headline lowercase">no courses tracked</h3>
            <p className="text-muted-foreground mt-2 lowercase text-center max-w-sm">
              add your subjects manually or import them from a screenshot to get started.
            </p>
            <div className="flex gap-4 mt-6">
              <Button onClick={() => setIsImportOpen(true)} className="rounded-xl lowercase">
                <Upload className="h-5 w-5 mr-2" /> Import Grades
              </Button>
              <Button variant="secondary" onClick={() => setIsAddOpen(true)} className="rounded-xl lowercase">
                <Plus className="h-5 w-5 mr-2" /> Add Manually
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CourseItem({ course, onDelete }: { course: any, onDelete: () => void }) {
  const grade = parseFloat(course.grade) || 0
  const colorClass = grade >= 90 ? 'bg-primary/20' : grade >= 80 ? 'bg-accent/20' : 'bg-muted'
  const textClass = grade >= 90 ? 'text-primary' : grade >= 80 ? 'text-accent-foreground' : 'text-muted-foreground'

  return (
    <Card className="group border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-[32px] overflow-hidden bg-white">
      <CardContent className="p-8 flex items-center gap-6">
        <div className={cn("h-16 w-16 rounded-[20px] flex items-center justify-center shrink-0", colorClass)}>
          <GraduationCap className={cn("h-8 w-8", textClass)} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-headline text-xl font-bold text-foreground lowercase leading-tight truncate">
            {course.name}
          </h3>
          <p className="text-sm font-medium text-muted-foreground lowercase mt-1 opacity-70">
            {course.code || 'general course'}
          </p>
        </div>

        <div className="hidden md:flex flex-col gap-2 w-48 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">current</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">grade</span>
            </div>
            <span className="text-base font-bold text-foreground ml-2">{grade}%</span>
          </div>
          <Progress value={grade} className="h-1.5 bg-muted" />
        </div>

        <div className="flex items-center gap-8 shrink-0">
          <div className="flex flex-col items-center w-16">
            <span className="text-4xl font-bold text-foreground leading-none lowercase">
              {course.letterGrade || '-'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">grade</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDelete} 
            className="text-destructive hover:bg-destructive/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ImportGradesDialog({ isOpen, setIsOpen, user, db }: any) {
  const [file, setFile] = React.useState<File | null>(null)
  const [rawText, setRawText] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [status, setStatus] = React.useState("")

  const handleImport = async () => {
    if (!user || !db || (!file && !rawText)) return

    setIsProcessing(true)
    setStatus("analyzing your grades...")

    try {
      let fileDataUri = ""
      if (file) {
        const reader = new FileReader()
        fileDataUri = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })
      }

      const output = await importGrades({
        fileDataUri: fileDataUri || undefined,
        rawText: rawText || undefined,
      })

      setStatus(`found ${output.courses.length} courses. saving...`)

      for (const courseData of output.courses) {
        const courseId = doc(collection(db, "temp")).id
        const courseRef = doc(db, "users", user.uid, "courses", courseId)
        setDocumentNonBlocking(courseRef, {
          id: courseId,
          ...courseData,
          createdAt: new Date().toISOString()
        }, { merge: true })
      }

      setStatus("import complete!")
      setTimeout(() => {
        setIsOpen(false)
        setIsProcessing(false)
        setFile(null)
        setRawText("")
      }, 1000)

    } catch (e) {
      console.error("import failed", e)
      setStatus("something went wrong.")
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 px-8 rounded-2xl shadow-lg transition-all hover:scale-105 lowercase">
          <Upload className="h-5 w-5 mr-2" /> import grades
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[32px] sm:max-w-xl p-0 overflow-hidden border-none bg-background shadow-2xl">
        <DialogHeader className="p-8 pb-4 text-left bg-primary/5">
          <DialogTitle className="font-headline text-2xl font-bold flex items-center gap-2 text-foreground lowercase">
            <School className="h-6 w-6 text-primary" /> grade portal import
          </DialogTitle>
          <DialogDescription className="text-muted-foreground lowercase">
            upload a screenshot of your grades or paste the text from your dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {isProcessing ? (
            <div className="py-12 flex flex-col items-center gap-6">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="font-bold text-lg lowercase">{status}</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer hover:bg-primary/5",
                    file ? "border-primary bg-primary/5" : "border-muted"
                  )}
                  onClick={() => document.getElementById('grade-upload')?.click()}
                >
                  <input 
                    id="grade-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-10 w-10 text-primary" />
                      <span className="font-bold text-sm text-foreground lowercase">{file.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-10 w-10 opacity-20" />
                      <span className="font-bold lowercase text-center">upload dashboard screenshot</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">or paste text data</Label>
                  <Textarea 
                    placeholder="copy and paste your grades table here..." 
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="rounded-2xl min-h-[120px] lowercase no-focus-ring"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setIsOpen(false)} className="flex-1 rounded-2xl py-6 font-bold lowercase">cancel</Button>
                <Button 
                  disabled={!file && !rawText} 
                  onClick={handleImport}
                  className="flex-[2] rounded-2xl py-6 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 lowercase"
                >
                  sync grades
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddCourseContent({ onClose, user, db }: any) {
  const [name, setName] = React.useState("")
  const [code, setCode] = React.useState("")
  const [grade, setGrade] = React.useState("")
  const [letterGrade, setLetterGrade] = React.useState("")
  const [credits, setCredits] = React.useState("")

  const handleAdd = () => {
    if (!user || !db || !name) return
    const courseId = doc(collection(db, "temp")).id
    const courseRef = doc(db, "users", user.uid, "courses", courseId)
    setDocumentNonBlocking(courseRef, {
      id: courseId,
      name,
      code,
      grade: parseFloat(grade) || 0,
      letterGrade,
      credits: parseFloat(credits) || 0,
      createdAt: new Date().toISOString()
    }, { merge: true })
    onClose()
  }

  return (
    <DialogContent className="rounded-[32px] border-none shadow-2xl">
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl lowercase">add new course</DialogTitle>
        <DialogDescription className="lowercase">track a class manually in your dashboard.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="lowercase ml-1">course name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. physics 1" className="rounded-xl lowercase" />
          </div>
          <div className="space-y-2">
            <Label className="lowercase ml-1">course code</Label>
            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. PHYS 101" className="rounded-xl lowercase" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="lowercase ml-1">grade %</Label>
            <Input type="number" value={grade} onChange={e => setGrade(e.target.value)} placeholder="95" className="rounded-xl lowercase" />
          </div>
          <div className="space-y-2">
            <Label className="lowercase ml-1">letter</Label>
            <Input value={letterGrade} onChange={e => setLetterGrade(e.target.value)} placeholder="A" className="rounded-xl lowercase" />
          </div>
          <div className="space-y-2">
            <Label className="lowercase ml-1">credits</Label>
            <Input type="number" value={credits} onChange={e => setCredits(e.target.value)} placeholder="3" className="rounded-xl lowercase" />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} className="rounded-xl lowercase">cancel</Button>
        <Button onClick={handleAdd} className="rounded-xl bg-primary text-primary-foreground lowercase">add class</Button>
      </DialogFooter>
    </DialogContent>
  )
}
