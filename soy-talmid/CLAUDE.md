# SoyTalmid

App PWA para que los talmidim (estudiantes) den feedback de las clases del Majon.

## Arquitectura Monorepo

Este proyecto es parte de un **monorepo** con dos aplicaciones:

```
cld-code-majon/                   # Raíz del monorepo
├── presentismo-majon/            # App para MEJANJIM (admins)
│   └── ...
└── soy-talmid/                   # App para TALMIDIM (esta app)
    └── ...
```

| App | Audiencia | Puerto | Funcionalidad |
|-----|-----------|--------|---------------|
| **presentismo-majon** | Mejanjim (admins) | 3000 | Asistencia, gestión, reportes, ver feedback |
| **soy-talmid** | Talmidim (estudiantes) | 3001 | Auto-registro, dar feedback, historial |

Ambas apps comparten la **misma base de datos PostgreSQL**.

---

## Stack Tecnológico

- **Framework**: Next.js 16 con App Router
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL (compartida con presentismo-majon)
- **ORM**: Prisma 5.22
- **Estilos**: Tailwind CSS v4
- **Deploy**: Vercel
- **PWA**: Manifest + Service Worker para instalación en celulares
- **Push**: Web Push API (pendiente de implementar completamente)

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts       # Login con email/password
│   │   │   ├── logout/route.ts      # Cerrar sesión
│   │   │   └── registro/route.ts    # Auto-registro con código
│   │   ├── feedback/
│   │   │   ├── route.ts             # GET pendientes, POST enviar
│   │   │   └── [claseId]/route.ts   # Detalle de clase para feedback
│   │   └── historial/route.ts       # Mis feedbacks dados
│   ├── feedback/
│   │   └── [claseId]/page.tsx       # Formulario de feedback
│   ├── historial/page.tsx           # Lista de mis feedbacks
│   ├── login/page.tsx               # Pantalla de login
│   ├── registro/page.tsx            # Auto-registro con código
│   ├── layout.tsx                   # Layout con SW registration
│   └── page.tsx                     # Dashboard (clases pendientes)
├── lib/
│   ├── auth.ts                      # Sesiones con cookies
│   ├── db.ts                        # Instancia de PrismaClient
│   └── push.ts                      # Web Push (parcial)
└── middleware.ts                    # Protección de rutas
```

---

## Flujo de Usuario

```
1. Mejanej comparte código de invitación (ej: "MAJON2025")
2. Talmid visita la app e instala como PWA
3. Se registra: código + email + contraseña
4. Sistema vincula con talmid existente por email
5. Activa notificaciones push (opcional)
6. Asiste a clase → Mejanej toma asistencia
7. Ve clases pendientes de feedback en dashboard
8. Completa feedback (estrellas + comentario por clase y docentes)
9. Ve su historial de feedbacks dados
```

---

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard con clases pendientes de feedback |
| `/login` | Login con email + contraseña |
| `/registro` | Auto-registro en 2 pasos (código → datos) |
| `/feedback/[claseId]` | Formulario de feedback (clase + docentes) |
| `/historial` | Lista de mis feedbacks enviados |

---

## APIs

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/login` | POST | Validar email/password, crear sesión |
| `/api/auth/logout` | POST | Destruir sesión |
| `/api/auth/registro` | POST | Verificar código / Registrar usuario |
| `/api/feedback` | GET | Clases pendientes de feedback |
| `/api/feedback` | POST | Enviar feedback de una clase |
| `/api/feedback/[claseId]` | GET | Detalle de clase para dar feedback |
| `/api/historial` | GET | Mis feedbacks enviados |

---

## Autenticación

- **Sesión**: Cookie `soytalmid_session` con JSON (token, talmidId, nombre, apellido)
- **Duración**: 30 días
- **Registro**: Requiere código de invitación válido + email existente en DB

### Flujo de registro
1. Talmid ingresa código de invitación
2. Sistema verifica que el código existe, está activo y no agotado
3. Talmid ingresa email y contraseña
4. Sistema busca talmid por email (debe existir en DB)
5. Se hashea la contraseña y se guarda en `Talmid.passwordHash`
6. Se incrementa `usosActuales` del código

---

## PWA

### Manifest (`public/manifest.json`)
- Nombre: "SoyTalmid"
- Color: Verde esmeralda (#10b981)
- Display: standalone
- Start URL: `/`

### Service Worker (`public/sw.js`)
- Cache de assets estáticos
- Network-first strategy para APIs
- Manejo de notificaciones push
- Click en notificación abre la app

### Instalación
La app se puede instalar desde:
- Chrome Android: menú → "Agregar a pantalla inicio"
- Safari iOS: compartir → "Agregar a inicio" (requiere iOS 16.4+)

---

## Sistema de Feedback

### Estructura del feedback
```typescript
{
  talmidId: string
  claseId: string
  claseRating: number        // 1-5 estrellas
  claseComentario?: string
  docentesFeedback?: string  // JSON: [{docenteId, rating, comentario}]
}
```

### Reglas
- Solo puede dar feedback de clases a las que asistió (presente o tardanza)
- Un feedback por talmid por clase (unique constraint)
- El feedback NO es anónimo (mejanjim ven quién lo escribió)

---

## Comandos Útiles

```bash
# Desarrollo (puerto 3001 para no colisionar con presentismo-majon)
npm run dev

# Build
npm run build

# Base de datos (usar desde presentismo-majon)
# Las migraciones se hacen SOLO desde presentismo-majon
```

---

## Variables de Entorno

```env
# Base de datos (misma que presentismo-majon)
DATABASE_URL="postgresql://..."

# Para notificaciones push (opcional por ahora)
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:admin@majon.com"

# Para proteger endpoint de cron
CRON_SECRET="tu-secreto"
```

---

## Deploy en Vercel

**Configuración del proyecto:**
- Repository: `matekno/presentismo-majon` (mismo repo que presentismo-majon)
- Root Directory: `soy-talmid`
- Framework: Next.js (detecta automático)
- Variables de entorno: `DATABASE_URL` (misma que presentismo-majon)

---

## Pendiente de Implementar

- [ ] Notificaciones push completas
  - [ ] API `/api/push/subscribe`
  - [ ] API `/api/push/unsubscribe`
  - [ ] API `/api/cron/send-reminders`
  - [ ] Vercel Cron para recordatorios
- [ ] Trigger de notificaciones al tomar asistencia
- [ ] Recordatorio a las 12hs si no llenó feedback

---

## Notas de Implementación

- El schema de Prisma es una **copia** del de presentismo-majon
- Las migraciones se hacen SOLO desde presentismo-majon
- No correr `prisma migrate` desde este proyecto
- Los colores usan verde esmeralda para diferenciarse de presentismo-majon (azul)
