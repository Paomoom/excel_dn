import React from 'react';
import { Row, Col, Card, Typography, theme } from 'antd';
import { ChartType, ChartOptions } from '../types';
import ReactECharts from 'echarts-for-react';

const { Title } = Typography;
const { useToken } = theme;

// 样式模板的数据结构定义
export interface ChartStyleTemplate {
  id: string;
  name: string;
  description: string;
  type: ChartType;
  options: ChartOptions;
  previewData?: {
    xAxis: string[];
    series: number[];
  };
}

// 柱状图样式模板集合
export const barChartTemplates: ChartStyleTemplate[] = [
  {
    id: 'classic-business',
    name: '经典商务风',
    description: '干净专业的蓝色渐变风格，适合正式场合',
    type: ChartType.BAR,
    options: {
      colors: ['#4e7bea', '#5d8aec', '#6b99ee', '#79a7f0', '#88b6f2'],
      barWidth: 65,
      borderRadius: 4,
      seriesOpacity: 1.0,
      bgColor: '#ffffff',
      borderColor: '#f0f0f0',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      titleColor: '#333333',
      axisColor: '#666666',
      labelColor: '#666666',
      legendColor: '#333333',
      showDataLabels: true
    },
    previewData: {
      xAxis: ['产品A', '产品B', '产品C', '产品D'],
      series: [120, 200, 150, 80]
    }
  },
  {
    id: 'vibrant-gradient',
    name: '活力渐变',
    description: '多彩渐变配色，充满活力',
    type: ChartType.BAR,
    options: {
      colors: ['#ff7c43', '#ffa600', '#7bdff2', '#38b4d6', '#007ed9'],
      barWidth: 70,
      borderRadius: 8,
      seriesOpacity: 0.85,
      bgColor: '#ffffff',
      borderColor: '#f0f0f0',
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      titleColor: '#303030',
      axisColor: '#666666',
      labelColor: '#505050',
      legendColor: '#404040',
      showDataLabels: true
    },
    previewData: {
      xAxis: ['产品A', '产品B', '产品C', '产品D'],
      series: [120, 200, 150, 80]
    }
  },
  {
    id: 'minimalist',
    name: '简约风格',
    description: '极简设计，清晰直观',
    type: ChartType.BAR,
    options: {
      colors: ['#222222'],
      barWidth: 50,
      borderRadius: 0,
      seriesOpacity: 0.75,
      bgColor: '#fafafa',
      borderColor: '#eeeeee',
      fontFamily: '"PingFang SC", "Helvetica Neue", Arial, sans-serif',
      titleColor: '#222222',
      axisColor: '#555555',
      labelColor: '#555555',
      legendColor: '#222222',
      showDataLabels: false
    },
    previewData: {
      xAxis: ['产品A', '产品B', '产品C', '产品D'],
      series: [120, 200, 150, 80]
    }
  },
  {
    id: 'dark-theme',
    name: '暗黑主题',
    description: '深色背景下的图表，适合夜间模式',
    type: ChartType.BAR,
    options: {
      colors: ['#8dd3c7', '#bebada', '#fb8072', '#80b1d3', '#fdb462'],
      barWidth: 60,
      borderRadius: 6,
      seriesOpacity: 0.9,
      bgColor: '#1f1f1f',
      borderColor: '#2a2a2a',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      titleColor: '#ffffff',
      axisColor: '#d0d0d0',
      labelColor: '#eeeeee',
      legendColor: '#eeeeee',
      showDataLabels: true
    },
    previewData: {
      xAxis: ['产品A', '产品B', '产品C', '产品D'],
      series: [120, 200, 150, 80]
    }
  },
  {
    id: '3d-effect',
    name: '立体效果',
    description: '具有3D质感的柱状图',
    type: ChartType.BAR,
    options: {
      colors: ['#55a4f3', '#92ec86', '#f7c967', '#fc7a43', '#df73ff'],
      barWidth: 75,
      borderRadius: 6,
      seriesOpacity: 0.85,
      bgColor: '#f7f7f7',
      borderColor: '#e5e5e5',
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      titleColor: '#333333',
      axisColor: '#666666',
      labelColor: '#666666',
      legendColor: '#333333',
      showDataLabels: true,
      // 添加阴影效果
      shadowBlur: 10,
      shadowColor: 'rgba(0, 0, 0, 0.2)',
      shadowOffsetX: 5,
      shadowOffsetY: 5
    },
    previewData: {
      xAxis: ['产品A', '产品B', '产品C', '产品D'],
      series: [120, 200, 150, 80]
    }
  },
  {
    id: 'pastel-palette',
    name: '柔和色调',
    description: '柔和的柔和色调，适合温馨场景',
    type: ChartType.BAR,
    options: {
      colors: ['#ffcccc', '#ccffcc', '#ccccff', '#ffffcc', '#ffccff'],
      barWidth: 65,
      borderRadius: 10,
      seriesOpacity: 0.8,
      bgColor: '#ffffff',
      borderColor: '#f0f0f0',
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      titleColor: '#555555',
      axisColor: '#777777',
      labelColor: '#777777',
      legendColor: '#555555',
      showDataLabels: true
    },
    previewData: {
      xAxis: ['产品A', '产品B', '产品C', '产品D'],
      series: [120, 200, 150, 80]
    }
  }
];

