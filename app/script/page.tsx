"use client"

import { useState, useCallback } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { ApiKeyInput } from "@/components/common/api-key-input"
import { FileUploader } from "@/components/translate/file-uploader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { parseSrt, type SrtEntry } from "@/lib/parse-srt"
import { srtToScript } from "@/lib/srt-to-script"
import { FileText, Download, Loader2, Copy, Check } from "lucide-react"
import { toast } from "react-hot-toast"

/**
 * Script Generator page
 * Main feature: Upload .srt files, convert to continuous script with AI
 */
export default function ScriptPage() {
  const [apiKey, setApiKey] = useState("")
  const [entries, setEntries] = useState<SrtEntry[]>([])
  const [script, setScript] = useState("")
  const [fileName, setFileName] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [model, setModel] = useState("gemini-2.5-flash")
  const [targetLanguage, setTargetLanguage] = useState("Tiếng Việt")
  const [promptStyle, setPromptStyle] = useState("")
  const [copied, setCopied] = useState(false)

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
    setScript("")
    setProgress(0)
  }, [])

  // Handle script generation
  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError("Vui lòng nhập khóa API trước")
      return
    }

    if (entries.length === 0) {
      setError("Vui lòng tải lên tệp SRT trước")
      return
    }

    setIsGenerating(true)
    setError(null)
    setProgress(0)

    try {
      const result = await srtToScript(
        entries,
        apiKey,
        targetLanguage,
        promptStyle,
        model,
        (current, total) => {
          setProgress(Math.round((current / total) * 100))
        }
      )
      setScript(result)
      toast.success("Tạo kịch bản thành công")
    } catch (err: any) {
      toast.error(err.message || "Tạo kịch bản thất bại")
      setError(err instanceof Error ? err.message : "Tạo kịch bản thất bại")
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!script) return

    try {
      await navigator.clipboard.writeText(script)
      setCopied(true)
      toast.success("Đã sao chép vào clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Không thể sao chép")
    }
  }

  // Handle export
  const handleExport = () => {
    if (!script) return

    const blob = new Blob([script], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)

    const baseName = fileName.replace(/\.srt$/i, "")
    const downloadName = `${baseName}.script.txt`

    const link = document.createElement("a")
    link.href = url
    link.download = downloadName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <FileText className="h-7 w-7 text-primary" />
            Tạo Kịch Bản
          </h1>
          <p className="mt-1 text-muted-foreground">
            Tải lên tệp SRT, chuyển đổi thành kịch bản liền mạch bằng AI
          </p>
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

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Model AI</label>
              <Select value={model} onValueChange={setModel} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                  <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                  <SelectItem value="gemini-2.0-pro">Gemini 2.0 Pro</SelectItem>
                  <SelectItem value="gemini-flash-latest">Gemini Flash Latest</SelectItem>
                  <SelectItem value="gemini-pro-latest">Gemini Pro Latest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Language Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ngôn ngữ đích</label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngôn ngữ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tiếng Việt">Tiếng Việt</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Chinese">中文</SelectItem>
                  <SelectItem value="Japanese">日本語</SelectItem>
                  <SelectItem value="Korean">한국어</SelectItem>
                  <SelectItem value="French">Français</SelectItem>
                  <SelectItem value="German">Deutsch</SelectItem>
                  <SelectItem value="Spanish">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prompt Style */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Yêu cầu chi tiết (tùy chọn)</label>
              <Textarea
                value={promptStyle}
                onChange={(e) => setPromptStyle(e.target.value)}
                placeholder="Ví dụ: Tóm tắt lại nội dung trong khoảng 1 phút (240 đến 280 từ). Chỉ lấy đoạn nổi bật"
                disabled={isGenerating}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* File Uploader */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tệp phụ đề</label>
              <FileUploader onFileContent={handleFileContent} disabled={isGenerating} />
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

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || entries.length === 0 || !apiKey.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo kịch bản...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Tạo Kịch Bản
                </>
              )}
            </Button>

            {/* Progress Bar */}
            {isGenerating && (
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
              <CardTitle>Kịch bản</CardTitle>
              <CardDescription>
                {script ? "Kịch bản đã được tạo thành công" : "Kết quả sẽ xuất hiện ở đây sau khi tạo"}
              </CardDescription>
            </div>
            {script && (
              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="outline" size="sm">
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Sao chép
                    </>
                  )}
                </Button>
                <Button onClick={handleExport} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Xuất .txt
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {script ? (
              <div className="rounded-lg border bg-muted/30 p-6">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{script}</p>
              </div>
            ) : (
              <div className="flex min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed">
                <p className="text-sm text-muted-foreground">Chưa có kịch bản nào được tạo</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
