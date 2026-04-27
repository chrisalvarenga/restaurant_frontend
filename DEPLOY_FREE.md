# Deploy Gratis (0 cobros) - Backend + Frontend

Este flujo evita proveedores con plan de pago. Usa tu PC como servidor y publica con Cloudflare Tunnel gratis.

## 1) Requisitos

- Node.js 20+
- MySQL local corriendo
- Cuenta gratis de Cloudflare
- Un dominio en Cloudflare (puede ser barato, pero Cloudflare Tunnel no cobra)

## 2) Variables de entorno seguras

Archivo `.env` en backend (ejemplo):

```env
DATABASE_URL="mysql://user:password@127.0.0.1:3306/restaurant_app"
DEFAULT_BUSINESS_NAME="Mi Negocio"
SUPER_ADMIN_EMAIL="admin@tu-dominio.com"
SUPER_ADMIN_NAME="Admin"
SUPER_ADMIN_PASSWORD="Cambia-Esta-Password-Larga"
FRONTEND_ORIGIN="https://app.tu-dominio.com"
PORT=3001
JWT_SECRET="Crea-Un-Secreto-Largo-Aleatorio-64-chars"
ADMIN_PIN="726451"
KITCHEN_PIN="839205"
```

Archivo `.env` en frontend:

```env
VITE_API_URL="https://api.tu-dominio.com/api"
VITE_SOCKET_URL="https://api.tu-dominio.com"
```

## 3) Preparar backend

```bash
cd backend
npm install
npm run prisma:deploy
npm run seed:super-admin
npm run start:prod
```

Verifica healthcheck:

```bash
curl http://localhost:3001/health
```

Debe responder `{"ok":true,"service":"restaurant-backend"}`.

## 4) Preparar frontend

```bash
cd frontend
npm install
npm run build
```

Para servir frontend gratis desde tu PC puedes usar:

```bash
npx serve -s dist -l 5173
```

## 5) Publicar gratis con Cloudflare Tunnel

Instala `cloudflared` y autentica:

```bash
cloudflared tunnel login
cloudflared tunnel create restaurant-app
```

Configura `~/.cloudflared/config.yml` (ajusta dominio):

```yml
tunnel: restaurant-app
credentials-file: C:\Users\TU_USUARIO\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: api.tu-dominio.com
    service: http://localhost:3001
  - hostname: app.tu-dominio.com
    service: http://localhost:5173
  - service: http_status:404
```

Asocia DNS:

```bash
cloudflared tunnel route dns restaurant-app api.tu-dominio.com
cloudflared tunnel route dns restaurant-app app.tu-dominio.com
```

Inicia túnel:

```bash
cloudflared tunnel run restaurant-app
```

## 6) Arranque automático en Windows (opcional)

Usa Task Scheduler para arrancar al iniciar sesión:

- Backend: `npm run start:prod` en carpeta `backend`
- Frontend estático: `npx serve -s dist -l 5173` en carpeta `frontend`
- Tunnel: `cloudflared tunnel run restaurant-app`

## 7) Limpieza de secretos en historial Git

Importante: si ya subiste secretos alguna vez, rotarlos y limpiar historial.

Backend:

```bash
cd backend
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- --all
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force --all
git push --force --tags
```

Si usaste archivo de credenciales en raíz, ejecuta lo mismo en ese repo eliminando `credential.txt`.

## 8) Checklist pre-producción

- [ ] `JWT_SECRET`, `ADMIN_PIN`, `KITCHEN_PIN` cambiados por valores fuertes
- [ ] `SUPER_ADMIN_PASSWORD` rotada
- [ ] Frontend apuntando a dominio público
- [ ] `FRONTEND_ORIGIN` actualizado al dominio real
- [ ] `/health` responde OK
- [ ] PIN login funciona en `/admin` y `/kitchen`
- [ ] Socket en cocina recibe pedidos en tiempo real

## Nota importante

Este esquema es 0 cobros, pero depende de que tu PC esté encendida y con Internet.
Para alta disponibilidad real 24/7 normalmente necesitas un VPS o PaaS de pago.