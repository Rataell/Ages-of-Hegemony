CREATE TABLE "AlphaMatchArchive" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "version" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlphaMatchArchive_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AlphaMatchArchive_matchId_idx" ON "AlphaMatchArchive"("matchId");
CREATE UNIQUE INDEX "AlphaMatchArchive_matchId_version_key" ON "AlphaMatchArchive"("matchId", "version");
