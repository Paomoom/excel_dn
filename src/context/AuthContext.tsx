import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';

// 定义用户接口
interface User {
  username: string;
}

// 定义上下文接口
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// 创建上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 提供上下文的组件
export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化：检查用户是否已登录
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isLoggedIn()) {
          const response = await authService.getCurrentUser();
          if (response.user) {
            setUser(response.user);
          }
        }
      } catch (err) {
        console.error('初始化认证失败:', err);
        // 如果获取当前用户失败，不设置错误，只是将用户设为未登录状态
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // 登录方法
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.login(username, password);
      if (response.user) {
        setUser(response.user);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('登录过程中发生错误');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 注册方法
  const register = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.register(username, password);
      // 注册成功后自动登录
      await login(username, password);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('注册过程中发生错误');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 登出方法
  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error('登出失败:', err);
      // 即使登出API调用失败，也将用户状态设置为未登录
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 清除错误
  const clearError = () => setError(null);

  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 自定义钩子用于访问上下文
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
}; 