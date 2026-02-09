# Plan: Soporte de Múltiples Kitot para Majón Guesher

## Resumen

Agregar soporte para 3 kitot (Najshón, Shinun, Heschel) con login separado por kitá y datos segmentados.

## Cambios al Modelo de Datos

### 1. Nuevo modelo `Kita` en `prisma/schema.prisma`

```prisma
model Kita {
  id            String   @id @default(cuid())
  nombre        String   @unique  // "najshon", "shinun", "heschel"
  nombreDisplay String             // "Najshón", "Shinun", "Heschel"
  anio          Int                // 1, 2, 3
  passwordHash  String             // Password de acceso para mejanjim
  colorHex      String   @default("#3B82F6")
  activa        Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  talmidim Talmid[]
  clases   ClaseKita[]

  @@map("kitot")
}
```

### 2. Nueva tabla relación `ClaseKita` (para clases compartidas)

```prisma
model ClaseKita {
  id        String   @id @default(cuid())
  claseId   String
  kitaId    String
  createdAt DateTime @default(now())

  clase Clase @relation(fields: [claseId], references: [id], onDelete: Cascade)
  kita  Kita  @relation(fields: [kitaId], references: [id], onDelete: Cascade)

  @@unique([claseId, kitaId])
  @@map("clase_kita")
}
```

### 3. Modificar modelo `Talmid`

Agregar campo `kitaId`:
```prisma
model Talmid {
  // ... campos existentes ...
  kitaId String?
  kita   Kita?  @relation(fields: [kitaId], references: [id])
  // ... relaciones existentes ...
}
```

### 4. Modificar modelo `Clase`

Agregar relación con kitot:
```prisma
model Clase {
  // ... campos existentes ...
  kitot ClaseKita[]
  // ... relaciones existentes ...
}
```

---

## Cambios a la Autenticación

### Archivos a modificar:

1. **`presentismo-majon/src/lib/auth.ts`**
   - Cambiar `verifyPassword(password)` → `verifyPassword(kitaId, password)`
   - Cambiar `createSession()` → `createSession(kita)` con datos de kitá
   - Agregar `getSession()` que retorne `{ kitaId, kitaNombre, kitaColor }`
   - La cookie pasa de valor simple `'authenticated'` a JSON con datos de kitá

2. **`presentismo-majon/src/app/api/auth/login/route.ts`**
   - Recibir `{ kitaId, password }` en lugar de solo `{ password }`
   - Buscar kitá y verificar password contra `kita.passwordHash`

3. **Nueva API: `presentismo-majon/src/app/api/kitot/route.ts`**
   - `GET` - Listar kitot activas (para el selector de login)

---

## Cambios a las APIs (Filtrado por Kitá)

### APIs que SÍ filtran por kitá:

| API | Cambio |
|-----|--------|
| `GET /api/talmidim` | Filtrar `WHERE kitaId = session.kitaId` |
| `GET /api/talmidim/[id]` | Verificar que talmid pertenece a la kitá |
| `GET /api/cronograma` | Filtrar clases por kitá via `ClaseKita` |
| `POST /api/cronograma` | Crear `ClaseKita` asociando a kitá actual |
| `GET /api/clases/[id]` | Verificar pertenencia a kitá |
| `GET /api/clases/planificadas` | Filtrar por kitá |
| `GET /api/asistencia` | Filtrar por kitá (via clase o talmid) |
| `GET /api/reportes/*` | Filtrar estadísticas por kitá |

### APIs COMPARTIDAS (NO filtran por kitá):

| API | Razón |
|-----|-------|
| `GET /api/docentes` | Los docentes son compartidos entre todas las kitot |
| `GET /api/docentes/[id]` | Un docente puede dar clases en cualquier kitá |
| `GET /api/feedback` | Ver abajo |

**Nota**: Los docentes no tienen `kitaId` - pueden ser asignados a clases de cualquier kitá.

