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
import { srtTranslate } from "@/lib/srt-translate"
import { Languages, Download, Loader2 } from "lucide-react"
import {toast} from "react-hot-toast"
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
      setError("Không thể phân tích phụ đề từ tệp. Vui lòng kiểm tra định dạng.")
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
      setError("Vui lòng nhập khóa API trước")
      return
    }

    if (entries.length === 0) {
      setError("Vui lòng tải lên tệp SRT trước")
      return
    }

    setIsTranslating(true)
    setError(null)
    setProgress(0)

    try {
      const results = await srtTranslate(entries, apiKey,"tiếng việt", "Liên minh", (current, total) => {
        setProgress(Math.round((current / total) * 100))
      })
      setTranslatedEntries(results)
        toast.success("Dịch thành công")
    } catch (err: any) {
        toast.error(err.message || "Dịch thất bại")
      setError(err instanceof Error ? err.message : "Dịch thất bại")
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
            Dịch Phụ Đề
          </h1>
          <p className="mt-1 text-muted-foreground">Tải lên tệp SRT, dịch bằng AI và xuất kết quả</p>
        </div>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Cấu hình</CardTitle>
            <CardDescription>Thiết lập khóa API và tải lên tệp phụ đề của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Key Input */}
            <ApiKeyInput value={apiKey} onChange={setApiKey} />

            {/* File Uploader */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tệp phụ đề</label>
              <FileUploader onFileContent={handleFileContent} disabled={isTranslating} />
            </div>

            {/* File Stats */}
            {entries.length > 0 && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{entries.length}</span> dòng phụ đề được tải từ{" "}
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
                  Đang dịch...
                </>
              ) : (
                <>
                  <Languages className="mr-2 h-4 w-4" />
                  Dịch Ngay
                </>
              )}
            </Button>

            {/* Progress Bar */}
            {isTranslating && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-center text-xs text-muted-foreground">{progress}% hoàn thành</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Kết quả dịch</CardTitle>
              <CardDescription>
                {translatedEntries.length > 0
                  ? `${translatedEntries.length} dòng đã dịch`
                  : "Kết quả sẽ xuất hiện ở đây sau khi dịch"}
              </CardDescription>
            </div>
            {translatedEntries.length > 0 && (
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Xuất .srt
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
