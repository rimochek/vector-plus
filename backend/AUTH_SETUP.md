# Инструкции для использования Authentication API

## Установка и запуск

### 1. Настройка базы данных

Убедитесь, что PostgreSQL установлен и запущен. По умолчанию используются следующие параметры (см. `.env`):

- Host: localhost
- Port: 5432
- User: postgres
- Password: postgres
- Database: vector_plus

Создайте БД, если её нет:

```sql
CREATE DATABASE vector_plus;
```

### 2. Переменные окружения

Скопируйте `.env.example` в **корень проекта** (не в `backend/`) и задайте параметры:

```
# См. .env.example в корне репозитория
DATABASE_URL=postgresql://...
JWT_SECRET=your-secure-secret-key-here
JWT_ACCESS_EXPIRATION=900
FRONTEND_URL=http://localhost:3000
```

### 3. Запуск сервера

```bash
npm run start:dev
```

Сервер запустится на `http://localhost:3000` (или на порту, указанном в PORT)

## API Endpoints

### Sign Up (Регистрация)

**POST** `/auth/signup`

Тело запроса:

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

Ответ:

```json
{
  "message": "User registered successfully",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Login (Вход)

**POST** `/auth/login`

Тело запроса:

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

Ответ:

```json
{
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

## Использование JWT токена

Все защищённые маршруты требуют передачи JWT в заголовке:

```
Authorization: Bearer <your-access-token>
```

## Структура проекта

```
src/
├── auth/
│   ├── auth.controller.ts       # API endpoints
│   ├── auth.service.ts          # Бизнес-логика
│   ├── auth.module.ts           # Module definition
│   └── dto/
│       ├── create-user.dto.ts   # DTO для регистрации
│       └── login.dto.ts         # DTO для входа
├── entities/
│   └── user.entity.ts           # User model для БД
├── app.module.ts                # Main module с конфигурацией БД
└── main.ts                      # Entry point
```

## Примечания

- Пароли хешируются с помощью bcryptjs перед сохранением в БД
- JWT токены генерируются при успешной регистрации и входе
- Email должен быть уникальным
- Пароль должен быть минимум 6 символов
