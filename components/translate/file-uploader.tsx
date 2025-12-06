"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Upload, FileText, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FileUploaderProps {
  onFileContent: (content: string, fileName: string) => void
  accept?: string
  disabled?: boolean
}

/**
 * Drag & drop file uploader with click support
 * Reads file content and passes it to parent component
 */
export function FileUploader({ onFileContent, accept = ".srt", disabled = false }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      setError(null)

      // Validate file type
      if (!file.name.endsWith(".srt")) {
        setError("Vui lòng tải lên tệp .srt hợp lệ")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (content) {
          setFileName(file.name)
          onFileContent(content, file.name)
        }
      }
      reader.onerror = () => {
        setError("Không thể đọc tệp")
      }
      reader.readAsText(file)
    },
    [onFileContent],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleClick = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = accept
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleFile(file)
      }
    }
    input.click()
  }

  const clearFile = () => {
    setFileName(null)
    setError(null)
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={disabled ? undefined : handleClick}
        className={cn(
          "relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragging && "border-primary bg-primary/5",
          !isDragging && "border-border hover:border-primary/50 hover:bg-muted/50",
          disabled && "cursor-not-allowed opacity-50",
          error && "border-destructive",
        )}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            if (!disabled) handleClick()
          }
        }}
        aria-label="Tải lên tệp SRT"
      >
        {fileName ? (
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{fileName}</span>
              <span className="text-xs text-muted-foreground">Nhấp để thay thế</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-2"
              onClick={(e) => {
                e.stopPropagation()
                clearFile()
              }}
              aria-label="Xóa tệp"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Kéo thả tệp .srt vào đây hoặc nhấp để duyệt</p>
            <p className="mt-1 text-xs text-muted-foreground">Hỗ trợ tệp phụ đề SRT</p>
          </>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
