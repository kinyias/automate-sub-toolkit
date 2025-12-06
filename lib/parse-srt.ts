/**
 * Represents a single subtitle entry from an SRT file
 */
export interface SrtEntry {
  index: number
  start: string
  end: string
  text: string
}

/**
 * Parses SRT file content into an array of subtitle entries
 * Handles various SRT formats and edge cases
 */
export function parseSrt(content: string): SrtEntry[] {
  const entries: SrtEntry[] = []

  // Normalize line endings and split by double newlines (entry separator)
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const blocks = normalized.split(/\n\n+/).filter((block) => block.trim())

  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.trim())

    if (lines.length < 2) continue

    // First line should be the index number
    const indexLine = lines[0].trim()
    const index = Number.parseInt(indexLine, 10)

    if (isNaN(index)) continue

    // Second line should be the timestamp
    const timestampLine = lines[1].trim()
    const timestampMatch = timestampLine.match(/(\d{2}:\d{2}:\d{2}[,.:]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.:]\d{3})/)

    if (!timestampMatch) continue

    const start = timestampMatch[1].replace(".", ",")
    const end = timestampMatch[2].replace(".", ",")

    // Remaining lines are the subtitle text
    const text = lines.slice(2).join("\n")

    entries.push({
      index,
      start,
      end,
      text,
    })
  }

  return entries
}
