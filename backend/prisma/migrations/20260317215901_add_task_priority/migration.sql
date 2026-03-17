-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('urgente', 'prioritario', 'normal');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "priority" "TaskPriority" NOT NULL DEFAULT 'normal';
