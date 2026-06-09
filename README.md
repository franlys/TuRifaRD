# Rifa2RD - Sistema de Sorteos Multi-Tenant Premium 🏆

Este proyecto es una plataforma de sorteos premium diseñada especialmente para marcas de eSports y sorteos exóticos, con soporte multi-inquilino (multi-tenant) dinámico que ajusta colores, logos y temática según la marca.

## 🚀 Despliegue Rápido y Configuración

El proyecto está preparado para conectarse a **Supabase** y desplegarse en **Vercel** de manera inmediata. Solo necesitas configurar las variables de entorno correspondientes.

---

### 1. Configuración de Base de Datos (Supabase)

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Dirígete a la sección **SQL Editor** en el panel lateral de tu proyecto de Supabase.
3. Copia el contenido del archivo [`supabase_schema.sql`](file:///c:/Users/elmae/rifas/supabase_schema.sql) (ubicado en la raíz de este proyecto).
4. Pega el script en el editor y presiona **Run** para crear las tablas (`tenants`, `creators`, `raffles`, `prizes`, `tickets`), configurar la seguridad de filas (RLS) y poblar los datos iniciales de prueba para `Banshee` y `Sorteos del Cibao`.
5. Obtén tus credenciales desde la pestaña **Project Settings > API**:
   - `Project URL` (ej. `https://xxxxxx.supabase.co`)
   - `anon public API key`

---

### 2. Configuración Local

1. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```
2. Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
   ```
3. Levanta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

### 3. Despliegue en Vercel

1. Sube tu repositorio a GitHub.
2. Crea un nuevo proyecto en **Vercel** apuntando a tu repositorio de GitHub.
3. En la sección **Environment Variables** durante la creación del proyecto (o en settings), agrega las siguientes variables:
   - `VITE_SUPABASE_URL` = (Tu URL de Supabase)
   - `VITE_SUPABASE_ANON_KEY` = (Tu API Key anon de Supabase)
   - `VITE_ADMIN_EMAIL` = (Tu correo personalizado para administrador)
   - `VITE_ADMIN_PASSWORD` = (Tu contraseña personalizada para administrador)
4. Vercel detectará la configuración de Vite automáticamente. Haz clic en **Deploy**.
5. Las rutas secundarias y subdominios están controlados en Vercel gracias al archivo [`vercel.json`](file:///c:/Users/elmae/rifas/vercel.json) configurado en la raíz.

---

### 🔑 Cambio de Credenciales de Administrador (Seguridad)

Por defecto, el sistema viene con las siguientes credenciales de prueba:
* **Email**: `admin@rifas.com`
* **Contraseña**: `admin123`

Para cambiar estas credenciales por las tuyas propias y deshabilitar las por defecto, simplemente agrega estas variables de entorno en **Vercel** o en tu archivo **`.env` local**:
* `VITE_ADMIN_EMAIL` = `tu-correo@ejemplo.com`
* `VITE_ADMIN_PASSWORD` = `TuContraseñaSegura123`
* `VITE_CREATOR_PASSWORD` = `ContraseñaParaCreadoresSecundarios`

El sistema cargará automáticamente tus variables de entorno y bloqueará las credenciales de prueba anteriores.

---

## 🎨 Características Clave Implementadas

- **Home Page / Catálogo Dinámico**: Landing page del cliente tipo grid que muestra todos los sorteos activos de la marca actual, con barra de progreso de ventas de boletos en tiempo real, imágenes en alta calidad del premio, estado del sorteo y botón para participar.
- **Cambio Dinámico de Marca (Tenants)**: El diseño visual (neon cyan, gold, fondos oscuros, tipografía gaming, etc.) se adapta automáticamente según el parámetro de URL:
  - `http://localhost:5173/?brand=banshee` (Estética dorada / Banshee Exótico)
  - `http://localhost:5173/?brand=cibao` (Estética cyan / Sorteos del Cibao)
- **Selector de Boletos Premium**: Compra múltiple de boletos de un solo clic con sistema de validación rápida.
- **Verificador de Boletos**: Formulario en el pie de página para que el usuario verifique el estado de su boleto ingresando su correo o teléfono.
- **Acceso Administrativo Completo**: Permite crear nuevos creadores de sorteos, aprobar/rechazar comprobantes de depósito de los participantes y sortear en vivo mediante ruleta interactiva.
