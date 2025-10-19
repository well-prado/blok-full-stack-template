# {{PROJECT_NAME}}

Complete Blok full-stack application with authentication, admin dashboard, and React frontend.

---

## 🚀 Quick Start with Blok CLI

### Creating a New Project

Create a new Blok full-stack application in seconds:

```bash
npx @well-prado/create-blok-fullstack@latest my-awesome-app
```

Or use a specific version:

```bash
npx @well-prado/create-blok-fullstack@2.3.2 my-project
```

### Available CLI Commands

#### 1. **Create Project**
```bash
npx @well-prado/create-blok-fullstack@latest <project-name>
```

**What it does:**
- ✅ Creates a new directory with your project name
- ✅ Clones the latest Blok full-stack template
- ✅ Installs all backend dependencies (Node.js packages)
- ✅ Installs all frontend dependencies (React, TypeScript, etc.)
- ✅ Sets up Prisma database with migrations
- ✅ Configures your development environment
- ✅ Creates a production-ready application structure

**Arguments:**
- `<project-name>` - Name of your project (required)

**Example:**
```bash
npx @well-prado/create-blok-fullstack@latest ecommerce-platform
cd ecommerce-platform
npm run dev
```

#### 2. **Development Mode**
```bash
npm run dev
```

**What it does:**
- 🔥 Starts both backend server (port 4000) and frontend dev server (port 5173)
- 🔄 Enables hot module replacement (HMR) for instant updates
- 🎯 Watches for file changes and auto-restarts
- 📊 Displays logs from both servers in your terminal

**When to use:** Daily development, building features, testing changes

#### 3. **Start Backend Only**
```bash
npm run dev:backend
```

**What it does:**
- 🎯 Starts only the Blok backend server on port 4000
- 🔄 Watches for changes in `src/` directory
- 📡 API endpoints available at `http://localhost:4000/api/*`

**When to use:** Working on backend workflows, testing APIs, debugging nodes

#### 4. **Start Frontend Only**
```bash
npm run dev:frontend
```

**What it does:**
- ⚡ Starts only the Vite dev server on port 5173
- 🎨 Hot reload for React components and styles
- 🔍 Source maps for debugging

**When to use:** Working on UI/UX, styling, frontend components

#### 5. **Generate TypeScript Types**
```bash
cd frontend && npm run blok:codegen
```

**What it does:**
- 🔮 Analyzes all your backend workflows
- 📝 Generates TypeScript types for each workflow
- 🎣 Creates type-safe React hooks (`useWorkflow`, `useWorkflowQuery`, `useWorkflowMutation`)
- 💡 Enables autocomplete in your IDE

**When to use:** 
- After creating new workflows
- After modifying workflow inputs/outputs
- Before starting frontend development

**Example:**
```typescript
// Automatically generated and fully typed!
import { useAuthLoginMutation } from '@/blok-types';

const { mutate: login } = useAuthLoginMutation();

login({ 
  email: 'admin@example.com',
  password: 'admin123' 
  // ✅ TypeScript will autocomplete and validate!
});
```

#### 6. **Build for Production**
```bash
npm run build:all
```

**What it does:**
- 🏗️ Compiles TypeScript backend to optimized JavaScript
- 📦 Bundles frontend with Vite (optimized, minified)
- 🎨 Processes Tailwind CSS
- ✅ Type checks entire codebase
- 📁 Output: `dist/` (backend) and `frontend/dist/` (frontend)

**When to use:** Preparing for deployment, testing production build

#### 7. **Start Production Server**
```bash
npm start
```

**What it does:**
- 🚀 Runs the compiled production build
- ⚡ Serves both backend API and frontend assets
- 🔒 Production optimizations enabled

**Requirements:** Must run `npm run build:all` first

#### 8. **Database Migrations**
```bash
npx prisma migrate dev --name <migration-name>
```

**What it does:**
- 🗄️ Creates and applies database schema changes
- 📝 Generates migration files
- 🔄 Updates Prisma Client types

**Example:**
```bash
npx prisma migrate dev --name add_user_preferences
```

#### 9. **Reset Database**
```bash
npx prisma migrate reset
```

**What it does:**
- 🗑️ Drops all database tables
- 🔄 Reapplies all migrations from scratch
- ⚠️ **WARNING:** Deletes all data!

**When to use:** Development only, when you need a clean database

#### 10. **View Database**
```bash
npx prisma studio
```

**What it does:**
- 🎨 Opens a web-based database GUI at `http://localhost:5555`
- 👀 View all tables and data
- ✏️ Edit records directly
- 🔍 Browse relationships

---

