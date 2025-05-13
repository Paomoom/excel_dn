import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Divider, Space, Collapse, Tag, Switch, InputNumber, Slider, Row, Col, Popover, Tooltip, Tabs, message } from 'antd';
import { 
  PlusOutlined, MinusCircleOutlined, SettingOutlined, DeleteOutlined, BarChartOutlined,
  SortAscendingOutlined, SortDescendingOutlined, BgColorsOutlined, HighlightOutlined,
  BorderOutlined, FontSizeOutlined, EditOutlined
} from '@ant-design/icons';
import { ChromePicker } from 'react-color';
import { ChartConfig, ChartType, SortOrder } from '../types';
import ChartStyleTemplates from './ChartStyleTemplates';

const { Option } = Select;
const { Panel } = Collapse;
const { TabPane } = Tabs;

// 颜色主题类型定义
type ColorThemeKey = 'default' | 'warm' | 'cool' | 'pastel' | 'dark' | 'custom';

// 颜色主题
export const colorThemes: Record<Exclude<ColorThemeKey, 'custom'>, string[]> = {
  default: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
  warm: ['#ff7f50', '#ff6347', '#ff4500', '#ff8c00', '#ffa500', '#ffb700', '#ffd700', '#ffff00', '#f0e68c'],
  cool: ['#87ceeb', '#00bfff', '#1e90ff', '#6495ed', '#7b68ee', '#9370db', '#8a2be2', '#9932cc', '#9400d3'],
  pastel: ['#FFB6C1', '#FFD700', '#ADD8E6', '#98FB98', '#DDA0DD', '#FFDAB9', '#87CEFA', '#B0E0E6', '#F5DEB3'],
  dark: ['#1a1a1a', '#2c2c2c', '#3f3f3f', '#515151', '#626262', '#7a7a7a', '#8b8b8b', '#9c9c9c', '#adadad'],
};

interface ChartConfigPanelProps {
  config: ChartConfig;
  headers: string[];
  onConfigChange: (config: ChartConfig) => void;
  onDelete: () => void;
}

