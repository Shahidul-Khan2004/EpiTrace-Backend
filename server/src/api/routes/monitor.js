import express from "express";
import {
  createMonitorController,
  startMonitorController,
  pauseMonitorController
} from "../controllers/monitor.js";

const router = express.Router();

router.post("/create", createMonitorController);
router.post("/start/:id", startMonitorController);
router.post("/pause/:id", pauseMonitorController);

export default router;
