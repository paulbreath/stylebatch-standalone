# Gemini Imagen API 错误日志

## 错误信息
```
[05:06:20] at convertImageStyle (/home/ubuntu/stylebatch-web/server/gemini.ts:273:11)
[05:06:20] at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[05:06:20] at async processConversion (/home/ubuntu/stylebatch-web/server/routers/conversion.ts:140:20)
```

## 分析
错误发生在 gemini.ts 的第 273 行，convertImageStyle 函数中。

需要检查：
1. Gemini Imagen API 的调用是否正确
2. API 响应格式是否符合预期
3. 错误处理逻辑是否完善
