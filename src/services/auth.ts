import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User } from '../database/models';
import { UserRole } from '../database/models/types';
import { Op } from 'sequelize';

// Validation schema for login credentials
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// Validation schema for user creation
const userCreationSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  email: z.string().email('Invalid email format'),
  role: z.enum([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.INVENTORY]),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional()
});

// Validation schema for user update
const userUpdateSchema = z.object({
  id: z.number(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.INVENTORY]).optional(),
  isActive: z.boolean().optional(),
  fullName: z.string().min(2, 'Full name is required').optional(),
  phone: z.string().optional()
});

// Mock user data - In production, this should come from a database
const USERS = [
  {
    id: 1,
    username: 'admin',
    // This is a hashed version of 'admin123'
    passwordHash: '$2a$10$8Ux.TQY0CLSh3SRQZ0yqU.LYBvF.PqnO6VkxE/BB.h9BXWYtOp8Oi',
    role: 'administrator'
  }
];

export interface AuthResponse {
  success: boolean;
  user?: {
    id: number;
    username: string;
    role: string;
    fullName: string;
  };
  error?: string;
}

export const authenticate = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    // Validate input
    const validatedInput = loginSchema.parse({ username, password });

    // Find user
    const user = await User.findOne({ where: { username: validatedInput.username, isActive: true } });
    
    if (!user) {
      return {
        success: false,
        error: 'Invalid username or password'
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedInput.password, user.passwordHash);
    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid username or password'
      };
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Return success response
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      };
    }
    return {
      success: false,
      error: 'An error occurred during authentication'
    };
  }
};

export const createUser = async (userData: z.infer<typeof userCreationSchema>): Promise<{ success: boolean; user?: any; error?: string }> => {
  try {
    // Validate input
    const validatedData = userCreationSchema.parse(userData);
    
    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: validatedData.username },
          { email: validatedData.email }
        ]
      }
    });

    if (existingUser) {
      return {
        success: false,
        error: 'Username or email already exists'
      };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);

    // Create user
    const newUser = await User.create({
      ...validatedData,
      passwordHash,
      isActive: true,
      lastLogin: null
    });

    return {
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        fullName: newUser.fullName
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      };
    }
    return {
      success: false,
      error: 'Failed to create user'
    };
  }
};

export const updateUser = async (userId: number, userData: z.infer<typeof userUpdateSchema>): Promise<{ success: boolean; user?: any; error?: string }> => {
  try {
    // Validate input
    const validatedData = userUpdateSchema.parse({ id: userId, ...userData });
    
    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Check if updating username or email
    if (validatedData.username || validatedData.email) {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            validatedData.username ? { username: validatedData.username } : null,
            validatedData.email ? { email: validatedData.email } : null
          ].filter(Boolean),
          id: { [Op.not]: userId }
        }
      });

      if (existingUser) {
        return {
          success: false,
          error: 'Username or email already exists'
        };
      }
    }

    // Update user data
    const updateData: any = { ...validatedData };
    delete updateData.id;

    // If updating password, hash it
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(updateData.password, salt);
      delete updateData.password;
    }

    await user.update(updateData);

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        fullName: user.fullName
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      };
    }
    return {
      success: false,
      error: 'Failed to update user'
    };
  }
};

export const getUserById = async (userId: number): Promise<{ success: boolean; user?: any; error?: string }> => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        fullName: user.fullName,
        phone: user.phone,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch user'
    };
  }
};

export const getAllUsers = async (): Promise<{ success: boolean; users?: any[]; error?: string }> => {
  try {
    const users = await User.findAll();
    
    return {
      success: true,
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        fullName: user.fullName,
        lastLogin: user.lastLogin
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch users'
    };
  }
};

export const toggleUserStatus = async (userId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    await user.update({ isActive: !user.isActive });
    
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to update user status'
    };
  }
};

export const resetPassword = async (userId: number, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await user.update({ passwordHash });
    
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to reset password'
    };
  }
}; 