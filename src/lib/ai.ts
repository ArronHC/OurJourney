import type { RecognizeResponse, TicketType } from '@/types';

const TICKET_TYPES: TicketType[] = ['flight', 'train', 'hotel'];
const AI_DATA_FIELDS = [
  'type',
  'departure',
  'arrival',
  'departure_time',
  'arrival_time',
  'carrier',
  'trip_number',
  'seat_class',
  'hotel_name',
  'check_in',
  'check_out',
  'price_per_night',
  'price',
] as const;
const NUMERIC_AI_DATA_FIELDS = ['price_per_night', 'price'] as const;

type AiDataField = (typeof AI_DATA_FIELDS)[number];
type NumericAiDataField = (typeof NUMERIC_AI_DATA_FIELDS)[number];
type TextAiDataField = Exclude<AiDataField, 'type' | NumericAiDataField>;
type NormalizedAiData = NonNullable<RecognizeResponse['data']>;

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

const AUTO_DETECT_PROMPT = `请先判断这张订单截图属于哪一种类型：flight、train、hotel。

然后根据识别出的类型提取信息，并严格返回单个 JSON 对象，不要返回任何额外文字。

所有结果都必须包含：
- type: 只能是 flight、train、hotel 之一

如果 type 是 flight，请额外返回：
- carrier: 航空公司名称
- trip_number: 航班号
- departure: 出发城市
- arrival: 到达城市
- departure_time: 出发时间 (ISO 8601 格式)
- arrival_time: 到达时间 (ISO 8601 格式)
- seat_class: 舱位等级
- price: 价格（纯数字）

如果 type 是 train，请额外返回：
- carrier: 铁路公司
- trip_number: 车次号
- departure: 出发站
- arrival: 到达站
- departure_time: 出发时间 (ISO 8601 格式)
- arrival_time: 到达时间 (ISO 8601 格式)
- seat_class: 座席等级
- price: 价格（纯数字）

如果 type 是 hotel，请额外返回：
- hotel_name: 酒店名称
- check_in: 入住日期 (YYYY-MM-DD)
- check_out: 退房日期 (YYYY-MM-DD)
- price_per_night: 每晚价格（纯数字）
- price: 总价（纯数字）

无法识别的字段设为 null。仅返回 JSON，不要其他文字。`;

export function getPrompt(type: TicketType): string {
  return PROMPTS[type];
}

function isTicketType(value: unknown): value is TicketType {
  return typeof value === 'string' && TICKET_TYPES.includes(value as TicketType);
}

function coerceAiNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = Number(value.replace(/[,\s¥￥]/g, ''));
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
}

function isNumericAiDataField(field: AiDataField): field is NumericAiDataField {
  return (NUMERIC_AI_DATA_FIELDS as readonly AiDataField[]).includes(field);
}

function normalizeAiText(value: unknown) {
  return value == null ? null : String(value).trim() || null;
}

export function normalizeAiData(rawData: unknown, typeOverride?: TicketType): NormalizedAiData {
  if (!rawData || typeof rawData !== 'object') {
    return typeOverride ? { type: typeOverride } : {};
  }

  const source = rawData as Record<string, unknown>;
  const normalized: NormalizedAiData = {};

  for (const field of AI_DATA_FIELDS) {
    if (!(field in source)) {
      continue;
    }

    if (field === 'type') {
      if (isTicketType(source.type)) {
        normalized.type = source.type;
      }
      continue;
    }

    if (isNumericAiDataField(field)) {
      normalized[field] = coerceAiNumber(source[field]);
      continue;
    }

    normalized[field as TextAiDataField] = normalizeAiText(source[field]);
  }

  if (typeOverride) {
    normalized.type = typeOverride;
  }

  return normalized;
}

