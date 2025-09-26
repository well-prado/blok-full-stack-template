# {{PROJECT_NAME}}

Complete Blok full-stack application with authentication, admin dashboard, and React frontend.

## 🚀 Features

- **Complete Authentication System** - Login, register, logout, session management
- **Admin Dashboard** - User management, analytics, system monitoring
- **React Frontend** - Modern UI with Shadcn components and Tailwind CSS
- **Database Integration** - SQLite with Drizzle ORM
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
   cd database && npx tsx migrate.ts && cd ..
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

The project uses SQLite with Drizzle ORM. Database files are stored in the `database/` directory.

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
