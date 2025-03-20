# Fixing Missing Imports and Linter Errors

This document provides instructions for fixing common linter errors across the project.

## 1. Install Required Dependencies

```bash
npm install next-auth @next-auth/prisma-adapter zod date-fns class-variance-authority clsx tailwind-merge bcrypt
npm install --save-dev @types/react @types/node @types/bcrypt
```

## 2. Fix React Scope Issues in JSX Components

For Next.js 13+ using the App Router, add React imports to all JSX files:

```typescript
import React from 'react';
```

For component files (e.g., `/src/components/`), add the React import at the top:

```typescript
import React from 'react';
```

## 3. Import Declaration Issues

Make sure the following imports are correctly set up:

For `next-auth`:
```typescript
import { getServerSession } from 'next-auth/next';
// or
import NextAuth from 'next-auth';
```

For path aliases:
```typescript
import { Button } from '@/components/shared/Button';
// Make sure tsconfig.json has the correct path aliases set
```

## 4. Type Definitions

If TypeScript complains about missing type definitions, add the following to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

For `next-auth` types, create a `next-auth.d.ts` file in the `src/types` directory:

```typescript
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: {
      id: string;
    } & DefaultSession['user'];
  }
}
```

## 5. Fixing React JSX Errors in Next.js Pages

For App Router pages, most JSX errors can be fixed by adding a client directive at the top of the file:

```typescript
'use client';
```

Or if it's a server component that only needs to render client components:

```typescript
import React from 'react';
``` 