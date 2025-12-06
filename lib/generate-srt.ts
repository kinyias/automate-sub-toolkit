import type { SrtEntry } from "@/lib/parse-srt"

/**
 * Extended SRT entry with translation
 */
export interface TranslatedSrtEntry extends SrtEntry {
  translatedText: string
}

/**
 * Generates valid SRT content from translated entries
 * Preserves original timing and formatting
 */
export function generateSrt(entries: TranslatedSrtEntry[]): string {
  return entries
    .map((entry) => {
      return `${entry.index}\n${entry.start} --> ${entry.end}\n${entry.translatedText}`
    })
    .join("\n\n")
}
