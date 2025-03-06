import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  authenticate, 
  AuthResponse, 
  createUser, 
  updateUser, 
  getAllUsers, 
  getUserById, 
  toggleUserStatus, 
  resetPassword 
} from '../../services/auth';

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  email?: string;
  isActive?: boolean;
  lastLogin?: Date | null;
  phone?: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  user: User | null;
  isLoading: boolean;
  users: User[];
  addUser: (userData: any) => Promise<{ success: boolean; user?: any; error?: string }>;
  updateUserData: (userId: number, userData: any) => Promise<{ success: boolean; user?: any; error?: string }>;
  fetchUsers: () => Promise<void>;
  fetchUserDetails: (userId: number) => Promise<{ success: boolean; user?: any; error?: string }>;
  activateDeactivateUser: (userId: number) => Promise<{ success: boolean; error?: string }>;
  resetUserPassword: (userId: number, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: async () => ({ success: false, error: 'Context not initialized' }),
  logout: () => {},
  user: null,
  isLoading: false,
  users: [],
  addUser: async () => ({ success: false, error: 'Context not initialized' }),
  updateUserData: async () => ({ success: false, error: 'Context not initialized' }),
  fetchUsers: async () => {},
  fetchUserDetails: async () => ({ success: false, error: 'Context not initialized' }),
  activateDeactivateUser: async () => ({ success: false, error: 'Context not initialized' }),
  resetUserPassword: async () => ({ success: false, error: 'Context not initialized' })
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const authUser = localStorage.getItem('user');
      if (authUser) {
        try {
          const userData = JSON.parse(authUser);
          setUser(userData);
          setIsAuthenticated(true);
          
          // Fetch users list if authenticated user is admin
          if (userData.role === 'admin') {
            await fetchUsers();
          }
        } catch (error) {
          console.error('Failed to parse auth user:', error);
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authenticate(username, password);
      if (response.success && response.user) {
        setIsAuthenticated(true);
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Fetch users list if authenticated user is admin
        if (response.user.role === 'admin') {
          await fetchUsers();
        }
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: 'An error occurred during login'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setUsers([]);
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchUsers = async (): Promise<void> => {
    try {
      const response = await getAllUsers();
      if (response.success && response.users) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const addUser = async (userData: any) => {
    try {
      const response = await createUser(userData);
      if (response.success) {
        await fetchUsers();
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create user'
      };
    }
  };

  const updateUserData = async (userId: number, userData: any) => {
    try {
      const response = await updateUser(userId, userData);
      if (response.success) {
        await fetchUsers();
        
        // Update current user if it's the same user
        if (user && user.id === userId) {
          setUser(prevUser => ({
            ...prevUser!,
            ...response.user
          }));
          localStorage.setItem('user', JSON.stringify({
            ...user,
            ...response.user
          }));
        }
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update user'
      };
    }
  };

  const fetchUserDetails = async (userId: number) => {
    try {
      return await getUserById(userId);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch user details'
      };
    }
  };

  const activateDeactivateUser = async (userId: number) => {
    try {
      const response = await toggleUserStatus(userId);
      if (response.success) {
        await fetchUsers();
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update user status'
      };
    }
  };

  const resetUserPassword = async (userId: number, newPassword: string) => {
    try {
      return await resetPassword(userId, newPassword);
    } catch (error) {
      return {
        success: false,
        error: 'Failed to reset password'
      };
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        login, 
        logout, 
        user, 
        isLoading,
        users,
        addUser,
        updateUserData,
        fetchUsers,
        fetchUserDetails,
        activateDeactivateUser,
        resetUserPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 