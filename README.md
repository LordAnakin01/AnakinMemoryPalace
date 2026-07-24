# Memory Palace (3D)

A method-of-loci practice tool: build a palace, place items at stops, then
click through a 3D room to study and test recall. Progress is saved in your
browser (localStorage) and spaced-repetition scheduling tells you when a
list is due for retesting.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Deploy to Vercel

**Option A — no command line (easiest):**
1. Go to https://vercel.com/new
2. Drag this whole folder onto the page, or connect it via a GitHub repo
   (push this folder to a new GitHub repo first, then "Import Project" in
   Vercel and pick that repo)
3. Vercel auto-detects Next.js — leave settings as default and click Deploy
4. You'll get a live URL in about a minute

**Option B — Vercel CLI:**
```bash
npm install -g vercel
vercel login
vercel        # deploy a preview
vercel --prod # promote to production URL
```

## Notes
- All data lives in your browser's localStorage — nothing is sent to a
  server. Clearing browser data will erase your palaces.
- The 3D room is view-and-click only (orbit/zoom with mouse or touch) —
  there's no first-person walking, by design.
- Built with Next.js, react-three-fiber, and drei.