// 折线图样式模板集合
export const lineChartTemplates: ChartStyleTemplate[] = [
  {
    id: 'smooth-gradient',
    name: '平滑渐变',
    description: '平滑曲线与渐变填充，适合趋势展示',
    type: ChartType.LINE,
    options: {
      colors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'],
      seriesOpacity: 0.8,
      bgColor: '#ffffff',
      borderColor: '#f0f0f0',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      titleColor: '#333333',
      axisColor: '#666666',
      labelColor: '#666666',
      legendColor: '#333333',
      showDataLabels: false,
      // 线图特有属性
      smooth: true,
      lineWidth: 3,
      symbolSize: 6,
      areaStyle: true,
      areaOpacity: 0.3
    },
    previewData: {
      xAxis: ['1月', '2月', '3月', '4月', '5月'],
      series: [120, 132, 101, 134, 90]
    }
  },
  {
    id: 'dotted-line',
    name: '虚线标记',
    description: '带标记点的虚线样式，突出关键数据点',
    type: ChartType.LINE,
    options: {
      colors: ['#5b8ff9', '#5ad8a6', '#5d7092', '#f6bd16', '#e86452'],
      seriesOpacity: 1.0,
      bgColor: '#ffffff',
      borderColor: '#f0f0f0',
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      titleColor: '#262626',
      axisColor: '#565656',
      labelColor: '#565656',
      legendColor: '#262626',
      showDataLabels: true,
      // 线图特有属性
      smooth: false,
      lineWidth: 2,
      symbolSize: 8,
      areaStyle: false,
      lineType: 'dashed'
    },
    previewData: {
      xAxis: ['1月', '2月', '3月', '4月', '5月'],
      series: [120, 132, 101, 134, 90]
    }
  },
  {
    id: 'dark-line',
    name: '暗色线图',
    description: '暗色背景下的明亮线条，适合大屏展示',
    type: ChartType.LINE,
    options: {
      colors: ['#36c5b0', '#a0e8af', '#ffdd7e', '#ff9d84', '#9e9fff'],
      seriesOpacity: 0.9,
      bgColor: '#1a1a1a',
      borderColor: '#2a2a2a',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      titleColor: '#ffffff',
      axisColor: '#d0d0d0',
      labelColor: '#eeeeee',
      legendColor: '#eeeeee',
      showDataLabels: false,
      // 线图特有属性
      smooth: true,
      lineWidth: 4,
      symbolSize: 6,
      areaStyle: true,
      areaOpacity: 0.2
    },
    previewData: {
      xAxis: ['1月', '2月', '3月', '4月', '5月'],
      series: [120, 132, 101, 134, 90]
    }
  },
  {
    id: 'minimal-line',
    name: '极简线条',
    description: '极简风格的线图，干净清晰',
    type: ChartType.LINE,
    options: {
      colors: ['#000000', '#666666', '#999999'],
      seriesOpacity: 1.0,
      bgColor: '#f5f5f5',
      borderColor: '#e0e0e0',
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      titleColor: '#333333',
      axisColor: '#888888',
      labelColor: '#888888',
      legendColor: '#666666',
      showDataLabels: false,
      // 线图特有属性
      smooth: false,
      lineWidth: 1.5,
      symbolSize: 4,
      areaStyle: false
    },
    previewData: {
      xAxis: ['1月', '2月', '3月', '4月', '5月'],
      series: [120, 132, 101, 134, 90]
    }
  }
];

