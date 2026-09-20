CREATE TABLE "AlphaMatch" (
    "id" TEXT NOT NULL,
    "joinCode" TEXT NOT NULL,
    "version" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AlphaMatch_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AlphaMatch_joinCode_key" ON "AlphaMatch"("joinCode");
