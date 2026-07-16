import { AppLayout } from "@/components/layout/app-layout";
import { useGetNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, getGetNotificationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Gift, Users, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function Notifications() {
  const { data: notifications, isLoading } = useGetNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();

  const handleMarkRead = (id: number) => {
    markRead.mutate({ notificationId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      }
    });
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      }
    });
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'prediction_won': return <Trophy className="w-5 h-5 text-primary" />;
      case 'prediction_lost': return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'friend_request': return <Users className="w-5 h-5 text-blue-400" />;
      case 'daily_reward': return <Gift className="w-5 h-5 text-gold" />;
      case 'match_reminder': return <Clock className="w-5 h-5 text-orange-400" />;
      default: return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-3xl mx-auto pb-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Notifications</h1>
            <p className="text-muted-foreground">Stay updated on your predictions and network.</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="border-white/10 hover:bg-white/5">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Mark all read
            </Button>
          )}
        </div>

        <Card className="glass border-white/5">
          <CardContent className="p-0">
            {notifications && notifications.length > 0 ? (
              <div className="divide-y divide-white/5">
                {notifications.map((notification, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={notification.id} 
                    className={`flex items-start gap-4 p-5 transition-colors ${!notification.isRead ? 'bg-primary/5' : 'hover:bg-white/5'}`}
                    onClick={() => !notification.isRead && handleMarkRead(notification.id)}
                    style={{ cursor: !notification.isRead ? 'pointer' : 'default' }}
                  >
                    <div className={`mt-1 p-2 rounded-full ${!notification.isRead ? 'bg-primary/10' : 'bg-black/50'}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`font-semibold ${!notification.isRead ? 'text-white' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground/80 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>You're all caught up. No new notifications.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

import { Bell } from "lucide-react";