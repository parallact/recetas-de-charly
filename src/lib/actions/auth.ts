'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signIn } from '@/auth'
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
  password: string,
  redirectTo: string
): Promise<LoginResult> {
  const cleanEmail = sanitizeEmail(email)

  if (!checkRateLimit(`login:${cleanEmail}`, 5, 15 * 60 * 1000)) {
    return { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }
  }

  const emailError = getEmailError(cleanEmail)
  if (emailError) {
    return { error: emailError }
  }

  if (!password) {
    return { error: 'La contraseña es requerida' }
  }

  // Validate credentials before calling signIn to avoid AuthError handling issues
  const user = await prisma.users.findUnique({
    where: { email: cleanEmail },
  })

  if (!user || !user.password) {
    return { error: 'Email o contraseña incorrectos' }
  }

  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    return { error: 'Email o contraseña incorrectos' }
  }

  // Credentials valid — signIn will redirect on success (throws NEXT_REDIRECT)
  await signIn('credentials', {
    email: cleanEmail,
    password,
    redirectTo,
  })
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
      return { success: false, error: 'Todos los campos son requeridos' }
    }

    const cleanEmailForLimit = sanitizeEmail(email)
    if (!checkRateLimit(`register:${cleanEmailForLimit}`, 3, 60 * 60 * 1000)) {
      return { success: false, error: 'Demasiados intentos de registro. Intenta de nuevo en 1 hora.' }
    }

    // Name validation
    const nameError = getNameError(name)
    if (nameError) {
      return { success: false, error: nameError }
    }

    if (password.length > 128) {
      return { success: false, error: 'La contraseña no puede tener más de 128 caracteres' }
    }

    // Email validation
    const cleanEmail = sanitizeEmail(email)
    const emailError = getEmailError(cleanEmail)
    if (emailError) {
      return { success: false, error: emailError }
    }

    if (!password.trim()) {
      return { success: false, error: 'La contraseña no puede contener solo espacios' }
    }

    if (password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' }
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: cleanEmail }
    })

    if (existingUser) {
      return { success: false, error: 'Este email ya esta registrado' }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

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
    return { success: false, error: 'Error al crear la cuenta' }
  }
}