// 饼图样式模板集合
export const pieChartTemplates: ChartStyleTemplate[] = [
  {
    id: 'glossy-pie',
    name: '光泽饼图',
    description: '带有光泽质感的饼图，立体感强',
    type: ChartType.PIE,
    options: {
      colors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'],
      seriesOpacity: 1.0,
      bgColor: '#ffffff',
      borderColor: '#f0f0f0',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      titleColor: '#333333',
      labelColor: '#333333',
      legendColor: '#333333',
      showDataLabels: true,
      // 饼图特有属性
      borderRadius: 8,
      borderWidth: 2,
      roseType: false,
      // 单独设置饼图边框颜色
      pieBorderColor: '#ffffff',
      itemStyle: {
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffsetX: 2,
        shadowOffsetY: 2
      }
    },
    previewData: {
      xAxis: ['类别A', '类别B', '类别C', '类别D'],
      series: [30, 50, 20, 40]
    }
  },
  {
    id: 'pastel-donut',
    name: '柔和环形',
    description: '柔和色彩的环形图，清新温馨',
    type: ChartType.PIE,
    options: {
      colors: ['#a8d8ea', '#aa96da', '#fcbad3', '#ffffd2', '#a1de93'],
      seriesOpacity: 0.85,
      bgColor: '#ffffff',
      borderColor: '#f0f0f0',
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      titleColor: '#555555',
      labelColor: '#555555',
      legendColor: '#555555',
      showDataLabels: true,
      // 饼图特有属性
      borderRadius: 4,
      borderWidth: 2,
      roseType: false,
      radius: ['40%', '70%'], // 环形图参数
      // 单独设置饼图边框颜色
      pieBorderColor: '#ffffff',
      itemStyle: {}
    },
    previewData: {
      xAxis: ['类别A', '类别B', '类别C', '类别D'],
      series: [30, 50, 20, 40]
    }
  },
  {
    id: 'dark-pie',
    name: '暗色饼图',
    description: '暗色背景下的饼图，突出数据对比',
    type: ChartType.PIE,
    options: {
      colors: ['#36c5b0', '#a0e8af', '#ffdd7e', '#ff9d84', '#9e9fff'],
      seriesOpacity: 0.9,
      bgColor: '#1a1a1a',
      borderColor: '#2a2a2a',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      titleColor: '#ffffff',
      labelColor: '#eeeeee',
      legendColor: '#eeeeee',
      showDataLabels: true,
      // 饼图特有属性
      borderRadius: 0,
      borderWidth: 2,
      roseType: false,
      // 单独设置饼图边框颜色
      pieBorderColor: '#1a1a1a',
      itemStyle: {}
    },
    previewData: {
      xAxis: ['类别A', '类别B', '类别C', '类别D'],
      series: [30, 50, 20, 40]
    }
  },
  {
    id: 'rose-chart',
    name: '玫瑰图',
    description: '南丁格尔玫瑰图，突出数值大小对比',
    type: ChartType.PIE,
    options: {
      colors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'],
      seriesOpacity: 0.9,
      bgColor: '#ffffff',
      borderColor: '#f0f0f0',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      titleColor: '#333333',
      labelColor: '#333333',
      legendColor: '#333333',
      showDataLabels: true,
      // 饼图特有属性
      borderRadius: 0,
      borderWidth: 1,
      roseType: true, // 南丁格尔玫瑰图
      // 单独设置饼图边框颜色
      pieBorderColor: '#ffffff',
      itemStyle: {}
    },
    previewData: {
      xAxis: ['类别A', '类别B', '类别C', '类别D'],
      series: [30, 50, 20, 40]
    }
  }
];

