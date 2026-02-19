'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sanitizeEmail, getEmailError } from '@/lib/validators/email'
import { getNameError } from '@/lib/validators/name'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email/mailer'
import { verifyEmailTemplate, passwordResetTemplate } from '@/lib/email/templates'

interface RegisterResult {
  success: boolean
  error?: string
  requiresVerification?: boolean
}

interface LoginResult {
  error?: string
}

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResult> {
  const cleanEmail = sanitizeEmail(email)

  if (!checkRateLimit(`login:${cleanEmail}`, 5, 15 * 60 * 1000)) {
    return { error: 'loginRateLimit' }
  }

  const emailError = getEmailError(cleanEmail)
  if (emailError) {
    return { error: emailError }
  }

  const cleanPassword = password.trim()
  if (!cleanPassword) {
    return { error: 'passwordRequired' }
  }

  // Validate credentials server-side (rate-limited)
  const user = await prisma.users.findUnique({
    where: { email: cleanEmail },
  })

  if (!user || !user.password) {
    return { error: 'invalidCredentials' }
  }

  const isValidPassword = await bcrypt.compare(cleanPassword, user.password)
  if (!isValidPassword) {
    return { error: 'invalidCredentials' }
  }

  // Check email verification
  if (!user.email_verified) {
    return { error: 'emailNotVerified' }
  }

  // Credentials valid — client handles signIn via next-auth/react
  return {}
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<RegisterResult> {
  try {
    // Validate input
    if (!name || !email || !password) {
      return { success: false, error: 'allFieldsRequired' }
    }

    const cleanEmailForLimit = sanitizeEmail(email)
    if (!checkRateLimit(`register:${cleanEmailForLimit}`, 3, 60 * 60 * 1000)) {
      return { success: false, error: 'registerRateLimit' }
    }

    // Name validation
    const nameError = getNameError(name)
    if (nameError) {
      return { success: false, error: nameError }
    }

    const cleanPassword = password.trim()

    if (cleanPassword.length > 72) {
      return { success: false, error: 'passwordTooLong' }
    }

    // Email validation
    const cleanEmail = sanitizeEmail(email)
    const emailError = getEmailError(cleanEmail)
    if (emailError) {
      return { success: false, error: emailError }
    }

    if (!cleanPassword) {
      return { success: false, error: 'passwordOnlySpaces' }
    }

    if (cleanPassword.length < 8) {
      return { success: false, error: 'passwordTooShort' }
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: cleanEmail }
    })

    if (existingUser) {
      return { success: false, error: 'emailTaken' }
    }

    // Hash password (trimmed)
    const hashedPassword = await bcrypt.hash(cleanPassword, 10)

    // Create user with password (email_verified = null until confirmed)
    const user = await prisma.users.create({
      data: {
        email: cleanEmail,
        name: name.trim(),
        password: hashedPassword,
      }
    })

    // Create profile
    await prisma.profiles.create({
      data: {
        id: user.id,
        display_name: name,
      }
    })

    // Generate and send verification email
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.verification_tokens.create({
      data: {
        identifier: cleanEmail,
        token,
        expires,
      }
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3003'
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`

    await sendEmail({
      to: cleanEmail,
      subject: 'Verificá tu email — Recetas de Charly',
      html: verifyEmailTemplate(verifyUrl),
    })

    return { success: true, requiresVerification: true }
  } catch {
    return { success: false, error: 'accountCreationError' }
  }
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!checkRateLimit(`reset:${email}`, 3, 60 * 60 * 1000)) {
      return { success: false, error: 'resetRateLimit' }
    }

    const cleanEmail = sanitizeEmail(email)
    const emailError = getEmailError(cleanEmail)
    if (emailError) {
      // Return success anyway to not reveal if email exists
      return { success: true }
    }

    const user = await prisma.users.findUnique({
      where: { email: cleanEmail },
      select: { id: true, password: true },
    })

    // Always return success — don't reveal if email exists
    if (!user || !user.password) {
      return { success: true }
    }

    // Delete any existing reset tokens for this email
    await prisma.verification_tokens.deleteMany({
      where: { identifier: `reset:${cleanEmail}` }
    })

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.verification_tokens.create({
      data: {
        identifier: `reset:${cleanEmail}`,
        token,
        expires,
      }
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3003'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    await sendEmail({
      to: cleanEmail,
      subject: 'Resetear contraseña — Recetas de Charly',
      html: passwordResetTemplate(resetUrl),
    })

    return { success: true }
  } catch {
    return { success: false, error: 'serverError' }
  }
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!token || !newPassword) {
      return { success: false, error: 'allFieldsRequired' }
    }

    const cleanPassword = newPassword.trim()
    if (cleanPassword.length < 8) {
      return { success: false, error: 'passwordTooShort' }
    }
    if (cleanPassword.length > 72) {
      return { success: false, error: 'passwordTooLong' }
    }

    // Find token — identifiers for reset use the "reset:" prefix
    const tokenRecord = await prisma.verification_tokens.findFirst({
      where: {
        token,
        identifier: { startsWith: 'reset:' },
        expires: { gt: new Date() },
      }
    })

    if (!tokenRecord) {
      return { success: false, error: 'resetTokenInvalid' }
    }

    const email = tokenRecord.identifier.replace('reset:', '')

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    })

    if (!user) {
      return { success: false, error: 'resetTokenInvalid' }
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10)

    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Delete the used token
    await prisma.verification_tokens.delete({
      where: { identifier_token: { identifier: tokenRecord.identifier, token } }
    })

    return { success: true }
  } catch {
    return { success: false, error: 'serverError' }
  }
}

export async function verifyEmail(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!token) {
      return { success: false, error: 'verifyTokenInvalid' }
    }

    const tokenRecord = await prisma.verification_tokens.findFirst({
      where: {
        token,
        identifier: { not: { startsWith: 'reset:' } },
        expires: { gt: new Date() },
      }
    })

    if (!tokenRecord) {
      return { success: false, error: 'verifyTokenInvalid' }
    }

    await prisma.users.update({
      where: { email: tokenRecord.identifier },
      data: { email_verified: new Date() },
    })

    await prisma.verification_tokens.delete({
      where: { identifier_token: { identifier: tokenRecord.identifier, token } }
    })

    return { success: true }
  } catch {
    return { success: false, error: 'serverError' }
  }
}

export async function resendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = sanitizeEmail(email)

    if (!checkRateLimit(`resend-verify:${cleanEmail}`, 3, 60 * 60 * 1000)) {
      return { success: false, error: 'resetRateLimit' }
    }

    const user = await prisma.users.findUnique({
      where: { email: cleanEmail },
      select: { email_verified: true },
    })

    if (!user) return { success: true } // Don't reveal if email exists
    if (user.email_verified) return { success: true } // Already verified

    // Delete existing verification tokens
    await prisma.verification_tokens.deleteMany({
      where: {
        identifier: cleanEmail,
        token: { not: { startsWith: 'reset:' } },
      }
    })

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.verification_tokens.create({
      data: { identifier: cleanEmail, token, expires }
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3003'
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`

    await sendEmail({
      to: cleanEmail,
      subject: 'Verificá tu email — Recetas de Charly',
      html: verifyEmailTemplate(verifyUrl),
    })

    return { success: true }
  } catch {
    return { success: false, error: 'serverError' }
  }
}
