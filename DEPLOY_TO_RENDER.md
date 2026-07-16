# Deploy BBPW to Render (free, no expiration)

Follow these steps once. After that the site stays live 24/7 for free.

---

## Step 1 — Push code to GitHub

1. Go to https://github.com and create a free account (if you don't have one).
2. Create a new **private** repository called `bbpw`.
3. In Replit, open the **Shell** tab and run:

```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/bbpw.git
git add .
git commit -m "initial"
git push -u origin main
```

---

## Step 2 — Create a free database on Neon

1. Go to https://neon.tech and sign up for free.
2. Create a new project → choose a name → click **Create project**.
3. Copy the **Connection string** (it looks like `postgresql://user:pass@host/dbname`).
4. Keep this tab open — you'll need the connection string in Step 4.

---

## Step 3 — Create a Render account and deploy

1. Go to https://render.com and sign up for free (use GitHub to sign in).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repo (`bbpw`).
4. Render will auto-detect the `render.yaml` file. Click **Apply**.

---

## Step 4 — Set environment variables in Render

In your Render service dashboard go to **Environment** and add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | The Neon connection string from Step 2 |
| `SESSION_SECRET` | Any long random string, e.g. `openssl rand -hex 32` in your shell |

Click **Save Changes** — Render will redeploy automatically.

---

## Step 5 — Push the database schema

After the first successful deploy, open the Replit Shell and run:

```bash
DATABASE_URL="<your-neon-connection-string>" pnpm --filter @workspace/db run push
```

This creates all the tables on the Neon database.

---

## Done

Your site will be live at `https://bbpw.onrender.com` (or similar).
- The first request after 15 minutes of inactivity takes ~30 seconds to wake up.
- Everything else is instant.
- No credit card, no expiration.
