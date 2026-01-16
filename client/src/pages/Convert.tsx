import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Sparkles, Upload, Loader2, Download, ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { QuotaDisplay } from "@/components/QuotaDisplay";
// import { storagePut } from "../../server/storage";

export default function Convert() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [tab, setTab] = useState<"single" | "batch">("single");
  
  // 单张转换状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [styleType, setStyleType] = useState<"preset" | "custom" | "reference">("preset");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customStyle, setCustomStyle] = useState<string>("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string>("");
  const [referencePrompt, setReferencePrompt] = useState<string>("");
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const [strength, setStrength] = useState<number>(0.75);
  const [analyzeFirst, setAnalyzeFirst] = useState<boolean>(false);
  const [preserveTransparency, setPreserveTransparency] = useState<boolean>(false);
  const [imageWidth, setImageWidth] = useState<number | undefined>();
  const [imageHeight, setImageHeight] = useState<number | undefined>();
  const [imageSize, setImageSize] = useState<'1K' | '2K'>('1K');
  const [apiProvider, setApiProvider] = useState<'volcengine' | 'gemini' | 'replicate' | 'seedream'>('volcengine');
  const [isConverting, setIsConverting] = useState(false);
  const [taskId, setTaskId] = useState<number | null>(null);
  const [resultUrl, setResultUrl] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理参考图选择
  const handleReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceFile(file);
      const url = URL.createObjectURL(file);
      setReferencePreviewUrl(url);
    }
  };

  // 获取预设风格
  const { data: stylesByCategory } = trpc.styles.getByCategory.useQuery();
  
  // 查询任务状态
  const { data: taskStatus } = trpc.conversion.getTaskStatus.useQuery(
    { taskId: taskId! },
    {
      enabled: taskId !== null,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) return 2000;
        if (data.status === "processing" || data.status === "pending") return 2000;
        return false;
      },
    }
  );

  // 转换 mutation
  const uploadMutation = trpc.upload.uploadImage.useMutation();
  
  const convertMutation = trpc.conversion.convertSingle.useMutation({
    onSuccess: (data) => {
      setTaskId(data.taskId);
      toast.success("转换任务已创建，正在处理中...");
    },
    onError: (error) => {
      setIsConverting(false);
      toast.error(`转换失败: ${error.message}`);
    },
  });

  // 监听任务状态变化
  useEffect(() => {
    if (taskStatus) {
      if (taskStatus.status === "completed" && taskStatus.resultImageUrl) {
        setIsConverting(false);
        setResultUrl(taskStatus.resultImageUrl);
        toast.success("转换完成！");
      } else if (taskStatus.status === "failed") {
        setIsConverting(false);
        toast.error(`转换失败: ${taskStatus.errorMessage || "未知错误"}`);
      }
    }
  }, [taskStatus]);

  // 自动切换模型：自定义描述模式下自动使用 Nano Banana
  useEffect(() => {
    if (styleType === 'custom' && apiProvider === 'volcengine') {
      setApiProvider('replicate');
      toast.info('自定义描述模式已自动切换到 Nano Banana 模型');
    }
  }, [styleType, apiProvider]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">需要登录</CardTitle>
            <CardDescription className="text-white/60">
              请先登录以使用图片转换功能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
              <a href={getLoginUrl()}>立即登录</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResultUrl("");
      setTaskId(null);
      
      // 获取图片尺寸
      const img = new Image();
      img.onload = () => {
        setImageWidth(img.width);
        setImageHeight(img.height);
      };
      img.src = url;
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      toast.error("请先选择图片");
      return;
    }

    if (styleType === "preset" && !selectedPreset) {
      toast.error("请选择预设风格");
      return;
    }

    if (styleType === "custom" && !customStyle.trim()) {
      toast.error("请输入自定义风格描述");
      return;
    }

    if (styleType === "reference" && !referenceFile) {
      toast.error("请上传参考图片");
      return;
    }

    setIsConverting(true);
    setResultUrl("");

    try {
      // 上传图片到 S3
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        try {
          // 调用上传 API
          const uploadResult = await uploadMutation.mutateAsync({
            base64Data: base64,
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
          });
          
          // 如果是参考图模式，也上传参考图
          let referenceUploadResult = null;
          if (styleType === "reference" && referenceFile) {
            const refReader = new FileReader();
            const refBase64 = await new Promise<string>((resolve) => {
              refReader.onload = () => resolve(refReader.result as string);
              refReader.readAsDataURL(referenceFile);
            });
            referenceUploadResult = await uploadMutation.mutateAsync({
              base64Data: refBase64,
              fileName: referenceFile.name,
              mimeType: referenceFile.type,
            });
          }
          
          // 使用上传后的 URL 进行转换
          convertMutation.mutate({
            imageUrl: uploadResult.url,
            imageKey: uploadResult.key,
            fileName: selectedFile.name,
            styleType,
            stylePreset: styleType === "preset" ? selectedPreset : undefined,
            styleDescription: styleType === "custom" ? customStyle : undefined,
            referenceImageUrl: referenceUploadResult?.url,
            referenceImageKey: referenceUploadResult?.key,
            referencePrompt: styleType === "reference" ? referencePrompt : undefined,
            strength,
            analyzeFirst,
            preserveTransparency,
            originalWidth: imageWidth,
            originalHeight: imageHeight,
            imageSize,
            apiProvider,
          });
        } catch (error: any) {
          setIsConverting(false);
          toast.error(`上传失败: ${error.message}`);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      setIsConverting(false);
      toast.error(`读取文件失败: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-400" />
              <span className="text-xl font-bold text-white">StyleBatch</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">图片风格转换</h1>
        </div>
        
        {/* 额度显示 */}
        <div className="mb-6">
          <QuotaDisplay />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "single" | "batch")}>
          <TabsList className="bg-white/10">
            <TabsTrigger value="single">单张转换</TabsTrigger>
            <TabsTrigger value="batch">批量转换</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* 左侧：配置 */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">转换配置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 上传图片 */}
                  <div className="space-y-2">
                    <Label className="text-white">选择图片</Label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                      ) : (
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-white/60" />
                          <p className="mt-2 text-sm text-white/60">点击上传图片</p>
                        </div>
                      )}
                    </div>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* 风格类型 */}
                  <div className="space-y-2">
                    <Label className="text-white">风格类型</Label>
                    <Select value={styleType} onValueChange={(v) => setStyleType(v as "preset" | "custom" | "reference")}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preset">预设风格</SelectItem>
                        <SelectItem value="custom">自定义描述</SelectItem>
                        <SelectItem value="reference">参考图风格</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 预设风格选择 */}
                  {styleType === "preset" && stylesByCategory && (
                    <div className="space-y-2">
                      <Label className="text-white">选择风格</Label>
                      <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="选择一个风格" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(stylesByCategory).map(([category, styles]) => (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                {category}
                              </div>
                              {styles.map((style) => (
                                <SelectItem key={style.id} value={style.id}>
                                  {style.name}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* 自定义风格 */}
                  {styleType === "custom" && (
                    <div className="space-y-2">
                      <Label className="text-white">风格描述</Label>
                      <Textarea
                        value={customStyle}
                        onChange={(e) => setCustomStyle(e.target.value)}
                        placeholder="例如：梵高星空风格，旋转的笔触，强烈的色彩对比"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        rows={3}
                      />
                      <p className="text-xs text-white/50">
                        💡 火山引擎仅支持预设风格，请选择 Nano Banana 使用自定义描述
                      </p>
                    </div>
                  )}

                  {/* 参考图上传 */}
                  {styleType === "reference" && (
                    <div className="space-y-2">
                      <Label className="text-white">上传参考图</Label>
                      <div
                        onClick={() => referenceInputRef.current?.click()}
                        className="flex h-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        {referencePreviewUrl ? (
                          <img src={referencePreviewUrl} alt="Reference" className="h-full w-full object-contain rounded-lg" />
                        ) : (
                          <div className="text-center">
                            <Upload className="mx-auto h-8 w-8 text-white/60" />
                            <p className="mt-2 text-sm text-white/60">点击上传参考图片</p>
                            <p className="mt-1 text-xs text-white/40">系统将学习此图的风格</p>
                          </div>
                        )}
                      </div>
                      <Input
                        ref={referenceInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleReferenceFileChange}
                        className="hidden"
                      />
                    </div>
                  )}

                  {/* 参考图额外提示词 */}
                  {styleType === "reference" && (
                    <div className="space-y-2">
                      <Label className="text-white">额外提示词（可选）</Label>
                      <Textarea
                        value={referencePrompt}
                        onChange={(e) => setReferencePrompt(e.target.value)}
                        placeholder="例如：增强色彩饱和度、加强笔触质感、保留更多细节..."
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        rows={2}
                      />
                      <p className="text-xs text-white/50">
                        在参考图风格基础上进一步指导转换效果
                      </p>
                    </div>
                  )}

                  {/* 转换强度 */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-white">转换强度</Label>
                      <span className="text-sm text-white/60">{strength.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[strength]}
                      onValueChange={(v) => setStrength(v[0])}
                      min={0}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                    <p className="text-xs text-white/50">
                      0 = 保留原图，1 = 完全应用新风格
                    </p>
                  </div>

                  {/* 是否分析 */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">先分析图片</Label>
                      <p className="text-xs text-white/50">
                        更准确但更慢
                      </p>
                    </div>
                    <Switch
                      checked={analyzeFirst}
                      onCheckedChange={setAnalyzeFirst}
                    />
                  </div>

                  {/* 背景透明开关 */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">保持背景透明</Label>
                      <p className="text-xs text-white/50">
                        适用于 PNG 图片或需要透明背景的场景
                      </p>
                    </div>
                    <Switch
                      checked={preserveTransparency}
                      onCheckedChange={setPreserveTransparency}
                    />
                  </div>

                  {/* AI 模型选择 */}
                  <div className="space-y-2">
                    <Label className="text-white">AI 模型</Label>
                    <Select value={apiProvider} onValueChange={(v: 'volcengine' | 'gemini' | 'replicate' | 'seedream') => setApiProvider(v)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="volcengine">
                          <div className="flex flex-col">
                            <span>🚀 火山引擎 - 快速经济</span>
                            <span className="text-xs text-muted-foreground">¥0.1/张 · 3-7秒 · 25种风格</span>
                          </div>
                        </SelectItem>
                        {/* 隐藏 Gemini Imagen 4.0 选项，保留代码以便将来恢复 */}
                        {/* <SelectItem value="gemini">
                          <div className="flex flex-col">
                            <span>✨ Gemini - 高端智能</span>
                            <span className="text-xs text-muted-foreground">¥0.29/张 · 5-10秒 · 支持参考图</span>
                          </div>
                        </SelectItem> */}
                        <SelectItem value="replicate">
                          <div className="flex flex-col">
                            <span>🍌 Nano Banana - Gemini 图像模型</span>
                            <span className="text-xs text-muted-foreground">¥0.4/张 · 10秒 · Gemini 2.5</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="seedream">
                          <div className="flex flex-col">
                            <span>🌱 Seedream 4.5 - 火山引擎图像模型</span>
                            <span className="text-xs text-muted-foreground">¥0.35/张 · 10-15秒 · 4K 高清</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-white/50">
                      {apiProvider === 'volcengine' 
                        ? '火山引擎：成本更低，速度更快，适合批量处理' 
                        : apiProvider === 'replicate'
                        ? 'Nano Banana：Google Gemini 2.5 Flash 图像模型，基于 Gemini 世界知识，理解上下文'
                        : 'Seedream 4.5：字节跳动图像模型，支持自定义描述，4K 高清输出，文字渲染更好'}
                    </p>
                  </div>

                  {/* 转换按钮 */}
                  <Button
                    onClick={handleConvert}
                    disabled={isConverting || !selectedFile}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        转换中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        开始转换
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* 右侧：结果 */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">转换结果</CardTitle>
                  {resultUrl && previewUrl && (
                    <CardDescription className="text-white/60">
                      点击图片可放大查看
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {resultUrl ? (
                    <div className="space-y-4">
                      {/* 原图与结果对比 */}
                      {previewUrl && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm text-white/60 text-center">原图</p>
                            <div 
                              className="relative overflow-hidden rounded-lg border border-white/10 cursor-pointer hover:border-white/30 transition-colors group"
                              onClick={() => window.open(previewUrl, '_blank')}
                            >
                              <img
                                src={previewUrl}
                                alt="Original"
                                className="w-full h-auto"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-white text-sm">点击放大</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-white/60 text-center">转换后</p>
                            <div 
                              className="relative overflow-hidden rounded-lg border border-white/10 cursor-pointer hover:border-white/30 transition-colors group"
                              onClick={() => setIsPreviewOpen(true)}
                            >
                              <img
                                src={resultUrl}
                                alt="Result"
                                className="w-full h-auto"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-white text-sm">点击放大</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 仅结果图（无原图对比） */}
                      {!previewUrl && (
                        <div 
                          className="relative overflow-hidden rounded-lg border border-white/10 cursor-pointer hover:border-white/30 transition-colors group"
                          onClick={() => setIsPreviewOpen(true)}
                        >
                          <img
                            src={resultUrl}
                            alt="Result"
                            className="w-full rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white text-sm">点击放大</p>
                          </div>
                        </div>
                      )}
                      
                      <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                        <a 
                          href={resultUrl} 
                          download={selectedFile?.name.replace(/\.[^/.]+$/, "-converted.png")}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          下载图片
                        </a>
                      </Button>
                    </div>
                  ) : isConverting ? (
                    <div className="flex h-64 items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-400" />
                        <p className="mt-4 text-white/60">
                          {taskStatus?.status === "processing" ? "正在转换中..." : "准备中..."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-white/40">
                      转换结果将在这里显示
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="batch">
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">批量转换</CardTitle>
                <CardDescription className="text-white/60">
                  一次性转换多张图片，支持批量下载
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-white/80 text-lg">
                      批量转换功能已就绪，点击下方按钮开始使用
                    </p>
                    <p className="text-white/60 text-sm">
                      支持同时上传多张图片，一键批量转换，自动打包下载
                    </p>
                  </div>
                  <Link href="/batch">
                    <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      <Sparkles className="mr-2 h-5 w-5" />
                      进入批量转换
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* 全屏预览模态框 */}
      <ImagePreviewModal
        imageUrl={resultUrl}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        fileName={selectedFile?.name.replace(/\.[^/.]+$/, "-converted.png")}
      />
    </div>
  );
}
