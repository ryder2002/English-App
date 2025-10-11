import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface User {
  id: number
  email: string
  name?: string | null
}

export interface AuthResult {
  user: User
  token: string
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret'
  private static readonly JWT_EXPIRES_IN = '7d'

  // Register new user
  static async register(email: string, password: string, name?: string): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new Error('User already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    )

    return { 
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined
      }, 
      token 
    }
  }

  // Login user
  static async login(email: string, password: string): Promise<AuthResult> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    )

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined
      },
      token
    }
  }

  // Verify JWT token
  static async verifyToken(token: string): Promise<User | null> {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as { userId: number; email: string }
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true
        }
      })

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name || undefined
      }
    } catch (error) {
      return null
    }
  }

  // Get user by ID
  static async getUserById(id: number): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined
    }
  }

  // Update user
  static async updateUser(id: number, data: { name?: string; email?: string }): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined
    }
  }

  // Change password
  static async changePassword(id: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect')
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12)
    
    await prisma.user.update({
      where: { id },
      data: { password: hashedNewPassword }
    })
  }

  // Delete user
  static async deleteUser(id: number): Promise<void> {
    await prisma.user.delete({
      where: { id }
    })
  }
}

// Standalone function for verifying JWT tokens
export function verifyJWT(token: string): { userId: number; email: string } | null {
  try {
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret'
    const payload = jwt.verify(token, JWT_SECRET) as any
    return {
      userId: payload.userId,
      email: payload.email
    }
  } catch (error) {
    return null
  }
}
