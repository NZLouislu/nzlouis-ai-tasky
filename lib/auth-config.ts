import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { taskyDb } from "./supabase/tasky-db-client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Create user profile record on first login
      if (user.email) {
        try {
          // Check if user already exists
          const { data: existingUser } = await taskyDb
            .from('user_profiles')
            .select('id')
            .eq('email', user.email)
            .single();

          if (!existingUser) {
            // Create new user record
            const { error } = await taskyDb
              .from('user_profiles')
              .insert({
                id: user.id || crypto.randomUUID(),
                email: user.email,
                name: user.name,
                image: user.image,
                email_verified: profile?.email_verified ? new Date().toISOString() : null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (error) {
              console.error('Failed to create user profile:', error);
              // Continue login even if creation fails
            }
          } else {
            // Update existing user info
            await taskyDb
              .from('user_profiles')
              .update({
                name: user.name,
                image: user.image,
                updated_at: new Date().toISOString(),
              })
              .eq('email', user.email);
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Add user info to token on first login
      if (user) {
        // Get user ID from database
        if (user.email) {
          const { data: dbUser } = await taskyDb
            .from('user_profiles')
            .select('id')
            .eq('email', user.email)
            .single();

          token.id = dbUser?.id || user.id;
        } else {
          token.id = user.id;
        }
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      // Get user info from token
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt', // Use JWT strategy to avoid database access in Edge Runtime
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
