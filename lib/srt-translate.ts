import type { SrtEntry } from './parse-srt';
import type { TranslatedSrtEntry } from './generate-srt';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
/**
 * Mock translation function that simulates AI API behavior
 * In production, replace this with actual API call
 *
 * @param entries - Array of SRT entries to translate
 * @param apiKey - API key (unused in mock, but validates presence)
 * @param onProgress - Callback for progress updates
 * @returns Promise resolving to translated entries
 *
 */
export async function srtTranslate(
  entries: SrtEntry[],
  apiKey: string,
  targetLanguage: string,
  promptStyle: string,
  model: string,
  onProgress?: (current: number, total: number) => void
): Promise<TranslatedSrtEntry[]> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API key is required');
  }

  // Set batch size to 200 entries per API call
  const BATCH_SIZE = 200;
  
  // If entries are 200 or less, process in single call
  if (entries.length <= BATCH_SIZE) {
    return await translateBatch(entries, apiKey, targetLanguage, promptStyle, model, onProgress);
  }

  // For more than 200 entries, process in chunks
  console.log(`Processing ${entries.length} entries in batches of ${BATCH_SIZE}...`);
  
  const allTranslatedEntries: TranslatedSrtEntry[] = [];
  const totalBatches = Math.ceil(entries.length / BATCH_SIZE);
  
  // Report initial progress
  onProgress?.(0, entries.length);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startIdx = batchIndex * BATCH_SIZE;
    const endIdx = Math.min(startIdx + BATCH_SIZE, entries.length);
    const batchEntries = entries.slice(startIdx, endIdx);
    
    console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (entries ${startIdx + 1}-${endIdx})...`);
    
    try {
      const translatedBatch = await translateBatch(
        batchEntries,
        apiKey,
        targetLanguage,
        promptStyle,
        model,
        (current, total) => {
          // Calculate overall progress
          const batchProgress = (current / total) * batchEntries.length;
          const overallProgress = startIdx + batchProgress;
          onProgress?.(Math.min(Math.round(overallProgress), entries.length), entries.length);
        }
      );
      
      allTranslatedEntries.push(...translatedBatch);
      
      console.log(`Batch ${batchIndex + 1}/${totalBatches} completed successfully`);
      
      // Add delay between batches to avoid rate limiting
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`Error processing batch ${batchIndex + 1}:`, error);
    
    }
  }

  // Report final progress
  onProgress?.(entries.length, entries.length);
  
  console.log(`All ${allTranslatedEntries.length} entries translated successfully`);
  return allTranslatedEntries;
}

// Main translation function for a single batch (up to 200 entries)
async function translateBatch(
  batchEntries: SrtEntry[],
  apiKey: string,
  targetLanguage: string,
  promptStyle: string,
  modelName: string,
  onProgress?: (current: number, total: number) => void
): Promise<TranslatedSrtEntry[]> {
  // Initialize Gemini model
  const model = new ChatGoogleGenerativeAI({
    apiKey,
    model: modelName,
    temperature: 0.2,
    maxOutputTokens: 20000, // Increased for handling larger translations
  });

  // Create prompt template for bulk translation
  const translationPrompt = PromptTemplate.fromTemplate(`
Bạn là một dịch giả phụ đề chuyên nghiệp, chuyên dịch phụ đề sang ${targetLanguage} cho video.

Nhiệm vụ:
Dịch TOÀN BỘ các đoạn hội thoại phụ đề bên dưới sang ${targetLanguage}.

Yêu cầu về phong cách dịch:
- Câu ngắn, mạnh, giàu kịch tính.
- Giọng văn dứt khoát, tạo cảm giác căng thẳng, tò mò.
- Tối ưu cho AI voice-over: mượt, tự nhiên, không lặp từ.
- Giữ nguyên tên nhân vật, địa danh, vật phẩm.
- Dễ hiểu với ${targetLanguage}, ưu tiên tính lan truyền và thu hút.
- ${promptStyle}
QUY TẮC ĐỊNH DẠNG BẮT BUỘC:
1. Tôi sẽ cung cấp phụ đề theo đúng format:
   [INDEX]: [NỘI DUNG HỘI THOẠI]

2. Bạn PHẢI trả kết quả theo ĐÚNG format đó:
   [INDEX]: [NỘI DUNG ĐÃ DỊCH]

3. KHÔNG được thêm timestamp, ký hiệu (-->) hoặc bất kỳ định dạng SRT nào.
4. KHÔNG được thêm bình luận, giải thích, hoặc văn bản thừa.
5. Giữ nguyên số dòng như đầu vào.
6. Mỗi dòng phải có đúng dạng:
   [INDEX]: [DỊCH]

Ví dụ Input:
1: Hello world
2: This is a test

Ví dụ Output:
1: Xin chào thế giới
2: Đây là một bài kiểm tra

Bây giờ hãy dịch toàn bộ {totalEntries} dòng phụ đề sau:

{allSubtitles}

Kết quả dịch:

`);

  // Report initial progress for this batch
  onProgress?.(0, batchEntries.length);

  // Format all subtitles in this batch
  const allSubtitles = batchEntries
    .map(entry => `${entry.index}: ${entry.text}`)
    .join('\n');

  // Create and execute the translation chain
  const translationChain = translationPrompt
    .pipe(model)
    .pipe(new StringOutputParser());

  console.log(`Sending ${batchEntries.length} subtitles for batch translation...`);
  
  const translatedResult = await translationChain.invoke({
    allSubtitles,
    totalEntries: batchEntries.length,
    targetLanguage,
  });

  // Report completion for this batch
  onProgress?.(batchEntries.length, batchEntries.length);

  // Parse the translated result back into individual entries
  const translatedLines = translatedResult.trim().split('\n');
  
  // Create a map of index to translated text
  const translationMap = new Map<number, string>();
  
  for (const line of translatedLines) {
    // Extract index number and translated text
    const match = line.match(/^(\d+):\s*(.+)$/);
    if (match) {
      const index = parseInt(match[1], 10);
      const translatedText = match[2].trim();
      translationMap.set(index, translatedText);
    }
  }

  // Create translated entries using the map
  const translatedEntries: TranslatedSrtEntry[] = batchEntries.map(entry => {
    const translatedText = translationMap.get(entry.index) || 
                         `[TRANSLATION MISSING] ${entry.text}`;
    
    return {
      ...entry,
      translatedText,
    };
  });

  console.log(`Batch translation completed: ${translatedEntries.length} entries`);
  return translatedEntries;
}