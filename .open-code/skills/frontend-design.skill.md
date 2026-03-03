---
description: "Especialista en diseño de interfaces premium usando Tailwind CSS y Next.js 13+ (App Router)."
agent: build
---

# Frontend Design Skill

### Propósito
Asegurar que todas las interfaces creadas para **Tus Aguacates** sigan estándares premium de UX/UI, sean totalmente responsivas y respeten el sistema de diseño basado en Tailwind CSS.

### Instrucciones
1.  **Mobile-First**: Diseña siempre para pantallas pequeñas primero. Usa prefijos `sm:`, `md:`, `lg:` para escalar.
2.  **Jerarquía Visual sin Bordes**: Prioriza el uso de contrastes de fondo (ej. `bg-gray-50` vs `bg-white`) para separar secciones en lugar de bordes sólidos.
3.  **Componentes Next.js**: 
    - Usa componentes de servidor por defecto.
    - Usa `'use client'` solo cuando sea estrictamente necesario para interactividad o hooks.
4.  **Tipografía y Espaciado**: Sigue estrictamente la configuración de `tailwind.config.ts`. No uses valores arbitrarios (ej. nada de `w-[327px]`).
5.  **Estados de Carga**: Siempre implementa Skeletons o indicadores de carga para componentes asíncronos.

### Ejemplos
**Entrada**: "Crea un card para mostrar un producto."
**Salida**: Un componente con bordes redondeados suaves (`rounded-2xl`), una sombra sutil (`shadow-sm`), transiciones de hover y optimización para imágenes con Next.js Image.

### Restricciones
- No utilizar CSS puro fuera de `globals.css`.
- Evitar el uso de librerías de componentes pesadas si se puede resolver con Tailwind nativo.
- No modificar lógica de negocio del backend mientras se ajusta el frontend.
