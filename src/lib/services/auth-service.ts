import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface User {
  id: number
  email: string
  name?: string | null
  role?: string
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
        name,
        lastLoginAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLoginAt: true
      }
    })

    // Generate JWT token (include role in payload)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role || null },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    )

    return { 
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role || undefined
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

    // Generate JWT token (include role)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role || null },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    )

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role || undefined
      },
      token
    }
  }

  // Verify JWT token
  static async verifyToken(token: string): Promise<User | null> {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as { userId: number; email: string; role?: string }
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      })

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role || undefined
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
        name: true,
        role: true
      }
    })

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role || undefined
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
        name: true,
        role: true
      }
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role || undefined
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
export function verifyJWT(token: string): { userId: number; email: string; role: string | null } | null {
  try {
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret'
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Type guard to ensure payload has required properties
    if (typeof decoded !== 'object' || !decoded || 
        !('userId' in decoded) || !('email' in decoded)) {
      return null
    }

    const payload = decoded as { userId: number; email: string; role?: string }

    // Always return a defined role value (null if not present)
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role || null  // Ensure role is never undefined
    }
  } catch (error) {
    return null
  }
}
