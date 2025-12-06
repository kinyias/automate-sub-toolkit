"use client"

import { useState, useCallback } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { ApiKeyInput } from "@/components/common/api-key-input"
import { FileUploader } from "@/components/translate/file-uploader"
import { ResultTable } from "@/components/translate/result-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { parseSrt, type SrtEntry } from "@/lib/parse-srt"
import { generateSrt, type TranslatedSrtEntry } from "@/lib/generate-srt"
import { mockTranslate } from "@/lib/mock-translate"
import { Languages, Download, Loader2 } from "lucide-react"

/**
 * Translate Subtitles page
 * Main feature: Upload .srt files, translate with AI, export results
 */
export default function TranslatePage() {
  const [apiKey, setApiKey] = useState("")
  const [entries, setEntries] = useState<SrtEntry[]>([])
  const [translatedEntries, setTranslatedEntries] = useState<TranslatedSrtEntry[]>([])
  const [fileName, setFileName] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Handle file upload
  const handleFileContent = useCallback((content: string, name: string) => {
    setError(null)
    const parsed = parseSrt(content)

    if (parsed.length === 0) {
      setError("Could not parse any subtitles from the file. Please check the format.")
      return
    }

    setEntries(parsed)
    setFileName(name)
    setTranslatedEntries([])
    setProgress(0)
  }, [])

  // Handle translation
  const handleTranslate = async () => {
    if (!apiKey.trim()) {
      setError("Please enter your API key first")
      return
    }

    if (entries.length === 0) {
      setError("Please upload an SRT file first")
      return
    }

    setIsTranslating(true)
    setError(null)
    setProgress(0)

    try {
      const results = await mockTranslate(entries, apiKey, (current, total) => {
        setProgress(Math.round((current / total) * 100))
      })
      setTranslatedEntries(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed")
    } finally {
      setIsTranslating(false)
    }
  }

  // Handle export
  const handleExport = () => {
    if (translatedEntries.length === 0) return

    const srtContent = generateSrt(translatedEntries)
    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)

    const baseName = fileName.replace(/\.srt$/i, "")
    const downloadName = `${baseName}.translated.srt`

    const link = document.createElement("a")
    link.href = url
    link.download = downloadName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleUpdateEntry = useCallback((index: number, newText: string) => {
    setTranslatedEntries((prev) =>
      prev.map((entry) => (entry.index === index ? { ...entry, translatedText: newText } : entry)),
    )
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Languages className="h-7 w-7 text-primary" />
            Translate Subtitles
          </h1>
          <p className="mt-1 text-muted-foreground">Upload an SRT file, translate with AI, and export the results</p>
        </div>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Set up your API key and upload your subtitle file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Key Input */}
            <ApiKeyInput value={apiKey} onChange={setApiKey} />

            {/* File Uploader */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subtitle File</label>
              <FileUploader onFileContent={handleFileContent} disabled={isTranslating} />
            </div>

            {/* File Stats */}
            {entries.length > 0 && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{entries.length}</span> subtitle entries loaded from{" "}
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

            {/* Translate Button */}
            <Button
              onClick={handleTranslate}
              disabled={isTranslating || entries.length === 0 || !apiKey.trim()}
              className="w-full"
              size="lg"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="mr-2 h-4 w-4" />
                  Translate Now
                </>
              )}
            </Button>

            {/* Progress Bar */}
            {isTranslating && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-center text-xs text-muted-foreground">{progress}% complete</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Translation Results</CardTitle>
              <CardDescription>
                {translatedEntries.length > 0
                  ? `${translatedEntries.length} entries translated`
                  : "Results will appear here after translation"}
              </CardDescription>
            </div>
            {translatedEntries.length > 0 && (
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export .srt
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <ResultTable entries={translatedEntries} onUpdateEntry={handleUpdateEntry} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