## 📋 Complete Command Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npx @well-prado/create-blok-fullstack@latest <name>` | Create new project | Starting a new application |
| `npm run dev` | Development mode (both servers) | Daily development |
| `npm run dev:backend` | Backend only | Working on APIs/workflows |
| `npm run dev:frontend` | Frontend only | Working on UI/UX |
| `cd frontend && npm run blok:codegen` | Generate types | After workflow changes |
| `npm run build:all` | Build for production | Before deployment |
| `npm start` | Run production build | Production/staging servers |
| `npx prisma migrate dev` | Create migration | Database schema changes |
| `npx prisma migrate reset` | Reset database | Clean slate (dev only) |
| `npx prisma studio` | Database GUI | Viewing/editing data |

---

## 🎯 Common Workflows

### Starting Your Day
```bash
cd your-project
npm run dev
# Opens backend at http://localhost:4000
# Opens frontend at http://localhost:5173
```

### Adding a New Workflow
```bash
# 1. Create your workflow in src/workflows/
# 2. Regenerate types
cd frontend && npm run blok:codegen

# 3. Use the new types in your React components!
```

### Deploying to Production
```bash
# 1. Build everything
npm run build:all

# 2. Test production build locally
npm start

# 3. Deploy dist/ folders to your server
```

---

## 🚀 Features

- **Complete Authentication System** - Login, register, logout, session management
- **Admin Dashboard** - User management, analytics, system monitoring
- **React Frontend** - Modern UI with Shadcn components and Tailwind CSS
- **Database Integration** - SQLite with Prisma ORM
- **Email Services** - Multi-provider email system
- **Security Features** - Password hashing, rate limiting, audit logs
- **Type Safety** - Full TypeScript support with auto-generated types

## 🏗️ Project Structure

```
{{PROJECT_NAME}}/
├── src/                    # Backend source code
│   ├── nodes/             # Blok nodes (authentication, database, etc.)
│   ├── workflows/         # Blok workflows
│   └── index.ts          # Server entry point
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── pages/        # React pages
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # React contexts
│   │   └── lib/          # Utility libraries
│   └── package.json
├── database/              # Database schemas and migrations
├── public/                # Static files
└── package.json          # Backend dependencies
```

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

2. **Set up database:**

   ```bash
   npx prisma migrate dev --name init
   ```

3. **Start development servers:**

   ```bash
   npm run dev
   ```

4. **Access your application:**
   - Backend: http://localhost:4000
   - Frontend: http://localhost:5173

## 👤 Demo Credentials

- **Admin:** admin@example.com / admin123
- **User:** user@example.com / user123

## 📜 Available Scripts

### Backend

- `npm run dev` - Start both backend and frontend in development mode
- `npm run dev:backend` - Start only the backend server
- `npm run build` - Build the backend for production
- `npm start` - Start the production server

### Frontend

- `npm run dev:frontend` - Start only the frontend development server
- `npm run build:frontend` - Build the frontend for production
- `npm run blok:codegen` - Generate TypeScript types from workflows

### Combined

- `npm run build:all` - Build both backend and frontend
- `npm run dev` - Start both servers concurrently

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=file:./database/app.db

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Email Service (optional)
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-resend-api-key

# Server
PORT=4000
NODE_ENV=development
```

### Database

The project uses SQLite with Prisma ORM. Database files are stored in the `database/` directory.

To run migrations:

```bash
cd database && npx tsx migrate.ts
```

## 🎨 Frontend Development

The frontend is built with:

- **React 19** - Latest React features
- **TypeScript** - Full type safety
- **Tailwind CSS v4** - Modern utility-first CSS
- **Shadcn UI** - Beautiful, accessible components
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **Framer Motion** - Smooth animations

### Adding New Pages

1. Create a new page component in `frontend/src/pages/`
2. Add the route in your routing configuration
3. The page will automatically have access to authentication context

### Type Generation

The project automatically generates TypeScript types from your Blok workflows:

```bash
cd frontend && npm run blok:codegen
```

## 🔐 Authentication

The authentication system includes:

- Session-based authentication with JWT
- Password hashing with bcryptjs
- Role-based access control (admin/user)
- Protected routes and API endpoints
- Automatic session refresh

## 📊 Admin Dashboard

Access the admin dashboard at `/admin` (admin credentials required):

- User management (create, update, delete users)
- System analytics and monitoring
- Audit logs and security features
- Email service configuration
- System settings

## 🚀 Deployment

### Production Build

```bash
npm run build:all
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure your production database
3. Set secure JWT secret
4. Configure email service credentials

### Running in Production

```bash
npm start
```

## 📚 Documentation

- [Blok Framework Docs](https://blok-framework.com)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Shadcn UI](https://ui.shadcn.com)

## 🤝 Contributing

This project was generated from the Blok Framework template. Feel free to customize it for your needs!

## 📄 License

MIT License - feel free to use this template for your projects.
