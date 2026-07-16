import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetTodayMatches, useGetLeaderboard, useClaimDailyReward, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Trophy, Gift, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isClaiming, setIsClaiming] = useState(false);

  const { data: todayMatches } = useGetTodayMatches();
  const { data: leaderboard } = useGetLeaderboard({ sortBy: "coins", limit: 3 });
  
  const claimReward = useClaimDailyReward({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: "Daily Reward Claimed!",
          description: `You received ${data.coinsAwarded} BBPW Coins. New balance: ${data.newBalance}`,
        });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setIsClaiming(false);
      },
      onError: (err: any) => {
        toast({
          title: "Cannot claim reward",
          description: err.response?.data?.error || "You might have already claimed it today.",
          variant: "destructive"
        });
        setIsClaiming(false);
      }
    }
  });

  const handleClaim = () => {
    setIsClaiming(true);
    claimReward.mutate();
  };

  const hasClaimedToday = user?.lastDailyRewardAt && 
    new Date(user.lastDailyRewardAt).toDateString() === new Date().toDateString();

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Welcome back, {user?.username}
            </h1>
            <p className="text-muted-foreground">
              The arena is active. You have <span className="text-gold font-semibold">{user?.coins?.toLocaleString()}</span> coins to play with.
            </p>
          </div>
          
          {!hasClaimedToday ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
            >
              <Button 
                onClick={handleClaim} 
                disabled={isClaiming}
                className="bg-gold hover:bg-gold/90 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] gap-2"
              >
                <Gift className="w-4 h-4" />
                Claim Daily Reward
              </Button>
            </motion.div>
          ) : (
            <Badge variant="glass" className="py-2 px-4 border-gold/20 text-gold bg-gold/5 gap-2">
              <Gift className="w-4 h-4" />
              Reward Claimed Today
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <Card className="glass border-white/5 bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Balance</p>
                <h3 className="text-3xl font-bold text-gold flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gold inline-block"></span>
                  {user?.coins?.toLocaleString()}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-gold" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/5 bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Win Rate</p>
                <h3 className="text-3xl font-bold text-primary">
                  {user?.accuracy ? `${user.accuracy}%` : "0%"}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/5 bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Global Rank</p>
                <h3 className="text-3xl font-bold text-white">
                  {user?.rank ? `#${user.rank}` : "Unranked"}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Matches */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Today's Matches
              </h2>
              <Link href="/matches" className="text-sm text-primary hover:underline flex items-center">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="grid gap-4">
              {todayMatches && todayMatches.length > 0 ? (
                todayMatches.map((match, i) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link href={`/matches/${match.id}`}>
                      <Card className="glass border-white/5 hover:border-primary/50 transition-colors cursor-pointer group">
                        <CardContent className="p-0">
                          <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <Badge variant="outline" className="text-xs bg-black/50 border-white/10">
                              {match.leagueLabel}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              {format(new Date(match.kickoffAt), "HH:mm")}
                            </span>
                          </div>
                          <div className="p-6 flex items-center justify-between">
                            <div className="text-center flex-1">
                              <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{match.homeTeam}</h3>
                            </div>
                            <div className="px-4 text-center">
                              <div className="text-xs text-muted-foreground mb-1">VS</div>
                              {match.status === "live" ? (
                                <Badge className="bg-red-500/20 text-red-500 border-red-500/20 animate-pulse">LIVE</Badge>
                              ) : match.status === "completed" ? (
                                <Badge className="bg-white/10 text-white border-white/10">FT</Badge>
                              ) : (
                                <Badge variant="outline" className="border-white/10 text-muted-foreground">UPCOMING</Badge>
                              )}
                            </div>
                            <div className="text-center flex-1">
                              <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{match.awayTeam}</h3>
                            </div>
                          </div>
                          <div className="px-6 pb-4 flex justify-between text-xs text-muted-foreground">
                            <span>Pool: <span className="text-gold">{match.totalPool} BBPW</span></span>
                            <span>{match.predictionCount} Predictions</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <Card className="glass border-white/5 border-dashed">
                  <CardContent className="p-12 text-center text-muted-foreground">
                    No matches scheduled for today. Check back later or view upcoming matches.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Leaderboard Preview */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold" />
                Top Players
              </h2>
              <Link href="/leaderboard" className="text-sm text-gold hover:underline flex items-center">
                Full list <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <Card className="glass border-white/5">
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {leaderboard?.map((entry, i) => (
                    <div key={entry.user.id} className="p-4 flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${i === 0 ? 'bg-yellow-500/20 text-yellow-500 ring-1 ring-yellow-500/50' : 
                          i === 1 ? 'bg-slate-300/20 text-slate-300 ring-1 ring-slate-300/50' : 
                          i === 2 ? 'bg-amber-700/20 text-amber-500 ring-1 ring-amber-700/50' : 
                          'bg-white/5 text-muted-foreground'}`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{entry.user.username}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gold"></span>{entry.coins}</span>
                          <span>{entry.accuracy}% Win</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}