'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isValidEmail, sanitizeEmail } from '@/lib/validators/email'

interface RegisterResult {
  success: boolean
  error?: string
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

    // Max length validation
    if (name.length > 50) {
      return { success: false, error: 'El nombre no puede tener más de 50 caracteres' }
    }

    if (email.length > 255) {
      return { success: false, error: 'El email no puede tener más de 255 caracteres' }
    }

    if (password.length > 128) {
      return { success: false, error: 'La contraseña no puede tener más de 128 caracteres' }
    }

    // Email validation
    const cleanEmail = sanitizeEmail(email)
    if (!isValidEmail(cleanEmail)) {
      return { success: false, error: 'El email no es válido' }
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
