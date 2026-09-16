-- Enable Row Level Security with no permissive policies (default-deny) on
-- tables exposed via Supabase's auto-generated PostgREST API. The app never
-- talks to Postgres through PostgREST/anon key — Prisma connects as the
-- table-owning `postgres` role, which bypasses RLS entirely, so this only
-- closes off the unused REST API surface without affecting the backend.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transfer" ENABLE ROW LEVEL SECURITY;
