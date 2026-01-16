import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Sparkles, Image, History, Palette } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-400" />
            <span className="text-xl font-bold text-white">StyleBatch</span>
          </div>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/convert">
                  <Button variant="ghost" className="text-white hover:bg-white/10">转换</Button>
                </Link>
                <Link href="/batch">
                  <Button variant="ghost" className="text-white hover:bg-white/10">批量转换</Button>
                </Link>
                <Link href="/styles">
                  <Button variant="ghost" className="text-white hover:bg-white/10">风格库</Button>
                </Link>
                <Link href="/history">
                  <Button variant="ghost" className="text-white hover:bg-white/10">历史记录</Button>
                </Link>
                <span className="text-sm text-white/70">{user?.name || user?.email}</span>
              </>
            ) : (
              <Link href="/auth">
                <Button variant="default" className="bg-purple-600 hover:bg-purple-700">登录</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl">
            AI 图片风格转换工具
          </h1>
          <p className="mb-8 text-xl text-white/80 md:text-2xl">
            使用 Gemini AI 将您的图片转换为任何艺术风格
          </p>
          <p className="mb-12 text-lg text-white/60">
            支持 22 种预设风格，包括水彩、油画、水墨、动漫等，也可以自定义风格描述
          </p>

          {isAuthenticated ? (
            <Link href="/convert">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6">
                <Sparkles className="mr-2 h-5 w-5" />
                开始转换
              </Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6">
                <Sparkles className="mr-2 h-5 w-5" />
                立即开始
              </Button>
            </Link>
          )}
        </div>

        <div className="mt-24 grid gap-8 md:grid-cols-3">
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600">
                <Image className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-white">单张 & 批量转换</CardTitle>
              <CardDescription className="text-white/60">
                支持单张图片快速转换，也支持批量上传多张图片统一处理
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                <Palette className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-white">22 种预设风格</CardTitle>
              <CardDescription className="text-white/60">
                精选艺术风格、摄影风格、设计风格和特殊效果，满足各种需求
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600">
                <History className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-white">转换历史</CardTitle>
              <CardDescription className="text-white/60">
                自动保存所有转换记录，随时查看和下载历史结果
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm mt-24">
        <div className="container mx-auto px-4 py-8 text-center text-white/60">
          <p>Powered by Gemini AI</p>
        </div>
      </footer>
    </div>
  );
}
