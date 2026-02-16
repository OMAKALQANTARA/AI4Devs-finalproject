# UNLOKD - Setup en AWS (Amazon Linux 2023)

Guia para desplegar en EC2 separando **backend y frontend fuera de Docker**.

En esta fase:
- Backend: corre en el host con Node.js + PM2.
- Frontend: se construye en el host y se sirve con Nginx.
- MySQL y Redis: se mantienen temporalmente en Docker para simplificar operacion.

---

## 1. Conectar a la instancia

**SSH con clave (.pem):**

```bash
chmod 400 TU_KEY.pem
ssh -i TU_KEY.pem ec2-user@TU_IP_PUBLICA
```

Si trabajas como `root`, usa rutas bajo `/root`. Si trabajas como `ec2-user`, usa `/home/ec2-user`.

---

## 2. Abrir puertos en AWS

Configura reglas de entrada en el Security Group:

| Tipo   | Puerto | Uso |
|--------|--------|-----|
| SSH    | 22     | Acceso remoto |
| HTTP   | 80     | Frontend por Nginx |
| HTTPS  | 443    | Frontend/API con TLS |
| Custom | 3000   | API backend (si no usas proxy para API) |

Opcional:
- `5173` solo para pruebas locales de frontend, no recomendado en produccion.

---

## 3. Instalar dependencias del host

En Amazon Linux 2023:

```bash
sudo dnf update -y
sudo dnf install -y git nginx docker
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
sudo npm i -g pm2
```

Habilita servicios:

```bash
sudo systemctl enable --now docker
sudo systemctl enable --now nginx
sudo usermod -aG docker $USER
```

Insala Docker Composer
```bash
ARCH=$(uname -m)
COMPOSE_VERSION="v5.0.2"
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-${ARCH}" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version
```

Vuelve a iniciar sesion (o ejecuta `newgrp docker`) para aplicar grupo Docker.

---

## 4. Clonar repositorio

```bash
cd ~
git clone <URL_DEL_REPO> AI4Devs-finalproject
cd AI4Devs-finalproject
```

---

## 5. Levantar solo MySQL y Redis con Docker

Desde `unlokd-backend/`:

```bash
cd ~/AI4Devs-finalproject/unlokd-backend
# o /root/AI4Devs-finalproject/unlokd-backend si usas root
docker compose up -d mysql redis
docker compose ps
```

Notas de puertos:
- `3307:3306` en MySQL significa:
  - Host -> MySQL: `127.0.0.1:3307`
  - Dentro de Docker -> MySQL: `mysql:3306`
- Como backend correra en el host, debe apuntar a `127.0.0.1:3307`.

---

## 6. Configurar y desplegar backend en host (sin Docker)

En `unlokd-backend/.env`, valida:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://root:<MYSQL_ROOT_PASSWORD>@127.0.0.1:3307/unlokd_db
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET=<SECRET_SEGURO>
CORS_ORIGIN=http://TU_DOMINIO_O_IP
```

Instala, migra y construye:

```bash
cd ~/AI4Devs-finalproject/unlokd-backend
npm ci
npx prisma migrate deploy
npm run build
ls -la dist
```

Si aparece `No migration found in prisma/migrations`, el servidor no tiene los archivos SQL de migracion en `unlokd-backend/prisma/migrations/**/migration.sql`.

- Verifica que el repositorio ya incluya esos archivos (haz `git pull` despues de publicar el fix de `.gitignore` y los archivos de migracion).
- Como salida temporal para bootstrap en una instancia nueva, puedes ejecutar:
  - `npx prisma db push`

Levanta backend con PM2:

```bash
pm2 start npm --name unlokd-backend -- run start:prod
pm2 save
pm2 status
```

Si PM2 muestra `script not found`, normalmente `dist/` no existe porque el build no se genero o fallo.
Repite:

```bash
npm run build
ls -la dist
pm2 start npm --name unlokd-backend -- run start:prod
```

Para autoarranque tras reboot:

```bash
pm2 startup
```

PM2 imprimira un comando adicional; ejecutalo exactamente y luego repite `pm2 save`.

---

## 7. Configurar y desplegar frontend en host (sin Docker)

Define variables para build en `unlokd-frontend/.env`:

```env
VITE_API_BASE_URL=http://TU_DOMINIO_O_IP:3000
VITE_WS_BASE_URL=http://TU_DOMINIO_O_IP:3000
```

Construye frontend:

```bash
cd ~/AI4Devs-finalproject/unlokd-frontend
npm ci
npm run build
```

---

## 8. Servir frontend con Nginx

Publica el `dist` en Nginx:

```bash
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r ~/AI4Devs-finalproject/unlokd-frontend/dist/* /usr/share/nginx/html/
sudo systemctl restart nginx
```

Con esto:
- Frontend: `http://TU_DOMINIO_O_IP` (puerto 80)
- Backend: `http://TU_DOMINIO_O_IP:3000`

---

## 9. Verificacion

```bash
curl -i http://TU_DOMINIO_O_IP:3000/health
pm2 status
docker compose -f ~/AI4Devs-finalproject/unlokd-backend/docker-compose.yml ps
```

Prueba en navegador:
- `http://TU_DOMINIO_O_IP` (frontend)
- Login, chat y perfil.

---

## 10. Actualizaciones futuras

```bash
cd ~/AI4Devs-finalproject
git pull

# Backend
cd unlokd-backend
npm ci
npm run build
npx prisma migrate deploy
pm2 restart unlokd-backend

# Frontend
cd ../unlokd-frontend
npm ci
npm run build
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r dist/* /usr/share/nginx/html/
sudo systemctl reload nginx
```

---

## 11. Siguiente paso recomendado

Cuando estabilices esta fase:
- Mueve MySQL a RDS.
- Mueve Redis a ElastiCache.
- Deja Docker fuera del runtime completamente.
# UNLOKD – Setup en instancia AWS (Amazon Linux 2023)

Guía paso a paso para desplegar la aplicación en una instancia EC2 con **Amazon Linux 2023**. Se asume que ya tienes la instancia creada y acceso por consola (SSH o AWS Session Manager).
