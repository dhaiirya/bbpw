import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Trophy } from "lucide-react";

const authSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  pin: z.string().regex(/^[0-9]{4}$/, "PIN must be exactly 4 digits"),
});

type AuthValues = z.infer<typeof authSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const form = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      username: "",
      pin: "",
    },
  });

  const onSubmit = async (data: AuthValues) => {
    try {
      if (isLogin) {
        await login.mutateAsync({ data: { ...data, rememberMe: true } });
        toast({ title: "Welcome back to BBPW" });
      } else {
        await register.mutateAsync({ data });
        toast({ title: "Account created successfully" });
      }
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error?.response?.data?.error || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex bg-background relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,230,118,0.3)]"
            >
              <Trophy className="w-8 h-8 text-black" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">BBPW</h1>
            <p className="text-muted-foreground">The premier arena for football predictions.</p>
          </div>

          <Card className="glass border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle>{isLogin ? "Enter the Arena" : "Claim Your Spot"}</CardTitle>
              <CardDescription>
                {isLogin 
                  ? "Login with your username and 4-digit PIN" 
                  : "Create an account to start predicting"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. striker99" 
                            className="bg-black/50 border-white/10 focus-visible:ring-primary" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>4-Digit PIN</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="••••" 
                            className="bg-black/50 border-white/10 focus-visible:ring-primary text-center tracking-widest text-lg" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full mt-6 bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(0,230,118,0.3)]"
                    disabled={login.isPending || register.isPending}
                  >
                    {login.isPending || register.isPending ? (
                      <span className="animate-pulse">Processing...</span>
                    ) : (
                      isLogin ? "Login" : "Register"
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already in the arena?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline font-semibold"
                >
                  {isLogin ? "Register now" : "Login here"}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Desktop side graphic */}
      <div className="hidden lg:flex flex-1 relative bg-black items-center justify-center overflow-hidden border-l border-white/5">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518605368461-1e1e38ce8058?auto=format&fit=crop&q=80&w=2000')] opacity-30 bg-cover bg-center grayscale mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
        
        <div className="relative z-10 max-w-lg p-12 text-left">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <Badge variant="glass" className="mb-6 px-4 py-1 text-sm text-primary border-primary/30">
              High Stakes • High Reward
            </Badge>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Every match is a <span className="text-primary">battle of knowledge</span>.
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Analyze the stats. Trust your gut. Put your BBPW coins on the line and rise to the top of the global leaderboard.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="glass p-4 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-gold mb-1">10k+</div>
                <div className="text-sm text-muted-foreground">Daily Predictions</div>
              </div>
              <div className="glass p-4 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-primary mb-1">Live</div>
                <div className="text-sm text-muted-foreground">Match Tracking</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}