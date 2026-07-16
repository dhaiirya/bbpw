import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import matchesRouter from "./matches";
import predictionsRouter from "./predictions";
import leaderboardRouter from "./leaderboard";
import friendsRouter from "./friends";
import notificationsRouter from "./notifications";
import rewardsRouter from "./rewards";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(matchesRouter);
router.use(predictionsRouter);
router.use(leaderboardRouter);
router.use(friendsRouter);
router.use(notificationsRouter);
router.use(rewardsRouter);
router.use(adminRouter);

export default router;
