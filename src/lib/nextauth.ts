import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { prisma } from "@/lib/prisma";
import { createSession, detectSuspiciousActivity } from "./session-management";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }) {
      // Add user ID to token when signing in
      if (user) {
        token.id = user.id;
      }
      
      // Handle session updates
      if (trigger === "update" && session) {
        // Update the token with any session changes
        Object.assign(token, session);
      }
      
      return token;
    },
    
    async session({ session, token }) {
      // Add user ID to session from token
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      
      return session;
    },
    
    async signIn({ user, account, profile, email, credentials, req }) {
      // Skip extra checks for non-credentials providers
      if (!credentials || !req) return true;
      
      const ipAddress = req.headers["x-forwarded-for"] as string || 
                        req.socket.remoteAddress || 
                        "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";
      
      // Create a session record for this login
      try {
        if (user && user.id) {
          const userId = user.id;
          
          // Check for suspicious login
          const isSuspicious = await detectSuspiciousActivity(
            userId,
            ipAddress,
            userAgent
          );
          
          if (isSuspicious) {
            // Store the suspicious flag in the user object to use in the JWT
            (user as any).suspiciousLogin = true;
            
            // Optionally trigger notifications or additional verification here
            // ...
          }
          
          // Create session in database
          await createSession(userId, ipAddress, userAgent);
        }
        
        return true;
      } catch (error) {
        console.error("Session tracking error:", error);
        // Allow sign in even if session tracking fails
        return true;
      }
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        
        if (!user) {
          throw new Error("No user found with this email");
        }
        
        // Check email verification
        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in");
        }
        
        // Check account lockout
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
          const remainingMinutes = Math.ceil(
            (user.lockoutUntil.getTime() - Date.now()) / (1000 * 60)
          );
          throw new Error(
            `Account is locked due to too many failed attempts. Try again in ${remainingMinutes} minute${
              remainingMinutes === 1 ? "" : "s"
            }`
          );
        }
        
        const isValidPassword = await compare(credentials.password, user.password);
        
        if (!isValidPassword) {
          // Increment failed login attempts
          const failedAttempts = (user.failedLoginAttempts || 0) + 1;
          const MAX_ATTEMPTS = 5;
          
          if (failedAttempts >= MAX_ATTEMPTS) {
            // Lock account for 15 minutes
            const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
            
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: failedAttempts,
                lockoutUntil,
              },
            });
            
            throw new Error(
              "Account locked for 15 minutes due to too many failed login attempts"
            );
          } else {
            // Just increment the counter
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: failedAttempts,
              },
            });
            
            throw new Error(`Invalid password. ${MAX_ATTEMPTS - failedAttempts} attempts remaining`);
          }
        }
        
        // Reset failed login attempts on successful login
        if (user.failedLoginAttempts > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockoutUntil: null,
            },
          });
        }
        
        // Check for MFA requirement
        if (user.mfaEnabled && user.mfaVerified) {
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
      },
    }),
  ],
  events: {
    async signOut({ token, session }) {
      // Clean up the user's session when they sign out
      try {
        if (token && token.id) {
          const userId = token.id as string;
          
          // Delete current session if it exists
          if (session?.sessionToken) {
            await prisma.session.deleteMany({
              where: {
                sessionToken: session.sessionToken,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error cleaning up session:", error);
      }
    },
  },
}; 