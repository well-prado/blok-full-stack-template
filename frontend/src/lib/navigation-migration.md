# Blok Navigation Migration Guide

## Overview

This guide documents the migration from React Router + window.location to Blok's Inertia.js-inspired navigation system.

## Migration Mapping

### 1. React Router Link → BlokLink

```tsx
// OLD - React Router
import { Link } from "react-router-dom";
<Link to="/dashboard">Dashboard</Link>;

// NEW - Blok Navigation
import BlokLink from "../components/BlokLink";
<BlokLink href="/dashboard">Dashboard</BlokLink>;
```

### 2. useNavigate Hook → useBlokRouter Hook

```tsx
// OLD - React Router
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();
navigate("/dashboard");

// NEW - Blok Navigation
import { useBlokRouter } from "../hooks/useBlokRouter";
const router = useBlokRouter();
router.push("/dashboard");
```

### 3. window.location.href → router.push()

```tsx
// OLD - Window navigation (causes page reload)
window.location.href = "/login";

// NEW - Blok Navigation (SPA navigation)
const router = useBlokRouter();
router.push("/login");
```

### 4. window.location.reload() → router.reload()

```tsx
// OLD - Full page reload
window.location.reload();

// NEW - SPA reload
const router = useBlokRouter();
router.reload();
```

### 5. Button with asChild → BlokButton

```tsx
// OLD - Shadcn Button with Link
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
<Button asChild>
  <Link to="/settings">Settings</Link>
</Button>;

// NEW - BlokButton
import { BlokButton } from "../components/BlokLink";
<BlokButton href="/settings" className="button-styles">
  Settings
</BlokButton>;
```

## Files to Update

### High Priority (Navigation Breaking)

1. **frontend/src/lib/error-handler.ts**

   - Line 175: `window.location.href = "/login";` → `router.push('/login')`
   - Line 122: `window.location.reload();` → `router.reload()`

2. **frontend/src/contexts/AuthContext.tsx**

   - Line 56: `window.location.reload();` → `router.reload()`
   - Line 91: `window.location.reload();` → `router.reload()`

3. **frontend/src/components/Sidebar.tsx**
   - Line 90: `window.location.href = "/login";` → `router.push('/login')`

### Medium Priority (Page-specific)

4. **frontend/src/pages/Login.tsx**

   - Lines 22, 35, 46: `navigate()` calls → `router.push()`
   - Line 11: Import BlokLink instead of React Router Link

5. **frontend/src/pages/Register.tsx**

   - Lines 22, 36, 67: `navigate()` calls → `router.push()`

6. **frontend/src/components/DashboardHeader.tsx**
   - Lines 56, 67: `<Link to="">` → `<BlokLink href="">`

### Low Priority (Fallback Navigation)

7. **frontend/src/pages/Security.tsx**

   - Line 71: `window.location.href = "/login";`
   - Line 401: `window.location.href = "/profile"`

8. **frontend/src/pages/Profile.tsx**

   - Line 55: `window.location.href = "/login";`
   - Lines 132, 200: `window.location.reload();`

9. **frontend/src/pages/[Analytics|System|Themes|Help].tsx**

   - Various `window.location.href = "/login";` calls

10. **frontend/src/contexts/NotificationContext.tsx**

    - Line 252: `window.location.href = notification.actionUrl;`

11. **frontend/src/components/NotificationDrawer.tsx**
    - Line 523: `navigate(url);` → `router.push(url)`

## Implementation Strategy

### Phase 1: Core Infrastructure

1. ✅ Create BlokRouter class
2. ✅ Create useBlokRouter hook
3. ✅ Create BlokLink component
4. ✅ Create BlokNavigationContext
5. 🔄 Update main.tsx to include BlokNavigationProvider
6. 🔄 Update FrontendServer to handle JSON requests

### Phase 2: Critical Navigation

1. Replace ErrorHandler navigation (login redirects)
2. Replace AuthContext navigation (post-login reloads)
3. Replace Sidebar logout navigation

### Phase 3: Component Navigation

1. Replace all React Router Links
2. Replace useNavigate hooks
3. Update Button + Link combinations

### Phase 4: Page-specific Navigation

1. Update all page-level navigation
2. Replace notification navigation
3. Test all navigation flows

## Testing Checklist

### Navigation Flows

- [ ] Login → Dashboard (no page reload)
- [ ] Dashboard → Settings (SPA navigation)
- [ ] Sidebar navigation (all links)
- [ ] Logout → Login (proper cleanup)
- [ ] Error redirects to login
- [ ] Back/forward browser buttons
- [ ] Direct URL access
- [ ] Refresh page functionality

### Error Scenarios

- [ ] Network errors fall back to regular navigation
- [ ] Invalid URLs handled gracefully
- [ ] Authentication errors redirect properly
- [ ] Server errors don't break navigation

### Performance

- [ ] No full page reloads during navigation
- [ ] State preservation across navigation
- [ ] Fast navigation between pages
- [ ] Prefetching works on hover

## Migration Commands

```bash
# Search for patterns to replace
grep -r "window\.location\." frontend/src/
grep -r "useNavigate" frontend/src/
grep -r "import.*Link.*react-router" frontend/src/
grep -r "navigate(" frontend/src/

# Test navigation after changes
cd frontend && pnpm dev
# Test all navigation flows manually
```

## Rollback Plan

If issues arise:

1. Keep old navigation methods as fallback
2. Add feature flag for Blok navigation
3. Gradual rollout per page/component
4. Monitor for navigation errors
5. Quick revert to React Router if needed
