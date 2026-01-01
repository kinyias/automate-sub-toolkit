"use client"

import { useState, useCallback } from "react"

import { JsonFileUploader } from "@/components/converter/json-file-uploader"
import { ResultTable } from "@/components/translate/result-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { parseCapCutJson } from "@/lib/parse-capcut-json"
import { generateSrt, type TranslatedSrtEntry } from "@/lib/generate-srt"
import { FileJson, Download, ArrowRight } from "lucide-react"

/**
 * JSON to SRT Converter page
 * Converts CapCut draft JSON files to SRT subtitle format
 */
export default function ConverterPage() {
  const [entries, setEntries] = useState<TranslatedSrtEntry[]>([])
  const [fileName, setFileName] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Handle file upload and conversion
  const handleFileContent = useCallback((content: string, name: string) => {
    setError(null)

    try {
      const parsed = parseCapCutJson(content)

      if (parsed.length === 0) {
        setError("Không thể phân tích phụ đề từ tệp JSON. Vui lòng kiểm tra định dạng.")
        return
      }

      setEntries(parsed)
      setFileName(name)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể phân tích tệp JSON")
      setEntries([])
    }
  }, [])

  // Handle export
  const handleExport = () => {
    if (entries.length === 0) return

    const srtContent = generateSrt(entries)
    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)

    const baseName = fileName.replace(/\.json$/i, "")
    const downloadName = `${baseName}.srt`

    const link = document.createElement("a")
    link.href = url
    link.download = downloadName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Handle editing entries
  const handleUpdateEntry = useCallback((index: number, newText: string) => {
    setEntries((prev) => prev.map((entry) => (entry.index === index ? { ...entry, translatedText: newText } : entry)))
  }, [])

  return (

      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <FileJson className="h-7 w-7 text-primary" />
            Chuyển đổi JSON sang SRT
          </h1>
          <p className="mt-1 text-muted-foreground">Chuyển đổi tệp JSON bản nháp CapCut sang định dạng phụ đề SRT</p>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tải lên tệp JSON</CardTitle>
            <CardDescription>Tải lên tệp draft_content.json hoặc draft_info.json của CapCut</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Uploader */}
            <JsonFileUploader onFileContent={handleFileContent} />

            {/* File Stats */}
            {entries.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                <ArrowRight className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{entries.length}</span> dòng phụ đề được trích xuất từ{" "}
                  <span className="font-mono text-xs">{fileName}</span>
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Phụ đề đã trích xuất</CardTitle>
              <CardDescription>
                {entries.length > 0
                  ? `${entries.length} dòng sẵn sàng để xuất - nhấp để chỉnh sửa trước khi xuất`
                  : "Tải lên tệp JSON để xem phụ đề được trích xuất"}
              </CardDescription>
            </div>
            {entries.length > 0 && (
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Xuất .srt
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <ResultTable entries={entries} onUpdateEntry={handleUpdateEntry} />
          </CardContent>
        </Card>
      </div>

  )
}
