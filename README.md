# 🧱 LegoSim 3D — Руководство по запуску на сервере и безопасности

3D-игра и симулятор LEGO со свободным строительством, физикой Cannon-es и симуляцией жизни лего-человечков в стиле The Sims.

---

## 🚀 Способ 1: Запуск через Node.js (Локальный сервер / VPS)

### 1. Требования
- **Node.js**: версия 20+ (рекомендуется LTS 22+)
- **NPM**: версия 10+

### 2. Установка зависимостей и сборка
```bash
# 1. Установите зависимости
npm install

# 2. Соберите клиентскую часть для продакшена
npm run build

# 3. Запустите защищённый продакшен-сервер
npm start
```
Сервер запустится на `http://0.0.0.0:3000`.

---

## 🐳 Способ 2: Запуск в Docker (Рекомендуемый для продакшена)

В проекте настроен многоэтапный безопасный `Dockerfile` с запуском от непривилегированного пользователя `node` и встроенным мониторингом здоровья (`HEALTHCHECK`).

### Сборка и запуск:
```bash
# 1. Сборка контейнера
docker build -t legosim3d:latest .

# 2. Запуск контейнера на порту 3000
docker run -d \
  --name legosim \
  --restart unless-stopped \
  -p 3000:3000 \
  legosim3d:latest
```

Проверить статус работы и здоровье контейнера:
```bash
docker ps
curl http://localhost:3000/health
```

---

## ⚡ Способ 3: Запуск через PM2 (для непрерывной работы на VPS)

Для автоматического перезапуска при сбоях и при перезагрузке сервера:

```bash
# Установите PM2 глобально
npm install -g pm2

# Сборка проекта
npm run build

# Запуск процесса
pm2 start server.ts --name "legosim" --time

# Настройка автозапуска при перезагрузке ОС
pm2 startup
pm2 save
```

---

## 🌐 Способ 4: Настройка Nginx (Reverse Proxy + SSL)

В корне проекта подготовлен файл `nginx.conf`:
1. Скопируйте файл в `/etc/nginx/sites-available/legosim`:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/legosim
   sudo ln -s /etc/nginx/sites-available/legosim /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```
2. Подключите бесплатный SSL-сертификат Let's Encrypt:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

## 🔒 Настройки безопасности (Security Checklist)

Проект полностью оптимизирован с учётом требований корпоративной безопасности:

1. **Защита от XSS и инъекций (CSP)**:
   - В `server.ts` настроен строгий заголовок `Content-Security-Policy`, разрешающий выполнение только доверенных ресурсов, WebGL-шейдеров и текстур.
2. **Защита от MIME-sniffing**:
   - Заголовок `X-Content-Type-Options: nosniff`.
3. **Защита от Clickjacking**:
   - Заголовок `X-Frame-Options: SAMEORIGIN`.
4. **Маскировка сигнатуры сервера**:
   - `x-powered-by` полностью отключён (злоумышленники не видят Express/Node в заголовках ответов).
5. **Защита от DoS**:
   - Ограничение размера принимаемого тела запросов (`limit: '1mb'`).
6. **Безопасность контейнера**:
   - Запуск внутри Docker осуществляется от непривилегированного пользователя `node` (UID 1000), без root-прав.
7. **Graceful Shutdown**:
   - Корректная обработка сигналов `SIGTERM` и `SIGINT` (безопасное завершение соединений без обрыва сессий клиентов).
8. **Эндпоинт проверки работоспособности (Health Check)**:
   - Доступен по пути `/health` для балансировщиков нагрузки (Docker, Kubernetes, AWS, Cloud Run).
