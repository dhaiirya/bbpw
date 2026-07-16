import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState, useCallback } from "react";
import { useGetAdminStats, useListMatches, useListUsers, useCreateMatch, useUpdateMatch, useDeleteMatch, useDeclareResult, useSetUserCoins, useToggleAdmin, getListMatchesQueryKey, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient as useQC } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Edit, Trash2, CheckCircle, Shield, Coins, Gift, Save } from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !user.isAdmin) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  if (!user?.isAdmin) return null;

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" /> Admin Command Center
          </h1>
          <p className="text-muted-foreground">Manage the BBPW platform.</p>
        </div>

        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="bg-card border border-white/5 mb-6">
            <TabsTrigger value="stats">Platform Stats</TabsTrigger>
            <TabsTrigger value="matches">Manage Matches</TabsTrigger>
            <TabsTrigger value="users">Manage Users</TabsTrigger>
            <TabsTrigger value="settings">Reward Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <StatsTab />
          </TabsContent>

          <TabsContent value="matches">
            <MatchesTab />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="settings">
            <RewardSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function StatsTab() {
  const { data: stats } = useGetAdminStats();

  if (!stats) return <div className="text-center py-12">Loading stats...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass border-white/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-normal">Total Users</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-white">{stats.totalUsers}</div></CardContent>
        </Card>
        <Card className="glass border-white/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-normal">Active Matches</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-primary">{stats.activeMatches}</div></CardContent>
        </Card>
        <Card className="glass border-white/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-normal">Total Predictions</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-white">{stats.totalPredictions}</div></CardContent>
        </Card>
        <Card className="glass border-white/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-normal">Coins in Circulation</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-gold">{stats.totalCoinsInCirculation.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle>Recent Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                <Badge variant="outline" className="uppercase text-[10px] w-20 justify-center">
                  {activity.type}
                </Badge>
                <div className="flex-1 text-sm">{activity.description}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {format(new Date(activity.timestamp), "MMM d HH:mm")}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MatchesTab() {
  const { data: matches } = useListMatches({ status: "all" });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMatch = useCreateMatch();
  const deleteMatch = useDeleteMatch();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ league: "", leagueLabel: "", homeTeam: "", awayTeam: "", kickoffAt: "" });

  const handleCreate = () => {
    const payload = {
      ...formData,
      // datetime-local gives a string without timezone; new Date() treats it as
      // local time in the browser, so .toISOString() gives the correct UTC value.
      kickoffAt: formData.kickoffAt ? new Date(formData.kickoffAt).toISOString() : "",
    };
    createMatch.mutate({ data: payload as any }, {
      onSuccess: () => {
        toast({ title: "Match created" });
        setIsCreateOpen(false);
        queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
        setFormData({ league: "", leagueLabel: "", homeTeam: "", awayTeam: "", kickoffAt: "" });
      }
    });
  };

  return (
    <Card className="glass border-white/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>All Matches</CardTitle>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>Create Match</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>Create New Match</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <Input placeholder="League Code (e.g. PL)" value={formData.league} onChange={e => setFormData({...formData, league: e.target.value})} />
              <Input placeholder="League Label (e.g. Premier League)" value={formData.leagueLabel} onChange={e => setFormData({...formData, leagueLabel: e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Home Team" value={formData.homeTeam} onChange={e => setFormData({...formData, homeTeam: e.target.value})} />
                <Input placeholder="Away Team" value={formData.awayTeam} onChange={e => setFormData({...formData, awayTeam: e.target.value})} />
              </div>
              <Input type="datetime-local" value={formData.kickoffAt} onChange={e => setFormData({...formData, kickoffAt: e.target.value})} />
              <Button onClick={handleCreate} disabled={createMatch.isPending}>Save Match</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>League</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Kickoff</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches?.map(match => (
              <TableRow key={match.id}>
                <TableCell><Badge variant="outline">{match.league}</Badge></TableCell>
                <TableCell className="font-medium">{match.homeTeam} vs {match.awayTeam}</TableCell>
                <TableCell className="text-muted-foreground">{format(new Date(match.kickoffAt), "MMM d, HH:mm")}</TableCell>
                <TableCell>
                  <Badge className={
                    match.status === 'live' ? 'bg-red-500/20 text-red-500' :
                    match.status === 'completed' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white'
                  }>
                    {match.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <ResultDialog match={match} />
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                    if(confirm("Are you sure?")) {
                      deleteMatch.mutate({ matchId: match.id }, {
                        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() })
                      });
                    }
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ResultDialog({ match }: { match: any }) {
  const [open, setOpen] = useState(false);
  const [res, setRes] = useState<"home"|"draw"|"away">("home");
  const [hScore, setHScore] = useState(0);
  const [aScore, setAScore] = useState(0);
  
  const declareResult = useDeclareResult();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDeclare = () => {
    declareResult.mutate({
      matchId: match.id,
      data: { result: res, homeScore: hScore, awayScore: aScore }
    }, {
      onSuccess: () => {
        toast({ title: "Result declared and payouts settled" });
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
      }
    });
  };

  if (match.status === "completed") return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80"><CheckCircle className="w-4 h-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Declare Result</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{match.homeTeam} Score</label>
              <Input type="number" value={hScore} onChange={e => setHScore(parseInt(e.target.value))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{match.awayTeam} Score</label>
              <Input type="number" value={aScore} onChange={e => setAScore(parseInt(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Winning Outcome</label>
            <select className="w-full bg-black/50 border border-white/10 rounded-md p-2" value={res} onChange={e => setRes(e.target.value as any)}>
              <option value="home">Home ({match.homeTeam})</option>
              <option value="draw">Draw</option>
              <option value="away">Away ({match.awayTeam})</option>
            </select>
          </div>
          <Button onClick={handleDeclare} disabled={declareResult.isPending} className="w-full bg-primary text-black">
            Settle Match & Pay Winners
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UsersTab() {
  const { data: users } = useListUsers();
  const toggleAdmin = useToggleAdmin();
  const setCoins = useSetUserCoins();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return (
    <Card className="glass border-white/5">
      <CardHeader>
        <CardTitle>Manage Users</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Coins</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">#{u.id}</TableCell>
                <TableCell className="font-medium">{u.username}</TableCell>
                <TableCell className="text-gold font-mono">{u.coins}</TableCell>
                <TableCell>
                  {u.isAdmin ? <Badge className="bg-red-500/20 text-red-500 border-0">ADMIN</Badge> : <Badge variant="outline">USER</Badge>}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => {
                    const amt = prompt(`Set coins for ${u.username}:`, u.coins.toString());
                    if(amt && !isNaN(parseInt(amt))) {
                      setCoins.mutate({ userId: u.id, data: { coins: parseInt(amt) } }, {
                        onSuccess: () => {
                          toast({ title: "Coins updated" });
                          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
                        }
                      });
                    }
                  }}>
                    <Coins className="w-4 h-4 text-gold" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    if(confirm(`Toggle admin status for ${u.username}?`)) {
                      toggleAdmin.mutate({ userId: u.id }, {
                        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() })
                      });
                    }
                  }}>
                    <Shield className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RewardSettingsTab() {
  const { toast } = useToast();
  const qc = useQC();

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
  });

  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const save = useMutation({
    mutationFn: async (values: Record<string, string>) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Failed to save");
      }
      return res.json();
    },
    onSuccess: (data) => {
      qc.setQueryData(["admin-settings"], data);
      toast({ title: "Reward settings saved" });
    },
    onError: (err: any) =>
      toast({ title: "Save failed", description: err.message, variant: "destructive" }),
  });

  const FIELDS = [
    {
      key: "daily_reward_base",
      label: "Base daily reward",
      description: "Coins every user gets just for claiming their daily reward.",
      min: 0, max: 10000, step: 10,
    },
    {
      key: "daily_reward_streak_bonus_per_day",
      label: "Streak bonus per day",
      description: "Extra coins added for each consecutive login day.",
      min: 0, max: 500, step: 1,
    },
    {
      key: "daily_reward_max_streak_bonus",
      label: "Max streak bonus (cap)",
      description: "The streak bonus stops growing once it hits this ceiling.",
      min: 0, max: 10000, step: 10,
    },
  ] as const;

  const base   = Number(form["daily_reward_base"] ?? 50);
  const perDay = Number(form["daily_reward_streak_bonus_per_day"] ?? 10);
  const cap    = Number(form["daily_reward_max_streak_bonus"] ?? 100);
  const preview: [string, number][] = [
    ["Day 1",  base + Math.min(1  * perDay, cap)],
    ["Day 7",  base + Math.min(7  * perDay, cap)],
    ["Day 30", base + Math.min(30 * perDay, cap)],
  ];

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading…</div>;

  return (
    <div className="max-w-xl space-y-6">
      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Daily Reward Configuration
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Formula: <span className="font-mono text-white">base + min(day × bonus_per_day, cap)</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-8">

          {FIELDS.map(({ key, label, description, min, max, step }) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="text-sm font-semibold text-white">{label}</label>
                <span className="text-xs text-muted-foreground">{min} – {max.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">{description}</p>
              <div className="flex items-center gap-4 pt-1">
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={Number(form[key] ?? 0)}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="flex-1 accent-[#00E676] cursor-pointer"
                />
                <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 w-32 focus-within:border-primary/50 transition-colors shrink-0">
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={form[key] ?? ""}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    onBlur={e => {
                      const clamped = Math.max(min, Math.min(max, Number(e.target.value) || 0));
                      setForm(f => ({ ...f, [key]: String(clamped) }));
                    }}
                    className="w-full bg-transparent text-right text-gold font-bold text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] text-muted-foreground shrink-0">coins</span>
                </div>
              </div>
            </div>
          ))}

          {/* Live payout preview */}
          <div className="p-4 bg-black/30 rounded-xl border border-white/5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Live payout preview</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {preview.map(([label, coins]) => (
                <div key={label}>
                  <div className="text-xs text-muted-foreground mb-1">{label}</div>
                  <div className="text-2xl font-bold text-gold">{coins.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">BBPW</div>
                </div>
              ))}
            </div>
          </div>

          <Button
            className="w-full bg-primary text-black font-bold hover:bg-primary/90 flex items-center justify-center gap-2"
            onClick={() => save.mutate(form)}
            disabled={save.isPending}
          >
            <Save className="w-4 h-4" />
            {save.isPending ? "Saving…" : "Save Settings"}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}