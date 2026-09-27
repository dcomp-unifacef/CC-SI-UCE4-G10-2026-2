import { Router } from "express"
import * as controller from "../controllers/bodyAssessmentController"

const router = Router();

router.get("/", controller.findAll);
router.get("/patient/:patientId", controller.findAllByPatientId);
router.get("/:id", controller.findById);
router.post("/", controller.create);
router.put("/:id", controller.updateById);
router.delete("/:id", controller.remove);

export default router;