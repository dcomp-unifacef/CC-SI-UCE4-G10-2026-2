-- CreateEnum
CREATE TYPE "BiologicalSex" AS ENUM ('MASCULINO', 'FEMININO');

-- CreateTable
CREATE TABLE "Patient" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "birth_date" DATE NOT NULL,
    "gender" VARCHAR(40) NOT NULL,
    "biological_sex" "BiologicalSex" NOT NULL,
    "cpf" TEXT NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_cpf_key" ON "Patient"("cpf");
