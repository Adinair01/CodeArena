import { Router } from "express";
import { submit, mySubmissions } from "../controllers/solutionController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/", protect, submit);
router.get("/me", protect, mySubmissions);

export default router;
