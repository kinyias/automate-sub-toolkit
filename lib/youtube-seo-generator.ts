import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';

/**
 * YouTube SEO Content Generator using LangChain
 * Analyzes video scripts and generates SEO-optimized content
 */

export interface YouTubeSEOResult {
  main_topic: string;
  search_intent: string;
  target_audience: string;
  titles: string[];
  description: string;
  tags_25: string[];
  main_tags_10: string[];
  thumbnail_prompt: string;
}

/**
 * Token limits for different Gemini models (approximate input token limits)
 * These are conservative estimates to account for prompt overhead
 */
export const MODEL_TOKEN_LIMITS: Record<string, number> = {
  'gemini-2.5-flash': 800000,
  'gemini-2.0-flash': 800000,
  'gemini-2.5-pro': 800000,
  'gemini-2.0-pro': 800000,
  'gemini-flash-latest': 800000,
  'gemini-pro-latest': 800000,
  'gemini-2.0-flash-exp': 800000,
};

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Check if script exceeds model token limit
 */
export function isScriptWithinLimit(script: string, model: string): boolean {
  const tokenCount = estimateTokenCount(script);
  const limit = MODEL_TOKEN_LIMITS[model] || 800000;
  // Reserve 2000 tokens for prompt and output
  return tokenCount < (limit - 2000);
}

/**
 * Get token limit for a specific model
 */
export function getModelTokenLimit(model: string): number {
  return MODEL_TOKEN_LIMITS[model] || 800000;
}

/**
 * Generate YouTube SEO content from a video script
 * @param script - The full video script
 * @param apiKey - Google AI API key
 * @param language - Target language (vietnamese or english)
 * @param model - Gemini model to use
 * @returns Promise resolving to SEO content
 */
