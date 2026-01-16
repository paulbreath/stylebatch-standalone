import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Styles() {
  const { data: stylesByCategory, isLoading } = trpc.styles.getByCategory.useQuery();

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
          <h1 className="text-3xl font-bold text-white">风格库</h1>
          <p className="mt-2 text-white/60">浏览 22 种精选艺术风格</p>
        </div>

        {isLoading ? (
          <div className="text-center text-white/60">加载中...</div>
        ) : (
          <div className="space-y-12">
            {stylesByCategory &&
              Object.entries(stylesByCategory).map(([category, styles]) => (
                <div key={category}>
                  <h2 className="mb-4 text-2xl font-bold text-white">{category}</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {styles.map((style) => (
                      <Card key={style.id} className="border-white/10 bg-white/5 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle className="text-white">{style.name}</CardTitle>
                          <CardDescription className="text-white/60">
                            {style.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Link href="/convert">
                            <Button className="w-full bg-purple-600 hover:bg-purple-700">
                              使用此风格
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}
