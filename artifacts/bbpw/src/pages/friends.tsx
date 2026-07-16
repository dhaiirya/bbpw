import { AppLayout } from "@/components/layout/app-layout";
import { useGetFriends, useGetFriendRequests, useSearchUsers, useSendFriendRequest, useRespondFriendRequest, useRemoveFriend, getGetFriendsQueryKey, getGetFriendRequestsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, Check, X, UserMinus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

export default function Friends() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: friends } = useGetFriends();
  const { data: requests } = useGetFriendRequests();
  const { data: searchResults, refetch: doSearch } = useSearchUsers({ q: searchQuery }, {
    query: { enabled: false }
  });

  const sendRequest = useSendFriendRequest({
    mutation: {
      onSuccess: () => {
        toast({ title: "Friend request sent!" });
        setSearchQuery("");
      }
    }
  });

  const respondRequest = useRespondFriendRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFriendsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFriendRequestsQueryKey() });
      }
    }
  });

  const removeFriend = useRemoveFriend({
    mutation: {
      onSuccess: () => {
        toast({ title: "Friend removed." });
        queryClient.invalidateQueries({ queryKey: getGetFriendsQueryKey() });
      }
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length >= 3) {
      doSearch();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl mx-auto pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Friends</h1>
          <p className="text-muted-foreground">Build your network of top predictors.</p>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="bg-card border border-white/5 p-1 w-full md:w-auto">
            <TabsTrigger value="list" className="flex-1 md:flex-none">My Friends ({friends?.length || 0})</TabsTrigger>
            <TabsTrigger value="requests" className="flex-1 md:flex-none">
              Requests 
              {requests && requests.length > 0 && (
                <span className="ml-2 w-5 h-5 bg-primary text-black rounded-full text-xs flex items-center justify-center font-bold">
                  {requests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="add" className="flex-1 md:flex-none">Add Friend</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <Card className="glass border-white/5">
              <CardContent className="p-0">
                {friends && friends.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {friends.map(friend => (
                      <div key={friend.id} className="flex items-center justify-between p-4">
                        <Link href={`/profile/${friend.user.id}`} className="flex items-center gap-4 group">
                          <Avatar>
                            <AvatarImage src={friend.user.avatarUrl || ''} />
                            <AvatarFallback>{friend.user.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-white group-hover:text-primary transition-colors">{friend.user.username}</div>
                            <div className="text-xs text-muted-foreground">Rank #{friend.user.rank || 'N/A'} • {friend.user.coins} Coins</div>
                          </div>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeFriend.mutate({ friendId: friend.user.id })}
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground border-dashed border-white/5 border m-4 rounded-xl">
                    You haven't added any friends yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <Card className="glass border-white/5">
              <CardContent className="p-0">
                {requests && requests.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {requests.map(req => (
                      <div key={req.id} className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={req.fromUser.avatarUrl || ''} />
                            <AvatarFallback>{req.fromUser.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-white">{req.fromUser.username}</div>
                            <div className="text-xs text-muted-foreground">Sent a friend request</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-black/50 border-white/10 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/50"
                            onClick={() => respondRequest.mutate({ requestId: req.id, data: { action: "decline" }})}
                          >
                            <X className="w-4 h-4 mr-1" /> Decline
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-primary text-black hover:bg-primary/90"
                            onClick={() => respondRequest.mutate({ requestId: req.id, data: { action: "accept" }})}
                          >
                            <Check className="w-4 h-4 mr-1" /> Accept
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground border-dashed border-white/5 border m-4 rounded-xl">
                    No pending friend requests.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="mt-6">
            <Card className="glass border-white/5">
              <CardContent className="p-6">
                <form onSubmit={handleSearch} className="flex gap-2 mb-8">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by username..." 
                      className="pl-9 bg-black/50 border-white/10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={searchQuery.length < 3}>Search</Button>
                </form>

                {searchResults && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Results</h3>
                    {searchResults.length > 0 ? (
                      <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden bg-black/20">
                        {searchResults.map(user => (
                          <div key={user.id} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                              <Avatar>
                                <AvatarImage src={user.avatarUrl || ''} />
                                <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-white">{user.username}</div>
                                <div className="text-xs text-muted-foreground">{user.coins} Coins</div>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-primary text-primary hover:bg-primary hover:text-black"
                              onClick={() => sendRequest.mutate({ data: { toUserId: user.id }})}
                              disabled={sendRequest.isPending}
                            >
                              <UserPlus className="w-4 h-4 mr-1" /> Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No users found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}