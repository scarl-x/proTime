import express from 'express';
import * as tasksController from '../controllers/tasks.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', tasksController.getAllTasks);
router.get('/:id', tasksController.getTaskById);
router.post('/', tasksController.createTask);
router.put('/:id', tasksController.updateTask);
router.delete('/:id', tasksController.deleteTask);
router.get('/:id/assignments', tasksController.getTaskAssignments);
router.post('/:id/assignments', tasksController.createTaskAssignment);
router.put('/assignments/:assignmentId', tasksController.updateTaskAssignment);
router.delete('/assignments/:assignmentId', tasksController.deleteTaskAssignment);

export default router;

