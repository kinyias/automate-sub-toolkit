import { GoogleGenerativeAI } from "@google/generative-ai";
import { PromptTemplate } from "@langchain/core/prompts";
import type { SrtEntry } from "./parse-srt";

/**
 * Convert SRT entries to a continuous script/paragraph
 */
export async function srtToScript(
  entries: SrtEntry[],
  apiKey: string,
  targetLanguage: string,
  promptStyle: string,
  modelName: string,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  // Initialize Gemini model
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 20000,
    },
  });

  // Combine all subtitle text into one string
  const subtitleText = entries.map((entry) => entry.text).join(" ");

  // Create prompt for script generation
  const promptTemplate = PromptTemplate.fromTemplate(`
Bạn là một biên kịch chuyên nghiệp, chuyên chuyển đổi phụ đề thành kịch bản liền mạch bằng ${targetLanguage}.

Nhiệm vụ:
Chuyển đổi các đoạn phụ đề dưới đây thành một đoạn văn kịch bản liền mạch, tự nhiên bằng ${targetLanguage}.

Yêu cầu:
- Tạo một đoạn văn liền mạch, không chia thành nhiều đoạn nhỏ.
- Giữ nguyên ý nghĩa và nội dung của phụ đề gốc.
- Loại bỏ sự lặp lại không cần thiết.
- Đảm bảo văn phong tự nhiên, dễ đọc.
- Phù hợp cho voice-over hoặc đọc kịch bản.
Yêu cầu chi tiết : ${promptStyle}

Phụ đề gốc:
{subtitles}

Hãy trả về KẾT QUẢ DẠNG VĂN BẢN THUẦN TÚY, KHÔNG có tiêu đề, không có ghi chú, chỉ có đoạn văn kịch bản.
`);

  const prompt = await promptTemplate.format({
    subtitles: subtitleText,
  });

  try {
    // Report initial progress
    if (onProgress) onProgress(0, 100);

    // Generate script
    const result = await model.generateContent(prompt);
    const response = result.response;
    const script = response.text();

    // Report completion
    if (onProgress) onProgress(100, 100);

    return script.trim();
  } catch (error: any) {
    console.error("Script generation error:", error);
    throw new Error(
      error.message || "Không thể tạo kịch bản. Vui lòng thử lại."
    );
  }
}
