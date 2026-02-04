'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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

    if (password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' }
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    })

    if (existingUser) {
      return { success: false, error: 'Este email ya esta registrado' }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with password
    const user = await prisma.users.create({
      data: {
        email,
        name,
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
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Error al crear la cuenta' }
  }
}