export async function generateYouTubeSEO(
  script: string,
  apiKey: string,
  language: string = 'vietnamese',
  model: string = 'gemini-2.5-flash'
): Promise<YouTubeSEOResult> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API key is required');
  }

  if (!script || script.trim() === '') {
    throw new Error('Script is required');
  }

  // Validate token limit
  if (!isScriptWithinLimit(script, model)) {
    const tokenCount = estimateTokenCount(script);
    const limit = getModelTokenLimit(model);
    throw new Error(
      `Script is too long (${tokenCount} tokens). Maximum allowed: ${limit - 2000} tokens for ${model}`
    );
  }

  // Initialize Gemini model
  const llm = new ChatGoogleGenerativeAI({
    apiKey,
    model: model,
    temperature: 0.7,
    maxOutputTokens: 8000,
  });

  // Create prompt template based on language
  const promptTemplate = language === 'vietnamese' 
    ? createVietnamesePrompt() 
    : createEnglishPrompt();

  // Create the chain with JSON output parser
  const parser = new JsonOutputParser<YouTubeSEOResult>();
  
  const chain = promptTemplate
    .pipe(llm)
    .pipe(parser);

  try {
    console.log('Generating YouTube SEO content...');
    
    const result = await chain.invoke({
      script: script.trim(),
    });

    // Validate the result structure
    validateSEOResult(result);

    console.log('YouTube SEO content generated successfully');
    return result as YouTubeSEOResult;
    
  } catch (error) {
    console.error('Error generating YouTube SEO content:', error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to generate SEO content: ${error.message}`);
    }
    
    throw new Error('Failed to generate SEO content');
  }
}

/**
 * Create Vietnamese prompt template
 */
function createVietnamesePrompt(): PromptTemplate {
  return PromptTemplate.fromTemplate(`
Bạn là một chuyên gia SEO YouTube chuyên nghiệp với nhiều năm kinh nghiệm tối ưu hóa nội dung video.

NHIỆM VỤ:
Phân tích kịch bản video dưới đây và tạo nội dung SEO tối ưu cho YouTube.

YÊU CẦU PHÂN TÍCH:
1. Xác định chủ đề chính (main_topic) của video
2. Phân tích ý định tìm kiếm (search_intent) của người xem tiềm năng
3. Xác định đối tượng mục tiêu (target_audience)

YÊU CẦU TẠO NỘI DUNG:
1. Tạo 5 tiêu đề video (titles) tối ưu SEO:
   - Độ dài 50-70 ký tự
   - Hấp dẫn, thu hút click
   - Chứa từ khóa chính
   - Tạo cảm giác tò mò hoặc giá trị rõ ràng
   - Phù hợp với thuật toán YouTube

2. Tạo 1 mô tả video (description) chi tiết:
   - Độ dài 200-300 từ
   - Đoạn đầu (2-3 câu) hấp dẫn nhất
   - Chứa từ khóa tự nhiên
   - Có cấu trúc rõ ràng
   - Kêu gọi hành động (CTA)
   - Thêm hashtags phù hợp ở cuối

3. Tạo 25 thẻ YouTube (tags_25):
   - Bao gồm từ khóa chính, phụ, long-tail
   - Từ khóa liên quan đến nội dung
   - Cân bằng giữa cạnh tranh cao và thấp
   - Phù hợp với thuật toán tìm kiếm YouTube

4. Chọn 10 thẻ chính quan trọng nhất (main_tags_10):
   - Từ khóa có khả năng ranking cao nhất
   - Liên quan trực tiếp đến nội dung
   - Cân bằng volume tìm kiếm và cạnh tranh

5. Tạo 1 prompt AI cho thumbnail (thumbnail_prompt):
   - Mô tả hình ảnh thu hút, chuyên nghiệp
   - Phù hợp với nội dung video
   - Tối ưu cho tỷ lệ click (CTR)
   - Viết bằng tiếng Anh để dùng cho AI image generator

QUY TẮC QUAN TRỌNG:
- PHẢI dựa HOÀN TOÀN vào nội dung kịch bản
- KHÔNG được tự sáng tác chủ đề không liên quan
- Tối ưu cho thuật toán tìm kiếm YouTube
- Tối ưu cho tỷ lệ click (CTR) và engagement

ĐỊNH DẠNG ĐẦU RA:
Trả về KẾT QUẢ dưới dạng JSON hợp lệ với cấu trúc sau (KHÔNG thêm markdown, chỉ JSON thuần):

{{
  "main_topic": "chủ đề chính của video",
  "search_intent": "ý định tìm kiếm của người xem",
  "target_audience": "đối tượng mục tiêu",
  "titles": ["tiêu đề 1", "tiêu đề 2", "tiêu đề 3", "tiêu đề 4", "tiêu đề 5"],
  "description": "mô tả video chi tiết với từ khóa và CTA",
  "tags_25": ["tag1", "tag2", ..., "tag25"],
  "main_tags_10": ["main_tag1", "main_tag2", ..., "main_tag10"],
  "thumbnail_prompt": "detailed English prompt for AI image generation"
}}

KỊCH BẢN VIDEO:
{script}

Hãy phân tích và tạo nội dung SEO tối ưu ngay bây giờ:
`);
}

/**
 * Create English prompt template
 */
function createEnglishPrompt(): PromptTemplate {
  return PromptTemplate.fromTemplate(`
You are a professional YouTube SEO expert with years of experience optimizing video content.

TASK:
Analyze the video script below and create SEO-optimized content for YouTube.

ANALYSIS REQUIREMENTS:
1. Identify the main topic (main_topic) of the video
2. Analyze the search intent (search_intent) of potential viewers
3. Identify the target audience (target_audience)

CONTENT CREATION REQUIREMENTS:
1. Create 5 SEO-optimized video titles (titles):
   - Length: 50-70 characters
   - Engaging and click-worthy
   - Contains main keywords
   - Creates curiosity or clear value
   - Optimized for YouTube algorithm

2. Create 1 detailed video description (description):
   - Length: 200-300 words
   - First 2-3 sentences most engaging
   - Natural keyword placement
   - Clear structure
   - Call-to-action (CTA)
   - Relevant hashtags at the end

3. Create 25 YouTube tags (tags_25):
   - Include primary, secondary, and long-tail keywords
   - Content-related keywords
   - Balance between high and low competition
   - Optimized for YouTube search algorithm

4. Select 10 most important main tags (main_tags_10):
   - Keywords with highest ranking potential
   - Directly related to content
   - Balance search volume and competition

5. Create 1 AI prompt for thumbnail (thumbnail_prompt):
   - Describe attractive, professional image
   - Matches video content
   - Optimized for click-through rate (CTR)
   - Written in English for AI image generators

IMPORTANT RULES:
- MUST be based ENTIRELY on the script content
- DO NOT invent unrelated topics
- Optimize for YouTube search algorithm
- Optimize for CTR and engagement

OUTPUT FORMAT:
Return RESULT as valid JSON with this structure (NO markdown, pure JSON only):

{{
  "main_topic": "main topic of the video",
  "search_intent": "viewer's search intent",
  "target_audience": "target audience",
  "titles": ["title 1", "title 2", "title 3", "title 4", "title 5"],
  "description": "detailed video description with keywords and CTA",
  "tags_25": ["tag1", "tag2", ..., "tag25"],
  "main_tags_10": ["main_tag1", "main_tag2", ..., "main_tag10"],
  "thumbnail_prompt": "detailed English prompt for AI image generation"
}}

VIDEO SCRIPT:
{script}

Analyze and create optimized SEO content now:
`);
}

/**
 * Validate the SEO result structure
 */
function validateSEOResult(result: any): void {
  const requiredFields = [
    'main_topic',
    'search_intent',
    'target_audience',
    'titles',
    'description',
    'tags_25',
    'main_tags_10',
    'thumbnail_prompt'
  ];

  for (const field of requiredFields) {
    if (!(field in result)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate arrays
  if (!Array.isArray(result.titles) || result.titles.length !== 5) {
    throw new Error('titles must be an array of 5 items');
  }

  if (!Array.isArray(result.tags_25) || result.tags_25.length !== 25) {
    throw new Error('tags_25 must be an array of 25 items');
  }

  if (!Array.isArray(result.main_tags_10) || result.main_tags_10.length !== 10) {
    throw new Error('main_tags_10 must be an array of 10 items');
  }

  // Validate strings
  const stringFields = ['main_topic', 'search_intent', 'target_audience', 'description', 'thumbnail_prompt'];
  for (const field of stringFields) {
    if (typeof result[field] !== 'string' || result[field].trim() === '') {
      throw new Error(`${field} must be a non-empty string`);
    }
  }
}
