-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bookings" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "bookingTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "inspirationImages" TEXT[],
    "currentHairImages" JSONB,
    "loyaltyPointsEarned" INTEGER,
    "customerLoyaltyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feedback" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "serviceRating" INTEGER NOT NULL,
    "staffRating" INTEGER,
    "overallRating" INTEGER NOT NULL,
    "comments" TEXT,
    "serviceUsed" TEXT,
    "staffMember" TEXT,
    "wouldRecommend" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."loyalty_programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pointsPerBooking" INTEGER NOT NULL DEFAULT 10,
    "pointsPerDollar" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "rewardThreshold" INTEGER NOT NULL DEFAULT 100,
    "rewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer_loyalty" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "totalPointsRedeemed" INTEGER NOT NULL DEFAULT 0,
    "rewardsRedeemed" INTEGER NOT NULL DEFAULT 0,
    "lastActivity" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_loyalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."points_history" (
    "id" TEXT NOT NULL,
    "customerLoyaltyId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "bookingId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "public"."staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customer_loyalty_customerEmail_key" ON "public"."customer_loyalty"("customerEmail");

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_customerLoyaltyId_fkey" FOREIGN KEY ("customerLoyaltyId") REFERENCES "public"."customer_loyalty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."points_history" ADD CONSTRAINT "points_history_customerLoyaltyId_fkey" FOREIGN KEY ("customerLoyaltyId") REFERENCES "public"."customer_loyalty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
