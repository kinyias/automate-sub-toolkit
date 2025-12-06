import type { SrtEntry } from "./parse-srt"
import type { TranslatedSrtEntry } from "./generate-srt"

/**
 * Mock translation function that simulates AI API behavior
 * In production, replace this with actual API call
 *
 * @param entries - Array of SRT entries to translate
 * @param apiKey - API key (unused in mock, but validates presence)
 * @param onProgress - Callback for progress updates
 * @returns Promise resolving to translated entries
 *
 * To integrate a real AI API, replace the setTimeout logic with:
 *
 * const response = await fetch('https://api.openai.com/v1/chat/completions', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': `Bearer ${apiKey}`,
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify({
 *     model: 'gpt-4',
 *     messages: [
 *       { role: 'system', content: 'Translate the following subtitle text to Spanish. Preserve meaning and timing.' },
 *       { role: 'user', content: entry.text }
 *     ]
 *   })
 * });
 */
export async function mockTranslate(
  entries: SrtEntry[],
  apiKey: string,
  onProgress?: (current: number, total: number) => void,
): Promise<TranslatedSrtEntry[]> {
  // Validate API key presence
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API key is required")
  }

  const translated: TranslatedSrtEntry[] = []

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]

    // Simulate API latency (50-150ms per entry)
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100))

    // Mock translation: prefix with [ES] to simulate Spanish translation
    // In production, this would be the actual translated text from the API
    const translatedText = `[ES] ${entry.text}`

    translated.push({
      ...entry,
      translatedText,
    })

    // Report progress
    onProgress?.(i + 1, entries.length)
  }

  return translated
}
