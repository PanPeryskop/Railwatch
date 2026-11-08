"use client"

import { useRef, useState } from "react"

import { Input } from "@/components/ui/input"
import { findStations, type Station } from "@/lib/api"

type Props = {
  id: string
  value: Station | null
  onChange: (station: Station | null) => void
  placeholder?: string
}

export function StationPicker({ id, value, onChange, placeholder }: Props) {
  const [text, setText] = useState(value?.name ?? "")
  const [options, setOptions] = useState<Station[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const latest = useRef("")

  const shown = value ? value.name : text

  function type(next: string) {
    setText(next)
    onChange(null)
    clearTimeout(timer.current)
    latest.current = next
    if (next.trim().length < 2) {
      setOptions([])
      return
    }
    timer.current = setTimeout(async () => {
      const result = await findStations(next).catch(() => [])
      if (latest.current === next) setOptions(result)
    }, 250)
  }

  function select(station: Station) {
    setText(station.name)
    setOptions([])
    setOpen(false)
    onChange(station)
  }

  return (
    <div className="relative">
      <Input
        id={id}
        value={shown}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => type(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      {open && options.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border bg-popover py-1 text-popover-foreground shadow-md">
          {options.map((station) => (
            <li key={station.external_id}>
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                onMouseDown={(e) => {
                  e.preventDefault()
                  select(station)
                }}
              >
                {station.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
