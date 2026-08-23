# Compliance Suite — Selección de Proveedores

Aplicación web empresarial para la gestión de procesos de cumplimiento de una empresa colombiana de transporte de carga terrestre. Esta primera versión implementa exclusivamente el módulo **Selección de proveedores**: creación de procesos, registro de proveedores, matriz de calificación ponderada, comparación automática, selección final con justificación, generación de informes (PDF y Excel) y trazabilidad completa para auditoría.

La aplicación está construida para operar **100% en la nube**: no depende de servidores locales, redes internas ni VPN. El backend, la base de datos y el almacenamiento de archivos se despliegan en servicios cloud administrados.

---

## 1. Arquitectura

```
Navegador (desktop / tablet / celular, HTTPS)
        │
        ▼
Next.js (frontend + API en un solo proyecto) ── desplegado en Vercel (o similar)
        │
        ├── Autenticación y sesiones ── NextAuth.js (JWT, roles)
        │
        ├── Base de datos PostgreSQL ── Supabase / Neon / RDS (con Prisma ORM)
        │
        └── Almacenamiento de archivos ── S3 / Cloudflare R2 / Supabase Storage
              (documentos e informes, con URLs firmadas temporales)
```

- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS. Responsivo (escritorio, tablet, celular).
- **Backend**: API routes de Next.js (Node.js), con validación de datos con Zod tanto en frontend como en backend.
- **Base de datos**: PostgreSQL, accedida mediante Prisma ORM. Compatible con cualquier proveedor cloud de PostgreSQL.
- **Almacenamiento de archivos**: cualquier servicio compatible con la API de S3 (AWS S3, Cloudflare R2, Supabase Storage, MinIO). Los archivos nunca se guardan en el servidor de aplicación ni en el navegador; la base de datos solo guarda una referencia segura.
- **Autenticación**: NextAuth.js con credenciales (correo + contraseña), sesiones JWT, control de acceso por roles (Administrador, Responsable de selección, Consulta).
- **Generación de informes**: PDF (`@react-pdf/renderer`) y Excel (`exceljs`), generados en el servidor y subidos al storage cloud.
- **Trazabilidad**: toda acción relevante (creación, edición, cambios de estado, calificaciones, generación de informes, descargas, cambios de configuración) queda registrada en la tabla `eventos_auditoria`, sin depender del navegador.

### Arquitectura modular

El código está organizado para que en fases posteriores se puedan agregar nuevos módulos (SARLAFT, BASC, gestión documental, evaluación de riesgos, auditorías, capacitación, etc.) sin reconstruir la aplicación:

- `src/app/(app)/` — páginas de la aplicación autenticada, una carpeta por módulo.
- `src/app/api/` — endpoints de la API, organizados por dominio.
- `src/lib/` — lógica de negocio reutilizable (cálculos, validaciones, auditoría, storage, autenticación).
- `prisma/schema.prisma` — esquema de base de datos, ya preparado con tablas de documentos, informes y auditoría genéricas que otros módulos futuros pueden reutilizar.

El menú lateral ya incluye las entradas para los módulos futuros ("Evaluación y reevaluación de proveedores", "Gestión documental"), marcadas como "Próximamente" y deshabilitadas, tal como se solicitó para esta primera versión.

---

## 2. Antes de empezar: cuentas necesarias

Para que la aplicación funcione en producción (accesible por internet, con datos persistentes y seguros) necesitas crear tres cuentas gratuitas para empezar (todas tienen planes gratuitos o de muy bajo costo):

