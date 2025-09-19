-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN     "currentHairImages" JSONB,
ADD COLUMN     "inspirationImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "joinLoyalty" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalPrice" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
