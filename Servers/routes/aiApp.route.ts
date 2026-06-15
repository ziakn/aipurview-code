import express from "express";
const router = express.Router();

import {
  createAiApp,
  deleteAiAppById,
  getAllAiApps,
  getAiAppById,
  updateAiAppById,
} from "../controllers/aiApp.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllAiApps);
router.get("/:id", authenticateJWT, getAiAppById);

// POST, PATCH, DELETE requests
router.post("/", authenticateJWT, createAiApp);
router.patch("/:id", authenticateJWT, updateAiAppById);
router.delete("/:id", authenticateJWT, deleteAiAppById);

export default router;
