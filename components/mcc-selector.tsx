'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { MCC_CODES, MCCCode } from '@/lib/mcc-codes'
import { Search, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MCCSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function MCCSelector({ value, onChange, placeholder = 'Search by code or description...', disabled }: MCCSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selected = MCC_CODES.find(m => m.code === value) ?? null

  const filtered = search.trim() === ''
    ? MCC_CODES
    : MCC_CODES.filter(m =>
        m.code.includes(search.trim()) ||
        m.description.toLowerCase().includes(search.trim().toLowerCase())
      )

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    if (disabled) return
    setOpen(true)
    setSearch('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSelect = useCallback((mcc: MCCCode) => {
    onChange(mcc.code)
    setOpen(false)
    setSearch('')
  }, [onChange])

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'ring-2 ring-ring ring-offset-2',
          !selected && 'text-muted-foreground'
        )}
      >
        <span className="truncate text-left">
          {selected
            ? <><span className="font-mono font-semibold text-foreground">{selected.code}</span> — {selected.description}</>
            : placeholder
          }
        </span>
        <span className="flex items-center gap-1 ml-2 flex-shrink-0">
          {selected && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={e => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
              className="rounded p-0.5 hover:bg-muted"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
          )}
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg"
        >
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by code or description..."
              className="h-8 border-0 p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            />
          </div>

          {/* Results list */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No MCC codes found for &quot;{search}&quot;
              </div>
            ) : (
              filtered.map(mcc => (
                <button
                  key={mcc.code}
                  type="button"
                  onClick={() => handleSelect(mcc)}
                  className={cn(
                    'flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
                    value === mcc.code && 'bg-accent text-accent-foreground'
                  )}
                >
                  <span className="font-mono font-semibold text-foreground min-w-[3.5rem] flex-shrink-0 pt-px">
                    {mcc.code}
                  </span>
                  <span className="text-muted-foreground leading-snug">{mcc.description}</span>
                </button>
              ))
            )}
          </div>

          {/* Footer count */}
          <div className="border-t border-border px-3 py-1.5">
            <p className="text-xs text-muted-foreground">
              {filtered.length} of {MCC_CODES.length} codes
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
