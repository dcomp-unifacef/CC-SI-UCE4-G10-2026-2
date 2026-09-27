-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARIO', 'LIGEIRAMENTE_ATIVO', 'MODERADAMENTE_ATIVO', 'MUITO_ATIVO', 'EXTREMAMENTE_ATIVO');

-- CreateTable
CREATE TABLE "BodyAssessment" (
    "id" SERIAL NOT NULL,
    "assessment_date" DATE NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "height" DECIMAL(3,2) NOT NULL,
    "activity_level" "ActivityLevel" NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BodyAssessment_patient_id_assessment_date_key" ON "BodyAssessment"("patient_id", "assessment_date");

-- AddForeignKey
ALTER TABLE "BodyAssessment" ADD CONSTRAINT "BodyAssessment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
