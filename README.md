# Recetas de Charly

App web de recetas: crear, compartir y descubrir recetas, con autenticación,
imágenes en la nube e interfaz bilingüe (español / inglés).

**[Ver demo →](https://recetas-de-charly.vercel.app)**

## Features

- Crear, editar y borrar recetas (ingredientes, pasos, tiempos, porciones, dificultad, categorías y tags)
- Recetas públicas o privadas, búsqueda, bookmarks, likes y comentarios
- Modo cocina y escalado de porciones
- Autenticación por email/contraseña (con verificación de email) y Google OAuth
- Subida de imágenes a Cloudflare R2
- Internacionalización español / inglés con next-intl

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Base de datos | Neon (PostgreSQL serverless) |
| ORM | Prisma 7 |
| Auth | NextAuth v5 (credentials + Google OAuth) |
| Imágenes | Cloudflare R2 (S3 compatible) |
| i18n | next-intl (es / en) |
| Estilos | Tailwind CSS 4 + shadcn/ui |
| Email | Nodemailer (verificación de email) |

## Desarrollo

```bash
# Instalar dependencias
npm install

# Variables de entorno (ver tabla abajo) en .env.local

# Generar el cliente de Prisma y sincronizar el esquema
npx prisma generate
npx prisma db push

# (Opcional) datos de ejemplo
npm run seed

# Servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | ✅ | Cadena de conexión de Neon (PostgreSQL) |
| `AUTH_SECRET` | ✅ | Secreto de NextAuth (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL pública de la app (`http://localhost:3000` en dev) |
| `R2_ACCOUNT_ID` | ✅ | Cloudflare R2 account id |
| `R2_ACCESS_KEY_ID` | ✅ | R2 access key |
| `R2_SECRET_ACCESS_KEY` | ✅ | R2 secret key |
| `R2_BUCKET_NAME` | ✅ | Nombre del bucket de R2 |
| `R2_PUBLIC_URL` | ✅ | URL pública base del bucket |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | ➖ | Config de Nodemailer para verificación de email |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ➖ | Google OAuth (opcional) |

## Scripts

| Script | Acción |
|--------|--------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Genera el cliente de Prisma y compila (`prisma generate && next build`) |
| `npm start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run seed` | Datos de ejemplo (`prisma/seed.mjs`) |

Deploy continuo en Vercel desde `master`.
