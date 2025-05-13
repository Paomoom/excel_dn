import React, { useState, useEffect } from 'react';
import { Layout, Typography, theme, Menu, Tabs, Button, message, Spin, Dropdown, Avatar, Card } from 'antd';
import { UserOutlined, LogoutOutlined, DownOutlined } from '@ant-design/icons';
import ExcelUploader from './components/ExcelUploader';
import DataPreview from './components/DataPreview';
import ChartGenerator from './components/ChartGenerator';
import { ExcelData, SheetData, LockedChart, ChartConfig, ChartTemplate } from './types';
import { useAuth } from './context/AuthContext';
import { templateService, chartService } from './services/api';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

// 本地存储键
const TEMPLATES_STORAGE_KEY = 'excel_draw_templates';
const LOCKED_CHARTS_STORAGE_KEY = 'excel_draw_locked_charts';

const App: React.FC = () => {
  const { token } = theme.useToken();
  const { user, logout } = useAuth(); // 使用认证上下文
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lockedCharts, setLockedCharts] = useState<LockedChart[]>([]);
  const [templates, setTemplates] = useState<ChartTemplate[]>([]);
  const [currentSheetName, setCurrentSheetName] = useState<string>('');

  // 加载已保存的锁定图表和模板
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // 加载用户的模板
        const userTemplates = await templateService.getTemplates();
        setTemplates(userTemplates);
        
        // 加载用户的锁定图表
        const userCharts = await chartService.getLockedCharts();
        setLockedCharts(userCharts);
      } catch (error) {
        console.error('加载用户数据失败:', error);
        message.error('加载用户数据失败');
      }
    };
    
    loadUserData();
  }, []);

  // 保存锁定图表到服务器
  useEffect(() => {
    if (lockedCharts.length > 0) {
      chartService.saveLockedCharts(lockedCharts).catch(err => {
        console.error('保存锁定图表失败:', err);
      });
    }
  }, [lockedCharts]);

  // 保存模板到服务器
  useEffect(() => {
    if (templates.length > 0) {
      templateService.saveTemplates(templates).catch(err => {
        console.error('保存模板失败:', err);
      });
    }
  }, [templates]);

  // 处理Excel数据加载完成
  const handleDataLoaded = (data: ExcelData) => {
    setExcelData(data);
    setLoading(false);
  };
  
  // 处理Excel文件上传
  const handleExcelUpload = (sheetDataMap: Record<string, SheetData>) => {
    setLoading(true);
    const fileName = Object.keys(sheetDataMap)[0].split('/').pop() || '未命名';
    const sheets = Object.keys(sheetDataMap);
    
    // 创建Excel数据对象
    const data: ExcelData = {
      fileName,
      sheets: sheets.map(sheetName => ({
        sheetName,
        headers: sheetDataMap[sheetName].headers,
        data: sheetDataMap[sheetName].data
      })),
      currentSheetName: sheets[0]
    };
    
    handleDataLoaded(data);
    setCurrentSheetName(sheets[0]);
  };
  
  // 处理工作表切换
  const handleSheetChange = (sheetName: string) => {
    if (excelData) {
      setExcelData({
        ...excelData,
        currentSheetName: sheetName
      });
    }
    setCurrentSheetName(sheetName);
  };
  
  // 获取当前工作表数据
  const getCurrentSheetData = (): SheetData | null => {
    if (!excelData) {
      return null;
    }
    
    return excelData.sheets.find(sheet => sheet.sheetName === currentSheetName) || null;
  };
  
  // 处理图表锁定
  const handleChartLock = (chartId: string, config: ChartConfig) => {
    const currentSheet = getCurrentSheetData();
    if (!currentSheet || !excelData) return;
    
    const lockedChart: LockedChart = {
      id: `locked-${Date.now()}-${chartId}`,
      config,
      sourceData: {
        headers: currentSheet.headers,
        data: currentSheet.data,
        sheetName: currentSheetName,
      },
      lockedAt: Date.now(),
      sourceFileName: excelData.fileName
    };
    
    setLockedCharts([...lockedCharts, lockedChart]);
    message.success('图表已锁定');
  };
  
  // 删除锁定的图表
  const handleDeleteLockedChart = (lockedChartId: string) => {
    setLockedCharts(lockedCharts.filter(chart => chart.id !== lockedChartId));
  };
  
  // 创建模板
  const createTemplate = (name: string, description: string) => {
    if (lockedCharts.length === 0) {
      message.error('请先锁定至少一个图表再创建模板');
      return;
    }
    
    // 提取图表配置和分析内容创建模板
    const templateCharts = lockedCharts.map(chart => ({
      config: chart.config,
      originalHeaders: chart.sourceData.headers,
      // 预留预后分析字段，将在ChartGenerator组件中填充
      preAnalysis: '',
      postAnalysis: ''
    }));
    
    const newTemplate: ChartTemplate = {
      id: `template-${Date.now()}`,
      name,
      description,
      createdAt: Date.now(),
      charts: templateCharts
    };
    
    setTemplates([...templates, newTemplate]);
    message.success(`模板 "${name}" 已创建`);
    return newTemplate.id;
  };
  
  // 删除模板
  const deleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    message.success('模板已删除');
  };
  
  // 应用模板
  const applyTemplate = (templateId: string, matchStrategy: 'exact' | 'fuzzy' | 'manual' = 'exact', headerMappings?: Record<string, string>) => {
    const currentSheet = getCurrentSheetData();
    if (!currentSheet || !excelData) {
      message.error('请先选择一个工作表');
      return;
    }
    
    // 查找模板
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      message.error('未找到指定模板');
      return;
    }
    
    // 应用模板创建锁定图表
    const newLockedCharts: LockedChart[] = [];
    
    template.charts.forEach((chartTemplate, index) => {
      // 根据匹配策略调整配置
      const adjustedConfig = adjustConfigForNewHeaders(
        chartTemplate.config, 
        chartTemplate.originalHeaders, 
        currentSheet.headers,
        matchStrategy,
        headerMappings
      );
      
      // 创建锁定图表
      const lockedChart: LockedChart = {
        id: `applied-${Date.now()}-${index}`,
        config: adjustedConfig,
        lockedAt: Date.now(),
        sourceData: {
          headers: currentSheet.headers,
          data: currentSheet.data,
          sheetName: currentSheetName
        },
        sourceFileName: excelData.fileName
      };
      
      newLockedCharts.push(lockedChart);
    });
    
    // 添加到锁定图表列表
    setLockedCharts([...lockedCharts, ...newLockedCharts]);
    message.success(`已应用模板 "${template.name}"，生成 ${newLockedCharts.length} 个图表`);
  };
  
  // 根据新表头调整图表配置
  const adjustConfigForNewHeaders = (
    config: ChartConfig,
    originalHeaders: string[],
    newHeaders: string[],
    matchStrategy: 'exact' | 'fuzzy' | 'manual',
    headerMappings?: Record<string, string>
  ): ChartConfig => {
    // 深拷贝配置
    const adjustedConfig: ChartConfig = JSON.parse(JSON.stringify(config));
    
    if (matchStrategy === 'exact') {
      // 精确匹配：只使用和原来完全相同的字段名
      // 如果字段在新表头中不存在，则保持原样（可能导致图表数据不显示）
      return adjustedConfig;
    } 
    else if (matchStrategy === 'manual' && headerMappings) {
      // 手动映射：使用用户提供的映射关系
      
      // 调整X轴字段
      if (adjustedConfig.xAxis?.field && headerMappings[adjustedConfig.xAxis.field]) {
        const mappedField = headerMappings[adjustedConfig.xAxis.field];
        adjustedConfig.xAxis.field = mappedField;
        adjustedConfig.xAxis.title = mappedField;
      }
      
      // 调整Y轴字段
      if (adjustedConfig.yAxis?.field && headerMappings[adjustedConfig.yAxis.field]) {
        const mappedField = headerMappings[adjustedConfig.yAxis.field];
        adjustedConfig.yAxis.field = mappedField;
        adjustedConfig.yAxis.title = mappedField;
      }
      
      // 调整系列字段
      if (adjustedConfig.series) {
        adjustedConfig.series = adjustedConfig.series.map(seriesItem => {
          if (seriesItem.field && headerMappings[seriesItem.field]) {
            return {
              ...seriesItem,
              field: headerMappings[seriesItem.field],
              name: headerMappings[seriesItem.field]
            };
          }
          return seriesItem;
        });
      }
    }
    else if (matchStrategy === 'fuzzy') {
      // 模糊匹配：根据字段名相似度进行匹配
      
      // 调整X轴字段
      if (adjustedConfig.xAxis?.field && !newHeaders.includes(adjustedConfig.xAxis.field)) {
        const bestMatch = findBestMatchingHeader(adjustedConfig.xAxis.field, newHeaders);
        if (bestMatch) {
          adjustedConfig.xAxis.field = bestMatch;
          adjustedConfig.xAxis.title = bestMatch;
        }
      }
      
      // 调整Y轴字段
      if (adjustedConfig.yAxis?.field && !newHeaders.includes(adjustedConfig.yAxis.field)) {
        const bestMatch = findBestMatchingHeader(adjustedConfig.yAxis.field, newHeaders);
        if (bestMatch) {
          adjustedConfig.yAxis.field = bestMatch;
          adjustedConfig.yAxis.title = bestMatch;
        }
      }
      
      // 调整系列字段
      if (adjustedConfig.series) {
        adjustedConfig.series = adjustedConfig.series.map(seriesItem => {
          if (seriesItem.field && !newHeaders.includes(seriesItem.field)) {
            const bestMatch = findBestMatchingHeader(seriesItem.field, newHeaders);
            if (bestMatch) {
              return {
                ...seriesItem,
                field: bestMatch,
                name: bestMatch
              };
            }
          }
          return seriesItem;
        });
      }
    }
    
    return adjustedConfig;
  };
  
  // 计算字符串相似度
  const calculateSimilarity = (str1: string, str2: string): number => {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;
    
    // 简单的Jaccard相似度
    const set1 = new Set(str1.split(''));
    const set2 = new Set(str2.split(''));
    
    // 用数组方法计算交集
    const intersection = Array.from(set1).filter(x => set2.has(x));
    // 用数组方法计算并集
    const union = Array.from(new Set([...str1.split(''), ...str2.split('')]));
    
    return intersection.length / union.length;
  };
  
  // 查找最佳匹配的表头
  const findBestMatchingHeader = (originalHeader: string, newHeaders: string[]): string | null => {
    let bestMatch = null;
    let bestSimilarity = 0.5; // 设置相似度阈值
    
    for (const header of newHeaders) {
      const similarity = calculateSimilarity(originalHeader, header);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = header;
      }
    }
    
    return bestMatch;
  };

  // 处理用户登出
  const handleLogout = async () => {
    try {
      await logout();
      message.success('已成功登出');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  // 用户菜单项
  const userMenuItems = [
    {
      key: 'logout',
      label: '登出',
      icon: <LogoutOutlined />,
      onClick: handleLogout
    }
  ];
  
  return (
    <Layout className="app-container">
      <Header style={{ background: token.colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
        <Title level={3} style={{ margin: 0 }}>Excel绘图</Title>
        
        {/* 用户信息和下拉菜单 */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
            <span style={{ marginRight: 4 }}>{user?.username}</span>
            <DownOutlined />
          </div>
        </Dropdown>
      </Header>
      
      <Content style={{ padding: '24px', overflow: 'initial' }}>
        <ExcelUploader onDataLoaded={handleExcelUpload} />
        
        {loading && <Spin size="large" style={{ display: 'block', margin: '20px auto' }} />}
        
        {excelData && (
          <>
            <Tabs 
              type="card"
              activeKey={currentSheetName} 
              onChange={handleSheetChange}
              items={excelData.sheets.map(sheet => ({
                key: sheet.sheetName,
                label: sheet.sheetName,
                children: (
                  <Card title={`${sheet.sheetName} 数据预览`} style={{ marginTop: 16 }}>
                    <DataPreview 
                      headers={sheet.headers} 
                      data={sheet.data} 
                    />
                  </Card>
                )
              }))}
            />
            
            {getCurrentSheetData() && (
              <ChartGenerator 
                data={getCurrentSheetData() as SheetData}
                onChartLock={handleChartLock} 
                lockedCharts={lockedCharts}
                onDeleteLockedChart={handleDeleteLockedChart}
                templates={templates}
                onCreateTemplate={createTemplate}
                onDeleteTemplate={deleteTemplate}
                onApplyTemplate={applyTemplate}
              />
            )}
          </>
        )}
      </Content>
      
      <Footer style={{ textAlign: 'center' }}>
        Excel绘图 ©{new Date().getFullYear()} 由Claude创建
      </Footer>
    </Layout>
  );
};

export default App; 