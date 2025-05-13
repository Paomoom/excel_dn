import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const { Title } = Typography;

const LoginPage: React.FC = () => {
  const { login, error, clearError, isLoading } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      clearError();
      setLocalError(null);
      await login(values.username, values.password);
      // 登录成功，跳转到主页
      navigate('/');
    } catch (err) {
      // 错误已经在useAuth钩子中处理
      console.error('登录失败:', err);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card 
        style={{ 
          width: 400, 
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          borderRadius: '8px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>登录到Excel绘图</Title>
        </div>

        {(error || localError) && (
          <Alert
            message={error || localError}
            type="error"
            style={{ marginBottom: 24 }}
            closable
            onClose={() => {
              clearError();
              setLocalError(null);
            }}
          />
        )}

        <Form
          form={form}
          name="login"
          initialValues={{ remember: true }}
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              style={{ width: '100%' }}
              loading={isLoading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <span>没有账号?</span>
          <Link to="/register">立即注册</Link>
        </Space>
      </Card>
    </div>
  );
};

export default LoginPage; 