### Feedback: Lógica Especial

El feedback es **visible para todas las kitot** pero con **filtro opcional**:
- Los mejanjim pueden ver feedback de TODAS las kitot (útil para evaluar docentes externos)
- UI incluye filtro por kitá para ver solo los de sus clases si lo desean
- La ficha de cada docente muestra TODO el feedback que recibió (de todas las kitot)

Esto permite que si Shinun quiere contratar un capacitador que ya trabajó con Heschel, puedan ver qué opinaron los talmidim de Heschel.

---

## Cambios al Frontend

### 1. Login (`presentismo-majon/src/app/login/page.tsx`)

- Agregar selector de kitá (3 botones: Najshón, Shinun, Heschel)
- Cargar kitot desde `/api/kitot` al montar
- Enviar `{ kitaId, password }` al login

### 2. Layout/Header

- Mostrar badge con nombre de kitá actual (ej: "Shinun" en azul)
- Obtener datos de kitá desde la sesión

### 3. Cronograma (crear/editar clase)

- Por defecto, clase se asocia a kitá actual
- Agregar checkbox "Clase compartida" para seleccionar múltiples kitot
- Mostrar indicador visual de qué kitot participan en cada clase

### 4. Feedback/Dashboard

- Mostrar feedback de TODAS las kitot por defecto
- Agregar filtro dropdown para filtrar por kitá específica
- Las fichas de docentes muestran todo el feedback recibido (sin filtrar por kitá)

### 5. Internacionalización (`messages/es.json`)

Agregar claves para:
- Selector de kitá en login
- Nombres de kitot
- Labels de clase compartida

---

## Migración de Datos

### Script de migración (`prisma/seed-kitot.ts`):

1. **Crear las 3 kitot** con passwords temporales (`najshon2025`, `shinun2025`, `heschel2025`)
   - Colores: Najshón=#10B981 (verde), Shinun=#3B82F6 (azul), Heschel=#8B5CF6 (violeta)

2. **Migrar talmidim existentes a Shinun** (según indicó el usuario)

3. **Migrar clases existentes a Shinun**

4. **Sincronizar schema en soy-talmid** (copiar cambios de schema.prisma)

---

## Orden de Implementación

### Fase 1: Base de Datos
1. Agregar modelos `Kita` y `ClaseKita` al schema
2. Agregar `kitaId` a `Talmid`
3. Agregar relación `kitot` a `Clase`
4. Ejecutar `prisma db push`
5. Ejecutar script de migración de datos
6. Sincronizar schema en soy-talmid

### Fase 2: Autenticación
7. Modificar `auth.ts` (verifyPassword, createSession, getSession)
8. Crear `GET /api/kitot`
9. Modificar `POST /api/auth/login`

### Fase 3: APIs
10. Modificar APIs para filtrar por kitá (talmidim, cronograma, clases, reportes, feedback)

### Fase 4: Frontend
11. Rediseñar página de login con selector de kitá
12. Agregar badge de kitá al header
13. Modificar cronograma para clases compartidas
14. Agregar mensajes de i18n

---

## Archivos Críticos

- `presentismo-majon/prisma/schema.prisma` - Cambios al modelo
- `presentismo-majon/src/lib/auth.ts` - Autenticación por kitá
- `presentismo-majon/src/app/login/page.tsx` - UI de login
- `presentismo-majon/src/app/api/talmidim/route.ts` - Patrón de filtrado
- `presentismo-majon/src/app/api/cronograma/route.ts` - Clases compartidas

---

## Verificación

1. **Login**: Verificar que cada kitá tiene su propio password y solo ve sus datos
2. **Talmidim**: Verificar que solo aparecen los de la kitá logueada
3. **Clases**: Verificar filtrado correcto y creación con kitá asociada
4. **Clase compartida**: Crear una clase para múltiples kitot y verificar que aparece en ambas
5. **Reportes**: Verificar que estadísticas son solo de la kitá actual
