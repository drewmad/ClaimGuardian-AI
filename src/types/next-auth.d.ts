// Type definitions for next-auth
// This extends the default Session type to include user ID

declare module 'next-auth' {
  interface Session {
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

// Add type definitions for getServerSession
declare module 'next-auth/next' {
  import { NextAuthOptions } from 'next-auth';
  
  function getServerSession(
    ...args: [...unknown[], NextAuthOptions]
  ): Promise<Session | null>;
}

// Extend next-auth to include credentials provider
declare module 'next-auth/providers/credentials' {
  interface CredentialInput {
    label?: string;
    type?: string;
    value?: string;
    placeholder?: string;
  }

  interface CredentialsConfig {
    id?: string;
    name: string;
    credentials: Record<string, CredentialInput>;
    authorize(credentials: Record<string, string>): Promise<any>;
  }

  function CredentialsProvider(options: CredentialsConfig): any;
  export default CredentialsProvider;
} 