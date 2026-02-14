# UNLOKD – Setup en instancia AWS (Amazon Linux 2023)

Guía paso a paso para desplegar la aplicación en una instancia EC2 con **Amazon Linux 2023**. Se asume que ya tienes la instancia creada y acceso por consola (SSH o AWS Session Manager).

---

## 1. Conectar a la instancia

**Opción A – SSH con clave (.pem)**  
Desde tu máquina local (reemplaza `TU_KEY.pem` y `TU_IP_PUBLICA`). El usuario por defecto en Amazon Linux 2023 es `ec2-user`:

```bash
chmod 400 TU_KEY.pem
ssh -i TU_KEY.pem ec2-user@TU_IP_PUBLICA
```

**Opción B – AWS Systems Manager (Session Manager)**  
En la consola EC2: selecciona la instancia → **Connect** → pestaña **Session Manager** → **Connect**. Se abrirá una terminal en el navegador.

---

## 2. Abrir puertos en AWS

En la consola AWS: **EC2** → **Security Groups** → grupo asociado a tu instancia.

Añade reglas de entrada (Inbound rules):

| Type   | Port | Source     | Uso              |
|--------|------|------------|------------------|
| SSH    | 22   | Tu IP / 0.0.0.0/0 | Acceso SSH       |
| HTTP   | 80   | 0.0.0.0/0  | Web (o proxy)    |
| HTTPS  | 443  | 0.0.0.0/0  | HTTPS (o proxy)  |
| Custom | 3000 | 0.0.0.0/0  | API (si no usas proxy) |
| Custom | 5173 | 0.0.0.0/0  | Frontend (si no usas proxy) |

Para pruebas rápidas puedes abrir 3000 y 5173; en producción es mejor usar solo 80/443 con un reverse proxy.

---

## 3. Instalar Docker y Docker Compose (en la instancia)

En Amazon Linux 2023 se usa `dnf` como gestor de paquetes. Conectado por SSH/Session Manager, ejecuta:

```bash
sudo dnf update -y
sudo dnf install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

Para Docker Compose (plugin): si está en los repos, instálalo con:

```bash
sudo dnf install -y docker-compose-plugin
```

Si `docker-compose-plugin` no está disponible, instala el binario de Docker Compose. Usa esta URL (importante: `linux` en minúsculas y `${ARCH}`; una URL mal escrita descarga HTML en lugar del binario):

```bash
COMPOSE_VERSION="v5.0.2"
ARCH=$(uname -m)
URL="https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-${ARCH}"
sudo curl -L "$URL" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

**Docker Buildx (requerido para `docker compose build`)**  
Si al ejecutar `docker compose ... up --build` aparece *"compose build requires buildx 0.17.0 or later"*, instala el plugin Buildx:

```bash
BUILDX_VERSION="v0.31.1"
ARCH=$(uname -m)
[ "$ARCH" = "x86_64" ] && BUILDX_ARCH="amd64" || BUILDX_ARCH="arm64"
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -L "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-${BUILDX_ARCH}" -o /usr/local/lib/docker/cli-plugins/docker-buildx
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx
docker buildx version
```

Cierra sesión y vuelve a conectar para que el grupo `docker` se aplique, o en la misma sesión:

```bash
newgrp docker
```

Comprueba:

```bash
docker --version
docker compose version
# o, si usaste el binario: docker-compose --version
```

---

## 4. Clonar el repositorio

Si no tienes `git` instalado (comprobar con `git --version`):

```bash
sudo dnf install -y git
```

Sustituye `<URL_DEL_REPO>` por la URL de tu repo (HTTPS o SSH):

```bash
cd ~
git clone <URL_DEL_REPO> AI4Devs-finalproject
cd AI4Devs-finalproject/unlokd-backend
```

Si el repo es privado, configura SSH o un token en la instancia, o sube el código por otro medio (scp, zip, etc.).

---

## 5. Configurar variables para producción

La URL pública y CORS para la instancia EC2 ya están definidos en **`docker-compose.prod.yml`** (host `ec2-18-188-12-41.us-east-2.compute.amazonaws.com`). No hace falta editar URLs en archivos.

Opcional: para **JWT_SECRET** y **MYSQL_ROOT_PASSWORD** en producción, puedes exportar variables antes de levantar o usar un `.env` solo con secretos:

```bash
export JWT_SECRET=$(openssl rand -base64 32)
export MYSQL_ROOT_PASSWORD=<tu-password-seguro>
# Luego: docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Si cambias de host (otra EC2 o dominio), edita `docker-compose.prod.yml` y actualiza las URLs ahí.

---

## 6. Construir y levantar contenedores

Desde `unlokd-backend/` usa el override de producción (URL y CORS ya vienen en `docker-compose.prod.yml`). Si aparece *"compose build requires buildx 0.17.0 or later"*, instala Buildx (sección 3).

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Verifica que todo esté en ejecución (usa los mismos `-f` que en el `up`):

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps -a
```

