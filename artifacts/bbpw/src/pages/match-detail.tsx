import { AppLayout } from "@/components/layout/app-layout";
import { useGetMatch, usePlacePrediction, useGetMe, getGetMatchQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Clock, Trophy, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const matchId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();

  const { data: detail, isLoading } = useGetMatch(matchId, {
    query: {
      enabled: !!matchId,
      queryKey: getGetMatchQueryKey(matchId)
    }
  });

  const placePrediction = usePlacePrediction({
    mutation: {
      onSuccess: () => {
        toast({ title: "Prediction Placed!" });
        queryClient.invalidateQueries({ queryKey: getGetMatchQueryKey(matchId) });
      },
      onError: (err: any) => {
        toast({
          title: "Prediction Failed",
          description: err.response?.data?.error || "Could not place prediction",
          variant: "destructive"
        });
      }
    }
  });

  const [stake, setStake] = useState<number[]>([10]);
  const [stakeInput, setStakeInput] = useState("10");
  const [selectedPrediction, setSelectedPrediction] = useState<"home" | "draw" | "away" | null>(null);

  const maxStake = Math.min(user?.coins || 1000, 10000);

  const applyStake = (val: number) => {
    const clamped = Math.max(10, Math.min(val, maxStake));
    const snapped = Math.round(clamped / 10) * 10;
    setStake([snapped]);
    setStakeInput(String(snapped));
  };

  const PRESETS = [
    { label: "25%", pct: 0.25 },
    { label: "50%", pct: 0.5 },
    { label: "75%", pct: 0.75 },
    { label: "All In", pct: 1 },
  ];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!detail) {
    return (
      <AppLayout>
        <div className="text-center py-12">Match not found</div>
      </AppLayout>
    );
  }

  const { match, userPrediction, homeVotes, drawVotes, awayVotes, totalStaked } = detail;
  const totalVotes = homeVotes + drawVotes + awayVotes || 1; // prevent div by zero
  const homePct = (homeVotes / totalVotes) * 100;
  const drawPct = (drawVotes / totalVotes) * 100;
  const awayPct = (awayVotes / totalVotes) * 100;

  const handlePredict = () => {
    if (!selectedPrediction) return;
    placePrediction.mutate({
      data: {
        matchId,
        prediction: selectedPrediction,
        stake: stake[0]
      }
    });
  };

  const isPredictable = match.status === "upcoming" && !userPrediction;

  return (
    <AppLayout>
      <div className="space-y-8 pb-8 max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-4">
          <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
            {match.leagueLabel}
          </Badge>
          <div className="flex items-center justify-center gap-8 w-full">
            <div className="flex-1 flex flex-col items-end">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-2">{match.homeTeam}</h2>
              {match.status !== "upcoming" && (
                <div className="text-4xl font-mono font-bold text-gold">{match.homeScore ?? "-"}</div>
              )}
            </div>
            
            <div className="flex flex-col items-center px-4">
              <div className="text-muted-foreground font-mono text-sm mb-2">
                {format(new Date(match.kickoffAt), "MMM d, yyyy")}
                <br/>
                {format(new Date(match.kickoffAt), "HH:mm")}
              </div>
              <div className="w-12 h-12 rounded-full bg-card border border-white/10 flex items-center justify-center text-muted-foreground font-bold">
                VS
              </div>
            </div>

            <div className="flex-1 flex flex-col items-start">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-2">{match.awayTeam}</h2>
              {match.status !== "upcoming" && (
                <div className="text-4xl font-mono font-bold text-gold">{match.awayScore ?? "-"}</div>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {match.status === "live" && <Badge className="bg-red-500 animate-pulse">LIVE NOW</Badge>}
            {match.status === "completed" && <Badge variant="secondary">MATCH COMPLETED</Badge>}
            <Badge variant="outline" className="border-white/10">
              <Trophy className="w-3 h-3 mr-1 text-gold" />
              {match.totalPool} BBPW Pool
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Prediction Area */}
          <Card className="glass border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
            <CardHeader>
              <CardTitle>Your Prediction</CardTitle>
            </CardHeader>
            <CardContent>
              {userPrediction ? (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-2">
                    <Trophy className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Prediction Locked</h3>
                  <div className="grid grid-cols-2 gap-4 text-left bg-black/40 rounded-lg p-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Selection</div>
                      <div className="font-semibold text-white uppercase">{userPrediction.prediction}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Stake</div>
                      <div className="font-semibold text-gold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gold"></span>
                        {userPrediction.stake} BBPW
                      </div>
                    </div>
                    {userPrediction.outcome && userPrediction.outcome !== "pending" && (
                      <div className="col-span-2 mt-2 pt-2 border-t border-white/10">
                        <div className="text-xs text-muted-foreground">Result</div>
                        <div className={`font-bold ${userPrediction.outcome === 'win' ? 'text-primary' : 'text-destructive'}`}>
                          {userPrediction.outcome.toUpperCase()}
                          {userPrediction.payout ? ` (+${userPrediction.payout})` : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : !isPredictable ? (
                <div className="bg-black/40 border border-white/5 rounded-xl p-6 text-center text-muted-foreground flex flex-col items-center gap-3">
                  <AlertCircle className="w-8 h-8 opacity-50" />
                  <p>Predictions are closed for this match.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-3 gap-3">
                    {["home", "draw", "away"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedPrediction(opt as any)}
                        className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 ${
                          selectedPrediction === opt 
                            ? "bg-primary/20 border-primary text-white" 
                            : "bg-black/40 border-white/5 text-muted-foreground hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span className="text-xs uppercase tracking-wider font-semibold opacity-70">{opt}</span>
                        <span className="font-bold text-sm text-center">
                          {opt === "home" ? match.homeTeam : opt === "away" ? match.awayTeam : "Draw"}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {/* Header row */}
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Stake Amount</label>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gold" />
                        <motion.span
                          key={stake[0]}
                          initial={{ scale: 1.2, opacity: 0.6 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.15 }}
                          className="text-2xl font-bold text-gold tabular-nums"
                        >
                          {stake[0].toLocaleString()}
                        </motion.span>
                        <span className="text-xs text-muted-foreground font-semibold">BBPW</span>
                      </div>
                    </div>

                    {/* Preset quick-pick buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      {PRESETS.map(({ label, pct }) => {
                        const val = Math.max(10, Math.round((maxStake * pct) / 10) * 10);
                        const active = stake[0] === val;
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => applyStake(val)}
                            className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              active
                                ? "bg-primary/20 border-primary text-primary"
                                : "bg-black/40 border-white/10 text-muted-foreground hover:border-white/30 hover:text-white"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Slider */}
                    <div className="px-1 py-2">
                      <Slider
                        value={stake}
                        onValueChange={(v) => {
                          setStake(v);
                          setStakeInput(String(v[0]));
                        }}
                        min={10}
                        max={maxStake}
                        step={10}
                        className="py-3"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>10</span>
                        <span>{maxStake.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Manual number input */}
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2 focus-within:border-primary/50 transition-colors">
                      <span className="text-xs text-muted-foreground font-semibold shrink-0">Enter amount</span>
                      <input
                        type="number"
                        min={10}
                        max={maxStake}
                        step={10}
                        value={stakeInput}
                        onChange={(e) => setStakeInput(e.target.value)}
                        onBlur={() => applyStake(Number(stakeInput))}
                        onKeyDown={(e) => e.key === "Enter" && applyStake(Number(stakeInput))}
                        className="flex-1 bg-transparent text-right text-gold font-bold text-lg outline-none min-w-0 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-xs text-muted-foreground font-semibold shrink-0">BBPW</span>
                    </div>

                    {/* Balance indicator */}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Your balance: <span className="text-gold font-semibold">{(user?.coins || 0).toLocaleString()} BBPW</span></span>
                      <span>Remaining: <span className={`font-semibold ${(user?.coins || 0) - stake[0] < 0 ? "text-destructive" : "text-white"}`}>{((user?.coins || 0) - stake[0]).toLocaleString()} BBPW</span></span>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 text-lg font-bold bg-primary text-black hover:bg-primary/90"
                    disabled={!selectedPrediction || placePrediction.isPending || (user?.coins || 0) < stake[0]}
                    onClick={handlePredict}
                  >
                    {placePrediction.isPending ? "Placing..." : "Lock Prediction"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Crowd Stats */}
          <Card className="glass border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                Crowd Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{match.homeTeam}</span>
                  <span className="font-bold">{homePct.toFixed(1)}%</span>
                </div>
                <Progress value={homePct} className="h-2 bg-black/40" indicatorColor="bg-blue-500" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Draw</span>
                  <span className="font-bold">{drawPct.toFixed(1)}%</span>
                </div>
                <Progress value={drawPct} className="h-2 bg-black/40" indicatorColor="bg-slate-500" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{match.awayTeam}</span>
                  <span className="font-bold">{awayPct.toFixed(1)}%</span>
                </div>
                <Progress value={awayPct} className="h-2 bg-black/40" indicatorColor="bg-red-500" />
              </div>

              <div className="mt-8 p-4 bg-black/30 rounded-xl border border-white/5 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Total Pool</div>
                  <div className="text-xl font-bold text-gold">{totalStaked} BBPW</div>
                </div>
                <div className="text-center border-l border-white/5">
                  <div className="text-xs text-muted-foreground mb-1">Total Bets</div>
                  <div className="text-xl font-bold text-white">{totalVotes}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

import { Users } from "lucide-react";