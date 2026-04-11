# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Kirana Konnect (Mobile App)
- **Path**: `artifacts/kirana-konnect/`
- **Type**: Expo (React Native)
- **Preview Path**: `/`
- **Description**: Map-first hyperlocal grocery platform for discovering nearby kirana stores

**Customer Features:**
- Splash screen + OTP login
- Map home screen with interactive shop pins
- Shop detail with category tabs + product listing
- Search (products + shops)
- Cart with pickup/delivery toggle
- Checkout with address + payment selection (COD/UPI)
- Order tracking with auto-advancing status timeline
- Order history with reorder functionality

**Shopkeeper Features:**
- Dashboard (today's orders, earnings, pending count)
- Order management (accept/reject, pack, ready/dispatch)
- Inventory management (add/edit/delete products, unit/category chips)

**Tech:**
- Expo Router (file-based routing)
- React Context (AppContext) + AsyncStorage
- Platform-specific map: `MapView.tsx` (native, react-native-maps 1.18.0) / `MapView.web.tsx` (web grid mock)
- Colors: `#2E7D32` primary green, `#FF9800` accent orange

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
