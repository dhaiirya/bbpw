import { AppLayout } from "@/components/layout/app-layout";
import { useGetLeaderboard, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Medal } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ sortBy: "coins", limit: 50 }, {
    query: {
      queryKey: getGetLeaderboardQueryKey({ sortBy: "coins", limit: 50 })
    }
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  const topThree = leaderboard?.slice(0, 3) || [];
  const rest = leaderboard?.slice(3) || [];

  return (
    <AppLayout>
      <div className="space-y-8 pb-8 max-w-4xl mx-auto">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white">Global Leaderboard</h1>
          <p className="text-muted-foreground">The best predictors in the arena.</p>
        </div>

        {/* Podium for Top 3 */}
        {topThree.length > 0 && (
          <div className="flex justify-center items-end h-64 gap-2 md:gap-6 mt-12 mb-16">
            {/* 2nd Place */}
            {topThree[1] && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="relative mb-4">
                  <Avatar className="w-16 h-16 border-4 border-[#C0C0C0] shadow-[0_0_20px_rgba(192,192,192,0.3)]">
                    <AvatarImage src={topThree[1].user.avatarUrl || ''} />
                    <AvatarFallback className="bg-secondary text-white">{topThree[1].user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-[#C0C0C0] text-black font-bold rounded-full flex items-center justify-center border-2 border-background">
                    2
                  </div>
                </div>
                <div className="text-center mb-2">
                  <Link href={`/profile/${topThree[1].user.id}`} className="font-bold text-white hover:text-primary transition-colors">
                    {topThree[1].user.username}
                  </Link>
                  <div className="text-gold font-mono text-sm">{topThree[1].coins} BBPW</div>
                </div>
                <div className="w-24 md:w-32 h-24 bg-gradient-to-t from-[#C0C0C0]/20 to-[#C0C0C0]/5 border-t-2 border-[#C0C0C0] rounded-t-lg" />
              </motion.div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center z-10"
              >
                <div className="relative mb-4">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400">
                    <Trophy className="w-8 h-8 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                  </div>
                  <Avatar className="w-20 h-20 border-4 border-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.4)]">
                    <AvatarImage src={topThree[0].user.avatarUrl || ''} />
                    <AvatarFallback className="bg-secondary text-white">{topThree[0].user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-[#FFD700] text-black font-bold rounded-full flex items-center justify-center border-2 border-background">
                    1
                  </div>
                </div>
                <div className="text-center mb-2">
                  <Link href={`/profile/${topThree[0].user.id}`} className="font-bold text-lg text-white hover:text-primary transition-colors">
                    {topThree[0].user.username}
                  </Link>
                  <div className="text-gold font-mono font-bold">{topThree[0].coins} BBPW</div>
                </div>
                <div className="w-28 md:w-36 h-32 bg-gradient-to-t from-[#FFD700]/20 to-[#FFD700]/5 border-t-2 border-[#FFD700] rounded-t-lg" />
              </motion.div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="relative mb-4">
                  <Avatar className="w-16 h-16 border-4 border-[#CD7F32] shadow-[0_0_20px_rgba(205,127,50,0.3)]">
                    <AvatarImage src={topThree[2].user.avatarUrl || ''} />
                    <AvatarFallback className="bg-secondary text-white">{topThree[2].user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-[#CD7F32] text-black font-bold rounded-full flex items-center justify-center border-2 border-background">
                    3
                  </div>
                </div>
                <div className="text-center mb-2">
                  <Link href={`/profile/${topThree[2].user.id}`} className="font-bold text-white hover:text-primary transition-colors">
                    {topThree[2].user.username}
                  </Link>
                  <div className="text-gold font-mono text-sm">{topThree[2].coins} BBPW</div>
                </div>
                <div className="w-24 md:w-32 h-16 bg-gradient-to-t from-[#CD7F32]/20 to-[#CD7F32]/5 border-t-2 border-[#CD7F32] rounded-t-lg" />
              </motion.div>
            )}
          </div>
        )}

        {/* Rest of the Leaderboard */}
        <Card className="glass border-white/5">
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {rest.map((entry, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  key={entry.user.id} 
                  className="flex items-center p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="w-12 text-center font-mono text-muted-foreground font-bold">
                    {entry.rank}
                  </div>
                  <div className="flex-1 flex items-center gap-4">
                    <Avatar className="w-10 h-10 border border-white/10">
                      <AvatarImage src={entry.user.avatarUrl || ''} />
                      <AvatarFallback className="bg-black/50 text-white">{entry.user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/profile/${entry.user.id}`} className="font-semibold text-white hover:text-primary transition-colors">
                        {entry.user.username}
                      </Link>
                      <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {entry.accuracy}% Win Rate</span>
                        <span>{entry.wins} Wins</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-gold flex items-center justify-end gap-1">
                      <span className="w-2 h-2 rounded-full bg-gold"></span>
                      {entry.coins.toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}