// 面积图样式模板集合
export const areaChartTemplates: ChartStyleTemplate[] = [
  {
    id: 'gradient-area',
    name: '渐变面积',
    description: '平滑渐变填充的面积图，视觉效果佳',
    type: ChartType.AREA,
    options: {
      colors: ['#83bff6', '#188df0', '#188df0'],
      seriesOpacity: 0.8,
      bgColor: '#ffffff',
      borderColor: '#f0f0f0',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      titleColor: '#333333',
      axisColor: '#666666',
      labelColor: '#666666',
      legendColor: '#333333',
      showDataLabels: false,
      // 面积图特有属性
      smooth: true,
      lineWidth: 2,
      symbolSize: 6,
      areaStyle: true,
      areaOpacity: 0.5,
      colorStops: [
        [0, 'rgba(24, 144, 255, 0.6)'],
        [1, 'rgba(24, 144, 255, 0.1)']
      ]
    },
    previewData: {
      xAxis: ['1月', '2月', '3月', '4月', '5月'],
      series: [120, 132, 101, 134, 90]
    }
  },
  {
    id: 'stacked-area',
    name: '堆叠面积',
    description: '堆叠式面积图，适合展示构成关系',
    type: ChartType.AREA,
    options: {
      colors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'],
      seriesOpacity: 0.8,
      bgColor: '#ffffff',
      borderColor: '#f0f0f0',
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      titleColor: '#333333',
      axisColor: '#666666',
      labelColor: '#666666',
      legendColor: '#333333',
      showDataLabels: false,
      // 面积图特有属性
      smooth: false,
      lineWidth: 1,
      symbolSize: 4,
      areaStyle: true,
      areaOpacity: 0.7,
      stack: true
    },
    previewData: {
      xAxis: ['1月', '2月', '3月', '4月', '5月'],
      series: [120, 132, 101, 134, 90]
    }
  },
  {
    id: 'dark-area',
    name: '暗色面积',
    description: '暗色背景下的亮色面积图，视觉冲击强',
    type: ChartType.AREA,
    options: {
      colors: ['#36c5b0', '#a0e8af', '#ffdd7e', '#ff9d84', '#9e9fff'],
      seriesOpacity: 0.9,
      bgColor: '#1a1a1a',
      borderColor: '#2a2a2a',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      titleColor: '#ffffff',
      axisColor: '#d0d0d0',
      labelColor: '#eeeeee',
      legendColor: '#eeeeee',
      showDataLabels: false,
      // 面积图特有属性
      smooth: true,
      lineWidth: 2,
      symbolSize: 5,
      areaStyle: true,
      areaOpacity: 0.4,
      colorStops: [
        [0, 'rgba(54, 197, 176, 0.8)'],
        [1, 'rgba(54, 197, 176, 0)']
      ]
    },
    previewData: {
      xAxis: ['1月', '2月', '3月', '4月', '5月'],
      series: [120, 132, 101, 134, 90]
    }
  }
];

// 散点图样式模板集合
export const scatterChartTemplates: ChartStyleTemplate[] = [
  {
    id: 'bubble-scatter',
    name: '气泡散点',
    description: '不同大小的气泡散点图，突出多维度数据',
    type: ChartType.SCATTER,
    options: {
      colors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'],
      seriesOpacity: 0.7,
      bgColor: '#ffffff',
      borderColor: '#f0f0f0',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      titleColor: '#333333',
      axisColor: '#666666',
      labelColor: '#666666',
      legendColor: '#333333',
      showDataLabels: false,
      // 散点图特有属性
      symbolSize: [10, 16, 22, 8, 12],
      effectType: 'ripple',
      effectColor: 'rgba(0, 0, 0, 0.1)'
    },
    previewData: {
      xAxis: ['10', '20', '30', '40', '50'],
      series: [25, 15, 35, 20, 30]
    }
  },
  {
    id: 'gradient-scatter',
    name: '渐变散点',
    description: '带有渐变色彩的散点图，视觉美观',
    type: ChartType.SCATTER,
    options: {
      colors: ['#91cc75', '#fac858', '#5470c6', '#ee6666', '#73c0de'],
      seriesOpacity: 0.85,
      bgColor: '#ffffff',
      borderColor: '#f0f0f0',
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      titleColor: '#333333',
      axisColor: '#666666',
      labelColor: '#666666',
      legendColor: '#333333',
      showDataLabels: false,
      // 散点图特有属性
      symbolSize: 14,
      effectGradient: true
    },
    previewData: {
      xAxis: ['10', '20', '30', '40', '50'],
      series: [25, 15, 35, 20, 30]
    }
  },
  {
    id: 'dark-scatter',
    name: '暗色散点',
    description: '暗色背景下的亮色散点，对比明显',
    type: ChartType.SCATTER,
    options: {
      colors: ['#36c5b0', '#a0e8af', '#ffdd7e', '#ff9d84', '#9e9fff'],
      seriesOpacity: 0.9,
      bgColor: '#1a1a1a',
      borderColor: '#2a2a2a',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      titleColor: '#ffffff',
      axisColor: '#d0d0d0',
      labelColor: '#eeeeee',
      legendColor: '#eeeeee',
      showDataLabels: false,
      // 散点图特有属性
      symbolSize: 12,
      effectShadow: true,
      shadowColor: 'rgba(255, 255, 255, 0.3)',
      shadowBlur: 10
    },
    previewData: {
      xAxis: ['10', '20', '30', '40', '50'],
      series: [25, 15, 35, 20, 30]
    }
  }
];

