"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Key } from "lucide-react"

export const API_KEY_STORAGE_KEY = "ai-api-key"

interface ApiKeyInputProps {
  value: string
  onChange: (value: string) => void
}

/**
 * Secure API key input with localStorage persistence
 * Shows/hides the key and saves to localStorage on blur
 */
export function ApiKeyInput({ value, onChange }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false)

  // Load saved API key on mount
  useEffect(() => {
    const saved = localStorage.getItem(API_KEY_STORAGE_KEY)
    if (saved) {
      onChange(saved)
    }
  }, [onChange])

  // Save to localStorage when value changes
  const handleBlur = () => {
    if (value) {
      localStorage.setItem(API_KEY_STORAGE_KEY, value)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="api-key" className="flex items-center gap-2 text-sm font-medium">
        <Key className="h-4 w-4" />
        AI API Key
      </Label>
      <div className="relative">
        <Input
          id="api-key"
          type={showKey ? "text" : "password"}
          placeholder="Nhập API key..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className="pr-10 font-mono text-sm"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => setShowKey(!showKey)}
          aria-label={showKey ? "Hide API key" : "Show API key"}
        >
          {showKey ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Khóa API của bạn được lưu trữ cục bộ và không bao giờ được gửi đến máy chủ của chúng tôi.</p>
    </div>
  )
}
