"use client"

import { useState, useCallback } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
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
        setError("Could not parse any subtitles from the JSON file. Please check the format.")
        return
      }

      setEntries(parsed)
      setFileName(name)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse JSON file")
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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <FileJson className="h-7 w-7 text-primary" />
            JSON to SRT Converter
          </h1>
          <p className="mt-1 text-muted-foreground">Convert CapCut draft JSON files to SRT subtitle format</p>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload JSON File</CardTitle>
            <CardDescription>Upload your CapCut draft_content.json or draft_info.json file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Uploader */}
            <JsonFileUploader onFileContent={handleFileContent} />

            {/* File Stats */}
            {entries.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                <ArrowRight className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{entries.length}</span> subtitle entries extracted from{" "}
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
              <CardTitle>Extracted Subtitles</CardTitle>
              <CardDescription>
                {entries.length > 0
                  ? `${entries.length} entries ready for export - click to edit before exporting`
                  : "Upload a JSON file to see extracted subtitles"}
              </CardDescription>
            </div>
            {entries.length > 0 && (
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export .srt
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <ResultTable entries={entries} onUpdateEntry={handleUpdateEntry} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
