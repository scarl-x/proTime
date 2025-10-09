import express from 'express';
import * as taskCategoriesController from '../controllers/taskCategories.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', taskCategoriesController.getAllTaskCategories);
router.get('/:id', taskCategoriesController.getTaskCategoryById);
router.post('/', taskCategoriesController.createTaskCategory);
router.put('/:id', taskCategoriesController.updateTaskCategory);
router.delete('/:id', taskCategoriesController.deleteTaskCategory);

export default router;

