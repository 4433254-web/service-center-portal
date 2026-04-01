-- AlterEnum
ALTER TYPE "FileEntityType" ADD VALUE 'order_photo';

-- AlterTable
ALTER TABLE "repair_orders" ADD COLUMN     "location_id" TEXT,
ADD COLUMN     "transferred_from_location_id" TEXT;

-- CreateTable
CREATE TABLE "service_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_locations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_locations_user_id_idx" ON "user_locations"("user_id");

-- CreateIndex
CREATE INDEX "user_locations_location_id_idx" ON "user_locations"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_locations_user_id_location_id_key" ON "user_locations"("user_id", "location_id");

-- AddForeignKey
ALTER TABLE "service_locations" ADD CONSTRAINT "service_locations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "service_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "service_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_transferred_from_location_id_fkey" FOREIGN KEY ("transferred_from_location_id") REFERENCES "service_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
