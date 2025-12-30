-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AssignmentType" ADD VALUE 'CLASSWORK';
ALTER TYPE "AssignmentType" ADD VALUE 'EXAM';

-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'ESSAY';

-- AlterTable
ALTER TABLE "academic_periods" ADD COLUMN     "excludeSaturday" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "excludeSunday" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "excludeWeekends" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "totalSchoolDays" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "class_subjects" ADD COLUMN     "assignmentWeight" DECIMAL(5,2) NOT NULL DEFAULT 5,
ADD COLUMN     "classTestWeight" DECIMAL(5,2) NOT NULL DEFAULT 10,
ADD COLUMN     "classworkWeight" DECIMAL(5,2) NOT NULL DEFAULT 10,
ADD COLUMN     "endOfTermWeight" DECIMAL(5,2) NOT NULL DEFAULT 15,
ADD COLUMN     "examWeight" DECIMAL(5,2) NOT NULL DEFAULT 10,
ADD COLUMN     "homeworkWeight" DECIMAL(5,2) NOT NULL DEFAULT 10,
ADD COLUMN     "hoursPerWeek" DECIMAL(4,2) NOT NULL DEFAULT 0,
ADD COLUMN     "midTermWeight" DECIMAL(5,2) NOT NULL DEFAULT 15,
ADD COLUMN     "projectWeight" DECIMAL(5,2) NOT NULL DEFAULT 5,
ADD COLUMN     "quizWeight" DECIMAL(5,2) NOT NULL DEFAULT 10,
ADD COLUMN     "testWeight" DECIMAL(5,2) NOT NULL DEFAULT 10;