const ChartConfigPanel: React.FC<ChartConfigPanelProps> = ({
  config,
  headers,
  onConfigChange,
  onDelete
}) => {
  const [form] = Form.useForm();
  const [chartType, setChartType] = useState<ChartType>(config.type);
  const [countMode, setCountMode] = useState<boolean>(config.options?.countMode || false);
  const [showDataLabels, setShowDataLabels] = useState<boolean>(config.options?.showDataLabels || false);
  const [sortOrder, setSortOrder] = useState<SortOrder>(config.options?.sortOrder || SortOrder.NONE);
  const [sortBySeriesValue, setSortBySeriesValue] = useState<boolean>(config.options?.sortBySeriesValue || false);
  const [baseValue, setBaseValue] = useState<number>(config.options?.baseValue || 0);
  
  // 新增颜色和样式相关状态
  const [colorTheme, setColorTheme] = useState<string>(config.options?.colorTheme || 'default');
  const [customColors, setCustomColors] = useState<string[]>(config.options?.colors || colorThemes.default);
  const [barWidth, setBarWidth] = useState<number>(config.options?.barWidth || 60);
  const [borderRadius, setBorderRadius] = useState<number>(config.options?.borderRadius || 0);
  const [seriesOpacity, setSeriesOpacity] = useState<number>(config.options?.seriesOpacity || 1.0);
  const [bgColor, setBgColor] = useState<string>(config.options?.bgColor || 'transparent');
  
  // 当外部配置改变时更新表单
  useEffect(() => {
    form.setFieldsValue({
      ...config,
      xAxis: {
        field: config.xAxis?.field || '',
        title: config.xAxis?.title || ''
      },
      yAxis: {
        field: config.yAxis?.field || '',
        title: config.yAxis?.title || ''
      },
      series: config.series && config.series.length > 0 
        ? config.series 
        : [{ field: headers[0] || '', name: headers[0] || '' }],
      options: {
        ...config.options,
        countMode: config.options?.countMode || false,
        showDataLabels: config.options?.showDataLabels || false,
        sortOrder: config.options?.sortOrder || SortOrder.NONE,
        sortBySeriesValue: config.options?.sortBySeriesValue || false,
        baseValue: config.options?.baseValue || 0,
        colorTheme: config.options?.colorTheme || 'default',
        colors: config.options?.colors || colorThemes.default,
        barWidth: config.options?.barWidth || 60,
        borderRadius: config.options?.borderRadius || 0,
        seriesOpacity: config.options?.seriesOpacity || 1.0,
        bgColor: config.options?.bgColor || 'transparent',
        borderColor: config.options?.borderColor || '#ccc',
        fontFamily: config.options?.fontFamily || 'Arial',
        // 新增文字颜色配置
        titleColor: config.options?.titleColor || '#333333',
        axisColor: config.options?.axisColor || '#666666',
        labelColor: config.options?.labelColor || '#666666',
        legendColor: config.options?.legendColor || '#666666'
      }
    });
    setChartType(config.type);
    setCountMode(config.options?.countMode || false);
    setShowDataLabels(config.options?.showDataLabels || false);
    setSortOrder(config.options?.sortOrder || SortOrder.NONE);
    setSortBySeriesValue(config.options?.sortBySeriesValue || false);
    setBaseValue(config.options?.baseValue || 0);
    
    // 更新颜色和样式状态
    setColorTheme(config.options?.colorTheme || 'default');
    setCustomColors(config.options?.colors || colorThemes.default);
    setBarWidth(config.options?.barWidth || 60);
    setBorderRadius(config.options?.borderRadius || 0);
    setSeriesOpacity(config.options?.seriesOpacity || 1.0);
    setBgColor(config.options?.bgColor || 'transparent');
  }, [config, form, headers]);

  // 当表单值改变时更新配置
  const handleValuesChange = (changedValues: any, allValues: any) => {
    // 处理特殊字段
    if (changedValues.type) {
      setChartType(changedValues.type);
    }
    
    // 处理计数模式切换
    if (changedValues.options?.countMode !== undefined) {
      setCountMode(changedValues.options.countMode);
    }

    // 处理数据标签显示切换
    if (changedValues.options?.showDataLabels !== undefined) {
      setShowDataLabels(changedValues.options.showDataLabels);
    }

    // 处理排序方式切换
    if (changedValues.options?.sortOrder !== undefined) {
      setSortOrder(changedValues.options.sortOrder);
    }

    // 处理排序依据切换
    if (changedValues.options?.sortBySeriesValue !== undefined) {
      setSortBySeriesValue(changedValues.options.sortBySeriesValue);
    }

    // 处理基数设置变更
    if (changedValues.options?.baseValue !== undefined) {
      setBaseValue(changedValues.options.baseValue);
    }
    
    // 处理颜色主题变更
    if (changedValues.options?.colorTheme !== undefined) {
      const newTheme = changedValues.options.colorTheme as ColorThemeKey;
      setColorTheme(newTheme);
      
      // 当选择预设主题时，更新颜色数组
      if (newTheme !== 'custom' && newTheme in colorThemes) {
        setCustomColors(colorThemes[newTheme as Exclude<ColorThemeKey, 'custom'>]);
        form.setFieldsValue({
          options: {
            ...form.getFieldValue('options'),
            colors: colorThemes[newTheme as Exclude<ColorThemeKey, 'custom'>]
          }
        });
      }
    }
    
    // 处理自定义颜色变更
    if (changedValues.options?.colors !== undefined) {
      setCustomColors(changedValues.options.colors);
    }
    
    // 处理柱状图宽度变更
    if (changedValues.options?.barWidth !== undefined) {
      setBarWidth(changedValues.options.barWidth);
    }
    
    // 处理边框圆角变更
    if (changedValues.options?.borderRadius !== undefined) {
      setBorderRadius(changedValues.options.borderRadius);
    }
    
    // 处理系列透明度变更
    if (changedValues.options?.seriesOpacity !== undefined) {
      setSeriesOpacity(changedValues.options.seriesOpacity);
    }
    
    // 处理背景颜色变更
    if (changedValues.options?.bgColor !== undefined) {
      setBgColor(changedValues.options.bgColor);
    }
    
    // 确保series中每个项目都有field属性
    const validSeries = allValues.series?.filter((s: any) => s && s.field) || [];
    
    onConfigChange({
      ...config,
      ...allValues,
      series: validSeries,
      type: allValues.type || config.type,
      options: {
        ...config.options,
        ...allValues.options
      }
    });
  };

  // 添加数据系列时的默认值
  const addSeriesItem = () => {
    const currentSeries = form.getFieldValue('series') || [];
    const defaultField = headers.find(h => 
      !currentSeries.some((s: any) => s && s.field === h)
    ) || headers[0] || '';
    
    form.setFieldsValue({
      series: [
        ...currentSeries,
        { field: defaultField, name: defaultField }
      ]
    });
    
    // 触发一次表单值改变，以便更新图表
    const allValues = form.getFieldsValue();
    handleValuesChange({ series: allValues.series }, allValues);
  };

  // 切换计数模式
  const toggleCountMode = (checked: boolean) => {
    form.setFieldsValue({
      options: {
        ...form.getFieldValue('options'),
        countMode: checked
      }
    });
    
    // 触发一次表单值改变，以便更新图表
    const allValues = form.getFieldsValue();
    handleValuesChange({ 
      options: { countMode: checked } 
    }, allValues);
  };

  // 处理颜色选择变更
  const handleColorChange = (color: {hex: string}, index: number) => {
    console.log('颜色变更:', color.hex, '索引:', index);
    
    const newColors = [...customColors];
    newColors[index] = color.hex;
    setCustomColors(newColors);
    
    form.setFieldsValue({
      options: {
        ...form.getFieldValue('options'),
        colors: newColors,
        colorTheme: 'custom' // 当手动选择颜色时，切换到自定义主题
      }
    });
    
    // 直接调用onConfigChange更新图表
    const formValues = form.getFieldsValue();
    onConfigChange({
      ...config,
      ...formValues,
      options: {
        ...config.options,
        ...formValues.options,
        colors: newColors,
        colorTheme: 'custom'
      }
    });
  };
  
  // 处理直接点击颜色块应用颜色
  const handleApplyColor = (color: string) => {
    console.log('直接应用颜色:', color);
    
    // 创建新的颜色数组，将点击的颜色设为第一个颜色
    const newColors = [...customColors];
    // 将点击的颜色移到首位
    const clickedIndex = newColors.indexOf(color);
    if (clickedIndex > 0) {
      // 如果不是首位，则移动到首位
      newColors.splice(clickedIndex, 1); // 移除该颜色
      newColors.unshift(color); // 添加到首位
    }
    
    setCustomColors(newColors);
    form.setFieldsValue({
      options: {
        ...form.getFieldValue('options'),
        colors: newColors,
        colorTheme: 'custom' // 当手动选择颜色时，切换到自定义主题
      }
    });
    
    // 直接调用onConfigChange更新图表
    const formValues = form.getFieldsValue();
    onConfigChange({
      ...config,
      ...formValues,
      options: {
        ...config.options,
        ...formValues.options,
        colors: newColors,
        colorTheme: 'custom'
      }
    });
  };

  // 处理背景颜色变更
  const handleBgColorChange = (color: {hex: string}) => {
    console.log('背景颜色变更:', color.hex);
    
    const newBgColor = color.hex;
    setBgColor(newBgColor);
    
    form.setFieldsValue({
      options: {
        ...form.getFieldValue('options'),
        bgColor: newBgColor
      }
    });
    
    // 直接调用onConfigChange更新图表
    const formValues = form.getFieldsValue();
    onConfigChange({
      ...config,
      ...formValues,
      options: {
        ...config.options,
        ...formValues.options,
        bgColor: newBgColor
      }
    });
  };

  // 处理文字颜色变更
  const handleTextColorChange = (color: {hex: string}, key: string) => {
    console.log('文字颜色变更:', color.hex, '键:', key);
    
    form.setFieldsValue({
      options: {
        ...form.getFieldValue('options'),
        [key]: color.hex
      }
    });
    
    // 直接调用onConfigChange更新图表
    const formValues = form.getFieldsValue();
    onConfigChange({
      ...config,
      ...formValues,
      options: {
        ...config.options,
        ...formValues.options
      }
    });
  };

  // 获取默认文字颜色
  const getDefaultTextColor = (key: string) => {
    // 根据不同的文字类型返回默认颜色
    switch (key) {
      case 'titleColor':
        return '#333333'; // 标题颜色默认深灰
      case 'axisColor':
        return '#666666'; // 坐标轴颜色默认中灰
      case 'labelColor':
        return '#666666'; // 标签颜色默认中灰
      case 'legendColor':
        return '#666666'; // 图例颜色默认中灰
      default:
        return '#333333'; // 其他情况默认深灰
    }
  };

  // 添加样式选项卡处理函数
  const handleStyleTemplateSelect = (styleOptions: any) => {
    // 更新表单中的样式相关字段
    form.setFieldsValue({
      options: {
        ...form.getFieldValue('options'),
        ...styleOptions
      }
    });
    
    // 更新状态
    if (styleOptions.colorTheme) setColorTheme(styleOptions.colorTheme);
    if (styleOptions.colors) setCustomColors(styleOptions.colors);
    if (styleOptions.barWidth !== undefined) setBarWidth(styleOptions.barWidth);
    if (styleOptions.borderRadius !== undefined) setBorderRadius(styleOptions.borderRadius);
    if (styleOptions.seriesOpacity !== undefined) setSeriesOpacity(styleOptions.seriesOpacity);
    if (styleOptions.bgColor !== undefined) setBgColor(styleOptions.bgColor);
    if (styleOptions.showDataLabels !== undefined) setShowDataLabels(styleOptions.showDataLabels);
    
    // 应用变更到图表配置
    onConfigChange({
      ...config,
      options: {
        ...config.options,
        ...styleOptions
      }
    });
    
    message.success('样式已应用');
  };

  return (
    <Card 
      title={
        <Input 
          placeholder="图表标题" 
          value={config.title} 
          onChange={e => onConfigChange({...config, title: e.target.value})}
          style={{ width: '100%' }}
        />
      }
      extra={
        <Space>
          <Button 
            icon={<DeleteOutlined />} 
            danger 
            onClick={onDelete}
            size="small"
          >
            删除
          </Button>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Form
        form={form}
        initialValues={config}
        onValuesChange={handleValuesChange}
        layout="vertical"
        size="small"
      >
        <Form.Item name="type" label="图表类型">
          <Select>
            <Option value={ChartType.BAR}>柱状图</Option>
            <Option value={ChartType.LINE}>折线图</Option>
            <Option value={ChartType.PIE}>饼图</Option>
            <Option value={ChartType.SCATTER}>散点图</Option>
            <Option value={ChartType.AREA}>面积图</Option>
            <Option value={ChartType.RADAR}>雷达图</Option>
          </Select>
        </Form.Item>
        
        <Tabs defaultActiveKey="data" style={{ marginBottom: '15px' }}>
          <TabPane tab="数据配置" key="data">
            <Divider orientation="left">数据源配置</Divider>
            
            <Form.Item label="启用计数模式" tooltip="启用后，Y轴将显示X轴字段中各值的出现次数">
              <Form.Item name={['options', 'countMode']} valuePropName="checked" noStyle>
                <Switch 
                  checkedChildren="已启用" 
                  unCheckedChildren="已禁用"
                  onChange={toggleCountMode}
                />
              </Form.Item>
              <span style={{ marginLeft: 8 }}>
                {countMode ? (
                  <Tag color="blue" icon={<BarChartOutlined />}>计数模式已启用</Tag>
                ) : null}
              </span>
            </Form.Item>

            <Form.Item
              name="xAxis"
              label="X轴配置"
              rules={[{ required: true, message: '请配置X轴' }]}
            >
              <Form.Item name={['xAxis', 'field']} rules={[{ required: true, message: '请选择X轴字段' }]}>
                <Select placeholder="请选择X轴字段">
                  {headers.map((header, index) => (
                    <Option key={index} value={header}>{header}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name={['xAxis', 'title']}>
                <Input placeholder="请输入X轴标题（可选）" />
              </Form.Item>
            </Form.Item>

            <Form.Item
              name="yAxis"
              label="Y轴配置"
              rules={[{ required: true, message: '请配置Y轴' }]}
            >
              <Form.Item name={['yAxis', 'field']} rules={[{ required: true, message: '请选择Y轴字段' }]}>
                <Select placeholder="请选择Y轴字段">
                  {headers.map((header, index) => (
                    <Option key={index} value={header}>{header}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name={['yAxis', 'title']}>
                <Input placeholder="请输入Y轴标题（可选）" />
              </Form.Item>
            </Form.Item>

            {/* 数据排序设置 */}
            <Divider orientation="left">数据排序</Divider>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="排序方式" name={['options', 'sortOrder']}>
                  <Select
                    placeholder="选择排序方式"
                    onChange={(value) => {
                      setSortOrder(value);
                      const formValues = form.getFieldsValue();
                      onConfigChange({
                        ...config,
                        ...formValues,
                        options: {
                          ...config.options,
                          ...formValues.options,
                          sortOrder: value
                        }
                      });
                    }}
                  >
                    <Option value={SortOrder.NONE}>不排序</Option>
                    <Option value={SortOrder.ASCENDING}>
                      <Space>
                        <SortAscendingOutlined />
                        升序排列
                      </Space>
                    </Option>
                    <Option value={SortOrder.DESCENDING}>
                      <Space>
                        <SortDescendingOutlined />
                        降序排列
                      </Space>
                    </Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  label="按系列值排序" 
                  name={['options', 'sortBySeriesValue']} 
                  valuePropName="checked"
                  tooltip="启用后，将根据第一个数据系列的值进行排序，而不是按X轴字段值"
                >
                  <Switch 
                    checkedChildren="系列值" 
                    unCheckedChildren="X轴值"
                    disabled={sortOrder === SortOrder.NONE}
                    onChange={(checked) => {
                      setSortBySeriesValue(checked);
                      const formValues = form.getFieldsValue();
                      onConfigChange({
                        ...config,
                        ...formValues,
                        options: {
                          ...config.options,
                          ...formValues.options,
                          sortBySeriesValue: checked
                        }
                      });
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* 数据设置 */}
            <Divider orientation="left">基准值设置</Divider>
            
            <Form.Item 
              label="Y轴基准值" 
              name={['options', 'baseValue']}
              tooltip="设置Y轴的起始值，例如不从0开始而从特定值开始"
            >
              <InputNumber
                min={0}
                step={1}
                onChange={(value) => {
                  if (value !== null) {
                    setBaseValue(value);
                    const formValues = form.getFieldsValue();
                    onConfigChange({
                      ...config,
                      ...formValues,
                      options: {
                        ...config.options,
                        ...formValues.options,
                        baseValue: value
                      }
                    });
                  }
                }}
              />
            </Form.Item>

            {/* 数据系列配置 */}
            <Divider orientation="left">数据系列</Divider>
            
            <Form.List name="series">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ display: 'flex', marginBottom: 8, alignItems: 'baseline' }}>
                      <Form.Item
                        {...restField}
                        name={[name, 'field']}
                        rules={[{ required: true, message: '请选择字段' }]}
                        style={{ marginRight: 8, width: '40%' }}
                      >
                        <Select placeholder="选择数据字段">
                          {headers.map((header, index) => (
                            <Option key={index} value={header}>{header}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        style={{ marginRight: 8, width: '40%' }}
                      >
                        <Input placeholder="系列名称（可选）" />
                      </Form.Item>
                      <Form.Item style={{ marginBottom: 0 }}>
                        <Button 
                          icon={<MinusCircleOutlined />} 
                          onClick={() => {
                            if (fields.length > 1) {
                              remove(name);
                              // 触发一次表单值改变，以便更新图表
                              const allValues = form.getFieldsValue();
                              handleValuesChange({ series: allValues.series }, allValues);
                            } else {
                              message.warning('至少需要保留一个数据系列');
                            }
                          }}
                          danger
                        />
                      </Form.Item>
                    </div>
                  ))}
                  <Form.Item>
                    <Button 
                      type="dashed" 
                      onClick={addSeriesItem} 
                      block 
                      icon={<PlusOutlined />}
                    >
                      添加数据系列
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </TabPane>
          <TabPane tab="外观样式" key="style">
            <Divider orientation="left">颜色与样式</Divider>
            
            <Form.Item label="颜色主题" name={['options', 'colorTheme']}>
              <Select
                placeholder="选择颜色主题"
                onChange={(value) => {
                  setColorTheme(value as string);
                  if (value !== 'custom' && value in colorThemes) {
                    setCustomColors(colorThemes[value as Exclude<ColorThemeKey, 'custom'>]);
                    form.setFieldsValue({
                      options: {
                        ...form.getFieldValue('options'),
                        colors: colorThemes[value as Exclude<ColorThemeKey, 'custom'>]
                      }
                    });
                    
                    // 触发一次表单值改变，以便更新图表
                    const allValues = form.getFieldsValue();
                    handleValuesChange({ 
                      options: { 
                        colorTheme: value,
                        colors: colorThemes[value as Exclude<ColorThemeKey, 'custom'>]
                      } 
                    }, allValues);
                  }
                }}
              >
                <Option value="default">默认主题</Option>
                <Option value="warm">暖色主题</Option>
                <Option value="cool">冷色主题</Option>
                <Option value="pastel">柔和主题</Option>
                <Option value="dark">深色主题</Option>
                <Option value="custom">自定义</Option>
              </Select>
            </Form.Item>

            <Form.Item label="自定义颜色" tooltip="点击色块直接应用该颜色到图表">
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px', 
                padding: '10px', 
                backgroundColor: '#f9f9f9', 
                borderRadius: '4px', 
                border: '1px solid #eee' 
              }}>
                {customColors.map((color, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: color,
                      width: '36px',
                      height: '36px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: '1px solid #d9d9d9',
                      display: 'inline-block',
                      boxShadow: index === 0 ? '0 0 0 2px #1890ff' : 'none' // 第一个颜色高亮显示
                    }}
                    onClick={() => handleApplyColor(color)}
                    title="点击应用此颜色"
                  />
                ))}
                
                <Popover
                  content={
                    <ChromePicker
                      color="#1890ff"
                      onChange={(newColor) => {
                        // 添加新的自定义颜色
                        const newColors = [newColor.hex, ...customColors];
                        setCustomColors(newColors);
                        form.setFieldsValue({
                          options: {
                            ...form.getFieldValue('options'),
                            colors: newColors,
                            colorTheme: 'custom'
                          }
                        });
                        
                        // 触发一次表单值改变，以便更新图表
                        const allValues = form.getFieldsValue();
                        handleValuesChange({ 
                          options: { 
                            colors: newColors,
                            colorTheme: 'custom'
                          } 
                        }, allValues);
                      }}
                      disableAlpha={true}
                    />
                  }
                  title="创建自定义颜色"
                  trigger="click"
                >
                  <Button 
                    icon={<PlusOutlined />}
                    type="primary"
                    size="small"
                  >
                    创建新颜色
                  </Button>
                </Popover>

                <Button
                  icon={<PlusOutlined />}
                  onClick={() => {
                    // 添加随机颜色
                    const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
                    const newColors = [randomColor, ...customColors];
                    setCustomColors(newColors);
                    form.setFieldsValue({
                      options: {
                        ...form.getFieldValue('options'),
                        colors: newColors,
                        colorTheme: 'custom'
                      }
                    });
                    
                    // 触发一次表单值改变，以便更新图表
                    const allValues = form.getFieldsValue();
                    handleValuesChange({ 
                      options: { 
                        colors: newColors,
                        colorTheme: 'custom'
                      } 
                    }, allValues);
                  }}
                >
                  添加随机颜色
                </Button>

                <Button
                  danger
                  disabled={customColors.length <= 1}
                  onClick={() => {
                    if (customColors.length > 1) {
                      const newColors = customColors.slice(0, -1);
                      setCustomColors(newColors);
                      form.setFieldsValue({
                        options: {
                          ...form.getFieldValue('options'),
                          colors: newColors,
                          colorTheme: 'custom'
                        }
                      });
                      
                      // 触发一次表单值改变，以便更新图表
                      const allValues = form.getFieldsValue();
                      handleValuesChange({ 
                        options: { 
                          colors: newColors,
                          colorTheme: 'custom'
                        } 
                      }, allValues);
                    }
                  }}
                >
                  移除最后一个颜色
                </Button>
              </div>
              <Form.Item name={['options', 'colors']} hidden>
                <Input />
              </Form.Item>
            </Form.Item>

            {/* 针对不同图表类型的特定样式 */}
            {(chartType === ChartType.BAR) && (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="柱状图宽度" name={['options', 'barWidth']}>
                      <Slider
                        min={20}
                        max={100}
                        tipFormatter={(value) => value !== undefined ? `${value}%` : ''}
                        onChange={(value) => {
                          console.log('柱状图宽度变更:', value);
                          
                          setBarWidth(value as number);
                          form.setFieldsValue({
                            options: {
                              ...form.getFieldValue('options'),
                              barWidth: value
                            }
                          });
                          
                          // 直接调用onConfigChange更新图表
                          const formValues = form.getFieldsValue();
                          onConfigChange({
                            ...config,
                            ...formValues,
                            options: {
                              ...config.options,
                              ...formValues.options,
                              barWidth: value
                            }
                          });
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="柱子圆角" name={['options', 'borderRadius']}>
                      <Slider
                        min={0}
                        max={20}
                        tipFormatter={(value) => value !== undefined ? `${value}px` : ''}
                        onChange={(value) => {
                          console.log('柱子圆角变更:', value);
                          
                          setBorderRadius(value as number);
                          form.setFieldsValue({
                            options: {
                              ...form.getFieldValue('options'),
                              borderRadius: value
                            }
                          });
                          
                          // 直接调用onConfigChange更新图表
                          const formValues = form.getFieldsValue();
                          onConfigChange({
                            ...config,
                            ...formValues,
                            options: {
                              ...config.options,
                              ...formValues.options,
                              borderRadius: value
                            }
                          });
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="系列不透明度" name={['options', 'seriesOpacity']}>
                  <Slider
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    tipFormatter={(value) => value !== undefined ? `${value * 100}%` : ''}
                    onChange={(value) => {
                      console.log('系列不透明度变更:', value);
                      
                      setSeriesOpacity(value as number);
                      form.setFieldsValue({
                        options: {
                          ...form.getFieldValue('options'),
                          seriesOpacity: value
                        }
                      });
                      
                      // 直接调用onConfigChange更新图表
                      const formValues = form.getFieldsValue();
                      onConfigChange({
                        ...config,
                        ...formValues,
                        options: {
                          ...config.options,
                          ...formValues.options,
                          seriesOpacity: value
                        }
                      });
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="显示数据标签" name={['options', 'showDataLabels']} valuePropName="checked">
                  <Switch 
                    checkedChildren="已启用" 
                    unCheckedChildren="已禁用"
                    onChange={(checked) => {
                      console.log('数据标签显示变更:', checked);
                      
                      setShowDataLabels(checked);
                      form.setFieldsValue({
                        options: {
                          ...form.getFieldValue('options'),
                          showDataLabels: checked
                        }
                      });
                      
                      // 直接调用onConfigChange更新图表
                      const formValues = form.getFieldsValue();
                      onConfigChange({
                        ...config,
                        ...formValues,
                        options: {
                          ...config.options,
                          ...formValues.options,
                          showDataLabels: checked
                        }
                      });
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* 背景颜色设置 */}
            <Form.Item label="背景颜色">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div 
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: bgColor === 'transparent' ? '#ffffff' : bgColor,
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    boxShadow: '0 0 0 2px #1890ff',
                    boxSizing: 'border-box',
                    position: 'relative'
                  }}
                  title="当前背景颜色"
                >
                  {bgColor === 'transparent' && (
                    <div style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      top: 0,
                      left: 0,
                      background: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 4px 4px',
                      borderRadius: '4px',
                      opacity: 0.5
                    }} />
                  )}
                </div>
                
                <Popover
                  content={
                    <ChromePicker
                      color={bgColor === 'transparent' ? '#ffffff' : bgColor}
                      onChange={handleBgColorChange}
                      disableAlpha={true}
                    />
                  }
                  title="选择背景颜色"
                  trigger="click"
                >
                  <Button
                    type="primary"
                    size="small"
                  >
                    选择背景色
                  </Button>
                </Popover>
                
                <Button 
                  icon={<BgColorsOutlined />} 
                  onClick={() => {
                    setBgColor('transparent');
                    form.setFieldsValue({
                      options: {
                        ...form.getFieldValue('options'),
                        bgColor: 'transparent'
                      }
                    });
                    
                    // 触发一次表单值改变，以便更新图表
                    const allValues = form.getFieldsValue();
                    handleValuesChange({ 
                      options: { bgColor: 'transparent' } 
                    }, allValues);
                  }}
                >
                  透明背景
                </Button>
              </div>
              <Form.Item name={['options', 'bgColor']} hidden>
                <Input />
              </Form.Item>
            </Form.Item>

            {/* 文字颜色设置 */}
            <Divider orientation="left">文字颜色</Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="标题颜色" name={['options', 'titleColor']}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div 
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: form.getFieldValue(['options', 'titleColor']) || getDefaultTextColor('titleColor'),
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        boxShadow: '0 0 0 2px #1890ff'
                      }}
                      title="当前标题颜色"
                    />
                    
                    <Popover
                      content={
                        <ChromePicker 
                          color={form.getFieldValue(['options', 'titleColor']) || getDefaultTextColor('titleColor')}
                          onChange={(color) => handleTextColorChange(color, 'titleColor')}
                          disableAlpha={true}
                        />
                      }
                      title="选择标题颜色"
                      trigger="click"
                    >
                      <Button
                        type="primary"
                        size="small"
                      >
                        选择颜色
                      </Button>
                    </Popover>
                  </div>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="坐标轴颜色" name={['options', 'axisColor']}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div 
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: form.getFieldValue(['options', 'axisColor']) || getDefaultTextColor('axisColor'),
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        boxShadow: '0 0 0 2px #1890ff'
                      }}
                      title="当前坐标轴颜色"
                    />
                    
                    <Popover
                      content={
                        <ChromePicker 
                          color={form.getFieldValue(['options', 'axisColor']) || getDefaultTextColor('axisColor')}
                          onChange={(color) => handleTextColorChange(color, 'axisColor')}
                          disableAlpha={true}
                        />
                      }
                      title="选择坐标轴颜色"
                      trigger="click"
                    >
                      <Button
                        type="primary"
                        size="small"
                      >
                        选择颜色
                      </Button>
                    </Popover>
                  </div>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="标签颜色" name={['options', 'labelColor']}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div 
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: form.getFieldValue(['options', 'labelColor']) || getDefaultTextColor('labelColor'),
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        boxShadow: '0 0 0 2px #1890ff'
                      }}
                      title="当前标签颜色"
                    />
                    
                    <Popover
                      content={
                        <ChromePicker 
                          color={form.getFieldValue(['options', 'labelColor']) || getDefaultTextColor('labelColor')}
                          onChange={(color) => handleTextColorChange(color, 'labelColor')}
                          disableAlpha={true}
                        />
                      }
                      title="选择标签颜色"
                      trigger="click"
                    >
                      <Button
                        type="primary"
                        size="small"
                      >
                        选择颜色
                      </Button>
                    </Popover>
                  </div>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="图例颜色" name={['options', 'legendColor']}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div 
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: form.getFieldValue(['options', 'legendColor']) || getDefaultTextColor('legendColor'),
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        boxShadow: '0 0 0 2px #1890ff'
                      }}
                      title="当前图例颜色"
                    />
                    
                    <Popover
                      content={
                        <ChromePicker 
                          color={form.getFieldValue(['options', 'legendColor']) || getDefaultTextColor('legendColor')}
                          onChange={(color) => handleTextColorChange(color, 'legendColor')}
                          disableAlpha={true}
                        />
                      }
                      title="选择图例颜色"
                      trigger="click"
                    >
                      <Button
                        type="primary"
                        size="small"
                      >
                        选择颜色
                      </Button>
                    </Popover>
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </TabPane>
          <TabPane tab="样式模板" key="templates">
            <ChartStyleTemplates 
              chartType={chartType} 
              onSelectStyle={handleStyleTemplateSelect} 
            />
          </TabPane>
        </Tabs>
      </Form>
    </Card>
  );
};

export default ChartConfigPanel; 