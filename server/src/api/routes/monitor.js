import express from 'express';
import { createMonitorController } from '../controllers/monitor';

const router = express.Router();

router.post('/create', createMonitorController);

export default router;