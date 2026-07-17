import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/hooks/use-auth';

import NotFound from '@/pages/not-found';
import AuthPage from '@/pages/auth';
import Dashboard from '@/pages/dashboard';
import Matches from '@/pages/matches';
import MatchDetail from '@/pages/match-detail';
import Leaderboard from '@/pages/leaderboard';
import Profile from '@/pages/profile';
import Friends from '@/pages/friends';
import Notifications from '@/pages/notifications';
import Admin from '@/pages/admin';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/matches" component={Matches} />
      <Route path="/matches/:id" component={MatchDetail} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/profile/:userId" component={Profile} />
      <Route path="/friends" component={Friends} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}



export default App;
