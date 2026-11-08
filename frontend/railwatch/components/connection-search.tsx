"use client"

import { useMemo, useState } from "react"
import { ArrowLeftRight } from "lucide-react"

import { StationPicker } from "@/components/station-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { searchConnections, type Connection, type Station } from "@/lib/api"

const BRANDS = ["EIP", "EIC", "IC", "TLK"]

function inDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString("sv-SE")
}

function clock(iso: string) {
  return iso.slice(11, 16)
}

function duration(minutes: number) {
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min`
}

export function ConnectionSearch() {
  const [origin, setOrigin] = useState<Station | null>(null)
  const [destination, setDestination] = useState<Station | null>(null)
  const [travelDate, setTravelDate] = useState(() => inDays(7))
  const [departAfter, setDepartAfter] = useState("00:00")
  const [departBefore, setDepartBefore] = useState("23:59")
  const [maxTransfers, setMaxTransfers] = useState("")
  const [brands, setBrands] = useState<string[]>(BRANDS)
  const [sortBy, setSortBy] = useState<"departure" | "price">("departure")
  const [results, setResults] = useState<Connection[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sorted = useMemo(() => {
    if (!results) return []
    if (sortBy === "departure") return results
    return [...results].sort((a, b) => Number(a.price ?? Infinity) - Number(b.price ?? Infinity))
  }, [results, sortBy])

  const cheapest = useMemo(() => {
    const prices = (results ?? []).filter((c) => c.price !== null).map((c) => Number(c.price))
    return prices.length ? Math.min(...prices) : null
  }, [results])

  function toggleBrand(brand: string) {
    setBrands((current) => (current.includes(brand) ? current.filter((b) => b !== brand) : [...current, brand]))
  }

  function swap() {
    setOrigin(destination)
    setDestination(origin)
  }

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (!origin || !destination) return
    setLoading(true)
    setError(null)
    try {
      setResults(
        await searchConnections({
          origin,
          destination,
          travel_date: travelDate,
          filters: {
            depart_after: departAfter,
            depart_before: departBefore,
            max_transfers: maxTransfers === "" ? null : Number(maxTransfers),
            brands,
          },
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać połączeń")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Wyszukaj połączenie</CardTitle>
          <CardDescription>Dane z Koleo: rozkład i ceny biletów normalnych</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={search} className="flex flex-col gap-4">
            <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <Field>
                <FieldLabel htmlFor="origin">Skąd</FieldLabel>
                <StationPicker id="origin" value={origin} onChange={setOrigin} placeholder="np. Kraków" />
              </Field>
              <Button type="button" variant="outline" size="icon" onClick={swap} aria-label="Zamień stacje">
                <ArrowLeftRight />
              </Button>
              <Field>
                <FieldLabel htmlFor="destination">Dokąd</FieldLabel>
                <StationPicker
                  id="destination"
                  value={destination}
                  onChange={setDestination}
                  placeholder="np. Warszawa"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <Field>
                <FieldLabel htmlFor="date">Data</FieldLabel>
                <Input id="date" type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="after">Odjazd od</FieldLabel>
                <Input id="after" type="time" value={departAfter} onChange={(e) => setDepartAfter(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="before">Odjazd do</FieldLabel>
                <Input
                  id="before"
                  type="time"
                  value={departBefore}
                  onChange={(e) => setDepartBefore(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="transfers">Maks. przesiadek</FieldLabel>
                <Input
                  id="transfers"
                  type="number"
                  min={0}
                  placeholder="bez limitu"
                  value={maxTransfers}
                  onChange={(e) => setMaxTransfers(e.target.value)}
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Kategorie:</span>
                {BRANDS.map((brand) => (
                  <Button
                    key={brand}
                    type="button"
                    size="sm"
                    variant={brands.includes(brand) ? "default" : "outline"}
                    aria-pressed={brands.includes(brand)}
                    onClick={() => toggleBrand(brand)}
                  >
                    {brand}
                  </Button>
                ))}
                {brands.length === 0 && <span className="text-sm text-muted-foreground">wszyscy przewoźnicy</span>}
              </div>
              <Button type="submit" disabled={!origin || !destination || loading}>
                {loading ? "Szukam…" : "Szukaj"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>
              {origin?.name} → {destination?.name}
            </CardTitle>
            <CardDescription>
              {results.length} połączeń
              {cheapest !== null && ` · najtaniej ${cheapest.toFixed(2)} zł`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Brak połączeń dla tych filtrów.</p>
            ) : (
              <>
                <div className="mb-3 flex gap-2">
                  <Button
                    size="sm"
                    variant={sortBy === "departure" ? "secondary" : "ghost"}
                    onClick={() => setSortBy("departure")}
                  >
                    Wg godziny
                  </Button>
                  <Button
                    size="sm"
                    variant={sortBy === "price" ? "secondary" : "ghost"}
                    onClick={() => setSortBy("price")}
                  >
                    Wg ceny
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Odjazd</TableHead>
                      <TableHead>Przyjazd</TableHead>
                      <TableHead>Czas</TableHead>
                      <TableHead>Przesiadki</TableHead>
                      <TableHead>Pociągi</TableHead>
                      <TableHead className="text-right">Cena</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((c) => {
                      const best = c.price !== null && Number(c.price) === cheapest
                      return (
                        <TableRow key={`${c.departure}-${c.trains.map((t) => t.number).join("-")}`}>
                          <TableCell className="font-medium">{clock(c.departure)}</TableCell>
                          <TableCell>{clock(c.arrival)}</TableCell>
                          <TableCell>{duration(c.duration_min)}</TableCell>
                          <TableCell>{c.transfers}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {c.trains.map((t) => (
                                <Badge key={`${t.category}-${t.number}`} variant="outline">
                                  {t.category} {t.number}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className={best ? "text-right font-semibold text-primary" : "text-right"}>
                            {c.price !== null ? `${Number(c.price).toFixed(2)} zł` : "—"}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
