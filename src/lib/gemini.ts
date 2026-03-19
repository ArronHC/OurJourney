import { GoogleGenerativeAI } from '@google/generative-ai';
import type { RecognizeResponse, TicketType } from '@/types';

const PROMPTS: Record<TicketType, string> = {
  flight: `请分析这张机票/航班订单截图，提取以下信息并以 JSON 格式返回：
- carrier: 航空公司名称
- trip_number: 航班号
- departure: 出发城市
- arrival: 到达城市
- departure_time: 出发时间 (ISO 8601 格式)
- arrival_time: 到达时间 (ISO 8601 格式)
- seat_class: 舱位等级
- price: 价格（纯数字）
如果某个字段无法识别，设为 null。仅返回 JSON，不要其他文字。`,

  train: `请分析这张火车票/高铁订单截图，提取以下信息并以 JSON 格式返回：
- carrier: 铁路公司
- trip_number: 车次号
- departure: 出发站
- arrival: 到达站
- departure_time: 出发时间 (ISO 8601 格式)
- arrival_time: 到达时间 (ISO 8601 格式)
- seat_class: 座席等级
- price: 价格（纯数字）
如果某个字段无法识别，设为 null。仅返回 JSON，不要其他文字。`,

  hotel: `请分析这张酒店订单截图，提取以下信息并以 JSON 格式返回：
- hotel_name: 酒店名称
- check_in: 入住日期 (YYYY-MM-DD)
- check_out: 退房日期 (YYYY-MM-DD)
- price_per_night: 每晚价格（纯数字）
- price: 总价（纯数字）
如果某个字段无法识别，设为 null。仅返回 JSON，不要其他文字。`,
};

export function getPrompt(type: TicketType): string {
  return PROMPTS[type];
}

export function parseGeminiResponse(
  raw: string
): Omit<RecognizeResponse, 'screenshot_path'> {
  try {
    let cleaned = raw.trim();
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim();
    }

    const data = JSON.parse(cleaned);
    if (!data || typeof data !== 'object') {
      return {
        success: false,
        error: 'recognition_failed',
        message: 'AI 未能识别此截图内容',
      };
    }

    const values = Object.values(data);
    const hasData = values.some((value) => value !== null && value !== undefined);
    if (!hasData) {
      return {
        success: false,
        error: 'recognition_failed',
        message: 'AI 未能识别此截图内容',
      };
    }

    const hasNulls = values.some((value) => value === null || value === undefined);

    return {
      success: true,
      partial: hasNulls || undefined,
      data,
    };
  } catch {
    return {
      success: false,
      error: 'recognition_failed',
      message: 'AI 未能识别此截图内容',
    };
  }
}

export async function recognizeScreenshot(
  imageBase64: string,
  mimeType: string,
  type: TicketType
): Promise<Omit<RecognizeResponse, 'screenshot_path'>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'service_unavailable',
      message: 'AI 识别服务未配置',
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const result = await model.generateContent([
      { text: getPrompt(type) },
      { inlineData: { mimeType, data: imageBase64 } },
    ]);

    const text = result.response.text();
    return parseGeminiResponse(text);
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      error.status === 429
    ) {
      return {
        success: false,
        error: 'service_unavailable',
        message: '识别服务暂时不可用，请稍后重试',
      };
    }

    return {
      success: false,
      error: 'service_unavailable',
      message: 'AI 识别服务暂时不可用',
    };
  }
}
