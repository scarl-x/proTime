import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import pool from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import timeSlotsRoutes from './routes/timeSlots.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import taskCategoriesRoutes from './routes/taskCategories.routes.js';
import leaveRequestsRoutes from './routes/leaveRequests.routes.js';
import bookingsRoutes from './routes/bookings.routes.js';
import { runAutoMigration } from './utils/autoMigration.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Безопасность заголовков
app.use(compression()); // Сжатие ответов
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Маршруты
app.get('/', (req, res) => {
  res.json({ message: 'ProTime API Server', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/time-slots', timeSlotsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/task-categories', taskCategoriesRoutes);
app.use('/api/leave-requests', leaveRequestsRoutes);
app.use('/api/bookings', bookingsRoutes);

// Обработка ошибок
app.use(notFound);
app.use(errorHandler);

// Проверка подключения к базе данных и запуск сервера
const startServer = async () => {
  try {
    // Проверяем подключение к БД
    await pool.query('SELECT NOW()');
    console.log('✅ Подключение к базе данных PostgreSQL успешно');
    
    // Запускаем автоматическую миграцию
    await runAutoMigration();
    
    // Запускаем сервер
    app.listen(PORT, () => {
      console.log(`\n🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📍 API доступен по адресу: http://localhost:${PORT}`);
      console.log(`🌍 Окружение: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error);
    console.error('💡 Проверьте настройки в файле server/.env');
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM получен. Завершение работы...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT получен. Завершение работы...');
  process.exit(0);
});