1. **[GitHub](https://github.com)** — para alojar el código fuente.
2. **[Vercel](https://vercel.com)** — para desplegar la aplicación (se conecta directamente a GitHub).
3. **[Supabase](https://supabase.com)** — provee la base de datos PostgreSQL **y** el almacenamiento de archivos compatible con S3, en un solo servicio. (Alternativamente puedes usar Neon para la base de datos y Cloudflare R2 o AWS S3 para archivos por separado; el código es compatible con cualquiera de estas combinaciones.)

Ninguna de estas cuentas requiere conocimientos técnicos avanzados para crearse; los pasos exactos están en la sección 5.

---

## 3. Variables de entorno

Copia `.env.example` a `.env` y completa los valores. Consulta la sección 5 para saber exactamente dónde obtener cada uno.

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL (con pooling, para la app en producción) |
| `DIRECT_URL` | Cadena de conexión directa a PostgreSQL (usada solo por Prisma para migraciones) |
| `NEXTAUTH_SECRET` | Valor aleatorio secreto para firmar sesiones. Genera uno con `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL pública de la aplicación (ej. `https://tuempresa.vercel.app`) |
| `S3_ENDPOINT` | Endpoint del servicio de almacenamiento S3-compatible |
| `S3_REGION` | Región del bucket (usa `auto` para Cloudflare R2) |
| `S3_BUCKET` | Nombre del bucket donde se guardan documentos e informes |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Credenciales de acceso al bucket |
| `S3_FORCE_PATH_STYLE` | `true` para la mayoría de proveedores S3-compatibles distintos de AWS |
| `EMPRESA_NOMBRE` / `EMPRESA_NIT` | Datos de la empresa, usados en el encabezado de los informes generados |

**Nunca subas el archivo `.env` a GitHub.** Ya está excluido en `.gitignore`.

---

## 4. Desarrollo local

Requisitos: Node.js 20.9 o superior.

```bash
npm install
cp .env.example .env   # y completa los valores según la sección 5
npx prisma generate    # genera el cliente de base de datos
npx prisma db push     # crea las tablas en tu base de datos (o usa migrate, ver abajo)
npm run db:seed        # crea los criterios de evaluación y usuarios de prueba
npm run dev            # inicia la aplicación en http://localhost:3000
```

Usuarios de prueba creados por el seed (contraseña para todos: `Cambiar123!`):

| Correo | Rol |
|---|---|
| `admin@empresa.com` | Administrador |
| `responsable@empresa.com` | Responsable de selección |
| `consulta@empresa.com` | Consulta |

**Cámbialos o elimínalos antes de usar la aplicación con datos reales.**

### Verificar los cálculos de la matriz

El motor de cálculo de la matriz de selección (ponderaciones, resultados, comparación) tiene una prueba independiente que no requiere base de datos:

```bash
npm run test:calculos
```

Esta prueba reproduce exactamente los ejemplos numéricos del documento de requisitos (criterios que suman 95%, resultado ponderado por criterio, comparación de proveedores con 92%/82%/72%, etc.) y confirma que los cálculos son correctos.

---

## 5. Despliegue en producción (paso a paso)

### 5.1. Sube el código a GitHub

```bash
cd proveedores-app
git add .
git commit -m "Versión inicial: módulo de selección de proveedores"
```

Crea un repositorio nuevo en GitHub (botón "New repository", puede ser privado) y luego:

```bash
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git branch -M main
git push -u origin main
```

### 5.2. Crea la base de datos y el almacenamiento en Supabase

1. Crea una cuenta en [supabase.com](https://supabase.com) y crea un nuevo proyecto.
2. Ve a **Project Settings → Database** y copia la cadena de conexión (**Connection string → URI**). Úsala como `DATABASE_URL` (elige la variante "Transaction" con pooling) y como `DIRECT_URL` (variante "Session" o directa).
3. Ve a **Project Settings → Storage** (o simplemente **Storage** en el menú) y crea un bucket, por ejemplo `proveedores-app-documentos`. Márcalo como privado (no público).
4. Ve a **Project Settings → API** para obtener las credenciales S3-compatibles de Storage (Supabase expone un endpoint S3 compatible en Storage → Settings). Usa esos valores para `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET` y `S3_REGION`.

> Alternativa: si prefieres usar Cloudflare R2 o AWS S3 para archivos, crea el bucket allí y usa esas credenciales; el resto de la configuración es idéntica.

### 5.3. Despliega en Vercel

1. Crea una cuenta en [vercel.com](https://vercel.com) (puedes registrarte con tu cuenta de GitHub).
2. Haz clic en **Add New → Project** y selecciona el repositorio que acabas de subir.
3. En **Environment Variables**, agrega todas las variables de la sección 3 con los valores obtenidos en el paso 5.2. Usa como `NEXTAUTH_URL` la URL que Vercel te asignará (ej. `https://tu-proyecto.vercel.app`); puedes actualizarla después del primer despliegue si es necesario.
4. En **Build & Development Settings**, agrega el siguiente **Build Command** para que Prisma genere el cliente y aplique las migraciones automáticamente en cada despliegue:
   ```
   npx prisma generate && npx prisma migrate deploy && next build
   ```
5. Haz clic en **Deploy**. Cuando termine, tu aplicación estará disponible en la URL que Vercel te asigne.
6. Ejecuta el sembrado de datos iniciales (criterios de evaluación y usuarios) una sola vez, desde tu computador, apuntando a la base de datos de producción:
   ```bash
   DATABASE_URL="la-misma-url-de-produccion" npm run db:seed
   ```

Desde este momento, cualquier `git push` a la rama `main` despliega automáticamente una nueva versión.

### 5.4. Primer inicio de sesión

Ingresa a la URL de tu aplicación y entra con `admin@empresa.com` / `Cambiar123!`. **Cambia esta contraseña de inmediato** (la gestión de cambio de contraseña desde la interfaz queda para una siguiente fase; mientras tanto puedes generar un nuevo hash con bcrypt y actualizarlo directamente en la base de datos, o crear un nuevo usuario administrador y desactivar el de prueba).

---

## 6. Roles y permisos

| Rol | Puede |
|---|---|
| **Administrador** | Todo lo del Responsable de selección, además de: configurar criterios y ponderaciones, gestionar usuarios y roles, consultar todos los procesos, autorizar excepciones de cierre, consultar la trazabilidad completa. |
| **Responsable de selección** | Crear procesos, registrar y calificar proveedores, generar informes, consultar y continuar sus propios procesos guardados como borrador. |
| **Consulta** | Consultar procesos e informes existentes, sin poder modificar información. |

Todas las reglas de autorización se validan en el backend (no solo en la interfaz), por lo que no es posible saltarlas manipulando solicitudes.

---

## 7. Sobre la matriz de calificación

- Los criterios, pesos y guías de calificación **no están fijos en el código**: se administran desde **Configuración** (solo Administrador) y se guardan en la base de datos, con historial de cambios.
- Los 7 criterios iniciales (tiempos de entrega, capacidad de suministro, garantía, servicio postventa, atención pre-venta, atención de PQR, formas de pago) suman **95%**, tal como especifica el documento de requisitos. La aplicación **detecta esto automáticamente** y muestra una alerta indicando que se debe definir el 5% restante antes de poder cerrar un proceso.
- Un proceso **no puede cerrarse** si la ponderación total no es exactamente 100%, salvo que un Administrador autorice explícitamente una excepción (queda registrado en la trazabilidad).
- La calificación (5, 3 o 1) siempre la asigna manualmente la persona responsable de la selección. El sistema **nunca** decide ni sugiere una calificación; solo aplica la ponderación configurada, calcula los resultados y compara los proveedores.
- El cálculo se realiza **siempre en el backend** (no se confía en valores calculados por el navegador), tanto al guardar calificaciones como al generar el informe final.

---

## 8. Seguridad

- Autenticación con NextAuth.js, sesiones JWT, contraseñas con hash bcrypt.
- Todas las rutas de la aplicación y de la API están protegidas (`src/proxy.ts` + verificación de sesión en cada endpoint).
- Comunicación cifrada mediante HTTPS (provista automáticamente por Vercel).
- Los documentos e informes se descargan mediante URLs firmadas temporales (5 minutos de vigencia), nunca exponiendo el bucket directamente.
- Toda acción relevante queda registrada en la tabla de auditoría (`eventos_auditoria`), incluyendo usuario, fecha, y — cuando aplica — estado anterior y nuevo.
- Los procesos cerrados quedan protegidos contra modificaciones no autorizadas; solo un Administrador puede editarlos, y el cambio queda igualmente auditado.
- Recomendación: usa entornos separados en Vercel (Preview / Production) y bases de datos separadas para desarrollo y producción.

---

## 9. Limitaciones conocidas de esta primera versión

- Solo el módulo **Selección de proveedores** está funcional. Los demás módulos del menú aparecen deshabilitados ("Próximamente"), tal como se solicitó.
- La carga de documentos de soporte por proveedor tiene la arquitectura de almacenamiento ya preparada (endpoints `/api/documentos`, tabla `documentos`, URLs firmadas), pero la interfaz de carga de archivos se dejó para una siguiente fase, según el alcance definido.
- La gestión de usuarios (crear/editar/desactivar usuarios desde la interfaz) no está incluida en esta versión; los usuarios se crean mediante el script de sembrado (`prisma/seed.ts`) o directamente en la base de datos. El modelo de datos y los roles ya están completamente preparados para agregar esa pantalla en una siguiente fase.
- El cambio de contraseña propio y la recuperación de contraseña quedan para una siguiente fase.
