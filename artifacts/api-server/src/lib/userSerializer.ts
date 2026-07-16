import type { User } from "@workspace/db";

export function serializeUser(user: User) {
  const total = user.wins + user.losses;
  const accuracy = total > 0 ? Math.round((user.wins / total) * 100) : 0;
  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl ?? null,
    coins: user.coins,
    wins: user.wins,
    losses: user.losses,
    accuracy,
    rank: null,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    lastDailyRewardAt: user.lastDailyRewardAt?.toISOString() ?? null,
    badges: user.badges ?? [],
  };
}
