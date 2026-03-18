# Task Manager (Mi App)

Aplicación de gestión de proyectos y tareas con roles de usuario (admin / user), autenticación JWT y persistencia en base de datos.

---

## Stack

| Capa      | Tecnología |
|-----------|------------|
| Backend   | NestJS, Prisma, PostgreSQL (Supabase), JWT, bcrypt |
| Frontend  | Angular 19 |
| Base de datos | Supabase (Postgres), Prisma ORM |

---

## Estructura del proyecto

```
Mi-App/
├── backend/          # API NestJS
│   ├── prisma/       # Schema y migraciones
│   └── src/
│       ├── auth/     # Login, registro, JWT
│       ├── prisma/   # PrismaService
│       ├── projects/ # CRUD proyectos
│       ├── tasks/    # CRUD tareas
│       └── users/    # Usuarios (in-memory hasta Fase 2)
├── frontend/         # SPA Angular
│   └── src/app/
│       ├── auth/     # Login, registro
│       ├── dashboard/ # Pantalla principal (proyectos + tareas)
│       ├── dnd/      # Drag-and-drop (atlaskit pragmatic)
│       ├── modal/    # Modales (CDK Overlay)
│       └── projects/ # (Legacy) pantallas de proyecto
└── package.json     # Scripts para correr backend + frontend
```

---

## Requisitos

