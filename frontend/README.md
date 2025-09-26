# 🚀 Modern React Frontend Template

A cutting-edge React frontend template with the latest technologies:

- **React 19** - Latest version with enhanced performance
- **Tailwind CSS v4** - Next-generation CSS framework with no config
- **Shadcn UI** - Beautiful, accessible components
- **TypeScript** - Full type safety
- **Vite** - Lightning-fast development

## ✨ Features

### 🔥 Latest Technologies

- **React 19.1.1** - Latest stable release with improved performance
- **Tailwind CSS 4.0.0** - Revolutionary CSS framework with no PostCSS/config needed
- **TypeScript 5.2+** - Full type safety and modern syntax
- **Vite 5** - Ultra-fast build tool and dev server

### 🎨 UI Components

- **Shadcn UI** - Production-ready components built with Radix UI
- **Lucide React** - Beautiful icon library
- **Responsive Design** - Mobile-first approach
- **Dark/Light Mode** - Built-in theme system

### 🛠️ Developer Experience

- **Hot Module Replacement** - Instant updates during development
- **TypeScript** - Full type checking and IntelliSense
- **ESLint** - Code quality and consistency
- **Path Aliases** - Clean imports with `@/` prefix

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm (recommended)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── ui/          # Shadcn UI components
│   ├── lib/
│   │   └── utils.ts     # Utility functions
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # App entry point
│   └── globals.css      # Global styles with Tailwind
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── components.json      # Shadcn UI configuration
└── package.json         # Dependencies and scripts
```

## 🎨 Styling

### Tailwind CSS v4

This template uses Tailwind CSS v4, which brings major improvements:

- **No config file needed** - Configuration through CSS
- **No PostCSS required** - Direct integration with build tools
- **Better performance** - Faster builds and smaller bundles
- **Simplified setup** - Just import and use

```css
/* globals.css */
@import "tailwindcss";

/* Your custom styles */
@layer base {
  body {
    @apply bg-background text-foreground;
  }
}
```

### CSS Variables

The template includes a complete design system with CSS variables:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... more variables */
}
```

## 🧩 Components

### Adding Shadcn Components

```bash
# Add new components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input

# Components will be added to src/components/ui/
```

### Using Components

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello World</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

## 🔧 Configuration

### Vite Configuration

The Vite config includes:

- React plugin for JSX support
- Path aliases for clean imports
- Tailwind CSS integration
- TypeScript support

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### TypeScript Configuration

Strict TypeScript setup with:

- Modern ES2020 target
- Strict type checking
- Path mapping for aliases
- React JSX support

## 📦 Available Scripts

```bash
# Development
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Build for production
pnpm preview      # Preview production build

# Code Quality
pnpm type-check   # TypeScript type checking
pnpm lint         # ESLint code checking
pnpm lint:fix     # Fix ESLint errors automatically
```

## 🚀 Production Ready

This template is production-ready with:

- ✅ **Modern React 19** - Latest features and performance
- ✅ **Tailwind CSS v4** - No config, better performance
- ✅ **Type Safety** - Full TypeScript coverage
- ✅ **Optimized Builds** - Tree shaking and code splitting
- ✅ **Accessible Components** - WCAG compliant Shadcn UI
- ✅ **Developer Experience** - Hot reload, linting, type checking

## 🎯 What's New in This Template

### React 19 Benefits

- Enhanced performance and smaller bundle sizes
- Improved developer experience
- Better error boundaries and debugging
- Modern JSX transform

### Tailwind CSS v4 Benefits

- No configuration file needed
- No PostCSS dependency
- Faster build times
- Cleaner project structure

### Modern Development

- Latest TypeScript features
- Optimized Vite configuration
- Clean project structure
- Production-ready setup

## 🤝 Contributing

This template is designed to be a starting point for modern React applications. Feel free to:

- Add more Shadcn components as needed
- Customize the theme in `globals.css`
- Add additional development tools
- Extend the TypeScript configuration

## 📄 License

This template is open source and available under the MIT License.

---

**Built with ❤️ using the latest web technologies**

- React 19 🚀
- Tailwind CSS v4 🎨
- Shadcn UI 🧩
- TypeScript 📝
- Vite ⚡