// 雷达图样式模板集合
export const radarChartTemplates: ChartStyleTemplate[] = [
  {
    id: 'classic-radar',
    name: '经典雷达',
    description: '标准雷达图，清晰展示多维数据',
    type: ChartType.RADAR,
    options: {
      colors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'],
      seriesOpacity: 0.8,
      bgColor: '#ffffff',
      borderColor: '#f0f0f0',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      titleColor: '#333333',
      axisColor: '#666666',
      labelColor: '#666666',
      legendColor: '#333333',
      showDataLabels: false,
      // 雷达图特有属性
      symbolSize: 5,
      areaStyle: true,
      areaOpacity: 0.5,
      lineWidth: 2
    },
    previewData: {
      xAxis: ['销售', '管理', '信息技术', '客服', '研发'],
      series: [80, 70, 60, 75, 90]
    }
  },
  {
    id: 'filled-radar',
    name: '填充雷达',
    description: '高填充度雷达图，强调覆盖面积',
    type: ChartType.RADAR,
    options: {
      colors: ['#ff7c43', '#ffa600', '#7bdff2', '#38b4d6', '#007ed9'],
      seriesOpacity: 0.9,
      bgColor: '#ffffff',
      borderColor: '#f5f5f5',
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      titleColor: '#333333',
      axisColor: '#777777',
      labelColor: '#666666',
      legendColor: '#333333',
      showDataLabels: false,
      // 雷达图特有属性
      symbolSize: 4,
      areaStyle: true,
      areaOpacity: 0.85,
      lineWidth: 1
    },
    previewData: {
      xAxis: ['销售', '管理', '信息技术', '客服', '研发'],
      series: [80, 70, 60, 75, 90]
    }
  },
  {
    id: 'dark-radar',
    name: '暗色雷达',
    description: '暗色背景下的雷达图，视觉冲击力强',
    type: ChartType.RADAR,
    options: {
      colors: ['#36c5b0', '#a0e8af', '#ffdd7e', '#ff9d84', '#9e9fff'],
      seriesOpacity: 0.8,
      bgColor: '#1a1a1a',
      borderColor: '#2a2a2a',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      titleColor: '#ffffff',
      axisColor: '#d0d0d0',
      labelColor: '#eeeeee',
      legendColor: '#eeeeee',
      showDataLabels: false,
      // 雷达图特有属性
      symbolSize: 6,
      areaStyle: true,
      areaOpacity: 0.6,
      lineWidth: 2.5
    },
    previewData: {
      xAxis: ['销售', '管理', '信息技术', '客服', '研发'],
      series: [80, 70, 60, 75, 90]
    }
  },
  {
    id: 'minimal-radar',
    name: '极简雷达',
    description: '简约风格雷达图，突出数据变化',
    type: ChartType.RADAR,
    options: {
      colors: ['#000000', '#444444', '#666666'],
      seriesOpacity: 0.7,
      bgColor: '#fafafa',
      borderColor: '#eeeeee',
      fontFamily: '"PingFang SC", "Helvetica Neue", Arial, sans-serif',
      titleColor: '#333333',
      axisColor: '#777777',
      labelColor: '#777777',
      legendColor: '#333333',
      showDataLabels: false,
      // 雷达图特有属性
      symbolSize: 3,
      areaStyle: true,
      areaOpacity: 0.4,
      lineWidth: 1.5
    },
    previewData: {
      xAxis: ['销售', '管理', '信息技术', '客服', '研发'],
      series: [80, 70, 60, 75, 90]
    }
  }
];

// 获取所有支持的图表类型的样式模板
export const getAllTemplates = (chartType?: ChartType): ChartStyleTemplate[] => {
  if (!chartType) {
    return [
      ...barChartTemplates,
      ...lineChartTemplates,
      ...pieChartTemplates,
      ...areaChartTemplates,
      ...scatterChartTemplates,
      ...radarChartTemplates
    ];
  }
  
  switch (chartType) {
    case ChartType.BAR:
      return barChartTemplates;
    case ChartType.LINE:
      return lineChartTemplates;
    case ChartType.PIE:
      return pieChartTemplates;
    case ChartType.AREA:
      return areaChartTemplates;
    case ChartType.SCATTER:
      return scatterChartTemplates;
    case ChartType.RADAR:
      return radarChartTemplates;
    default:
      return [];
  }
};

