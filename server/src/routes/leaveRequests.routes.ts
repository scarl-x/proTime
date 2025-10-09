import express from 'express';
import * as leaveRequestsController from '../controllers/leaveRequests.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', leaveRequestsController.getAllLeaveRequests);
router.get('/:id', leaveRequestsController.getLeaveRequestById);
router.post('/', leaveRequestsController.createLeaveRequest);
router.put('/:id', leaveRequestsController.updateLeaveRequest);
router.delete('/:id', leaveRequestsController.deleteLeaveRequest);
router.post('/:id/approve', leaveRequestsController.approveLeaveRequest);
router.post('/:id/reject', leaveRequestsController.rejectLeaveRequest);

export default router;