- Node.js (v18+)
- Cuenta en [Supabase](https://supabase.com) con un proyecto y base Postgres
- npm

---

## Configuración

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repo>
cd Mi-App
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Backend – Base de datos (Supabase + Prisma)

1. En **Supabase** → Project Settings → Database, copiá la **connection string** (URI).
2. En la raíz de `backend/` creá un archivo **`.env`** (no se sube a git) con:

   ```env
   DATABASE_URL="postgresql://..."
   ```

   - Para **ejecutar la app** en desarrollo: podés usar la URL del **pooler** (puerto **6543**) y agregar `?pgbouncer=true` al final.
   - Para **migraciones** (`npx prisma migrate dev`): usá la conexión **directa** (puerto **5432**, host `db.xxx.supabase.co`). Después podés volver a la del pooler si querés.

3. Aplicar el schema a la base (solo la primera vez o al cambiar el schema):

   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

   Si el comando se cuelga, probá con la URL **directa (5432)** en `.env`.

4. Generar el cliente Prisma (se hace también al migrar):

   ```bash
   npx prisma generate
   ```

### 3. Frontend

No requiere variables de entorno para desarrollo. La API del backend se espera en `http://localhost:3000`.

---

## Cómo correr el proyecto

Desde la **raíz** del repo:

```bash
npm run dev
```

Esto levanta:

- **Backend:** http://localhost:3000 (NestJS)
- **Frontend:** http://localhost:4200 (Angular)

Alternativamente:

```bash
# Terminal 1 – backend
cd backend && npm run start:dev

# Terminal 2 – frontend
cd frontend && npm run start
```

---

## Cómo correr con Docker (local)

Requisitos:
- Docker Desktop

Variables opcionales:
- Docker Compose lee variables desde un archivo `.env` en la raíz. Podés usar `.env.docker.example` como base.

Desde la raíz del repo:

```bash
docker compose up --build
```

Esto levanta:
- **Postgres local:** `localhost:5432` (DB: `taskmanager`, user/pass: `taskmanager`)
- **Backend:** `http://localhost:3000` (aplica migraciones Prisma al iniciar)
- **Frontend:** `http://localhost:4200`

Para bajar todo:

```bash
docker compose down
```

---

## Variables de entorno (backend)

| Variable                 | Uso |
|--------------------------|-----|
| `DATABASE_URL`           | Connection string de PostgreSQL (Supabase). Ver `backend/.env.example`. |
| `JWT_SECRET`             | Secreto para firmar el access token. |
| `JWT_EXPIRES_IN`         | Caducidad del access token (ej. `1h`). |
| `JWT_REFRESH_SECRET`     | Secreto para firmar el refresh token. |
| `JWT_REFRESH_EXPIRES_IN` | Caducidad del refresh token (ej. `7d`). |
| `QUICK_REGISTER_PASSWORD` | Password fijo para `POST /auth/quick-register` (ej. `123456`). |

---

## Modelo de datos (Prisma)

- **User:** id, email, password (hash), name, role (admin | user), createdAt.
- **Project:** id, name, description, status (pendiente | en_proceso | finalizado), ownerId → User, createdAt.
- **Task:** id, title, description, status (todo | in_progress | done), **priority (urgente | prioritario | normal)**, projectId → Project, creatorId → User, assigneeName (opcional), createdAt.

---

## Estado del proyecto

- **Fase 1 (hecha):** Supabase + Prisma, schema User/Project/Task, migraciones, ConfigModule, PrismaService.
- **Fase 2 (hecha):** Auth con Prisma (registro y login contra BD), bcrypt (12 rondas), JWT access + refresh token, endpoint `POST /auth/refresh`, UsersService sobre Prisma.
- **Fase 3 (hecha):** Proyectos y tareas con Prisma: ProjectsService y TasksService usan la BD (Supabase). Crear, listar, editar y eliminar proyectos y tareas persisten en la base de datos. Creator name/role en tareas vía `include` de Prisma. Reglas de negocio mantenidas (solo admin crea proyectos; solo creador o admin elimina tareas).
- **Fase 6 (en curso):** Dashboard tipo kanban:
  - 3 columnas por estado (todo / in_progress / done)
  - Crear/editar por modales (CDK Overlay)
  - Prioridad persistida en BD (urgente/prioritario/normal) con color en UI
  - Drag-and-drop entre columnas con `@atlaskit/pragmatic-drag-and-drop`

---

## Consignas (verificación)

Formato:
- **Estado**: Implementado | Parcial | Falta
- **Evidencia**: endpoints y/o archivos relevantes
- **Pendiente**: lo que falta (si aplica)

### 1) Objetivo

La aplicación debe incluir:
- autenticación de usuarios
- manejo de roles
- gestión de proyectos y tareas
- integración con una API externa

- **Autenticación de usuarios**
  - **Estado**: Implementado
  - **Evidencia**:
    - Backend: `backend/src/auth/auth.controller.ts`, `backend/src/auth/auth.service.ts`, `backend/src/auth/jwt.strategy.ts`
    - Frontend: `frontend/src/app/services/auth.service.ts`, `frontend/src/app/guards/auth.guard.ts`, `frontend/src/app/app.routes.ts`
- **Manejo de roles (admin/user)**
  - **Estado**: Implementado
  - **Evidencia**:
    - Modelo: `backend/prisma/schema.prisma` (enum `Role`)
    - Reglas de negocio: `backend/src/projects/projects.service.ts`, `backend/src/tasks/tasks.service.ts`
- **Gestión de proyectos y tareas**
  - **Estado**: Implementado
  - **Evidencia**:
    - Backend: `backend/src/projects/*`, `backend/src/tasks/*`
    - Frontend: `frontend/src/app/dashboard/*`, `frontend/src/app/modal/*`
- **Integración con API externa**
  - **Estado**: Implementado
  - **Evidencia**: `backend/src/external/external.service.ts` (consume `randomuser.me`)

### 2) Usuarios y autenticación

La aplicación debe permitir:
- registro de usuarios
- login

Cada usuario debe tener un rol:
- admin
- user

El sistema debe usar algún mecanismo de autenticación (por ejemplo tokens).

- **Registro**
  - **Estado**: Implementado
  - **Evidencia**:
    - Backend: `POST /auth/register` (`backend/src/auth/auth.controller.ts`)
    - Frontend: `frontend/src/app/auth/register/*`
- **Login**
  - **Estado**: Implementado
  - **Evidencia**:
    - Backend: `POST /auth/login` (`backend/src/auth/auth.controller.ts`)
    - Frontend: `frontend/src/app/auth/login/*`
- **Roles admin/user**
  - **Estado**: Implementado
  - **Evidencia**:
    - DB: `backend/prisma/schema.prisma` (`User.role` con default `user`)
    - Backend: `backend/src/auth/jwt.strategy.ts` incluye `role` en payload y `@CurrentUser('role')`
- **Tokens (JWT)**
  - **Estado**: Implementado
  - **Evidencia**:
    - Backend: `backend/src/auth/jwt.strategy.ts`
    - Frontend: `frontend/src/app/services/auth.service.ts` guarda `access_token` en `localStorage`

### 3) Entidades principales

La aplicación debe manejar al menos:
- Usuarios
- Proyectos
- Tareas

Las tareas deben pertenecer a un proyecto y tener un estado:
- todo
- in_progress
- done

- **Entidades y relaciones**
  - **Estado**: Implementado
  - **Evidencia**:
    - Prisma: `backend/prisma/schema.prisma` (`User`, `Project`, `Task`, `Task.projectId`)
    - Estado: `backend/src/tasks/task-status.enum.ts` (todo/in_progress/done)

### 4) Permisos

Reglas básicas:
- Usuario (user): puede crear/ver tareas, puede modificar el estado de sus tareas, solo puede eliminar tareas que haya creado
- Administrador (admin): puede eliminar cualquier tarea

- **Crear tareas**
  - **Estado**: Implementado
  - **Evidencia**: `POST /projects/:projectId/tasks` (`backend/src/projects/projects.controller.ts`)
- **Ver tareas (todas)**
  - **Estado**: Implementado
  - **Evidencia**: `GET /tasks` (`backend/src/tasks/tasks.controller.ts`, `backend/src/tasks/tasks.service.ts`)
- **Modificar estado (user: solo propias, admin: cualquiera)**
  - **Estado**: Implementado
  - **Evidencia**:
    - Backend: `PATCH /tasks/:id/status` y `PATCH /tasks/:id/reorder` validan creador/rol en `backend/src/tasks/tasks.service.ts`
    - Frontend: bloquea mover/editar tareas ajenas en `frontend/src/app/dashboard/home/home.component.ts`
- **Eliminar (user: solo propias, admin: cualquiera)**
  - **Estado**: Implementado
  - **Evidencia**: `DELETE /tasks/:id` y `assertCanDelete` en `backend/src/tasks/tasks.service.ts`

### 5) Integración con API externa

La aplicación debe consumir una API pública (ej. `https://randomuser.me/api/`) y usarla para algo dentro del sistema.

- **Consumo de API pública**
  - **Estado**: Implementado
  - **Evidencia**: `backend/src/external/external.service.ts`
- **Uso dentro del sistema**
  - **Estado**: Implementado
  - **Evidencia**:
    - **Registro rápido**: `POST /auth/quick-register` (`backend/src/auth/auth.controller.ts`, `backend/src/auth/auth.service.ts`)
      - Password fijo por env: `QUICK_REGISTER_PASSWORD` (ver `backend/.env.example`)
    - **Responsable automático al crear tarea (solo admin)**: `backend/src/tasks/tasks.service.ts`

### 6) Frontend

Crear una interfaz simple que permita:
- registrarse / iniciar sesión
- ver proyectos
- ver tareas de un proyecto
- crear tareas
- cambiar el estado de las tareas
- eliminar tareas (según permisos)

- **Registrarse / iniciar sesión**
  - **Estado**: Implementado
  - **Evidencia**:
    - Rutas: `frontend/src/app/app.routes.ts`
    - UI: `frontend/src/app/auth/login/*`, `frontend/src/app/auth/register/*`
- **Ver proyectos**
  - **Estado**: Implementado
  - **Evidencia**:
    - UI: `frontend/src/app/dashboard/home/home.component.html`
    - API client: `frontend/src/app/services/projects.service.ts`
- **Ver tareas de un proyecto**
  - **Estado**: Implementado
  - **Evidencia**: filtro por proyecto `filterByProject` en `frontend/src/app/dashboard/home/home.component.ts` + selector en `home.component.html`
- **Crear tareas**
  - **Estado**: Implementado
  - **Evidencia**: modal `frontend/src/app/modal/task-modal/*` + creación vía `frontend/src/app/services/tasks.service.ts`
- **Cambiar estado de tareas**
  - **Estado**: Implementado
  - **Evidencia**: drag & drop + `reorderTask` en `frontend/src/app/dashboard/home/home.component.ts` → `frontend/src/app/services/tasks.service.ts`
- **Eliminar tareas (según permisos)**
  - **Estado**: Implementado
  - **Evidencia**:
    - UI: `canDeleteTask` en `frontend/src/app/dashboard/home/home.component.ts` + botón condicionado en `home.component.html`
    - Backend: `DELETE /tasks/:id` + `assertCanDelete` en `backend/src/tasks/tasks.service.ts`

### 7) Opcional (bonus)

Si querés agregar más funcionalidades, por ejemplo:
- validaciones
- filtros o búsqueda
- paginación
- tests
- dockerización
- mejoras de UI

- **Validaciones**
  - **Estado**: Implementado (mínimas)
  - **Evidencia**: `Validators` en `frontend/src/app/auth/register/register.component.ts` y `frontend/src/app/auth/login/login.component.ts`
- **Filtros o búsqueda**
  - **Estado**: Implementado (filtros)
  - **Evidencia**: filtros por proyecto/creador/rol en `frontend/src/app/dashboard/home/home.component.ts`
- **Paginación**
  - **Estado**: Falta
- **Tests**
  - **Estado**: Implementado
  - **Evidencia**:
    - Backend: `cd backend && npm test`
    - Frontend (CI): `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless`
    - Specs: `backend/src/**` y `frontend/src/**` + `backend/test/app.e2e-spec.ts`
- **Dockerización**
  - **Estado**: Implementado (local)
  - **Evidencia**: `docker-compose.yml`, `.env.docker.example`, `backend/Dockerfile`, `frontend/Dockerfile`
- **Mejoras de UI**
  - **Estado**: Implementado
  - **Evidencia**: dashboard kanban + modales + dark mode + DnD + skeleton loaders (`frontend/src/app/dashboard/home/*`, `frontend/src/app/modal/*`, `frontend/src/styles.scss`)

### 8) Entrega

Enviar un repositorio con el código. Debe incluir un README explicando:
- cómo correr el proyecto
- tecnologías utilizadas
- decisiones técnicas tomadas

- **Repositorio**
  - **Estado**: A cargo del usuario (GitHub)
- **README: cómo correr**
  - **Estado**: Implementado
  - **Evidencia**: sección `## Cómo correr el proyecto`
- **README: tecnologías utilizadas**
  - **Estado**: Implementado
  - **Evidencia**: sección `## Stack`
- **README: decisiones técnicas tomadas**
  - **Estado**: Implementado (ver sección `## Decisiones técnicas`)

---

## Decisiones técnicas

- Autenticación con **JWT access + refresh** para evitar relogueo y mantener sesiones.
- **Prisma ORM** sobre Postgres (Supabase) para esquema, migraciones y tipado consistente.
- Roles `admin/user` persistidos en BD + claim `role` dentro del JWT para autorización.
- Dashboard único tipo **Kanban** para centralizar el flujo (proyectos + tareas en una sola vista).
- Modales con **Angular CDK Overlay** para crear/editar sin navegación extra.
- Drag & drop con `@atlaskit/pragmatic-drag-and-drop` + persistencia de orden (`Task.order`) y estado.
- `Task.priority` como enum persistido + estilos por variables CSS para lectura rápida.
- **Dark mode** con `ThemeService` y persistencia en `localStorage`.
- Integración `randomuser.me` para **quick-register** y responsable automático **solo si crea admin**.
- Skeleton loaders para estados de carga (mejor UX percibida).
- Frontend protegido con `authGuard` + token Bearer en servicios HTTP (`AuthService`, `ProjectsService`, `TasksService`).



