import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'

export default function App() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-background">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-2xl bg-primary/10 p-4">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">積ん読</h1>
        <p className="text-xl font-medium text-muted-foreground">Tsundoku</p>
      </div>
      <p className="max-w-sm text-center text-muted-foreground">
        Your personal reading list tracker. Stack is wired up and ready to build on.
      </p>
      <Button size="lg">Get Started</Button>
    </main>
  )
}
