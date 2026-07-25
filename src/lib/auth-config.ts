import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db/connection";
import { userProfiles } from "./db/schema/tasky";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      if (user.email) {
        try {
          const [existing] = await db
            .select({ id: userProfiles.id })
            .from(userProfiles)
            .where(eq(userProfiles.email, user.email));

          if (!existing) {
            await db.insert(userProfiles).values({
              id: user.id || crypto.randomUUID(),
              email: user.email,
              name: user.name,
              image: user.image,
              emailVerified: profile?.email_verified ? new Date() : null,
            });
          } else {
            await db
              .update(userProfiles)
              .set({
                name: user.name,
                image: user.image,
                updatedAt: new Date(),
              })
              .where(eq(userProfiles.email, user.email));
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        if (user.email) {
          try {
            const [dbUser] = await db
              .select({ id: userProfiles.id })
              .from(userProfiles)
              .where(eq(userProfiles.email, user.email));

            token.id = dbUser?.id || user.id;
          } catch {
            token.id = user.id;
          }
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
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
});
