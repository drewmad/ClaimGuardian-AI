import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcrypt';
import { z } from 'zod';
import prisma from './prisma';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          const { email, password } = loginSchema.parse(credentials);

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) {
            throw new Error('No user found with this email');
          }

          // Check if email is verified
          if (!user.emailVerified) {
            throw new Error('Please verify your email address before logging in. Check your inbox for the verification link or request a new one.');
          }

          const isPasswordValid = await compare(password, user.password);

          if (!isPasswordValid) {
            throw new Error('Invalid password');
          }

          // Check for MFA requirement
          if (user.mfaEnabled && user.mfaVerified) {
            // Return partial session to indicate MFA is required
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              requiresMfa: true,
            };
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new Error(error.errors[0].message);
          }
          throw error; // Pass through custom error messages
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        
        // If MFA is required, add flag to token
        if ((user as any).requiresMfa) {
          token.requiresMfa = true;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        
        // Add MFA requirement to session if present
        if ((token as any).requiresMfa) {
          (session as any).requiresMfa = true;
        }
      }
      return session;
    },
  },
}; 