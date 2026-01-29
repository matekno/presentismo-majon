# Presentismo Majon

Sistema de control de asistencia para el Majon (programa educativo judio).

## Stack Tecnologico

- **Framework**: Next.js 15 con App Router
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL (Prisma Postgres)
- **ORM**: Prisma 5.22
- **Estilos**: Tailwind CSS
- **Deploy**: Vercel
- **PWA**: Configurado con manifest.json

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── asistencia/[id]/route.ts   # Guardar asistencia de una clase
│   │   ├── auth/                       # Login/logout con cookies
│   │   ├── cronograma/route.ts         # CRUD de clases planificadas
│   │   ├── docentes/route.ts           # Gestionar docentes
│   │   ├── feriados/route.ts           # Gestionar feriados
│   │   ├── reportes/route.ts           # Estadisticas de asistencia
│   │   └── talmidim/
│   │       ├── route.ts                # Listar talmidim
│   │       └── [id]/
│   │           ├── route.ts            # GET/PUT talmid individual
│   │           └── notas/route.ts      # POST/DELETE notas
│   ├── asistencia/
│   │   ├── page.tsx                    # Lista de clases para tomar asistencia
│   │   └── [id]/page.tsx               # Tomar asistencia de una clase
│   ├── cronograma/page.tsx             # Calendario para planificar clases
│   ├── feriados/page.tsx               # Gestionar feriados
│   ├── login/page.tsx                  # Autenticacion simple
│   ├── reportes/page.tsx               # Estadisticas y reportes
│   ├── talmidim/
│   │   ├── page.tsx                    # Listado de talmidim
│   │   └── [id]/page.tsx               # Ficha individual con datos, notas e historial
│   └── page.tsx                        # Landing con botones de navegacion
├── components/
│   └── AsistenciaItem.tsx              # Componente para marcar presente/tarde/ausente
├── lib/
│   └── db.ts                           # Instancia de PrismaClient
└── middleware.ts                       # Proteccion de rutas con auth
```

## Modelos de Datos (Prisma)

- **Talmid**: Alumnos con datos personales (nombre, apellido, fechaNacimiento, telefono, email, fotoUrl en base64)
- **Nota**: Notas categorizadas (academico, conducta, salud, general) por talmid
- **Clase**: Clases planificadas con fecha, titulo, docente, horarios
- **Asistencia**: Registro de asistencia (presente, tardanza, ausente) con justificacion obligatoria para ausentes
- **Docente**: Profesores que dictan las clases
- **Feriado**: Dias sin clase (argentinos y judios)
- **Config**: Configuraciones como password de acceso

## Comandos Utiles

```bash
# Desarrollo
npm run dev

# Base de datos
npx prisma generate      # Generar cliente
npx prisma db push       # Sincronizar schema
npx prisma db seed       # Poblar datos iniciales
npx prisma studio        # UI para ver datos

# Build
npm run build
```

## Reglas de Negocio

1. **Dias de clase**: Solo martes (18:30-20:30) y viernes (17:30-21:00)
2. **Asistencia**: Solo se puede tomar en clases previamente planificadas en el cronograma
3. **Justificacion**: Obligatoria unicamente cuando el estado es "ausente"
4. **Fotos**: Se suben como archivo, se comprimen a max 400px y se guardan en base64
5. **Autenticacion**: Password simple almacenado en Config (default: majon2025)

## Notas de Implementacion

- Las fechas se parsean manualmente (`new Date(year, month-1, day)`) para evitar problemas de timezone con UTC
- La asistencia se guarda con actualizacion de estado local para evitar recargas de pagina
- El cronograma actualiza el estado local al crear/editar clases para feedback inmediato
