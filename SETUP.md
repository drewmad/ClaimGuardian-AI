# Florida Insurance Claims Assistant - Setup Guide

This document provides setup instructions to resolve dependencies and development environment issues for the Florida Insurance Claims Assistant project.

## Required Dependencies

The project requires the following dependencies:

### Core Dependencies
- Next.js (`next`)
- React & React DOM (`react`, `react-dom`)
- NextAuth.js (`next-auth`, `@next-auth/prisma-adapter`)
- Prisma ORM (`@prisma/client`, `prisma`)
- Data validation (`zod`)
- Date formatting (`date-fns`)
- Password hashing (`bcrypt`)
- UI utilities (`class-variance-authority`, `clsx`, `tailwind-merge`)
- File upload (`react-dropzone`)
- AWS SDK (`@aws-sdk/client-s3`, `@aws-sdk/client-rekognition`)

### Development Dependencies
- TypeScript (`typescript`)
- Type definitions (`@types/react`, `@types/node`, `@types/bcrypt`, etc.)
- ESLint (`eslint`, `eslint-config-next`, etc.)

## Setup Instructions

### 1. Install Node.js

First, ensure you have Node.js version 18.x or later installed:

```bash
# Check if Node.js is already installed
node -v

# Install Node.js if needed (using a package manager like nvm, brew, etc.)
```

### 2. Initialize Package Manager

The project needs to be initialized with a package manager:

```bash
# Navigate to project directory
cd Insurance

# Initialize npm if package.json doesn't exist
npm init -y
```

### 3. Install Dependencies

```bash
# Install core dependencies
npm install next react react-dom next-auth @next-auth/prisma-adapter @prisma/client zod date-fns bcrypt class-variance-authority clsx tailwind-merge react-dropzone @aws-sdk/client-s3 @aws-sdk/client-rekognition

# Install development dependencies
npm install --save-dev typescript @types/react @types/react-dom @types/node @types/bcrypt eslint eslint-config-next prisma
```

### 4. Configure Prisma

```bash
# Initialize Prisma if not already set up
npx prisma init

# Apply database migrations
npx prisma migrate dev
```

### 5. Set Environment Variables

Create a `.env` file in the project root with required environment variables:

```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/florida_insurance?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# AWS
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
S3_BUCKET_NAME="your-bucket-name"
```

### 6. Start Development Server

Once all dependencies are installed and configured, start the development server:

```bash
npm run dev
```

## Known Issues and Workarounds

### 1. React Type Errors

If you encounter React type errors, the project includes a workaround in `src/lib/fix-react.ts`. Import it in components as needed:

```typescript
// Instead of:
import React from 'react';

// Use:
import React from '@/lib/fix-react';
```

### 2. Module Resolution Errors

For module resolution errors, ensure your `tsconfig.json` has proper path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 3. NextAuth Type Errors

For NextAuth type errors, the project includes custom type definitions in `src/types/next-auth.d.ts`.

## Current Project Status

The project implementation has completed the following major iterations:

1. Project Setup & Authentication ✅
2. Core Insurance Features ✅
   - Insurance Policy Management ✅
   - Claims Management ✅
   - Dashboard ✅

Currently working on:
- Document Management (Iteration 3)

Issues to resolve:
- Installing required dependencies
- Fixing TypeScript type errors

## Getting Help

If you encounter any issues during setup:

1. Check this setup guide for common solutions
2. Review console errors for specific missing dependencies
3. Consult the `src/lib/fix-imports.md` document for targeted fixes
4. Manually update type definitions in the `src/types` directory as needed 