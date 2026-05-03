import { Link, useParams, useSearchParams } from 'react-router-dom'

export default function Reader() {
  const { slug } = useParams<{ slug: string }>()
  const [params] = useSearchParams()
  const chapter = params.get('chapter')
  const paragraph = params.get('paragraph')

  return (
    <main className="min-h-screen p-8">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
        ← Library
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Reader: {slug}</h1>
      <p className="mt-2 text-muted-foreground">
        chapter={chapter} paragraph={paragraph}
      </p>
    </main>
  )
}
