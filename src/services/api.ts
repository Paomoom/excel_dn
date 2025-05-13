import { ChartTemplate, LockedChart } from '../types';

const API_URL = 'http://localhost:3001/api';

// API响应接口
interface ApiResponse<T = any> {
  message?: string;
  user?: {
    username: string;
  };
  token?: string;
  data?: T;
}

// 用户服务
export const authService = {
  // 注册新用户
  async register(username: string, password: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '注册失败');
    }
    
    return data;
  },
  
  // 用户登录
  async login(username: string, password: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 包含cookie
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '登录失败');
    }
    
    // 保存token到localStorage，方便前端使用
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  },
  
  // 获取当前用户
  async getCurrentUser(): Promise<ApiResponse> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('未登录');
    }
    
    const response = await fetch(`${API_URL}/me`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      // 如果凭证无效，清除本地token
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
      }
      
      const data = await response.json();
      throw new Error(data.message || '获取用户信息失败');
    }
    
    return response.json();
  },
  
  // 用户登出
  async logout(): Promise<ApiResponse> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // 无论服务器响应如何，都清除本地token
    localStorage.removeItem('token');
    
    return response.json();
  },
  
  // 检查是否已登录
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
};

// 模板服务
export const templateService = {
  // 获取用户模板
  async getTemplates(): Promise<ChartTemplate[]> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('未登录');
    }
    
    const response = await fetch(`${API_URL}/templates`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || '获取模板失败');
    }
    
    return response.json();
  },
  
  // 保存用户模板
  async saveTemplates(templates: ChartTemplate[]): Promise<ApiResponse> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('未登录');
    }
    
    const response = await fetch(`${API_URL}/templates`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(templates),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || '保存模板失败');
    }
    
    return response.json();
  }
};

// 图表服务
export const chartService = {
  // 获取用户锁定图表
  async getLockedCharts(): Promise<LockedChart[]> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('未登录');
    }
    
    const response = await fetch(`${API_URL}/charts`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || '获取锁定图表失败');
    }
    
    return response.json();
  },
  
  // 保存用户锁定图表
  async saveLockedCharts(charts: LockedChart[]): Promise<ApiResponse> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('未登录');
    }
    
    const response = await fetch(`${API_URL}/charts`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(charts),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || '保存锁定图表失败');
    }
    
    return response.json();
  }
}; 