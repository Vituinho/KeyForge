import Link from "next/link"

export default function TrainingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-black text-white mb-2">TRAINING</h1>
        <p className="text-white/40">Targeted practice for your weak keys. Coming soon.</p>
      </div>
      <Link href="/" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-bold text-sm transition-colors">
        ← Back to Home
      </Link>
    </main>
  )
}
