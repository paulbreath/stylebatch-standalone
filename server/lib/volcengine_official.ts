/**
 * 火山引擎 AIGC 图像风格化 API
 * 使用官方签名算法
 * 文档: https://www.volcengine.com/docs/86081/1660199
 */

import crypto from 'crypto';
import { env } from '../_core/env';

const ACCESS_KEY = env.volcengineAccessKey;
const SECRET_KEY = env.volcengineSecretKey;
const SERVICE = 'cv';
const REGION = 'cn-north-1';
const HOST = 'visual.volcengineapi.com';

// 官方签名算法（从 GitHub 示例中提取）
function hmac(secret: string | Buffer, s: string): Buffer {
  return crypto.createHmac('sha256', secret).update(s, 'utf8').digest();
}

function hash(s: string): string {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

function uriEscape(str: string): string {
  try {
    return encodeURIComponent(str)
      .replace(/[^A-Za-z0-9_.~\-%]+/g, escape)
      .replace(/[*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
  } catch (e) {
    return '';
  }
}

function queryParamsToString(params: Record<string, any>): string {
  return Object.keys(params)
    .sort()
    .map((key) => {
      const val = params[key];
      if (typeof val === 'undefined' || val === null) return undefined;
      const escapedKey = uriEscape(key);
      if (!escapedKey) return undefined;
      return `${escapedKey}=${uriEscape(val)}`;
    })
    .filter((v) => v)
    .join('&');
}

const HEADER_KEYS_TO_IGNORE = new Set([
  "authorization", "content-type", "content-length",
  "user-agent", "presigned-expires", "expect",
]);

function getSignHeaders(originHeaders: Record<string, string>, needSignHeaders: string[] = []): [string, string] {
  function trimHeaderValue(header: any): string {
    return header.toString?.().trim().replace(/\s+/g, ' ') ?? '';
  }
  
  let h = Object.keys(originHeaders);
  if (Array.isArray(needSignHeaders) && needSignHeaders.length > 0) {
    const needSignSet = new Set([...needSignHeaders, 'x-date', 'host'].map((k) => k.toLowerCase()));
    h = h.filter((k) => needSignSet.has(k.toLowerCase()));
  }
  h = h.filter((k) => !HEADER_KEYS_TO_IGNORE.has(k.toLowerCase()));
  
  const signedHeaderKeys = h.slice().map((k) => k.toLowerCase()).sort().join(';');
  const canonicalHeaders = h
    .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))
    .map((k) => `${k.toLowerCase()}:${trimHeaderValue(originHeaders[k])}`)
    .join('\n');
  
  return [signedHeaderKeys, canonicalHeaders];
}

interface SignParams {
  headers: Record<string, string>;
  query: Record<string, any>;
  region: string;
  serviceName: string;
  method: string;
  pathName: string;
  accessKeyId: string;
  secretAccessKey: string;
  needSignHeaderKeys?: string[];
  bodySha: string;
}

function sign(params: SignParams): string {
  const {
    headers = {}, query = {}, region = '', serviceName = '',
    method = '', pathName = '/', accessKeyId = '',
    secretAccessKey = '', needSignHeaderKeys = [], bodySha,
  } = params;
  
  const datetime = headers["X-Date"];
  const date = datetime.substring(0, 8);
  const [signedHeaders, canonicalHeaders] = getSignHeaders(headers, needSignHeaderKeys);
  
  const canonicalRequest = [
    method.toUpperCase(), pathName, queryParamsToString(query) || '',
    `${canonicalHeaders}\n`, signedHeaders, bodySha || hash(''),
  ].join('\n');
  
  const credentialScope = [date, region, serviceName, "request"].join('/');
  const stringToSign = ["HMAC-SHA256", datetime, credentialScope, hash(canonicalRequest)].join('\n');
  
  const kDate = hmac(secretAccessKey, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, serviceName);
  const kSigning = hmac(kService, "request");
  const signature = hmac(kSigning, stringToSign).toString('hex');
  
  return [
    "HMAC-SHA256",
    `Credential=${accessKeyId}/${credentialScope},`,
    `SignedHeaders=${signedHeaders},`,
    `Signature=${signature}`,
  ].join(' ');
}

function getDateTimeNow(): string {
  return new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function getBodySha(body: string): string {
  return crypto.createHash('sha256').update(body, 'utf8').digest('hex');
}

// 风格映射表
export const VOLCENGINE_STYLE_MAP: Record<string, string> = {
  // 已测试成功的风格
  '3d': 'img2img_disney_3d_style_usage',
  'anime': 'img2img_ghibli_style_usage',
  'cartoon': 'img2img_cartoon_style_usage',
  'watercolor': 'img2img_water_paint_style_usage',
  'ink': 'img2img_water_ink_style_usage',
  'clay': 'img2img_clay_style_usage',
  
  // 其他风格（需要测试）
  'realistic': 'img2img_real_mix_style_usage',
  'angel': 'img2img_makoto_style_usage',
  'princess': 'img2img_rev_animated_style_usage',
  'fantasy': 'img2img_blueline_style_usage',
  'comic': 'img2img_comic_style_usage',

};

export interface VolcengineConvertOptions {
  imageBase64: string;
  style: string;
}

export interface VolcengineConvertResult {
  success: boolean;
  imageBase64?: string;
  error?: string;
  timeElapsed?: string;
  cost: number; // 成本（人民币）
}

/**
 * 使用火山引擎 API 进行图像风格转换
 */
export async function convertImageWithVolcengine(
  options: VolcengineConvertOptions
): Promise<VolcengineConvertResult> {
  const { imageBase64, style } = options;
  
  // 获取风格对应的 req_key
  const reqKey = VOLCENGINE_STYLE_MAP[style];
  if (!reqKey) {
    return {
      success: false,
      error: `Unsupported style: ${style}`,
      cost: 0,
    };
  }
  
  try {
    // 构建请求体
    const requestBodyObj = {
      req_key: reqKey,
      binary_data_base64: [imageBase64],
      return_url: false, // 返回 base64，不返回 URL
    };
    const requestBody = JSON.stringify(requestBodyObj);
    
    // 生成签名
    const datetime = getDateTimeNow();
    const signParams: SignParams = {
      headers: {
        "X-Date": datetime,
        "Host": HOST,
        "Content-Type": "application/json",
      },
      method: 'POST',
      query: { Action: 'CVProcess', Version: '2022-08-31' },
      pathName: '/',
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
      serviceName: SERVICE,
      region: REGION,
      bodySha: getBodySha(requestBody),
    };
    
    const authorization = sign(signParams);
    const url = `https://${HOST}/?${queryParamsToString(signParams.query)}`;
    
    // 发送请求
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...signParams.headers,
        'Authorization': authorization,
      },
      body: requestBody,
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${responseText}`,
        cost: 0,
      };
    }
    
    const data = JSON.parse(responseText);
    
    // 检查响应
    if (data.code === 10000 && data.data && data.data.binary_data_base64 && data.data.binary_data_base64[0]) {
      return {
        success: true,
        imageBase64: data.data.binary_data_base64[0],
        timeElapsed: data.time_elapsed,
        cost: 0.06, // ¥0.06/次
      };
    } else {
      return {
        success: false,
        error: data.message || 'Unknown error',
        cost: 0,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
      cost: 0,
    };
  }
}

/**
 * 检查火山引擎 API 是否可用
 */
export function isVolcengineAvailable(): boolean {
  return Boolean(ACCESS_KEY && SECRET_KEY);
}

/**
 * 获取支持的风格列表
 */
export function getVolcengineSupportedStyles(): string[] {
  return Object.keys(VOLCENGINE_STYLE_MAP);
}
