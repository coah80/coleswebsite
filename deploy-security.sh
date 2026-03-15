#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "=== Security Hardening Deploy ==="
echo ""

# Check supabase CLI is available
if ! command -v supabase &> /dev/null; then
  echo "ERROR: supabase CLI not found. Install it:"
  echo "  brew install supabase/tap/supabase"
  exit 1
fi

# Step 1: Run the RLS migration
echo "[1/5] Applying RLS policies to lock down the database..."
supabase db push
echo "  Done."
echo ""

# Step 2: Deploy admin-operations (the big one)
echo "[2/5] Deploying admin-operations edge function..."
supabase functions deploy admin-operations --no-verify-jwt
echo "  Done."
echo ""

# Step 3: Deploy other functions with restricted CORS
echo "[3/5] Deploying steam-games edge function..."
supabase functions deploy steam-games --no-verify-jwt
echo "  Done."
echo ""

echo "[4/5] Deploying igdb-cover edge function..."
supabase functions deploy igdb-cover --no-verify-jwt
echo "  Done."
echo ""

echo "[5/5] Deploying steam-wishlist-scraper edge function..."
supabase functions deploy steam-wishlist-scraper --no-verify-jwt
echo "  Done."
echo ""

echo "==================================="
echo "ALL DONE. Your site is hardened."
echo ""
echo "What changed:"
echo "  - RLS policies: nobody can write to projects/social_links/submissions"
echo "    without the service role key (your admin edge function has it)"
echo "  - CORS: edge functions only accept requests from coah80.com"
echo "  - Rate limiting: 5 login attempts/min, 60 admin ops/min"
echo "  - Daily rotating tokens"
echo ""
echo "NEXT STEPS:"
echo "  1. Log out and back into /admin (token format changed)"
echo "  2. Delete the toad/anti-toad garbage from the admin dashboard"
echo "  3. Build and redeploy your frontend (npm run build + deploy)"
echo "==================================="
