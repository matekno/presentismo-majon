# Pendientes UI - Multi-Kitá

## Contexto
Se implementó soporte para múltiples kitot (Najshón, Shinun, Heschel). El backend está completo, pero faltan algunas mejoras en la UI.

## 1. Clases compartidas en Cronograma
**Archivo**: `src/app/page.tsx` (sección Cronograma)
**API**: `POST /api/cronograma` ya soporta el campo `kitotIds: string[]`

### Qué falta:
- Al crear/editar una clase, agregar checkbox "Clase compartida"
- Si está marcado, mostrar selector múltiple de kitot
- Enviar `kitotIds` en lugar de usar solo la kitá de sesión
- Mostrar indicador visual en clases compartidas (ej: badge con las kitot)

### Modelo de datos:
```prisma
model ClaseKita {
  claseId   String
  kitaId    String
  @@unique([claseId, kitaId])
}
```

## 2. KitaBadge en más páginas
**Componente existente**: `src/components/KitaBadge.tsx`

### Dónde agregar:
- Ya está en la página principal (`page.tsx`)
- Considerar agregarlo en otras vistas si hay más páginas

## 3. API de kitot disponible
```
GET /api/kitot → [{ id, nombre, nombreDisplay, colorHex }]
```

## Notas técnicas
- La sesión contiene `kitaId` y `kitaNombre`
- Usar `getSession()` de `@/lib/auth` para obtener la kitá actual
- Los colores de las kitot: Najshón (#10B981 verde), Shinun (#3B82F6 azul), Heschel (#8B5CF6 violeta)
