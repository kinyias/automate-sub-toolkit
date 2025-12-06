import type { TranslatedSrtEntry } from "./generate-srt"

/**
 * Converts milliseconds to SRT timestamp format
 * Format: HH:MM:SS,mmm
 */
function msToSrtTimestamp(timeInMs: number): string {
  const totalMs = Math.floor(timeInMs / 1000)
  const ms = totalMs % 1000
  const totalSeconds = (totalMs - ms) / 1000
  const seconds = totalSeconds % 60
  const totalMinutes = (totalSeconds - seconds) / 60
  const minutes = totalMinutes % 60
  const hours = (totalMinutes - minutes) / 60

  const pad = (n: number, len = 2) => n.toString().padStart(len, "0")
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(ms, 3)}`
}

interface CapCutTextMaterial {
  id: string
  content: string
}

interface CapCutSegment {
  material_id: string
  target_timerange: {
    start: number
    duration: number
  }
}

interface CapCutTrack {
  segments: CapCutSegment[]
}

interface CapCutDraftData {
  materials: {
    texts: CapCutTextMaterial[]
  }
  tracks: CapCutTrack[]
}

/**
 * Parses CapCut draft JSON (draft_content.json / draft_info.json)
 * and converts it to SRT-compatible entries
 */
export function parseCapCutJson(jsonContent: string): TranslatedSrtEntry[] {
  const data: CapCutDraftData = JSON.parse(jsonContent)
  const { materials, tracks } = data

  if (!materials?.texts || !tracks) {
    throw new Error("Invalid CapCut JSON format: missing materials.texts or tracks")
  }

  // Extract text content from materials
  let subtitlesInfo = materials.texts.map((item) => {
    // Clean content - remove HTML-like tags and brackets
    let content = item.content
      .replace(/<.*?>/g, "")
      .replace(/<\/.*?>/g, "")
      .replace(/\[|\]/g, "")

    // Try to parse as JSON (CapCut v3 format)
    try {
      const contentV3 = JSON.parse(item.content)
      if (contentV3?.text) {
        content = contentV3.text
      }
    } catch {
      // Not JSON format, use cleaned content
    }

    return {
      content,
      id: item.id,
      start: 0,
      end: 0,
    }
  })

  // Find timing info from tracks
  let subTrackNumber = 0
  let subTiming = tracks[subTrackNumber]?.segments || []

  subtitlesInfo = subtitlesInfo.map((s) => {
    let segment = subTiming.find((seg) => seg.material_id === s.id)

    // Search through tracks if not found in current track
    while (!segment && subTrackNumber < tracks.length - 1) {
      subTrackNumber++
      subTiming = tracks[subTrackNumber]?.segments || []
      segment = subTiming.find((seg) => seg.material_id === s.id)
    }

    if (segment) {
      s.start = segment.target_timerange.start
      s.end = s.start + segment.target_timerange.duration
    }

    return s
  })

  // Filter out entries without timing and convert to SRT format
  return subtitlesInfo
    .filter((s) => s.start !== 0 || s.end !== 0)
    .sort((a, b) => a.start - b.start)
    .map((s, index) => ({
      index: index + 1,
      start: msToSrtTimestamp(s.start),
      end: msToSrtTimestamp(s.end),
      text: "",
      translatedText: s.content, 
    })) as TranslatedSrtEntry[]
}
