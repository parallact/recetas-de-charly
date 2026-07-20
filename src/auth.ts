import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { sanitizeEmail } from '@/lib/validators/email'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    // Credentials provider for email/password login
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = sanitizeEmail(credentials.email as string)
        const password = credentials.password as string

        // Brute-force protection enforced on the real auth path. The
        // loginUser() pre-check can be bypassed by calling signIn() directly,
        // so the limiter must live here too. Keyed on the submitted email and,
        // when available, the client IP.
        const forwardedFor = request?.headers?.get?.('x-forwarded-for') ?? ''
        const clientIp = forwardedFor.split(',')[0]?.trim() || 'unknown'
        if (!checkRateLimit(`authorize:${email}`, 5, 15 * 60 * 1000)) {
          return null
        }
        if (!checkRateLimit(`authorize-ip:${clientIp}`, 20, 15 * 60 * 1000)) {
          return null
        }

        // Find user by email
        const user = await prisma.users.findUnique({
          where: { email },
        })

        if (!user || !user.password) {
          return null
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password)

        if (!isValidPassword) {
          return null
        }

        // Block login if email not verified
        if (!user.email_verified) {
          throw new Error('emailNotVerified')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
    // Google OAuth (optional - configure when ready)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id
      }
      // Create profile on first sign in
      if (account && user) {
        const existingProfile = await prisma.profiles.findUnique({
          where: { id: user.id }
        })
        if (!existingProfile) {
          await prisma.profiles.create({
            data: {
              id: user.id!,
              display_name: user.name,
              avatar_url: user.image,
            }
          })
        }
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
