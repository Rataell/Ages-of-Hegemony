CREATE TABLE "Game" (
  "id" TEXT NOT NULL,
  "version" BIGINT NOT NULL CHECK ("version" >= 0),
  "snapshot" JSONB NOT NULL,
  CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);
