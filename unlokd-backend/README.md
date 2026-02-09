# UNLOKD Backend

Backend base para el MVP de UNLOKD (NestJS + MySQL + Redis + Prisma).

## Requisitos

- Node.js 20+
- Docker + Docker Compose

## Configuración inicial

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Variables de entorno:
   - Copia `env.example` a `.env` y ajusta valores locales.
   - Para Docker Compose no necesitas cambiar nada si usas el archivo por defecto.
   - El MySQL local expone puerto `3307` (para evitar conflicto con 3306).

## Desarrollo local (sin Docker)

1. Levantar MySQL y Redis localmente.
2. Configurar `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT` en `.env`.
3. Ejecutar:
   ```bash
   npm run start:dev
   ```

## Desarrollo con Docker

```bash
npm run docker:up
```

Para detener servicios:

```bash
npm run docker:down
```

## Health Check

```http
GET /health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2026-02-08T12:00:00.000Z",
  "services": {
    "db": "ok",
    "redis": "ok"
  }
}
```

## Scripts útiles

- `npm run start:dev`: desarrollo con hot reload
- `npm run build`: build de producción
- `npm run docker:up`: levantar stack local
- `npm run docker:down`: detener stack local