export function parseAiResponse(
  raw: string,
  typeOverride?: TicketType
): Omit<RecognizeResponse, 'screenshot_path'> {
  try {
    let cleaned = raw.trim();
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim();
    }

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    const data = JSON.parse(cleaned);
    if (!data || typeof data !== 'object') {
      return {
        success: false,
        error: 'recognition_failed',
        message: 'AI 未能识别此截图内容',
      };
    }

    const detectedType = typeOverride ?? (isTicketType(data.type) ? data.type : undefined);
    if (!detectedType) {
      return {
        success: false,
        error: 'recognition_failed',
        message: 'AI 未能识别此截图类型',
      };
    }

    const normalizedData = normalizeAiData(data, detectedType);
    const values = Object.entries(normalizedData)
      .filter(([key]) => key !== 'type')
      .map(([, value]) => value);
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
      detected_type: detectedType,
      data: normalizedData,
    };
  } catch {
    return {
      success: false,
      error: 'recognition_failed',
      message: 'AI 未能识别此截图内容',
    };
  }
}

function getAiConfig() {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || 'https://ai.qaq.al/v1';
  const model = process.env.AI_MODEL || 'gpt-4o';
  const responseFormat = process.env.AI_RESPONSE_FORMAT || 'json_object';

  return { apiKey, baseUrl, model, responseFormat };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  void timeout;
  return controller.signal;
}

function extractMessageContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return '';
      }

      if ('type' in item && item.type === 'text' && 'text' in item && typeof item.text === 'string') {
        return item.text;
      }

      return '';
    })
    .join('\n')
    .trim();
}

export async function recognizeScreenshot(
  imageBase64: string,
  mimeType: string,
  type?: TicketType
): Promise<Omit<RecognizeResponse, 'screenshot_path'>> {
  const { apiKey, baseUrl, model, responseFormat } = getAiConfig();
  if (!apiKey) {
    return {
      success: false,
      error: 'service_unavailable',
      message: 'AI 识别服务未配置',
    };
  }

  try {
    const isDashScope = baseUrl.includes('dashscope.aliyuncs.com');
    const prompt = type ? getPrompt(type) : AUTO_DETECT_PROMPT;
    const responseFormatBody =
      responseFormat === 'none' || responseFormat === 'disabled'
        ? {}
        : {
            response_format: {
              type: responseFormat,
            },
          };
    const requestBody = {
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
      ...responseFormatBody,
      ...(isDashScope
        ? {
            extra_body: {
              enable_thinking: false,
            },
          }
        : {}),
    };

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        signal: createTimeoutSignal(90000),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 429 || response.status === 503) {
        const bodyText = await response.text();
        console.error('AI recognition transient error', {
          attempt,
          status: response.status,
          body: bodyText.slice(0, 1000),
        });

        if (attempt < 3) {
          await sleep(attempt * 500);
          continue;
        }

        return {
          success: false,
          error: 'service_unavailable',
          message: '识别服务暂时不可用，请稍后重试',
        };
      }

      if (response.status === 400) {
        const bodyText = await response.text();
        console.error('AI recognition bad request', {
          status: response.status,
          body: bodyText.slice(0, 1000),
        });
        return {
          success: false,
          error: 'recognition_failed',
          message: '图片格式或内容不符合识别要求，请更换清晰截图后重试',
        };
      }

      if (!response.ok) {
        const bodyText = await response.text();
        console.error('AI recognition request failed', {
          status: response.status,
          body: bodyText.slice(0, 1000),
        });
        return {
          success: false,
          error: 'service_unavailable',
          message: 'AI 识别服务暂时不可用',
        };
      }

      const payload = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: unknown;
          };
        }>;
      };
      const text = extractMessageContent(payload.choices?.[0]?.message?.content);
      const parsed = parseAiResponse(text, type);
      if (!parsed.success) {
        console.error('AI recognition parse failed', {
          model,
          preview: text.slice(0, 1000),
        });
      }
      return parsed;
    }

    return {
      success: false,
      error: 'service_unavailable',
      message: '识别服务暂时不可用，请稍后重试',
    };
  } catch (error) {
    console.error('AI recognition fetch failed', {
      model,
      message: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'service_unavailable',
      message: 'AI 识别服务暂时不可用',
    };
  }
}
