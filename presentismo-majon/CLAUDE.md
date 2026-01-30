# Presentismo Majon

Sistema de control de asistencia para el Majon (programa educativo judío).

## Arquitectura Monorepo

Este proyecto es parte de un **monorepo** con dos aplicaciones:

```
cld-code-majon/                   # Raíz del monorepo
├── presentismo-majon/            # App para MEJANJIM (esta app)
│   └── ...
└── soy-talmid/                   # App para TALMIDIM (estudiantes)
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
- **Base de datos**: PostgreSQL (Prisma Postgres)
- **ORM**: Prisma 5.22
- **Estilos**: Tailwind CSS v4
- **Deploy**: Vercel (dos proyectos, mismo repo)
- **PWA**: Configurado con manifest.json

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── asistencia/route.ts        # Guardar asistencia de una clase
│   │   ├── auth/                       # Login/logout con cookies
│   │   ├── clases/                     # CRUD de clases
│   │   ├── cronograma/route.ts         # Clases planificadas
│   │   ├── docentes/
│   │   │   ├── route.ts                # Listar/crear docentes
│   │   │   └── [id]/route.ts           # GET/PUT docente individual
│   │   ├── feedback/
│   │   │   ├── route.ts                # Dashboard de feedback (stats)
│   │   │   └── docente/[id]/route.ts   # Feedback por docente
│   │   ├── feriados/route.ts           # Gestionar feriados
│   │   ├── reportes/route.ts           # Estadísticas de asistencia
│   │   └── talmidim/
│   │       ├── route.ts                # Listar talmidim
│   │       └── [id]/
│   │           ├── route.ts            # GET/PUT talmid individual
│   │           └── notas/route.ts      # POST/DELETE notas
│   ├── asistencia/
│   │   ├── page.tsx                    # Lista de clases para tomar asistencia
│   │   └── [id]/page.tsx               # Tomar asistencia de una clase
│   ├── cronograma/page.tsx             # Calendario para planificar clases
│   ├── docentes/
│   │   ├── page.tsx                    # Listado de docentes
│   │   └── [id]/page.tsx               # Ficha con datos, clases y FEEDBACK
│   ├── feedback/page.tsx               # Dashboard de feedback (ranking, stats)
│   ├── feriados/page.tsx               # Gestionar feriados
│   ├── login/page.tsx                  # Autenticación simple
│   ├── reportes/page.tsx               # Estadísticas de asistencia
│   ├── talmidim/
│   │   ├── page.tsx                    # Listado de talmidim
│   │   └── [id]/page.tsx               # Ficha individual con datos, notas e historial
│   └── page.tsx                        # Home con navegación
├── components/
│   └── AsistenciaItem.tsx              # Componente para marcar presente/tarde/ausente
├── lib/
│   ├── auth.ts                         # Funciones de autenticación
│   ├── db.ts                           # Instancia de PrismaClient
│   └── utils.ts                        # Utilidades (fechas, etc)
└── middleware.ts                       # Protección de rutas con auth
```

---

## Modelos de Datos (Prisma)

### Modelos principales
- **Talmid**: Alumnos con datos personales + campos auth (passwordHash, lastLogin, email único)
- **Nota**: Notas categorizadas (academico, conducta, salud, general) por talmid
- **Clase**: Clases planificadas con fecha, título, docentes, horarios
- **ClaseDocente**: Relación N:M entre clases y docentes
- **Asistencia**: Registro de asistencia (presente, tardanza, ausente) con justificación
- **Docente**: Profesores (tipo: mejanej o capacitador)
- **Feriado**: Días sin clase (argentinos, judíos, manuales)
- **Config**: Configuraciones (password de acceso)

### Modelos para SoyTalmid (feedback)
- **Feedback**: Evaluaciones de clase (claseRating 1-5, docentesFeedback JSON)
- **InviteCode**: Códigos de invitación para auto-registro de talmidim
- **PushSubscription**: Suscripciones push por talmid
- **NotificationQueue**: Cola de notificaciones programadas

---

## Sistema de Feedback

### Para Mejanjim (esta app)

**Página `/feedback`** - Dashboard con:
- Stats generales (total feedbacks, promedio clases)
- Ranking de docentes por puntuación
- Feedbacks recientes con comentarios

**Ficha de docente `/docentes/[id]`** - Tab "Feedback":
- Promedio personal del docente
- Lista de evaluaciones recibidas
- Comentarios de talmidim (con nombre visible)

### Para Talmidim (soy-talmid)
- Auto-registro con código de invitación
- Dar feedback de clases a las que asistieron
- Ver historial de feedbacks dados
- Notificaciones push (pendiente de implementar)

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev                  # Iniciar en puerto 3000

# Base de datos
npx prisma generate          # Generar cliente
npx prisma db push           # Sincronizar schema
npx prisma db seed           # Poblar datos iniciales
npx prisma studio            # UI para ver datos

# Build
npm run build                # Build de producción
```

---

## Reglas de Negocio

1. **Días de clase**: Solo martes (18:30-20:30) y viernes (17:30-21:00)
2. **Asistencia**: Solo se puede tomar en clases previamente planificadas
3. **Justificación**: Obligatoria únicamente cuando el estado es "ausente"
4. **Fotos**: Se comprimen a max 400px y se guardan en base64
5. **Autenticación mejanjim**: Password simple en Config (default: majon2025)
6. **Autenticación talmidim**: Email + password personal (app SoyTalmid)
7. **Feedback**: Solo talmidim que asistieron pueden evaluar (no anónimo)

---

## Deploy en Vercel

### Configuración del monorepo

**Proyecto 1: Presentismo Majon**
- Repository: `matekno/presentismo-majon`
- Root Directory: `presentismo-majon`
- Variables de entorno: `DATABASE_URL`

**Proyecto 2: SoyTalmid**
- Repository: `matekno/presentismo-majon` (mismo repo)
- Root Directory: `soy-talmid`
- Variables de entorno: `DATABASE_URL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`

---

## Notas de Implementación

- Las fechas se parsean manualmente (`new Date(year, month-1, day)`) para evitar problemas de timezone
- La asistencia se guarda con actualización de estado local para evitar recargas
- El cronograma actualiza el estado local al crear/editar clases para feedback inmediato
- El feedback de docentes se guarda como JSON string en `docentesFeedback`
- Los emails de talmidim deben ser únicos para permitir login en SoyTalmid
