import { ConnectionSearch } from "@/components/connection-search"

export default function Page() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Railwatch</h1>
        <p className="text-sm text-muted-foreground">Prototyp: wyszukiwanie połączeń i cen przez Koleo</p>
      </header>
      <ConnectionSearch />
    </main>
  )
}
