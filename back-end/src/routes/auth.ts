import { Router } from "express"
import * as controller from "../controllers/authController"
import { authenticate } from "../middlewares/auth"

const router = Router();

router.post("/login", controller.login);
router.get("/me", authenticate, controller.me);

export default router;