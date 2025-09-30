import { SignJWT, jwtVerify, decodeJwt, JWTPayload as JoseJWTPayload } from 'jose';
import { User } from '../types';

// Секретный ключ для подписи JWT токенов
// В реальном приложении это должно быть в переменных окружения
const JWT_SECRET = new TextEncoder().encode('your-super-secret-jwt-key-change-in-production');

// Время жизни токена (24 часа)
const JWT_EXPIRES_IN = '24h';

export interface JWTPayload extends JoseJWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Создает JWT токен для пользователя
 */
export const createJWTToken = async (user: User): Promise<string> => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);

  return jwt;
};

/**
 * Проверяет и декодирует JWT токен
 */
export const verifyJWTToken = async (token: string): Promise<JWTPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

/**
 * Проверяет, не истек ли токен
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeJwt(token) as JWTPayload;
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Сохраняет токен в localStorage
 */
export const saveTokenToStorage = (token: string): void => {
  try {
    localStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Error saving token to localStorage:', error);
  }
};

/**
 * Получает токен из localStorage
 */
export const getTokenFromStorage = (): string | null => {
  try {
    return localStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error getting token from localStorage:', error);
    return null;
  }
};

/**
 * Удаляет токен из localStorage
 */
export const removeTokenFromStorage = (): void => {
  try {
    localStorage.removeItem('auth_token');
  } catch (error) {
    console.error('Error removing token from localStorage:', error);
  }
};

/**
 * Проверяет валидность токена и возвращает данные пользователя
 */
export const validateStoredToken = async (): Promise<JWTPayload | null> => {
  const token = getTokenFromStorage();
  
  if (!token) {
    return null;
  }

  // Проверяем, не истек ли токен
  if (isTokenExpired(token)) {
    removeTokenFromStorage();
    return null;
  }

  // Проверяем подпись токена
  return await verifyJWTToken(token);
};
