-- Same rationale as 20260916031500_enable_rls_deny_all: Prisma's own
-- bookkeeping table is also public-schema and PostgREST-exposed by default.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