// 生成样式预览的ECharts选项
const generatePreviewOptions = (template: ChartStyleTemplate) => {
  const { options, previewData, type } = template;
  
  if (!previewData) {
    return {};
  }
  
  // 获取数据
  const xAxisData = previewData.xAxis;
  const seriesData = previewData.series;
  
  // 基础配置
  const baseOptions = {
    backgroundColor: options.bgColor,
    grid: {
      left: '10%',
      right: '10%',
      top: '20%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLine: {
        lineStyle: {
          color: options.axisColor
        }
      },
      axisLabel: {
        color: options.labelColor,
        fontFamily: options.fontFamily
      },
      axisTick: {
        alignWithLabel: true,
        lineStyle: {
          color: options.axisColor
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: options.axisColor
        }
      },
      axisLabel: {
        color: options.labelColor,
        fontFamily: options.fontFamily
      },
      splitLine: {
        lineStyle: {
          color: options.bgColor === '#1f1f1f' ? '#333333' : '#f0f0f0'
        }
      }
    }
  };
  
  // 根据图表类型创建不同的配置
  switch (type) {
    case ChartType.BAR:
      return {
        ...baseOptions,
        series: [{
          data: seriesData,
          type: 'bar',
          barWidth: `${options.barWidth}%`,
          itemStyle: {
            color: Array.isArray(options.colors) ? options.colors[0] : options.colors,
            opacity: options.seriesOpacity,
            borderRadius: options.borderRadius,
            shadowBlur: options.shadowBlur,
            shadowColor: options.shadowColor,
            shadowOffsetX: options.shadowOffsetX,
            shadowOffsetY: options.shadowOffsetY
          },
          label: {
            show: options.showDataLabels,
            position: 'top',
            color: options.labelColor,
            fontFamily: options.fontFamily
          }
        }]
      };
      
    case ChartType.LINE:
      return {
        ...baseOptions,
        series: [{
          data: seriesData,
          type: 'line',
          smooth: options.smooth,
          lineStyle: {
            width: options.lineWidth,
            type: options.lineType,
            opacity: options.seriesOpacity
          },
          symbol: 'circle',
          symbolSize: options.symbolSize,
          itemStyle: {
            color: Array.isArray(options.colors) ? options.colors[0] : options.colors,
            opacity: options.seriesOpacity
          },
          areaStyle: options.areaStyle ? {
            opacity: options.areaOpacity || (options.seriesOpacity ? options.seriesOpacity * 0.3 : 0.3),
            color: Array.isArray(options.colors) ? options.colors[0] : options.colors
          } : null,
          label: {
            show: options.showDataLabels,
            position: 'top',
            color: options.labelColor,
            fontFamily: options.fontFamily
          }
        }]
      };
      
    case ChartType.PIE:
      // 对于饼图，我们需要格式化数据
      const pieData = xAxisData.map((name, index) => ({
        name: name,
        value: seriesData[index]
      }));
      
      // 处理饼图特殊配置
      let radius = ['0%', '65%']; // 默认饼图
      if (options.radius) {
        radius = options.radius;
      }
      
      return {
        backgroundColor: options.bgColor,
        series: [{
          type: 'pie',
          radius: radius,
          center: ['50%', '50%'],
          data: pieData,
          label: {
            show: options.showDataLabels,
            color: options.labelColor,
            fontFamily: options.fontFamily
          },
          itemStyle: {
            borderRadius: options.borderRadius,
            borderWidth: options.borderWidth,
            borderColor: options.pieBorderColor,
            opacity: options.seriesOpacity,
            shadowBlur: options.itemStyle?.shadowBlur,
            shadowColor: options.itemStyle?.shadowColor,
            shadowOffsetX: options.itemStyle?.shadowOffsetX,
            shadowOffsetY: options.itemStyle?.shadowOffsetY
          },
          roseType: options.roseType ? 'radius' : false
        }]
      };
      
    case ChartType.AREA:
      return {
        ...baseOptions,
        series: [{
          data: seriesData,
          type: 'line',
          smooth: options.smooth,
          lineStyle: {
            width: options.lineWidth,
            opacity: options.seriesOpacity
          },
          symbol: 'circle',
          symbolSize: options.symbolSize,
          itemStyle: {
            color: Array.isArray(options.colors) ? options.colors[0] : options.colors,
            opacity: options.seriesOpacity
          },
          areaStyle: {
            opacity: options.areaOpacity || 0.4,
            color: options.colorStops ? {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: options.colorStops
            } : Array.isArray(options.colors) ? options.colors[0] : options.colors
          },
          label: {
            show: options.showDataLabels,
            position: 'top',
            color: options.labelColor,
            fontFamily: options.fontFamily
          }
        }]
      };
      
    case ChartType.SCATTER:
      // 对散点图，我们需要格式化数据为[x,y]格式
      const scatterData = xAxisData.map((x, index) => [
        x, seriesData[index]
      ]);
      
      // 处理散点图大小
      const symbolSizes = Array.isArray(options.symbolSize) 
        ? options.symbolSize 
        : Array(scatterData.length).fill(options.symbolSize || 10);
      
      return {
        ...baseOptions,
        xAxis: {
          ...baseOptions.xAxis,
          type: 'value',
          data: null
        },
        series: [{
          data: scatterData,
          type: 'scatter',
          symbolSize: (data: any, index: number) => symbolSizes[index % symbolSizes.length],
          itemStyle: {
            color: Array.isArray(options.colors) ? options.colors[0] : options.colors,
            opacity: options.seriesOpacity,
            shadowBlur: options.shadowBlur || (options.effectShadow ? 10 : 0),
            shadowColor: options.shadowColor
          },
          label: {
            show: options.showDataLabels,
            position: 'right',
            color: options.labelColor,
            fontFamily: options.fontFamily
          }
        }]
      };
      
    case ChartType.RADAR:
      // 对于雷达图，我们需要创建指示器数据
      const indicators = xAxisData.map((name, index) => ({
        name: name,
        max: 100 // 默认最大值设为100
      }));
      
      // 创建雷达数据
      const radarData = [{
        value: seriesData,
        name: '样例数据'
      }];
      
      return {
        backgroundColor: options.bgColor,
        radar: {
          indicator: indicators,
          shape: 'polygon',
          splitNumber: 5,
          splitArea: {
            areaStyle: {
              opacity: 0.1
            }
          },
          axisName: {
            color: options.labelColor,
            fontFamily: options.fontFamily
          },
          splitLine: {
            lineStyle: {
              color: options.bgColor === '#1a1a1a' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
            }
          },
          axisLine: {
            lineStyle: {
              color: options.bgColor === '#1a1a1a' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
            }
          }
        },
        series: [{
          type: 'radar',
          data: radarData,
          symbolSize: options.symbolSize || 5,
          lineStyle: {
            width: options.lineWidth || 2,
            opacity: options.seriesOpacity || 0.8
          },
          itemStyle: {
            color: Array.isArray(options.colors) ? options.colors[0] : options.colors
          },
          areaStyle: options.areaStyle ? {
            opacity: options.areaOpacity || 0.5
          } : undefined
        }]
      };
      
    default:
      return baseOptions;
  }
};

