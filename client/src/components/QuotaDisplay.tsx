import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export function QuotaDisplay() {
  const { data: quota, isLoading } = trpc.quota.getMyQuota.useQuery();

  if (isLoading) {
    return (
      <Card className="p-4 bg-white/5 border-white/10">
        <div className="animate-pulse">
          <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
          <div className="h-6 bg-white/10 rounded w-16"></div>
        </div>
      </Card>
    );
  }

  if (!quota) {
    return null;
  }

  const isEnterprise = quota.membershipType === "enterprise";
  const isTester = quota.isTester;
  const isLowQuota = !isEnterprise && !isTester && quota.totalRemaining <= 2;
  const isOutOfQuota = !isEnterprise && !isTester && quota.totalRemaining === 0;

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-white/60 mb-1">
            {quota.isFree ? "每日免费额度" : "剩余额度"}
          </div>
          <div className="flex items-baseline gap-2">
          {isEnterprise ? (
            <>
              <span className="text-2xl font-bold text-gradient bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                ∞
              </span>
              <span className="text-white/40 text-sm">
                无限额度
              </span>
            </>
          ) : isTester ? (
            <>
              <span className="text-2xl font-bold text-green-400">
                {quota.testerQuota}
              </span>
              <span className="text-white/40 text-sm">
                测试额度
              </span>
            </>
          ) : (
              <>
                <span className={`text-2xl font-bold ${isLowQuota ? "text-red-400" : "text-white"}`}>
                  {quota.totalRemaining}
                </span>
                <span className="text-white/40 text-sm">
                  / {quota.isFree ? "5" : quota.totalQuota}
                </span>
              </>
            )}
          </div>
          
          {isEnterprise ? (
            <div className="text-xs text-yellow-400/80 mt-1">
              🌟 企业版用户
            </div>
          ) : isTester ? (
            <div className="text-xs text-green-400/80 mt-1">
              🧪 测试人员{quota.testerNote ? ` - ${quota.testerNote}` : ""}
            </div>
          ) : quota.isFree && (
            <div className="text-xs text-white/40 mt-1">
              每日 00:00 重置
            </div>
          )}
          
          {quota.isVip && quota.membershipExpireAt && (
            <div className="text-xs text-white/40 mt-1">
              到期时间：{new Date(quota.membershipExpireAt).toLocaleDateString()}
            </div>
          )}
        </div>

        <div>
          {isEnterprise ? (
            <div className="px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded text-xs text-yellow-400">
              企业版
            </div>
          ) : isTester ? (
            <div className="px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/30 rounded text-xs text-green-400">
              测试人员
            </div>
          ) : quota.isFree ? (
            <Link href="/vip">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                升级 VIP
              </Button>
            </Link>
          ) : isLowQuota ? (
            <Link href="/vip">
              <Button 
                size="sm" 
                variant="outline" 
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                购买额度
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {isOutOfQuota && (
        <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded text-sm text-red-300">
          {quota.isFree 
            ? "今日额度已用完，明天 00:00 重置或升级 VIP 获取更多额度"
            : "额度已用完，请购买额度包或等待下个周期重置"
          }
        </div>
      )}
    </Card>
  );
}
