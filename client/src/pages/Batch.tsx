import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Sparkles, Upload, Loader2, Download, X, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

interface UploadedImage {
  file: File;
  url: string;
  key: string;
  previewUrl: string;
  status: "pending" | "uploading" | "uploaded" | "error";
}

export default function Batch() {
  const { isAuthenticated } = useAuth();

  const [styleType, setStyleType] = useState<"custom" | "reference">("custom");
  const [apiProvider, setApiProvider] = useState<"seedream" | "nanoBanana">("seedream");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customStyle, setCustomStyle] = useState<string>("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string>("");
  const [referencePrompt, setReferencePrompt] = useState<string>("");
  const [strength, setStrength] = useState<number>(0.75);
  const [preserveTransparency, setPreserveTransparency] = useState<boolean>(false);
  const [analyzeFirst, setAnalyzeFirst] = useState<boolean>(false);

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [batchId, setBatchId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // 获取预设风格
  const { data: stylesByCategory } = trpc.styles.getByCategory.useQuery();

  // 上传 mutation
  const uploadMutation = trpc.upload.uploadImage.useMutation();

  // 批量转换 mutation
  const createBatchMutation = trpc.batch.createBatch.useMutation({
    onSuccess: (data) => {
      setBatchId(data.batchId);
      toast.success("批量转换任务已创建，正在处理中...");
    },
    onError: (error) => {
      setIsConverting(false);
      toast.error(`批量转换失败: ${error.message}`);
    },
  });

  // 查询批量任务状态
  const { data: batchStatus } = trpc.batch.getBatchStatus.useQuery(
    { batchId: batchId! },
    {
      enabled: batchId !== null,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) return 2000;
        if (data.batch.status === "processing") return 2000;
        return false;
      },
    }
  );

  // 监听批量任务状态变化
  useEffect(() => {
    if (batchStatus) {
      if (batchStatus.batch.status === "completed") {
        setIsConverting(false);
        toast.success("批量转换完成！");
      } else if (batchStatus.batch.status === "failed") {
        setIsConverting(false);
        toast.error("批量转换失败");
      }
    }
  }, [batchStatus]);

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);

    const newImages: UploadedImage[] = files.map((file) => ({
      file,
      url: "",
      key: "",
      previewUrl: URL.createObjectURL(file),
      status: "pending" as const,
    }));

    setUploadedImages((prev) => [...prev, ...newImages]);

    // 逐个上传图片
    for (let i = 0; i < newImages.length; i++) {
      const image = newImages[i];
      const index = uploadedImages.length + i;

      try {
        // 更新状态为上传中
        setUploadedImages((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], status: "uploading" };
          return updated;
        });

        // 上传图片
        const result = await uploadMutation.mutateAsync({
          fileName: image.file.name,
          mimeType: image.file.type,
          base64Data: await fileToBase64(image.file),
        });

        // 更新状态为已上传
        setUploadedImages((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            url: result.url,
            key: result.key,
            status: "uploaded",
          };
          return updated;
        });
      } catch (error) {
        console.error("Upload failed:", error);
        setUploadedImages((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], status: "error" };
          return updated;
        });
        toast.error(`上传失败: ${image.file.name}`);
      }
    }

    setIsUploading(false);
  };

  // 处理参考图选择
  const handleReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceFile(file);
      const url = URL.createObjectURL(file);
      setReferencePreviewUrl(url);
    }
  };

  // 移除图片
  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 开始批量转换
  const handleBatchConvert = async () => {
    if (uploadedImages.length === 0) {
      toast.error("请先上传图片");
      return;
    }

    const uploadedOnly = uploadedImages.filter((img) => img.status === "uploaded");
    if (uploadedOnly.length === 0) {
      toast.error("没有成功上传的图片");
      return;
    }

    if (styleType === "custom" && !customStyle.trim()) {
      toast.error("请输入自定义风格描述");
      return;
    }

    if (styleType === "reference" && !referenceFile) {
      toast.error("请上传参考图");
      return;
    }

    setIsConverting(true);

    try {
      // 如果是参考图模式，先上传参考图
      let referenceImageUrl: string | undefined;
      let referenceImageKey: string | undefined;

      if (styleType === "reference" && referenceFile) {
        const referenceResult = await uploadMutation.mutateAsync({
          fileName: referenceFile.name,
          mimeType: referenceFile.type,
          base64Data: await fileToBase64(referenceFile),
        });
        referenceImageUrl = referenceResult.url;
        referenceImageKey = referenceResult.key;
      }

      // 创建批量转换任务
      await createBatchMutation.mutateAsync({
        images: uploadedOnly.map((img) => ({
          url: img.url,
          key: img.key,
          fileName: img.file.name,
        })),
        styleType,
        apiProvider,
        styleDescription: styleType === "custom" ? customStyle : undefined,
        referenceImageUrl,
        referenceImageKey,
        referencePrompt: styleType === "reference" ? referencePrompt : undefined,
        strength,
        preserveTransparency,
        analyzeFirst,
      });
    } catch (error) {
      console.error("Batch conversion failed:", error);
      setIsConverting(false);
    }
  };

  // 下载所有结果为 ZIP
  const handleDownloadAll = async () => {
    if (!batchStatus?.tasks) return;

    const completedTasks = batchStatus.tasks.filter((task) => task.status === "completed" && task.resultImageUrl);
    if (completedTasks.length === 0) {
      toast.error("没有可下载的结果");
      return;
    }

    toast.info(`正在打包 ${completedTasks.length} 张图片...`);

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // 下载所有图片并添加到 ZIP
      await Promise.all(
        completedTasks.map(async (task) => {
          try {
            const response = await fetch(task.resultImageUrl!);
            const blob = await response.blob();
            // 使用原始文件名，添加 _converted 后缀
            const fileName = task.originalFileName.replace(/(\.[^.]+)$/, "_converted$1");
            zip.file(fileName, blob);
          } catch (error) {
            console.error(`Failed to download ${task.originalFileName}:`, error);
          }
        })
      );

      // 生成 ZIP 文件
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `batch_converted_${new Date().getTime()}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`成功打包 ${completedTasks.length} 张图片`);
    } catch (error) {
      console.error("Failed to create ZIP:", error);
      toast.error("打包失败，请重试");
    }
  };

  // 重置
  const handleReset = () => {
    setUploadedImages([]);
    setBatchId(null);
    setIsConverting(false);
    setSelectedPreset("");
    setCustomStyle("");
    setReferenceFile(null);
    setReferencePreviewUrl("");
    setReferencePrompt("");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>需要登录</CardTitle>
            <CardDescription>请先登录以使用批量转换功能</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>登录</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-white">批量转换</h1>
        </div>

        {!batchId ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左侧：图片上传 */}
            <Card>
              <CardHeader>
                <CardTitle>上传图片</CardTitle>
                <CardDescription>选择多张图片进行批量转换</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isConverting}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        上传中...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        选择图片
                      </>
                    )}
                  </Button>
                </div>

                {/* 图片列表 */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {uploadedImages.map((image, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50"
                      >
                        <img
                          src={image.previewUrl}
                          alt={image.file.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{image.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(image.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {image.status === "uploading" && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          )}
                          {image.status === "uploaded" && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          {image.status === "error" && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeImage(index)}
                            disabled={isUploading || isConverting}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  已上传: {uploadedImages.filter((img) => img.status === "uploaded").length} /{" "}
                  {uploadedImages.length}
                </div>
              </CardContent>
            </Card>

            {/* 右侧：风格设置 */}
            <Card>
              <CardHeader>
                <CardTitle>风格设置</CardTitle>
                <CardDescription>选择要应用的风格</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 模型选择 */}
                <div className="space-y-2">
                  <Label>AI 模型</Label>
                  <Select value={apiProvider} onValueChange={(v) => setApiProvider(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seedream">
                        <div className="flex flex-col">
                          <span className="font-medium">Seedream 4.5</span>
                          <span className="text-xs text-muted-foreground">¥0.35/张 · 60秒 · 4K高清</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="nanoBanana">
                        <div className="flex flex-col">
                          <span className="font-medium">Nano Banana</span>
                          <span className="text-xs text-muted-foreground">¥0.4/张 · 10秒 · Gemini 2.5</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    批量转换仅支持自定义描述和参考图模式
                  </p>
                </div>

                {/* 风格类型选择 */}
                <Tabs value={styleType} onValueChange={(v) => setStyleType(v as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="custom">自定义描述</TabsTrigger>
                    <TabsTrigger value="reference">参考图</TabsTrigger>
                  </TabsList>

                  <TabsContent value="custom" className="space-y-4">
                    <div>
                      <Label>风格描述</Label>
                      <Textarea
                        placeholder="描述你想要的艺术风格..."
                        value={customStyle}
                        onChange={(e) => setCustomStyle(e.target.value)}
                        rows={6}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="reference" className="space-y-4">
                    <div>
                      <Label>参考图</Label>
                      <input
                        ref={referenceInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleReferenceFileChange}
                      />
                      <Button
                        onClick={() => referenceInputRef.current?.click()}
                        variant="outline"
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {referenceFile ? "更换参考图" : "上传参考图"}
                      </Button>
                      {referencePreviewUrl && (
                        <img
                          src={referencePreviewUrl}
                          alt="参考图"
                          className="mt-4 w-full h-48 object-cover rounded-lg"
                        />
                      )}
                    </div>
                    <div>
                      <Label>额外提示词（可选）</Label>
                      <Textarea
                        placeholder="添加额外的风格描述..."
                        value={referencePrompt}
                        onChange={(e) => setReferencePrompt(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* 转换强度 */}
                <div>
                  <Label>转换强度: {(strength * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[strength]}
                    onValueChange={(v) => setStrength(v[0])}
                    min={0}
                    max={1}
                    step={0.05}
                    className="mt-2"
                  />
                </div>

                {/* 背景透明开关 */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>保持背景透明</Label>
                    <p className="text-sm text-muted-foreground">适用于 PNG 图片或需要透明背景的场景</p>
                  </div>
                  <Switch
                    checked={preserveTransparency}
                    onCheckedChange={setPreserveTransparency}
                  />
                </div>

                {/* 分析原图开关 */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>先分析图片</Label>
                    <p className="text-sm text-muted-foreground">更准确但更慢</p>
                  </div>
                  <Switch
                    checked={analyzeFirst}
                    onCheckedChange={setAnalyzeFirst}
                  />
                </div>

                {/* 开始转换按钮 */}
                <Button
                  onClick={handleBatchConvert}
                  disabled={
                    isConverting ||
                    isUploading ||
                    uploadedImages.filter((img) => img.status === "uploaded").length === 0
                  }
                  className="w-full"
                  size="lg"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      转换中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      开始批量转换
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          // 转换进度显示
          <Card>
            <CardHeader>
              <CardTitle>批量转换进度</CardTitle>
              <CardDescription>
                {batchStatus?.batch.name || "批量转换任务"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 总体进度 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>总体进度</span>
                  <span>
                    {batchStatus?.stats.completed || 0} / {batchStatus?.stats.total || 0}
                  </span>
                </div>
                <Progress
                  value={
                    ((batchStatus?.stats.completed || 0) / (batchStatus?.stats.total || 1)) * 100
                  }
                />
              </div>

              {/* 统计信息 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {batchStatus?.stats.completed || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">已完成</div>
                </div>
                <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {batchStatus?.stats.processing || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">处理中</div>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {batchStatus?.stats.failed || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">失败</div>
                </div>
              </div>

              {/* 任务列表 */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {batchStatus?.tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${
                      task.status === "completed" ? "bg-green-50 border-green-200" :
                      task.status === "processing" ? "bg-blue-50 border-blue-200 animate-pulse" :
                      task.status === "failed" ? "bg-red-50 border-red-200" :
                      "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <img
                      src={task.originalImageUrl}
                      alt={task.originalFileName}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.originalFileName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {task.status === "completed" && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            已完成
                          </span>
                        )}
                        {task.status === "processing" && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            处理中...
                          </span>
                        )}
                        {task.status === "pending" && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                            <Clock className="h-3 w-3" />
                            等待中...
                          </span>
                        )}
                        {task.status === "failed" && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600">
                            <XCircle className="h-3 w-3" />
                            失败: {task.errorMessage}
                          </span>
                        )}
                      </div>
                    </div>
                    {task.status === "completed" && task.resultImageUrl && (
                      <div className="flex gap-2">
                        <img
                          src={task.resultImageUrl}
                          alt="结果"
                          className="w-20 h-20 object-cover rounded"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          asChild
                        >
                          <a href={task.resultImageUrl} download={`converted_${task.originalFileName}`}>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-4">
                <Button
                  onClick={handleDownloadAll}
                  disabled={!batchStatus || batchStatus.stats.completed === 0}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  下载全部 ({batchStatus?.stats.completed || 0})
                </Button>
                <Button onClick={handleReset} variant="outline" className="flex-1">
                  重新开始
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// 辅助函数：将文件转换为 base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
