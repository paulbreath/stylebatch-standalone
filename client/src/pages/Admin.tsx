import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Search, Users, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [testerQuota, setTesterQuota] = useState<number>(100);
  const [testerNote, setTesterNote] = useState<string>("");

  // 搜索用户
  const { data: searchResults, refetch: searchUsers } = trpc.admin.searchUsers.useQuery(
    { query: searchQuery },
    { enabled: false }
  );

  // 获取用户详情
  const { data: userDetail } = trpc.admin.getUserDetail.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId }
  );

  // 获取测试人员列表
  const { data: testers, refetch: refetchTesters } = trpc.admin.listTesters.useQuery();

  // 设置测试额度
  const setTesterMutation = trpc.admin.setTesterQuota.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchTesters();
      setSelectedUserId(null);
      setTesterQuota(100);
      setTesterNote("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // 移除测试人员
  const removeTesterMutation = trpc.admin.removeTester.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchTesters();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // 权限检查
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-6 w-6" />
              权限不足
            </CardTitle>
            <CardDescription className="text-white/60">
              只有管理员可以访问此页面
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                返回首页
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchUsers();
    }
  };

  const handleSetTester = () => {
    if (!selectedUserId) {
      toast.error("请先选择一个用户");
      return;
    }
    setTesterMutation.mutate({
      userId: selectedUserId,
      quota: testerQuota,
      note: testerNote || undefined,
    });
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
              <Shield className="h-6 w-6 text-purple-400" />
              <span className="text-xl font-bold text-white">管理后台</span>
            </div>
          </div>
          <div className="text-white/60 text-sm">
            管理员：{user?.name || user?.email}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid gap-6 md:grid-cols-2">
          {/* 左侧：搜索和设置 */}
          <div className="space-y-6">
            {/* 搜索用户 */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  搜索用户
                </CardTitle>
                <CardDescription className="text-white/60">
                  按邮箱或用户名搜索
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="输入邮箱或用户名"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                  <Button onClick={handleSearch} className="bg-purple-600 hover:bg-purple-700">
                    搜索
                  </Button>
                </div>

                {/* 搜索结果 */}
                {searchResults && searchResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => setSelectedUserId(result.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedUserId === result.id
                            ? "border-purple-500 bg-purple-500/20"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div className="text-white font-medium">{result.name || "未命名"}</div>
                        <div className="text-white/60 text-sm">{result.email}</div>
                        <div className="text-white/40 text-xs mt-1">
                          ID: {result.id} | 角色: {result.role}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults && searchResults.length === 0 && (
                  <div className="text-white/40 text-center py-4">未找到用户</div>
                )}
              </CardContent>
            </Card>

            {/* 设置测试额度 */}
            {selectedUserId && userDetail && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">设置测试额度</CardTitle>
                  <CardDescription className="text-white/60">
                    为 {userDetail.user.name || userDetail.user.email} 设置测试额度
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 当前额度信息 */}
                  {userDetail.quota && (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-white/60 text-sm mb-2">当前状态</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-white/40">会员类型：</span>
                          <span className="text-white">{userDetail.quota.membershipType}</span>
                        </div>
                        <div>
                          <span className="text-white/40">剩余额度：</span>
                          <span className="text-white">{userDetail.quota.remainingQuota}</span>
                        </div>
                        <div>
                          <span className="text-white/40">测试人员：</span>
                          <span className="text-white">{userDetail.quota.isTester ? "是" : "否"}</span>
                        </div>
                        {userDetail.quota.isTester && (
                          <div>
                            <span className="text-white/40">测试额度：</span>
                            <span className="text-white">{userDetail.quota.testerQuota}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-white">测试额度</Label>
                    <Input
                      type="number"
                      value={testerQuota}
                      onChange={(e) => setTesterQuota(Number(e.target.value))}
                      min={0}
                      max={10000}
                      className="bg-white/10 border-white/20 text-white"
                    />
                    <p className="text-white/40 text-xs">建议：100-500 张</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">备注（可选）</Label>
                    <Textarea
                      value={testerNote}
                      onChange={(e) => setTesterNote(e.target.value)}
                      placeholder="例如：外部测试 - 2024Q1"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      rows={2}
                    />
                  </div>

                  <Button
                    onClick={handleSetTester}
                    disabled={setTesterMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {setTesterMutation.isPending ? "设置中..." : "设置测试额度"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：测试人员列表 */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                测试人员列表
              </CardTitle>
              <CardDescription className="text-white/60">
                当前共有 {testers?.length || 0} 位测试人员
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testers && testers.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {testers.map((tester) => (
                    <div
                      key={tester.userId}
                      className="p-4 rounded-lg border border-white/10 bg-white/5"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-white font-medium">{tester.name || "未命名"}</div>
                          <div className="text-white/60 text-sm">{tester.email}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeTesterMutation.mutate({ userId: tester.userId })}
                          disabled={removeTesterMutation.isPending}
                          className="text-red-400 border-red-400/50 hover:bg-red-400/10"
                        >
                          移除
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-white/40">测试额度：</span>
                          <span className="text-white font-medium">{tester.testerQuota} 张</span>
                        </div>
                        <div>
                          <span className="text-white/40">累计使用：</span>
                          <span className="text-white">{tester.lifetimeUsage} 张</span>
                        </div>
                      </div>

                      {tester.testerNote && (
                        <div className="mt-2 text-white/60 text-sm">
                          备注：{tester.testerNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-white/40 text-center py-8">暂无测试人员</div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
