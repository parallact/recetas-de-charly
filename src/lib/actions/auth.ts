'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sanitizeEmail, getEmailError } from '@/lib/validators/email'
import { getNameError } from '@/lib/validators/name'
import { checkRateLimit } from '@/lib/rate-limit'

interface RegisterResult {
  success: boolean
  error?: string
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

    // Create user with password
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

    return { success: true }
  } catch {
    return { success: false, error: 'accountCreationError' }
  }
}
