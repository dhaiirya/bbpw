import { AppLayout } from "@/components/layout/app-layout";
import { useListMatches } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Matches() {
  const { data: upcomingMatches, isLoading: loadingUpcoming } = useListMatches({ status: "upcoming" });
  const { data: liveMatches, isLoading: loadingLive } = useListMatches({ status: "live" });
  const { data: completedMatches, isLoading: loadingCompleted } = useListMatches({ status: "completed" });

  const MatchList = ({ matches, emptyText }: { matches?: any[], emptyText: string }) => {
    if (!matches || matches.length === 0) {
      return (
        <Card className="glass border-white/5 border-dashed mt-6">
          <CardContent className="p-12 text-center text-muted-foreground">
            {emptyText}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4 mt-6">
        {matches.map((match, i) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/matches/${match.id}`}>
              <Card className="glass border-white/5 hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs bg-black/50 border-white/10">
                        {match.leagueLabel}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {format(new Date(match.kickoffAt), "MMM d, HH:mm")}
                      </span>
                    </div>
                    {match.status === "live" ? (
                      <Badge className="bg-red-500/20 text-red-500 border-red-500/20 animate-pulse">LIVE</Badge>
                    ) : match.status === "completed" ? (
                      <Badge className="bg-white/10 text-white border-white/10">
                        {match.homeScore} - {match.awayScore}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-white/10 text-muted-foreground">UPCOMING</Badge>
                    )}
                  </div>
                  <div className="p-6 flex items-center justify-between">
                    <div className="text-center flex-1">
                      <h3 className="text-lg md:text-xl font-bold group-hover:text-primary transition-colors">{match.homeTeam}</h3>
                    </div>
                    <div className="px-4 text-center">
                      <div className="text-xs text-muted-foreground">VS</div>
                    </div>
                    <div className="text-center flex-1">
                      <h3 className="text-lg md:text-xl font-bold group-hover:text-primary transition-colors">{match.awayTeam}</h3>
                    </div>
                  </div>
                  <div className="px-6 pb-4 flex justify-between text-xs text-muted-foreground border-t border-white/5 pt-4 bg-black/20">
                    <div className="flex gap-4">
                      <span>Pool: <span className="text-gold font-medium">{match.totalPool} BBPW</span></span>
                      <span>{match.predictionCount} Predictions</span>
                    </div>
                    {match.result && match.result !== "null" && (
                      <span className="text-primary font-medium">Result: {match.result.toUpperCase()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Matches</h1>
          <p className="text-muted-foreground">Find the next big game to place your prediction on.</p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="bg-card border border-white/5 w-full md:w-auto p-1">
            <TabsTrigger value="live" className="flex-1 md:flex-none">
              Live
              {liveMatches && liveMatches.length > 0 && (
                <span className="ml-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1 md:flex-none">Upcoming</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 md:flex-none">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="live">
            <MatchList matches={liveMatches} emptyText="No live matches right now." />
          </TabsContent>
          <TabsContent value="upcoming">
            <MatchList matches={upcomingMatches} emptyText="No upcoming matches found." />
          </TabsContent>
          <TabsContent value="completed">
            <MatchList matches={completedMatches} emptyText="No completed matches available." />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}