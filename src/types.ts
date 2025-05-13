// 表示单个工作表数据结构
export interface SheetData {
  headers: string[];
  data: any[][];
  sheetName: string;
}

// 表示Excel数据结构（包含多个工作表）
export interface ExcelData {
  fileName: string;
  sheets: SheetData[];
  currentSheetName: string; // 当前选中的工作表名称
}

// 图表类型
export enum ChartType {
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  SCATTER = 'scatter',
  AREA = 'area',
  RADAR = 'radar',
  FUNNEL = 'funnel',
  HEATMAP = 'heatmap',
  BOXPLOT = 'boxplot',
  TREE = 'tree',
  TREEMAP = 'treemap',
}

// 排序方式
export enum SortOrder {
  NONE = 'none',    // 不排序
  ASCENDING = 'asc', // 升序
  DESCENDING = 'desc' // 降序
}

// 图表配置选项
export interface ChartOptions {
  countMode?: boolean; // 是否启用计数模式
  showDataLabels?: boolean; // 是否显示数据标签
  sortOrder?: SortOrder; // X轴排序方式
  sortBySeriesValue?: boolean; // 是否按系列值而非X轴值进行排序
  baseValue?: number; // 基数设置
  colors?: string[]; // 自定义颜色数组，用于设置图表颜色
  colorTheme?: 'default' | 'warm' | 'cool' | 'pastel' | 'dark' | 'custom'; // 颜色主题
  barWidth?: number; // 柱状图宽度百分比
  borderRadius?: number; // 柱状图圆角大小
  seriesOpacity?: number; // 图表系列透明度
  bgColor?: string; // 图表背景颜色
  borderColor?: string; // 图表边框颜色
  fontFamily?: string; // 图表字体
  titleColor?: string; // 标题文字颜色
  axisColor?: string; // 轴线颜色
  labelColor?: string; // 标签文字颜色
  legendColor?: string; // 图例文字颜色
  shadowBlur?: number; // 阴影模糊大小
  shadowColor?: string; // 阴影颜色
  shadowOffsetX?: number; // 阴影X轴偏移
  shadowOffsetY?: number; // 阴影Y轴偏移
  
  // 线图和面积图特有属性
  smooth?: boolean; // 是否平滑曲线
  lineWidth?: number; // 线宽
  lineType?: 'solid' | 'dashed' | 'dotted'; // 线条类型
  symbolSize?: number | number[]; // 标记点大小（可以是单一值或数组）
  areaStyle?: boolean; // 是否显示面积样式
  areaOpacity?: number; // 面积透明度
  stack?: boolean; // 是否堆叠
  colorStops?: Array<[number, string]>; // 渐变色停止点
  
  // 饼图特有属性
  radius?: string[]; // 饼图半径，如['40%', '70%']表示环形图
  borderWidth?: number; // 边框宽度
  roseType?: boolean; // 是否启用南丁格尔玫瑰图
  pieBorderColor?: string; // 饼图边框颜色
  itemStyle?: { // 项目样式
    shadowBlur?: number;
    shadowColor?: string;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
  };
  
  // 散点图特有属性
  effectType?: 'ripple' | 'brushed'; // 效果类型
  effectColor?: string; // 效果颜色
  effectGradient?: boolean; // 是否使用渐变效果
  effectShadow?: boolean; // 是否使用阴影效果
  
  [key: string]: any; // 其他可能的配置选项
}

// 图表配置
export interface ChartConfig {
  type: ChartType;
  title: string;
  xAxis?: {
    field: string;
    title?: string;
  };
  yAxis?: {
    field: string;
    title?: string;
  };
  series?: {
    field: string;
    name?: string;
  }[];
  options?: ChartOptions;
}

// 图表组件的组合配置
export interface ChartComponentConfig {
  id: string;
  chartConfig: ChartConfig;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
}

// 可拖动的图表类型选项
export interface ChartTypeOption {
  id: string;
  type: ChartType;
  name: string;
  icon: string;
  description: string;
}

// 锁定图表的数据结构
export interface LockedChart {
  id: string;
  config: ChartConfig;
  sourceData: {
    headers: string[];
    data: any[][];
    sheetName: string;
  };
  lockedAt: number; // 锁定时间戳
  sourceFileName?: string;
}

// 图表模板相关类型
export interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  charts: Array<{
    config: ChartConfig;
    preAnalysis?: string;
    postAnalysis?: string;
    originalHeaders: string[];  // 记录原始表头，用于映射
  }>;
}

// 模板应用选项
export interface TemplateApplyOptions {
  matchStrategy: 'exact' | 'fuzzy' | 'manual';
  headerMappings?: Record<string, string>;  // 原始表头 -> 新表头的映射
} 