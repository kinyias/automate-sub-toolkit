"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApiKeyInput } from "@/components/common/api-key-input"
import { Youtube, Loader2, Copy, Check, Sparkles, AlertTriangle } from "lucide-react"
import { toast } from "react-hot-toast"
import { generateYouTubeSEO, estimateTokenCount, getModelTokenLimit, isScriptWithinLimit } from "@/lib/youtube-seo-generator"

/**
 * YouTube SEO Content Generator Page
 * Analyzes video scripts and generates SEO-optimized content for YouTube
 */

interface SEOResult {
  main_topic: string
  search_intent: string
  target_audience: string
  titles: string[]
  description: string
  tags_25: string[]
  main_tags_10: string[]
  thumbnail_prompt: string
}

export default function YouTubeSEOPage() {
  const [apiKey, setApiKey] = useState("")
  const [script, setScript] = useState("")
  const [language, setLanguage] = useState("vietnamese")
  const [model, setModel] = useState("gemini-2.5-flash")
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<SEOResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())
  const [tokenCount, setTokenCount] = useState(0)
  const [isOverLimit, setIsOverLimit] = useState(false)

  // Calculate token count when script or model changes
  useEffect(() => {
    if (script) {
      const count = estimateTokenCount(script)
      setTokenCount(count)
      setIsOverLimit(!isScriptWithinLimit(script, model))
    } else {
      setTokenCount(0)
      setIsOverLimit(false)
    }
  }, [script, model])

  // Load saved model from localStorage
  useEffect(() => {
    const savedModel = localStorage.getItem("youtubeseo_model")
    if (savedModel) setModel(savedModel)
  }, [])

  // Save model to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("youtubeseo_model", model)
  }, [model])

  // Handle SEO generation
  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError("Vui lòng nhập khóa API trước")
      return
    }

    if (!script.trim()) {
      setError("Vui lòng nhập kịch bản video")
      return
    }

    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const seoResult = await generateYouTubeSEO(script, apiKey, language, model)
      setResult(seoResult)
      toast.success("Tạo nội dung SEO thành công!")
    } catch (err: any) {
      const errorMessage = err.message || "Không thể tạo nội dung SEO"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle copy to clipboard
  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItems(prev => new Set(prev).add(label))
      toast.success(`Đã sao chép ${label}`)
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(label)
          return newSet
        })
      }, 2000)
    } catch (err) {
      toast.error("Không thể sao chép")
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Youtube className="h-7 w-7 text-primary" />
          YouTube SEO Content Generator
        </h1>
        <p className="mt-1 text-muted-foreground">
          Phân tích kịch bản video và tạo nội dung SEO tối ưu cho YouTube
        </p>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình</CardTitle>
          <CardDescription>Nhập kịch bản video và thiết lập tùy chọn</CardDescription>
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

          {/* Language Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ngôn ngữ nội dung</label>
            <Select value={language} onValueChange={setLanguage} disabled={isGenerating}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn ngôn ngữ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vietnamese">Tiếng Việt</SelectItem>
                <SelectItem value="english">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Script Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Kịch bản video</label>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Dán toàn bộ kịch bản video của bạn vào đây..."
              disabled={isGenerating}
              rows={12}
              className="resize-none text-sm"
            />
            {script && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {script.split(/\s+/).length} từ • {script.length} ký tự • ~{tokenCount.toLocaleString()} tokens
                </p>
                {isOverLimit && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      Kịch bản quá dài ({tokenCount.toLocaleString()} tokens). Giới hạn: {(getModelTokenLimit(model) - 2000).toLocaleString()} tokens cho {model}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !script.trim() || !apiKey.trim() || isOverLimit}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang phân tích và tạo nội dung SEO...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Tạo Nội Dung SEO
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Analysis Results */}
          <Card>
            <CardHeader>
              <CardTitle>Phân tích kịch bản</CardTitle>
              <CardDescription>Thông tin được AI phân tích từ kịch bản</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Chủ đề chính</p>
                  <p className="text-sm font-semibold">{result.main_topic}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Ý định tìm kiếm</p>
                  <p className="text-sm font-semibold">{result.search_intent}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Đối tượng mục tiêu</p>
                  <p className="text-sm font-semibold">{result.target_audience}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Titles */}
          <Card>
            <CardHeader>
              <CardTitle>5 Tiêu đề tối ưu SEO</CardTitle>
              <CardDescription>Các tiêu đề được tối ưu hóa cho tìm kiếm YouTube</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.titles.map((title, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <span className="mr-2 text-xs font-medium text-muted-foreground">#{index + 1}</span>
                      <span className="text-sm font-medium">{title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(title, `title-${index}`)}
                      className="shrink-0"
                    >
                      {copiedItems.has(`title-${index}`) ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mô tả video</CardTitle>
                <CardDescription>Mô tả tối ưu SEO cho YouTube</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(result.description, "description")}
              >
                {copiedItems.has("description") ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Sao chép
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Main Tags (10) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>10 Thẻ chính (Main Tags)</CardTitle>
                <CardDescription>Các thẻ quan trọng nhất cho video</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(result.main_tags_10.join(", "), "main-tags")}
              >
                {copiedItems.has("main-tags") ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Sao chép tất cả
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.main_tags_10.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => handleCopy(tag, `main-tag-${index}`)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    {tag}
                    {copiedItems.has(`main-tag-${index}`) ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All Tags (25) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>25 Thẻ YouTube (Tags)</CardTitle>
                <CardDescription>Bộ thẻ đầy đủ để tối ưu hóa khả năng hiển thị</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(result.tags_25.join(", "), "all-tags")}
              >
                {copiedItems.has("all-tags") ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Sao chép tất cả
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.tags_25.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => handleCopy(tag, `tag-${index}`)}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-sm transition-colors hover:bg-muted/80"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Thumbnail Prompt */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>AI Thumbnail Prompt</CardTitle>
                <CardDescription>Prompt để tạo ảnh thumbnail bằng AI</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(result.thumbnail_prompt, "thumbnail")}
              >
                {copiedItems.has("thumbnail") ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Sao chép
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-slate-950 p-4">
                <code className="text-sm text-green-400">{result.thumbnail_prompt}</code>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
