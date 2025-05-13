import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const { Title } = Typography;

const RegisterPage: React.FC = () => {
  const { register, error, clearError, isLoading } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (values: { username: string; password: string; confirmPassword: string }) => {
    try {
      clearError();
      setLocalError(null);
      
      // 验证密码一致性
      if (values.password !== values.confirmPassword) {
        setLocalError('两次输入的密码不一致');
        return;
      }
      
      await register(values.username, values.password);
      // 注册成功，跳转到主页
      navigate('/');
    } catch (err) {
      // 错误已经在useAuth钩子中处理
      console.error('注册失败:', err);
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
          <Title level={2}>注册Excel绘图</Title>
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
          name="register"
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

          <Form.Item
            name="confirmPassword"
            rules={[{ required: true, message: '请确认密码!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="确认密码" 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              style={{ width: '100%' }}
              loading={isLoading}
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <span>已有账号?</span>
          <Link to="/login">立即登录</Link>
        </Space>
      </Card>
    </div>
  );
};

export default RegisterPage; 