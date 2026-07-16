import { AppLayout } from "@/components/layout/app-layout";
import { useGetMe, useGetUser, useGetUserPredictions, getGetUserQueryKey, getGetUserPredictionsQueryKey, useUpdateUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Crosshair, Medal, Edit2, ShieldAlert } from "lucide-react";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const params = useParams();
  const { data: me } = useGetMe();
  
  // If no params.id, we're viewing our own profile. Otherwise, the requested profile.
  const isOwnProfile = !params.userId || parseInt(params.userId) === me?.id;
  const targetUserId = isOwnProfile ? me?.id : parseInt(params.userId!);

  const { data: profileData, isLoading: loadingProfile } = useGetUser(targetUserId!, {
    query: {
      enabled: !!targetUserId,
      queryKey: getGetUserQueryKey(targetUserId!)
    }
  });

  const { data: predictions, isLoading: loadingPredictions } = useGetUserPredictions(targetUserId!, {
    query: {
      enabled: !!targetUserId,
      queryKey: getGetUserPredictionsQueryKey(targetUserId!)
    }
  });

  const updateUser = useUpdateUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleUpdateProfile = () => {
    if (!me) return;
    updateUser.mutate({
      userId: me.id,
      data: { avatarUrl }
    }, {
      onSuccess: () => {
        toast({ title: "Profile updated" });
        setIsEditOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(me.id) });
      }
    });
  };

  if (loadingProfile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!profileData) {
    return (
      <AppLayout>
        <div className="text-center py-12">User not found</div>
      </AppLayout>
    );
  }

  const user = profileData.user;

  return (
    <AppLayout>
      <div className="space-y-8 pb-8 max-w-5xl mx-auto">
        {/* Profile Header */}
        <Card className="glass border-white/5 overflow-hidden border-t-4 border-t-primary">
          <div className="h-32 bg-gradient-to-r from-primary/20 via-black to-black" />
          <CardContent className="px-8 pb-8 pt-0 relative">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-background shadow-xl ring-2 ring-primary/20">
                  <AvatarImage src={user.avatarUrl || ''} className="object-cover" />
                  <AvatarFallback className="bg-secondary text-4xl">{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                      <button className="absolute bottom-0 right-0 p-2 bg-primary text-black rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Avatar URL</Label>
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleUpdateProfile} disabled={updateUser.isPending}>
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left mb-2">
                <h1 className="text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-3">
                  {user.username}
                  {user.isAdmin && <ShieldAlert className="w-5 h-5 text-red-500" title="Admin" />}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                  <Badge variant="glass" className="border-white/10 text-gold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gold"></span>
                    {user.coins.toLocaleString()} BBPW
                  </Badge>
                  {user.rank && (
                    <Badge variant="glass" className="border-white/10 text-muted-foreground flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Rank #{user.rank}
                    </Badge>
                  )}
                  <Badge variant="glass" className="border-white/10 text-muted-foreground">
                    Joined {format(new Date(user.createdAt), "MMM yyyy")}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass border-white/5 bg-black/40">
            <CardContent className="p-6 text-center">
              <Trophy className="w-6 h-6 text-gold mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{user.wins}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Wins</div>
            </CardContent>
          </Card>
          <Card className="glass border-white/5 bg-black/40">
            <CardContent className="p-6 text-center">
              <Crosshair className="w-6 h-6 text-red-500 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{user.losses}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Losses</div>
            </CardContent>
          </Card>
          <Card className="glass border-white/5 bg-black/40">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{user.accuracy}%</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Win Rate</div>
            </CardContent>
          </Card>
          <Card className="glass border-white/5 bg-black/40">
            <CardContent className="p-6 text-center">
              <Medal className="w-6 h-6 text-purple-400 mx-auto mb-2 opacity-80" />
              <div className="text-2xl font-bold">{user.badges?.length || 0}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Badges</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Prediction History */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            {loadingPredictions ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse">Loading history...</div>
            ) : predictions && predictions.length > 0 ? (
              <div className="space-y-4">
                {predictions.map(({ prediction, match }) => (
                  <Card key={prediction.id} className="glass border-white/5">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row items-center p-4 gap-4">
                        <div className="w-full sm:w-auto flex-1">
                          <div className="text-xs text-muted-foreground mb-1">
                            {format(new Date(match.kickoffAt), "MMM d, yyyy")} • {match.leagueLabel}
                          </div>
                          <div className="font-semibold text-white">
                            {match.homeTeam} vs {match.awayTeam}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Pick</div>
                            <div className="font-bold text-white uppercase">{prediction.prediction}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Stake</div>
                            <div className="font-bold text-gold">{prediction.stake}</div>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <div className="text-xs text-muted-foreground">Result</div>
                            {prediction.outcome === "win" ? (
                              <span className="font-bold text-primary">+{prediction.payout}</span>
                            ) : prediction.outcome === "loss" ? (
                              <span className="font-bold text-destructive">-{prediction.stake}</span>
                            ) : (
                              <span className="font-bold text-muted-foreground">PENDING</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass border-white/5 border-dashed">
                <CardContent className="p-12 text-center text-muted-foreground">
                  No prediction history yet.
                </CardContent>
              </Card>
            )}
          </div>

          {/* Badges (Sidebar) */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Badges</h2>
            <Card className="glass border-white/5">
              <CardContent className="p-6">
                {user.badges && user.badges.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.badges.map(badge => (
                      <Badge key={badge} variant="glass" className="py-2 px-3 bg-white/5 border-white/10 text-sm">
                        <Medal className="w-4 h-4 mr-2 text-primary" />
                        {badge.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Medal className="w-12 h-12 mx-auto opacity-20 mb-2" />
                    <p>No badges earned yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}