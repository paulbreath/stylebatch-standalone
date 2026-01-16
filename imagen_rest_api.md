# Gemini Imagen REST API

## 端点
```
POST https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict
```

## 请求格式
```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict" \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instances": [{
      "prompt": "Robot holding a red skateboard"
    }],
    "parameters": {
      "sampleCount": 4
    }
  }'
```

## 关键点
1. 使用 `:predict` 端点，不是 `:generateContent`
2. 模型名称：`imagen-4.0-generate-001`（最新版本）
3. API Key 通过 `x-goog-api-key` header 传递
4. 请求体使用 `instances` 和 `parameters` 结构
5. `sampleCount` 参数控制生成图片数量（1-4）
