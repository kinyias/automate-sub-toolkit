"use client"

import { useState } from "react"
import type { TranslatedSrtEntry } from "@/lib/generate-srt"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ResultTableProps {
  entries: TranslatedSrtEntry[]
  onUpdateEntry?: (index: number, newText: string) => void
}

/**
 * Displays translated subtitle entries in a scrollable table
 * Shows timing, original text, and translated text
 * Supports inline editing of translated text
 */
export function ResultTable({ entries, onUpdateEntry }: ResultTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")

  const handleStartEdit = (entry: TranslatedSrtEntry) => {
    setEditingIndex(entry.index)
    setEditValue(entry.translatedText)
  }

  const handleSaveEdit = () => {
    if (editingIndex !== null && onUpdateEntry) {
      onUpdateEntry(editingIndex, editValue)
    }
    setEditingIndex(null)
    setEditValue("")
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditValue("")
  }
  const isConverting = !entries.some((entry) => entry.text.trim() === "")
  if (entries.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Chưa có bản dịch. Tải lên tệp và nhấp vào dịch.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[400px] rounded-lg border">
      <Table>
        <TableHeader className="sticky top-0 bg-card">
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead >Thời gian</TableHead>
            <TableHead>Văn bản gốc</TableHead>
            {isConverting && <TableHead>Văn bản dịch</TableHead>}
            {isConverting && <TableHead className="w-[100px] text-right">Hành động</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.index}>
              <TableCell className="font-mono text-xs text-muted-foreground">{entry.index}</TableCell>
              <TableCell className="font-mono text-xs">
                <span className="text-muted-foreground">{entry.start}</span>
                <span className="mx-1 text-muted-foreground/50">→</span>
                <span className="text-muted-foreground">{entry.end}</span>
              </TableCell>
              {isConverting&&<TableCell className="max-w-[300px]">
                <p className="whitespace-pre-wrap break-words text-sm">{entry.text}</p>
              </TableCell>}
              
               <TableCell className="max-w-[300px]">
                {editingIndex === entry.index ? (
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="min-h-[60px] text-sm"
                    autoFocus
                  />
                ) : (
                  <p className="whitespace-pre-wrap break-words text-sm text-primary">{entry.translatedText}</p>
                )}
              </TableCell>
              {isConverting &&
              <TableCell className="text-right">
                {editingIndex === entry.index ? (
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}>
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleStartEdit(entry)}
                    disabled={!onUpdateEntry}
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}
