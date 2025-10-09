import express from 'express';
import * as usersController from '../controllers/users.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

router.get('/', usersController.getAllUsers);
router.get('/:id', usersController.getUserById);
router.post('/', requireAdmin, usersController.createUser);
router.put('/:id', requireAdmin, usersController.updateUser);
router.delete('/:id', requireAdmin, usersController.deleteUser);
router.post('/:id/account', requireAdmin, usersController.createAccount);
router.delete('/:id/account', requireAdmin, usersController.removeAccount);

export default router;

