import express from 'express';
import * as timeSlotsController from '../controllers/timeSlots.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', timeSlotsController.getAllTimeSlots);
router.get('/:id', timeSlotsController.getTimeSlotById);
router.post('/', timeSlotsController.createTimeSlot);
router.put('/:id', timeSlotsController.updateTimeSlot);
router.delete('/:id', timeSlotsController.deleteTimeSlot);

export default router;