Deberías ver: `backend`, `frontend`, `mysql`, `redis` en estado **Up**. Si **backend** no aparece o sale como **Exited**:

- Ver los logs del backend:  
  `docker compose -f docker-compose.yml -f docker-compose.prod.yml logs backend`
- Suele deberse a que la base de datos aún no está lista o faltan migraciones. Espera unos segundos y vuelve a levantar solo el backend:  
  `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend`  
  o ejecuta antes las migraciones (sección 7) y luego `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend`.

---

## 7. Ejecutar migraciones de base de datos

El backend se conecta a MySQL por el puerto **3306** (correcto): dentro de la red Docker el servicio `mysql` escucha en 3306. El **3307** del `docker-compose.yml` es solo el puerto en el *host* para acceder a MySQL desde fuera; no hace falta usarlo en `DATABASE_URL`.

Si al ejecutar `migrate deploy` sale *"No migration found in prisma/migrations"* y *"No pending migrations to apply"*, suele ser porque la imagen del backend se construyó sin la carpeta de migraciones (o con una versión antigua del repo). Usa la carpeta del host montando un volumen:

```bash
cd ~/AI4Devs-finalproject/unlokd-backend
# o, si estás en root: cd /root/AI4Devs-finalproject/unlokd-backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml run --rm -v "$(pwd)/prisma:/app/prisma" backend npx prisma migrate deploy
```

Ese comando usa el `prisma/migrations` de tu servidor (donde clonaste el repo), se conecta a la base del stack y aplica las migraciones. Si prefieres que la imagen lleve las migraciones, tras un `git pull` vuelve a construir la imagen del backend y luego ejecuta el comando normal:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

(Opcional) Si tienes seeds para datos de prueba:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma db seed
```

---

## 8. Verificación

- **API**:  
  `curl -i http://TU_IP_PUBLICA:3000/health`  
  Debe devolver 200.

- **Frontend**:  
  Abre en el navegador: `http://TU_IP_PUBLICA:5173`  
  Prueba login, chat y perfil.

- **WebSocket**:  
  Si el frontend se conecta al backend y ves mensajes en tiempo real, el WS está bien.

---

## 9. (Opcional) Dominio y HTTPS

1. Asigna un **Elastic IP** a la instancia (EC2 → Elastic IPs) para que la IP no cambie.
2. Apunta el DNS de tu dominio (A record) a esa IP.
3. Instala Nginx (o Traefik) en la instancia como reverse proxy:
   - `http://tudominio.com` → proxy a `localhost:5173` (frontend).
   - `http://tudominio.com/api`, `/health`, WebSocket → proxy a `localhost:3000` (backend).
4. Instala Certbot y obtén certificados Let's Encrypt para HTTPS.

Ejemplo mínimo Nginx (sustituye `tudominio.com`):

```nginx
# Frontend
server {
    listen 80;
    server_name tudominio.com;
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Backend API
server {
    listen 80;
    server_name api.tudominio.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Luego: `sudo certbot --nginx -d tudominio.com -d api.tudominio.com`.

No olvides actualizar `VITE_API_BASE_URL` y `VITE_WS_BASE_URL` a `https://api.tudominio.com` y volver a construir el frontend (`docker compose up -d --build` en `unlokd-backend`).

---

## 10. Actualizaciones futuras

```bash
cd ~/AI4Devs-finalproject
git pull
cd unlokd-backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

Si no tienes Buildx instalado, ver sección 3.

---

## Resumen de comandos (copy-paste)

```bash
# En la instancia Amazon Linux 2023
sudo dnf update -y
sudo dnf install -y docker
sudo systemctl start docker && sudo systemctl enable docker
sudo usermod -aG docker $USER
# Docker Compose: sudo dnf install -y docker-compose-plugin
# O binario: COMPOSE_VERSION=v5.0.2 ARCH=$(uname -m); sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-${ARCH}" -o /usr/local/bin/docker-compose; sudo chmod +x /usr/local/bin/docker-compose
# Reconectar sesión o: newgrp docker

cd ~
git clone <URL_DEL_REPO> AI4Devs-finalproject
cd AI4Devs-finalproject/unlokd-backend

# Producción: usar docker-compose.prod.yml (URL EC2 ya configurada). Opcional: .env para JWT_SECRET y MYSQL_ROOT_PASSWORD
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Verificar
curl -i http://localhost:3000/health
docker compose ps
```

Luego abre en el navegador: `http://<IP_PUBLICA>:5173`.