interface ChartStyleTemplatesProps {
  chartType: ChartType;
  onSelectStyle: (styleOptions: ChartOptions) => void;
}

const ChartStyleTemplates: React.FC<ChartStyleTemplatesProps> = ({ chartType, onSelectStyle }) => {
  const { token } = useToken();
  const templates = getAllTemplates(chartType);
  
  // 如果没有找到匹配的模板，显示空提示
  if (templates.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <Typography.Text>暂无此图表类型的样式模板</Typography.Text>
      </div>
    );
  }
  
  return (
    <div>
      <Title level={5} style={{ marginBottom: 16 }}>选择样式模板</Title>
      <Row gutter={[16, 16]}>
        {templates.map(template => (
          <Col span={12} key={template.id}>
            <Card
              hoverable
              size="small"
              style={{ 
                overflow: 'hidden', 
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadiusLG 
              }}
              bodyStyle={{ padding: 8 }}
              onClick={() => onSelectStyle(template.options)}
            >
              <div style={{ height: 120 }}>
                <ReactECharts 
                  option={generatePreviewOptions(template)} 
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
              <div style={{ padding: '8px 8px 0' }}>
                <Typography.Text strong>{template.name}</Typography.Text>
                <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
                  {template.description}
                </Typography.Paragraph>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ChartStyleTemplates; 