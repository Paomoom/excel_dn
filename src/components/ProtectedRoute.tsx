import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // 如果正在加载认证状态，显示加载指示器
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 如果用户未登录，重定向到登录页面
  if (!user) {
    // 将当前路径保存在重定向状态中，以便登录后可以返回
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 如果用户已登录，渲染子组件
  return <>{children}</>;
};

export default ProtectedRoute; 