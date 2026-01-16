import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Sparkles, ArrowLeft, Download, Clock, Copy } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { useState } from "react";

export default function History() {
  const { data: history, isLoading } = trpc.conversion.getHistory.useQuery({ limit: 50 });
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewFileName, setPreviewFileName] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">转换历史</h1>
          <p className="mt-2 text-white/60">查看您的所有转换记录</p>
        </div>

        {isLoading ? (
          <div className="text-center text-white/60">加载中...</div>
        ) : history && history.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {history.map((task) => (
              <Card key={task.id} className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div 
                    className="aspect-square mb-4 rounded-lg overflow-hidden bg-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      if (task.resultImageUrl) {
                        setPreviewUrl(task.resultImageUrl);
                        setPreviewFileName(task.originalFileName);
                        setIsPreviewOpen(true);
                      }
                    }}
                  >
                    {task.resultImageUrl ? (
                      <img
                        src={task.resultImageUrl}
                        alt={task.originalFileName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        {task.status === "processing" ? "处理中..." : "失败"}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white truncate">
                        {task.originalFileName}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          task.status === "completed"
                            ? "bg-green-500/20 text-green-300"
                            : task.status === "failed"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        {task.status === "completed"
                          ? "完成"
                          : task.status === "failed"
                          ? "失败"
                          : "处理中"}
                      </span>
                    </div>
                    
                    {/* 风格描述 */}
                    {task.styleDescription && (
                      <div className="space-y-1">
                        <p className="text-xs text-white/40">风格描述：</p>
                        <p className="text-xs text-white/60 line-clamp-2">
                          {task.styleDescription}
                        </p>
                      </div>
                    )}
                    
                    {/* 风格类型标签 */}
                    <p className="text-xs text-white/40">
                      {task.styleType === "preset"
                        ? "预设风格"
                        : task.styleType === "reference"
                        ? "参考图风格"
                        : "自定义风格"}
                    </p>
                    
                    <div className="flex items-center gap-1 text-xs text-white/50">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(task.createdAt), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      {task.styleDescription && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-white/20 bg-white/5 hover:bg-white/10 text-white"
                          onClick={() => {
                            // 复制提示词到剪贴板
                            navigator.clipboard.writeText(task.styleDescription!);
                            toast.success("提示词已复制到剪贴板");
                          }}
                        >
                          <Copy className="mr-2 h-3 w-3" />
                          复用提示词
                        </Button>
                      )}
                      {task.resultImageUrl && (
                        <Button
                          asChild
                          size="sm"
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          <a href={task.resultImageUrl} download={task.originalFileName}>
                            <Download className="mr-2 h-3 w-3" />
                            下载
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <p className="text-white/60 mb-4">还没有转换记录</p>
              <Link href="/convert">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  开始转换
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>

      {/* 全屏预览模态框 */}
      <ImagePreviewModal
        imageUrl={previewUrl}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        fileName={previewFileName}
      />
    </div>
  );
}
