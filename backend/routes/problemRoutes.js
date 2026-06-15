import { Router } from "express";
import { listProblems, getProblem, createProblem } from "../controllers/problemController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/", listProblems);
router.post("/", protect, createProblem);
router.get("/:id", getProblem);

export default router;
