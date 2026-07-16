import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";

const PgSession = ConnectPgSimple(session);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day default
      sameSite: "lax",
    },
  })
);

app.use("/api", router);

// In production, serve the compiled React frontend from the same process.
// This means a single Render web service handles both the API and the UI.
if (process.env.NODE_ENV === "production") {
  const { default: path } = await import("path");
  const { createReadStream } = await import("fs");

  // Works whether the CWD is the repo root or the artifact directory.
  const frontendDist = path.resolve(process.cwd(), "artifacts/bbpw/dist/public");

  // express.static is already a dependency (it ships with express).
  app.use(express.static(frontendDist));

  // Catch-all: return index.html so React Router handles client-side navigation.
  app.get("*", (_req, res) => {
    res.setHeader("Content-Type", "text/html");
    createReadStream(path.join(frontendDist, "index.html")).pipe(res);
  });
}

export default app;
