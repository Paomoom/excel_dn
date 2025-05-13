import React, { useState, useRef, useEffect } from 'react';
import { Card, Row, Col, Button, Space, Tabs, Divider, Typography, message, Empty, Menu, Dropdown, Input, Modal, Form, List, Tooltip, Radio, Select } from 'antd';
import { 
  BarChartOutlined, LineChartOutlined, PieChartOutlined, 
  DotChartOutlined, AreaChartOutlined, RadarChartOutlined, LockOutlined,
  DownloadOutlined, FilePdfOutlined, FileImageOutlined, FileExcelOutlined, FileZipOutlined, DownOutlined,
  SaveOutlined, DeleteOutlined, StarOutlined, QuestionCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ReactECharts from 'echarts-for-react';
import { SheetData, ChartType, ChartConfig, SortOrder, LockedChart, ChartTemplate } from '../types';
import ChartConfigPanel, { colorThemes } from './ChartConfigPanel';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import mergeImages from 'merge-images';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

// 富文本编辑器工具栏配置
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['link'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'align',
  'list', 'bullet',
  'link'
];

// 检查字段名称是否包含日期相关关键词
const isDateField = (fieldName: string): boolean => {
  const dateKeywords = ['date', 'time', 'day', 'month', 'year', '日期', '时间', '天', '月', '年'];
  const lowercaseName = fieldName.toLowerCase();
  return dateKeywords.some(keyword => lowercaseName.includes(keyword));
};

// 将Excel日期数字转换为日期字符串
const formatExcelDate = (value: any): string => {
  // 检查是否可能是Excel日期数值
  if (typeof value === 'number' && value > 25569 && value < 80000) {
    try {
      // Excel日期从1900年1月1日开始，距离1970年1月1日的天数是25569天
      const jsDate = new Date((value - 25569) * 86400 * 1000);
      return jsDate.toISOString().split('T')[0]; // 返回YYYY-MM-DD格式
    } catch (e) {
      return String(value);
    }
  }
  return String(value);
};

// 修改LockedChart接口，添加上下文分析字段
interface EditableChartText {
  preAnalysis: string;  // 图表前分析
  postAnalysis: string; // 图表后分析
}

interface ChartGeneratorProps {
  data: SheetData;
  onChartLock?: (chartId: string, config: ChartConfig) => void;
  lockedCharts?: LockedChart[];
  onDeleteLockedChart?: (lockedChartId: string) => void;
  templates?: ChartTemplate[];
  onCreateTemplate?: (name: string, description: string) => string | undefined;
  onDeleteTemplate?: (templateId: string) => void;
  onApplyTemplate?: (templateId: string, matchStrategy: 'exact' | 'fuzzy' | 'manual', headerMappings?: Record<string, string>) => void;
}

// 活动图表类型
interface ActiveChart {
  id: string;
  config: ChartConfig;
  sourceData: {
    headers: string[];
    data: any[][];
    sheetName: string;
  };
}

// 可选的图表类型定义
const chartTypes = [
  {
    id: 'bar',
    type: ChartType.BAR,
    name: '柱状图',
    icon: <BarChartOutlined />,
    description: '显示离散类别之间的比较'
  },
  {
    id: 'line',
    type: ChartType.LINE,
    name: '折线图',
    icon: <LineChartOutlined />,
    description: '显示随时间变化的连续数据'
  },
  {
    id: 'pie',
    type: ChartType.PIE,
    name: '饼图',
    icon: <PieChartOutlined />,
    description: '显示数据在整体中的占比'
  },
  {
    id: 'scatter',
    type: ChartType.SCATTER,
    name: '散点图',
    icon: <DotChartOutlined />,
    description: '显示数据点之间的关系'
  },
  {
    id: 'area',
    type: ChartType.AREA,
    name: '面积图',
    icon: <AreaChartOutlined />,
    description: '强调数量随时间的变化'
  },
  {
    id: 'radar',
    type: ChartType.RADAR,
    name: '雷达图',
    icon: <RadarChartOutlined />,
    description: '显示多变量数据的比较'
  }
];

const ChartGenerator: React.FC<ChartGeneratorProps> = ({ 
  data, 
  onChartLock,
  lockedCharts = [],
  onDeleteLockedChart,
  templates = [],
  onCreateTemplate,
  onDeleteTemplate,
  onApplyTemplate
}) => {
  const [activeCharts, setActiveCharts] = useState<ActiveChart[]>([]);
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);
  const [showLockedCharts, setShowLockedCharts] = useState<boolean>(false);
  const [chartTexts, setChartTexts] = useState<Record<string, EditableChartText>>({});
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [templateModalMode, setTemplateModalMode] = useState<'create' | 'apply'>('create');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateForm] = Form.useForm();
  const [applyStrategy, setApplyStrategy] = useState<'exact' | 'fuzzy' | 'manual'>('exact');
  const [headerMappings, setHeaderMappings] = useState<Record<string, string>>({});

  // 创建对锁定图表容器的ref
  const lockedChartsContainerRef = useRef<HTMLDivElement>(null);
  
  // 导出所有锁定图表的函数
  const exportLockedCharts = async (type: 'excel' | 'images' | 'pdf' | 'long-image' = 'excel') => {
    if (!lockedChartsContainerRef.current || lockedCharts.length === 0) {
      message.error('没有可导出的图表');
      return;
    }
    
    message.loading(`正在准备导出${type === 'excel' ? 'Excel' : type === 'images' ? '图片' : type === 'pdf' ? 'PDF' : '长图'}...`, 1.5);
    
    try {
      // 导出Excel数据
      if (type === 'excel') {
        await exportToExcel();
      }
      // 导出图片集合为ZIP
      else if (type === 'images') {
        await exportToImages();
      } 
      // 导出为PDF
      else if (type === 'pdf') {
        await exportToPDF();
      }
      // 导出为长图
      else if (type === 'long-image') {
        await exportToLongImage();
      }
    } catch (error) {
      console.error('导出图表时出错:', error);
      message.error('导出图表时出错');
    }
  };

  // 导出为Excel
  const exportToExcel = async () => {
    // 创建一个新的工作簿
    const workbook = XLSX.utils.book_new();
    
    // 为每个锁定图表创建一个sheet
    for (const chart of lockedCharts) {
      // 转换数据为工作表
      const worksheet = XLSX.utils.aoa_to_sheet([
        [`图表标题: ${chart.config.title}`],
        [`来源工作表: ${chart.sourceData.sheetName}`],
        [`来源文件: ${chart.sourceFileName || '未知'}`],
        [`锁定时间: ${new Date(chart.lockedAt).toLocaleString()}`],
        [],
        ['原始数据:'],
        chart.sourceData.headers,
        ...chart.sourceData.data
      ]);
      
      // 将工作表添加到工作簿
      XLSX.utils.book_append_sheet(
        workbook, 
        worksheet, 
        chart.config.title.slice(0, 30) // Excel工作表名称限制为31个字符
      );
    }
    
    // 导出Excel文件
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(excelBlob, `锁定图表数据_${new Date().toISOString().slice(0, 10)}.xlsx`);
    message.success('Excel数据导出完成！');
  };

  // 导出为图片ZIP
  const exportToImages = async () => {
    try {
      // 创建ZIP文件
      const zip = new JSZip();
      const imgFolder = zip.folder('图表图片');
      
      if (!imgFolder) {
        throw new Error('创建ZIP文件夹失败');
      }
      
      // 获取所有锁定图表的容器元素
      const chartCards = lockedChartsContainerRef.current?.querySelectorAll('.locked-chart-card') || [];
      
      // 创建一个Promise数组，等待所有图表截图完成
      const capturePromises = [];
      
      for (let i = 0; i < chartCards.length; i++) {
        const card = chartCards[i] as HTMLElement;
        const chartArea = card.querySelector('.echarts-for-react') as HTMLElement;
        
        if (chartArea) {
          const capturePromise = (async () => {
            try {
              const canvas = await html2canvas(chartArea, {
                backgroundColor: '#ffffff',
                scale: 2, // 提高导出图片的清晰度
                logging: false,
                useCORS: true // 允许加载跨域图片
              });
              
              // 将canvas转换为blob
              return new Promise<{index: number, blob: Blob, dataUrl: string}>((resolve, reject) => {
                const dataUrl = canvas.toDataURL('image/png');
                canvas.toBlob((blob) => {
                  if (blob) {
                    resolve({index: i, blob, dataUrl});
                  } else {
                    reject(new Error('创建Blob失败'));
                  }
                }, 'image/png');
              });
            } catch (error) {
              console.error(`导出图表 ${i + 1} 时出错:`, error);
              return null;
            }
          })();
          
          capturePromises.push(capturePromise);
        }
      }
      
      // 等待所有图表截图完成
      const results = await Promise.all(capturePromises);
      
      // 将图表添加到ZIP文件
      for (const result of results) {
        if (result) {
          const chartTitle = lockedCharts[result.index].config.title.replace(/[\/\\:*?"<>|]/g, '_'); // 移除文件名中的非法字符
          imgFolder.file(`${chartTitle}_${result.index + 1}.png`, result.blob);
        }
      }
      
      // 生成并保存ZIP文件
      const zipBlob = await zip.generateAsync({type: 'blob'});
      saveAs(zipBlob, `图表图片_${new Date().toISOString().slice(0, 10)}.zip`);
      
      message.success('图片导出完成！');
    } catch (error) {
      console.error('导出图表为PNG时出错:', error);
      message.error('导出图表图片时出错');
    }
  };

  // 导出为PDF
  const exportToPDF = async () => {
    try {
      // 创建新PDF文档并设置
      const pdf = new jsPDF();
      
      // 获取所有锁定图表的图像
      const results = await Promise.all(lockedCharts.map(async (chart, idx) => {
        const chartContainer = lockedChartsContainerRef.current?.querySelectorAll('.locked-chart-card')[idx]?.querySelector('.echarts-for-react');
      
        if (!chartContainer) return null;
        
            try {
          const canvas = await html2canvas(chartContainer as HTMLElement, {
                backgroundColor: '#ffffff',
            scale: 2,
                logging: false,
            useCORS: true
              });
              
              return {
            title: chart.config.title,
            dataUrl: canvas.toDataURL('image/jpeg', 0.9),
                width: canvas.width,
            height: canvas.height,
            id: chart.id
              };
            } catch (error) {
          console.error(`获取图表 ${idx + 1} 的图像时出错:`, error);
              return null;
            }
      }));
      
      // 辅助函数：将文本转换为图像添加到PDF
      const addTextAsImage = (text: string, x: number, y: number, maxWidth: number, fontSize: number, isBold: boolean = false, isCenter: boolean = false) => {
        if (!text) return;
        
        // 创建临时Canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = maxWidth * 4; // 较大尺寸，以获得更好的文本质量
        tempCanvas.height = fontSize * 4;
        
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;
        
        // 绘制文本
        ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
          ctx.fillStyle = '#000000';
        ctx.font = `${isBold ? 'bold ' : ''}${fontSize * 4}px Arial, "Microsoft YaHei", sans-serif`;
          
          if (isCenter) {
            ctx.textAlign = 'center';
            ctx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);
          } else {
            ctx.textAlign = 'left';
            ctx.fillText(text, 0, tempCanvas.height / 2);
          }
          
          // 将文本转为图像添加到PDF
          const imgData = tempCanvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', x, y - fontSize / 2, maxWidth, fontSize * 1.5);
      };

      // 添加富文本内容
      const addRichTextContent = async (htmlContent: string, x: number, y: number, maxWidth: number) => {
        try {
          if (!htmlContent || htmlContent.trim() === '') return y;
          
          // 直接使用renderHtmlToCanvas函数渲染HTML内容
          const htmlCanvas = await renderHtmlToCanvas(htmlContent, maxWidth);
          
          // 将Canvas添加到PDF
          const imgData = htmlCanvas.toDataURL('image/png');
          const imgHeight = (htmlCanvas.height / htmlCanvas.width) * maxWidth;
          
          // 添加背景
          pdf.setFillColor(255, 255, 255); // 改为白色
          pdf.rect(x - 2, y - 4, maxWidth + 4, imgHeight + 8, 'F');
          
          // 添加内容
          pdf.addImage(imgData, 'PNG', x, y, maxWidth, imgHeight);
          
          return y + imgHeight + 5;
        } catch (error) {
          console.error('添加富文本内容时出错:', error);
          // 如果富文本渲染失败，退回到简单文本模式
          const plainText = htmlToPlainText(htmlContent);
          return addMultiLineText(plainText, x, y, maxWidth, 10, 5);
        }
      };

      // 添加多行文本（作为备用）
      const addMultiLineText = (text: string, x: number, y: number, maxWidth: number, fontSize: number, lineHeight: number) => {
        if (!text || text.trim() === '') return y;
        
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        
        if (!ctx) return y;
        
        ctx.font = `${fontSize}px Arial, "Microsoft YaHei", "微软雅黑", STXihei, "华文细黑", sans-serif`;
        
        // 分行
        const lines = getTextLines(ctx, text, maxWidth * 4);
        let currentY = y;
        
        // 创建背景
        const textBlockHeight = lines.length * lineHeight;
        pdf.setFillColor(255, 255, 255); // 改为白色
        pdf.rect(x - 2, y - 4, maxWidth + 4, textBlockHeight + 8, 'F');
        
        // 逐行添加文本
        for (const line of lines) {
          addTextAsImage(line, x, currentY, maxWidth, fontSize);
          currentY += lineHeight;
        }
        
        return currentY;
      };
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 页边距，单位mm
      
      // 添加标题
      addTextAsImage('锁定图表集合', pageWidth / 2, margin + 8, pageWidth - 2 * margin, 16, true, true);
      addTextAsImage(`导出时间: ${new Date().toLocaleString()}`, pageWidth / 2, margin + 16, pageWidth - 2 * margin, 10, false, true);
      
      let y = margin + 25; // 起始y坐标，考虑标题的高度
      
      // 依次添加每个图表
      for (let index = 0; index < results.length; index++) {
        const result = results[index];
        if (!result) continue;
        
        // 获取当前图表的文本内容
        const chartId = result.id; // 使用result.id替代lockedCharts[result.index].id
        const chartText = chartTexts[chartId] || { preAnalysis: '', postAnalysis: '' };
        
        // 计算图像适合的宽度
        const availableWidth = pageWidth - 2 * margin;
        const imgRatio = result.width / result.height;
        const imgWidth = availableWidth;
        const imgHeight = imgWidth / imgRatio;
        
        // 计算标题和源信息高度
        const titleHeight = 10;
        const sourceHeight = 5;
        const totalTitleHeight = titleHeight + sourceHeight + 5;
        
        // 检查是否需要新页面 (预留足够空间)
        if (y + totalTitleHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin; // 新页面重置y坐标
        }
        
        // 添加图表标题
        addTextAsImage(`图表 ${index + 1}: ${result.title}`, margin, y, availableWidth, 12, true);
        y += titleHeight;
        
        // 检查剩余空间，决定是否需要新页面用于前置分析
        if (chartText.preAnalysis && y > pageHeight - 50) {
          pdf.addPage();
          y = margin;
        }
        
        // 添加前置分析（如果有）
        if (chartText.preAnalysis) {
          // 使用富文本渲染
          y = await addRichTextContent(chartText.preAnalysis, margin, y, availableWidth);
          
          // 检查渲染后的位置，如果太靠下就换页
          if (y > pageHeight - 50) {
            pdf.addPage();
            y = margin;
          }
        }
        
        // 检查剩余空间，决定是否需要新页面用于图表
        if (y + imgHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        
        // 添加图像
        try {
          pdf.addImage(result.dataUrl, 'JPEG', margin, y, imgWidth, imgHeight);
          y += imgHeight + 5;
        } catch (error) {
          console.error('添加图像到PDF时出错:', error);
        }
        
        // 检查剩余空间，决定是否需要新页面用于后置分析
        if (chartText.postAnalysis && y > pageHeight - 50) {
          pdf.addPage();
          y = margin;
        }
        
        // 添加后置分析（如果有）
        if (chartText.postAnalysis) {
          // 使用富文本渲染
          y = await addRichTextContent(chartText.postAnalysis, margin, y, availableWidth);
        } else {
          y += 10; // 底部额外空间
        }
        
        // 图表间添加额外空间
        if (index < results.length - 1) {
          y += 15;
          
          // 如果下一个图表可能不适合当前页，直接添加新页
          if (y > pageHeight - 50) {
            pdf.addPage();
            y = margin;
          }
        }
      }
      
      // 保存PDF
      pdf.save(`锁定图表集合_${new Date().toISOString().slice(0, 10)}.pdf`);
      message.success('PDF导出完成！');
    } catch (error) {
      console.error('导出PDF时出错:', error);
      message.error('导出PDF时出错');
    }
  };

  // 辅助函数：将HTML内容转换为纯文本
  const htmlToPlainText = (html: string): string => {
    try {
      // 创建一个临时元素
      const temp = document.createElement('div');
      temp.innerHTML = html;
      
      // 递归处理所有子元素
      const processNode = (node: Node): string => {
        let result = '';
        
        if (node.nodeType === Node.TEXT_NODE) {
          // 如果是文本节点，直接添加文本
          result += node.textContent || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // 如果是元素节点，递归处理子节点
          const element = node as Element;
          
          // 先处理所有子节点
          Array.from(element.childNodes).forEach(child => {
            result += processNode(child);
          });
          
          // 添加特定元素的额外处理
          const tagName = element.tagName.toLowerCase();
          if (tagName === 'br' || tagName === 'p' || tagName === 'div' || 
              tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || 
              tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
            if (!result.endsWith('\n')) {
              result += '\n';
            }
          }
        }
        
        return result;
      };
      
      // 处理整个文档
      let plainText = processNode(temp);
      
      // 修整换行符，确保没有过多的空行
      plainText = plainText.replace(/\n{3,}/g, '\n\n');
      
      return plainText.trim();
          } catch (error) {
      console.error('转换HTML到纯文本出错:', error);
      return html; // 出错时返回原始HTML
    }
  };

  // 辅助函数：将HTML内容渲染为Canvas以便于导出
  const renderHtmlToCanvas = async (html: string, width: number): Promise<HTMLCanvasElement> => {
    return new Promise<HTMLCanvasElement>(async (resolve) => {
      try {
        // 创建一个临时div用于渲染
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.width = `${width}px`;
        container.style.backgroundColor = '#ffffff';
        container.style.boxSizing = 'border-box';
        container.style.padding = '10px';
        
        // 设置内容，包含强制断行的样式
        container.innerHTML = `
          <div style="width:${width-20}px; overflow-wrap:break-word; word-break:break-all;">
            <style>
              * {
                max-width: 100% !important;
                word-break: break-all !important; 
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
                white-space: normal !important;
                box-sizing: border-box !important;
                font-family: Arial, "Microsoft YaHei", sans-serif !important;
              }
              p, div {
                margin: 0 0 10px 0 !important;
                padding: 0 !important;
                width: 100% !important;
                max-width: ${width-20}px !important;
              }
              .ql-align-center, [style*="text-align: center"], [align="center"] {
                text-align: center !important;
                display: block !important;
                margin: 0 auto !important;
              }
              .ql-align-right, [style*="text-align: right"], [align="right"] {
                text-align: right !important;
                display: block !important;
                width: 100% !important;
              }
              .ql-align-left, [style*="text-align: left"], [align="left"] {
                text-align: left !important;
                display: block !important;
                width: 100% !important;
              }
            </style>
            ${html}
          </div>
        `;
        
        // 添加到DOM以便测量和渲染
        document.body.appendChild(container);
        
        // 等待DOM渲染
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 获取内容高度
        const contentHeight = Math.max(100, container.scrollHeight);
        
        // 创建Canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = contentHeight;
        
        // 创建2D上下文
        const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法创建Canvas上下文');
      }
      
        // 设置白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, contentHeight);
        
        // 使用html2canvas渲染内容
        try {
          const renderedCanvas = await html2canvas(container, {
            backgroundColor: '#ffffff',
            scale: 2, // 提高清晰度
            logging: false,
            useCORS: true,
            width: width,
            height: contentHeight,
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0,
            windowWidth: width,
            onclone: (doc) => {
              // 确保克隆文档中的样式正确应用
              const style = doc.createElement('style');
              style.textContent = `
                * {
                  word-break: break-all !important;
                  word-wrap: break-word !important;
                  white-space: normal !important;
                  max-width: ${width-20}px !important;
                  overflow-x: hidden !important;
                }
              `;
              doc.head.appendChild(style);
            }
          });
          
          // 将渲染结果绘制到最终的canvas上
          ctx.drawImage(renderedCanvas, 0, 0);
        } catch (e) {
          console.error('HTML渲染为Canvas失败:', e);
          
          // 备用方案：使用Canvas API直接绘制文本
          ctx.font = '14px Arial, "Microsoft YaHei", sans-serif';
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'left';
          
          // 移除HTML标签获取纯文本
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          const plainText = tempDiv.textContent || tempDiv.innerText || html;
          
          // 简单文本换行
          const words = plainText.split('');
          let line = '';
          let lineHeight = 20;
          let y = 20;
          const maxWidth = width - 20;
          
          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && i > 0) {
              ctx.fillText(line, 10, y);
              line = words[i];
              y += lineHeight;
            } else {
              line = testLine;
            }
          }
          
          // 最后一行
          ctx.fillText(line, 10, y);
        }
        
        // 清理
        document.body.removeChild(container);
        
        resolve(canvas);
    } catch (error) {
        console.error('渲染HTML内容出错:', error);
        
        // 创建应急canvas
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = width;
        fallbackCanvas.height = 100;
        const ctx = fallbackCanvas.getContext('2d');
        
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, 100);
          ctx.fillStyle = '#000000';
          ctx.font = '16px Arial, "Microsoft YaHei", sans-serif';
          ctx.fillText('内容渲染失败', 20, 50);
        }
        
        resolve(fallbackCanvas);
      }
    });
  };

  // 辅助函数：将文本拆分为多行以适应最大宽度
  const getTextLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    if (!text || !ctx) return [];
    
    // 先尝试处理HTML内容
    try {
      const plainText = htmlToPlainText(text);
      
      // 先按照自然段落分割
      const paragraphs = plainText.split('\n');
      const lines: string[] = [];
      
      for (const paragraph of paragraphs) {
        if (!paragraph.trim()) {
          lines.push('');
          continue;
        }
        
        // 中文不需要按空格分词，可以逐字切分
        let currentLine = '';
        
        for (let i = 0; i < paragraph.length; i++) {
          const char = paragraph[i];
          const testLine = currentLine + char;
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && currentLine !== '') {
            lines.push(currentLine);
            currentLine = char;
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine) {
          lines.push(currentLine);
        }
      }
      
      return lines;
    } catch (e) {
      console.error('处理HTML文本时出错:', e);
      return text.split('\n');
    }
  };

  // 更新图表文本内容
  const updateChartText = (chartId: string, field: 'preAnalysis' | 'postAnalysis', value: string) => {
    setChartTexts(prev => {
      const newTexts = {
        ...prev,
        [chartId]: {
          ...prev[chartId] || { preAnalysis: '', postAnalysis: '' },
          [field]: value
        }
      };
      
      // 如果模板存在，更新模板中的文本
      if (templates && onCreateTemplate) {
        templates.forEach(template => {
          template.charts.forEach(chart => {
            if (chart.config.title === lockedCharts.find(c => c.id === chartId)?.config.title) {
              chart[field] = value;
            }
          });
        });
      }
      
      return newTexts;
    });
  };

  // 生成默认配置
  const createDefaultConfig = (chartType: ChartType): ChartConfig => {
    // 假设第一列是类别，第二列是数值
    const xField = data.headers.length > 0 ? data.headers[0] : '';
    const yField = data.headers.length > 1 ? data.headers[1] : '';
    
    return {
      type: chartType,
      title: `${chartTypes.find(c => c.type === chartType)?.name || '新图表'}`,
      xAxis: {
        field: xField,
        title: xField
      },
      yAxis: {
        field: yField,
        title: yField
      },
      series: [{
        field: yField,
        name: yField
      }],
      options: {
        showDataLabels: false,  // 默认不显示标签
        baseValue: 0,           // 默认基数为0
        sortOrder: SortOrder.NONE,  // 默认不排序
        countMode: true         // 默认启用计数模式
      }
    };
  };

  // 添加图表到工作区
  const addChart = (chartType: ChartType) => {
    const newChart = {
      id: `chart-${Date.now()}`,
      config: createDefaultConfig(chartType),
      sourceData: {
        headers: data.headers,
        data: data.data,
        sheetName: data.sheetName || 'unknown'
      }
    };
    
    setActiveCharts([...activeCharts, newChart]);
    setSelectedChartId(newChart.id);
    message.success('已添加图表到工作区');
  };

  // 更新图表配置
  const updateChartConfig = (chartId: string, config: ChartConfig) => {
    // 确保所有的系列都有有效的field属性
    const validatedConfig = {
      ...config,
      series: config.series?.filter(s => s && s.field) || []
    };
    
    setActiveCharts(activeCharts.map(chart => 
      chart.id === chartId ? { ...chart, config: validatedConfig } : chart
    ));
    
    // 添加调试日志，以便在控制台查看当前配置
    console.log('更新图表配置:', validatedConfig);
  };

  // 处理拖放完成事件
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    
    // 如果是从图表类型拖到工作区
    if (source.droppableId === 'chart-types' && destination.droppableId === 'workspace') {
      const chartType = chartTypes.find(type => type.id === draggableId)?.type;
      if (chartType) {
        addChart(chartType);
      }
    }
    
    // 如果是在工作区内部重新排序
    if (source.droppableId === 'workspace' && destination.droppableId === 'workspace') {
      const reordered = [...activeCharts];
      const [removed] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, removed);
      setActiveCharts(reordered);
    }
  };

  // 生成ECharts选项
  const generateChartOptions = (config: ChartConfig, customHeaders?: string[], customData?: any[][]) => {
    // 使用传入的自定义数据或当前工作表数据
    const headers = customHeaders || data.headers;
    const chartData = customData || data.data;
    
    // 获取配置选项
    const countMode = config.options?.countMode || false;
    const showDataLabels = config.options?.showDataLabels || false;
    const sortOrder = config.options?.sortOrder || SortOrder.NONE;
    const baseValue = config.options?.baseValue || 0;
    
    // 获取样式配置
    const colors = config.options?.colors || colorThemes.default;
    const barWidth = config.options?.barWidth || 60;
    const borderRadius = config.options?.borderRadius || 0; 
    const seriesOpacity = config.options?.seriesOpacity || 1.0;
    const bgColor = config.options?.bgColor || 'transparent';
    
    // 获取文字颜色配置
    const titleColor = config.options?.titleColor || '#333333';
    const axisColor = config.options?.axisColor || '#666666';
    const labelColor = config.options?.labelColor || '#666666';
    const legendColor = config.options?.legendColor || '#666666';
    
    // 通用样式配置
    const styleConfig = {
      color: colors,
      backgroundColor: bgColor,
      title: {
        text: config.title,
        textStyle: {
          color: titleColor // 标题文字颜色
        }
      },
      textStyle: {
        color: labelColor // 全局文字样式默认使用标签颜色
      },
      xAxis: {
        axisLine: {
          lineStyle: {
            color: axisColor // 坐标轴线颜色
          }
        },
        axisLabel: {
          color: axisColor // 坐标轴标签颜色
        },
        nameTextStyle: {
          color: axisColor // 坐标轴名称颜色
        }
      },
      yAxis: {
        axisLine: {
          lineStyle: {
            color: axisColor // 坐标轴线颜色
          }
        },
        axisLabel: {
          color: axisColor // 坐标轴标签颜色
        },
        nameTextStyle: {
          color: axisColor // 坐标轴名称颜色
        }
      },
      legend: {
        textStyle: {
          color: legendColor // 图例文字颜色
        }
      }
    };
    
    // 提取表头索引
    let xAxisIndex = -1;
    if (config.xAxis?.field) {
      xAxisIndex = headers.findIndex(h => h === config.xAxis?.field);
    }
    
    let yAxisIndex = -1;
    if (config.yAxis?.field && !countMode) {
      yAxisIndex = headers.findIndex(h => h === config.yAxis?.field);
    }
    
    // 检查是否是日期字段
    const isXAxisDate = xAxisIndex >= 0 && isDateField(headers[xAxisIndex]);
    
    // 过滤掉没有field属性的系列
    const validSeries = config.series?.filter(s => s && s.field) || [];
    const seriesIndices = validSeries.map(s => headers.findIndex(h => h === s.field));
    
    // 存储X轴数据和每个系列的值
    let xAxisData: string[] = [];
    let seriesValues: number[][] = seriesIndices.map(() => []);

    // 如果是计数模式，我们需要进行分组统计
    if (countMode && xAxisIndex >= 0) {
      // 获取所有不同的X轴值
      const uniqueXValues = new Set<string>();
      chartData.forEach(row => {
        if (xAxisIndex >= 0) {
          // 如果是日期字段，先格式化
          const xValue = isXAxisDate ? formatExcelDate(row[xAxisIndex]) : String(row[xAxisIndex]);
          uniqueXValues.add(xValue);
        }
      });
      
      // 转换为数组
      let uniqueXValuesArray = Array.from(uniqueXValues);

      // 创建统计对象
      const countStats: Record<string, number[]> = {};
      seriesIndices.forEach((_, index) => {
        countStats[index] = Array(uniqueXValuesArray.length).fill(0);
      });
      
      // 计算每个唯一值的出现次数
      chartData.forEach(row => {
        const rawXValue = row[xAxisIndex];
        const xValue = isXAxisDate ? formatExcelDate(rawXValue) : String(rawXValue);
        const xValueIndex = uniqueXValuesArray.indexOf(xValue);
        
        if (xValueIndex >= 0) {
          // 增加对应系列的计数
          seriesIndices.forEach((seriesIndex, i) => {
            if (seriesIndex >= 0) {
              // 如果系列字段值存在，则计数增加
              if (row[seriesIndex] !== undefined && row[seriesIndex] !== null && row[seriesIndex] !== '') {
                countStats[i][xValueIndex] += 1;
              }
            }
          });
        }
      });
      
      // 创建一个包含X值和计数的数据结构，用于排序
      const sortableData = uniqueXValuesArray.map((x, index) => {
        const counts = seriesIndices.map((_, i) => countStats[i][index]);
        return { x, counts };
      });
      
      // 检查是否需要根据系列值排序
      if (config.options?.sortBySeriesValue && sortOrder !== SortOrder.NONE) {
        // 根据第一个系列的计数值进行排序
        sortableData.sort((a, b) => {
          const valueA = a.counts[0] || 0;
          const valueB = b.counts[0] || 0;
          const result = valueA - valueB;
          return sortOrder === SortOrder.ASCENDING ? result : -result;
        });
      } else if (sortOrder !== SortOrder.NONE) {
        // 根据X轴值排序
        sortableData.sort((a, b) => {
          // 对于日期字段使用日期比较
          if (isXAxisDate) {
            const dateA = new Date(a.x);
            const dateB = new Date(b.x);
            if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
              const compareResult = dateA.getTime() - dateB.getTime();
              return sortOrder === SortOrder.ASCENDING ? compareResult : -compareResult;
            }
          }
          
          // 尝试数字排序，如果转换为数字失败则进行字符串排序
          const numA = Number(a.x);
          const numB = Number(b.x);
          
          let compareResult = 0;
          if (!isNaN(numA) && !isNaN(numB)) {
            compareResult = numA - numB;
          } else {
            compareResult = a.x.localeCompare(b.x);
          }
          
          // 如果是降序，则反转比较结果
          return sortOrder === SortOrder.ASCENDING ? compareResult : -compareResult;
        });
      }
      
      // 使用排序后的数据更新xAxisData和seriesValues
      xAxisData = sortableData.map(item => item.x);
      seriesValues = seriesIndices.map((_, i) => sortableData.map(item => item.counts[i]));
      
      // 基于图表类型创建不同的配置
      switch (config.type) {
        case ChartType.BAR:
          return {
            ...styleConfig, // 应用通用样式
            tooltip: {},
            xAxis: {
              ...styleConfig.xAxis,
              data: xAxisData,
              name: config.xAxis?.title
            },
            yAxis: {
              ...styleConfig.yAxis,
              name: countMode ? '计数' : config.yAxis?.title,
              min: baseValue > 0 ? baseValue : undefined
            },
            series: validSeries.map((s, index) => ({
              name: s.name || s.field,
              type: 'bar',
              data: seriesValues[index].map(val => val + baseValue),
              // 应用样式配置
              barWidth: `${barWidth}%`, // 设置柱子宽度
              itemStyle: {
                borderRadius: borderRadius, // 设置圆角
                opacity: seriesOpacity, // 设置不透明度
                // 支持阴影效果
                shadowBlur: config.options?.shadowBlur || 0,
                shadowColor: config.options?.shadowColor || 'rgba(0,0,0,0)',
                shadowOffsetX: config.options?.shadowOffsetX || 0,
                shadowOffsetY: config.options?.shadowOffsetY || 0
              },
              label: {
                show: showDataLabels,
                position: 'top',
                formatter: '{c}',
                color: labelColor // 应用数据标签颜色
              }
            }))
          };
          
        case ChartType.LINE:
          return {
            ...styleConfig, // 应用通用样式
            tooltip: {},
            xAxis: {
              ...styleConfig.xAxis,
              data: xAxisData,
              name: config.xAxis?.title
            },
            yAxis: {
              ...styleConfig.yAxis,
              name: countMode ? '计数' : config.yAxis?.title,
              min: baseValue > 0 ? baseValue : undefined
            },
            series: validSeries.map((s, index) => ({
              name: s.name || s.field,
              type: 'line',
              // 添加区域样式，使线图转为面积图并应用不透明度
              areaStyle: {
                opacity: config.options?.areaOpacity || seriesOpacity * 0.7,  // 面积透明度
                // 支持渐变色
                color: config.options?.colorStops ? {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: config.options.colorStops
                } : undefined
              },
              // 应用样式配置
              smooth: config.options?.smooth || true, // 默认平滑曲线
              symbolSize: config.options?.symbolSize || 4, // 标记点大小
              stack: config.options?.stack ? 'total' : undefined, // 是否堆叠
              lineStyle: {
                width: config.options?.lineWidth || 2, // 线宽
                opacity: seriesOpacity
              },
              itemStyle: {
                opacity: seriesOpacity
              },
              label: {
                show: showDataLabels,
                position: 'top',
                formatter: '{c}',
                color: labelColor // 应用数据标签颜色
              }
            }))
          };
          
        case ChartType.PIE:
          // 创建多个系列的饼图
          const pieSeriesConfigs = [];
          
          // 处理每个数据系列
          for (let seriesIdx = 0; seriesIdx < validSeries.length; seriesIdx++) {
            const currentSeries = validSeries[seriesIdx];
            const currentSeriesIndex = seriesIndices[seriesIdx];
            
            if (currentSeriesIndex >= 0) {
              // 为当前系列创建数据聚合对象
              const aggregatedData = new Map<string, number>();
              
              // 对于饼图，我们根据系列字段进行数据聚合，而不是使用X轴字段
              // 收集该系列字段的所有唯一值，这些值将作为饼图的分段
              const seriesValues = new Set<string>();
              chartData.forEach(row => {
                if (currentSeriesIndex >= 0) {
                  seriesValues.add(String(row[currentSeriesIndex]));
                }
              });
              
              // 统计每个唯一值的出现次数
              Array.from(seriesValues).forEach(value => {
                if (value !== undefined && value !== null && value !== '') {
                  const count = chartData.filter(row => 
                    String(row[currentSeriesIndex]) === value
                  ).length;
                  aggregatedData.set(value, count + baseValue);
                }
              });
              
              // 将聚合的数据转换为饼图数据格式
              const pieData = Array.from(aggregatedData.entries())
                .map(([name, value]) => ({ name, value }))
                .filter(item => item.value > 0); // 过滤掉值为0的项
              
              // 如果需要排序，按值进行排序
              if (sortOrder !== SortOrder.NONE) {
                pieData.sort((a, b) => {
                  const result = a.value - b.value;
                  return sortOrder === SortOrder.ASCENDING ? result : -result;
                });
              }
              
              // 如果有数据，添加这个系列的配置 (计数模式)
              if (pieData.length > 0) {
                pieSeriesConfigs.push({
                  name: currentSeries.name || currentSeries.field,
                  type: 'pie',
                  radius: config.options?.radius || [0, '65%'],  // 使用自定义半径或默认
                  center: ['40%', '50%'], // 将饼图居中，留出右侧空间给图例
                  data: pieData,
                  label: {
                    show: showDataLabels,
                    position: 'outside',
                    formatter: '{b}: {c} ({d}%)',
                    color: labelColor,
                    textStyle: { 
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: labelColor
                    }
                  },
                  labelLine: {
                    show: showDataLabels,
                    length: 10,
                    length2: 10
                  },
                  itemStyle: {
                    opacity: seriesOpacity,
                    borderRadius: config.options?.borderRadius || 0,
                    borderWidth: config.options?.borderWidth || 0,
                    borderColor: config.options?.borderColor || 'transparent',
                    shadowBlur: config.options?.itemStyle?.shadowBlur || 0,
                    shadowColor: config.options?.itemStyle?.shadowColor || 'rgba(0, 0, 0, 0.2)',
                    shadowOffsetX: config.options?.itemStyle?.shadowOffsetX || 0,
                    shadowOffsetY: config.options?.itemStyle?.shadowOffsetY || 0
                  },
                  roseType: config.options?.roseType ? 'radius' : false,
                  emphasis: {
                    itemStyle: {
                      shadowBlur: 10,
                      shadowOffsetX: 0,
                      shadowColor: 'rgba(0, 0, 0, 0.5)',
                      opacity: seriesOpacity
                    },
                    label: {
                      show: true
                    }
                  }
                });
              }
            }
          }
          
          // 如果没有有效系列，创建一个默认的空饼图配置 (计数模式)
          if (pieSeriesConfigs.length === 0) {
            pieSeriesConfigs.push({
              name: '数据',
              type: 'pie',
              radius: '65%',
              center: ['40%', '50%'], // 将饼图居中，留出右侧空间给图例
              data: [],
              label: {
                show: showDataLabels,
                color: labelColor
              }
            });
          }
          
          // 计数模式饼图配置
          return {
            ...styleConfig,
            tooltip: {
              trigger: 'item',
              formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            xAxis: { show: false },
            yAxis: { show: false },
            legend: {
              ...styleConfig.legend,
              orient: 'vertical',
              left: '65%', // 图例位于饼图右侧
              top: 'middle',
              itemGap: 15, // 增加图例项之间的间距
              textStyle: {
                ...styleConfig.legend.textStyle,
                padding: [0, 0, 0, 5]
              }
            },
            series: pieSeriesConfigs
          };
        
        case ChartType.AREA:
          return {
            ...styleConfig, // 应用通用样式
            tooltip: {},
            xAxis: {
              ...styleConfig.xAxis,
              data: xAxisData,
              name: config.xAxis?.title
            },
            yAxis: {
              ...styleConfig.yAxis,
              name: config.yAxis?.title,
              min: baseValue > 0 ? baseValue : undefined
            },
            series: validSeries.map((s, index) => ({
              name: s.name || s.field,
              type: 'line',
              // 添加区域样式，使线图转为面积图并应用不透明度
              areaStyle: {
                opacity: seriesOpacity * 0.7  // 面积稍微更透明一些，看起来更好看
              },
              lineStyle: {
                opacity: seriesOpacity
              },
              itemStyle: {
                opacity: seriesOpacity
              },
              data: seriesValues[index],
              label: {
                show: showDataLabels,
                position: 'top',
                formatter: '{c}',
                color: labelColor // 应用数据标签颜色
              }
            }))
          };
          
        case ChartType.RADAR:
          // 处理雷达图需要特殊的指标配置
          const standardRadarIndicators = xAxisData.map((name, index) => {
            // 找出此维度所有系列的最大值，作为雷达图该维度的最大值
            const maxValue = Math.max(...validSeries.map((_, seriesIdx) => {
              const val = seriesValues[seriesIdx][index];
              return isNaN(val) ? 0 : val;
            }));
            return {
              name: name,
              max: Math.ceil((maxValue + baseValue) * 1.2) // 最大值增加20%作为雷达图刻度
            };
          });
          
          return {
            ...styleConfig, // 应用通用样式
            tooltip: {},
            xAxis: { show: false }, // 隐藏X轴
            yAxis: { show: false }, // 隐藏Y轴
            radar: {
              indicator: standardRadarIndicators,
              name: {
                textStyle: {
                  color: axisColor // 雷达图指示器名称颜色
                }
              }
            },
            series: [{
              type: 'radar',
              data: validSeries.map((s, index) => ({
                name: s.name || s.field,
                value: standardRadarIndicators.map((_, i) => {
                  const val = seriesValues[index][i];
                  return isNaN(val) ? baseValue : val;
                }),
                // 应用样式配置
                areaStyle: {
                  opacity: seriesOpacity * 0.6  // 雷达图区域透明度稍低
                },
                lineStyle: {
                  opacity: seriesOpacity
                },
                itemStyle: {
                  opacity: seriesOpacity
                },
                label: {
                  show: showDataLabels,
                  color: labelColor // 应用数据标签颜色
                }
              }))
            }]
          };
          
        case ChartType.SCATTER:
          return {
            ...styleConfig, // 应用通用样式
            tooltip: {
              trigger: 'item',
              formatter: function(params: any) {
                return `${params.seriesName}<br/>${xAxisData[params.dataIndex]}: ${params.value[1]}`;
              }
            },
            xAxis: {
              ...styleConfig.xAxis,
              type: 'value',
              name: config.xAxis?.title,
              scale: true
            },
            yAxis: {
              ...styleConfig.yAxis,
              name: config.yAxis?.title,
              type: 'value',
              scale: true,
              min: baseValue > 0 ? baseValue : undefined
            },
            series: validSeries.map((s, index) => ({
              name: s.name || s.field,
              type: 'scatter',
              data: xAxisData.map((name, i) => {
                // 将x轴值尝试转换为数值，不能转换则使用索引
                const xVal = isNaN(parseFloat(name)) ? i : parseFloat(name);
                return [xVal, seriesValues[index][i] + baseValue];
              }),
              // 应用样式配置
              symbolSize: function(data: any, dataIndex: number) {
                // 支持单个大小或数组大小
                if (Array.isArray(config.options?.symbolSize)) {
                  const sizes = config.options?.symbolSize || [];
                  return sizes[dataIndex % sizes.length];
                }
                return config.options?.symbolSize || 10;
              },
              itemStyle: {
                opacity: seriesOpacity,
                // 支持渐变效果
                color: config.options?.effectGradient ? {
                  type: 'radial',
                  x: 0.5,
                  y: 0.5,
                  r: 0.5,
                  colorStops: [
                    {offset: 0, color: (Array.isArray(colors) ? colors[0] : colors) || '#5470c6'},
                    {offset: 1, color: 'rgba(255,255,255,0.2)'}
                  ]
                } : (Array.isArray(colors) ? colors[0] : colors),
                shadowBlur: config.options?.effectShadow ? 10 : (config.options?.shadowBlur || 0),
                shadowColor: config.options?.shadowColor || 'rgba(0, 0, 0, 0.3)'
              },
              label: {
                show: showDataLabels,
                position: 'right',
                formatter: '{@[1]}',
                color: labelColor // 应用数据标签颜色
              }
            }))
          };
        
        // 其他类型的图表...
        default:
          return { title: { text: config.title } };
      }
    } else {
      // 为数据处理准备变量
      if (sortOrder !== SortOrder.NONE && xAxisIndex >= 0) {
        // 获取所有x值及对应的所有系列值
        const allData: { x: string; rawX: any; values: number[] }[] = [];
        chartData.forEach(row => {
          if (xAxisIndex >= 0) {
            const rawXValue = row[xAxisIndex];
            const xValue = isXAxisDate ? formatExcelDate(rawXValue) : String(rawXValue);
            const rowValues: number[] = [];
            
            seriesIndices.forEach(seriesIndex => {
              if (seriesIndex >= 0) {
                // 应用基数设置
                const value = parseFloat(String(row[seriesIndex])) + baseValue;
                rowValues.push(isNaN(value) ? baseValue : value);
              } else {
                rowValues.push(baseValue);
              }
            });
            
            allData.push({ x: xValue, rawX: rawXValue, values: rowValues });
          }
        });
        
        // 如果请求的是Y轴排序（根据数据系列值排序）
        // 我们使用第一个系列的值作为排序依据
        if (config.options?.sortBySeriesValue && validSeries.length > 0) {
          // 使用第一个系列值排序
          allData.sort((a, b) => {
            const valA = a.values[0] || 0;
            const valB = b.values[0] || 0;
            const result = valA - valB;
            return sortOrder === SortOrder.ASCENDING ? result : -result;
          });
        } else {
          // 根据排序方式排序X轴
          allData.sort((a, b) => {
            // 对于日期字段使用日期比较
            if (isXAxisDate) {
              const dateA = new Date(a.x);
              const dateB = new Date(b.x);
              if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                const compareResult = dateA.getTime() - dateB.getTime();
                return sortOrder === SortOrder.ASCENDING ? compareResult : -compareResult;
              }
            }
            
            // 尝试数字排序，如果转换为数字失败则进行字符串排序
            const numA = Number(a.x);
            const numB = Number(b.x);
            
            let compareResult = 0;
            if (!isNaN(numA) && !isNaN(numB)) {
              compareResult = numA - numB;
            } else {
              compareResult = a.x.localeCompare(b.x);
            }
            
            // 如果是降序，则反转比较结果
            return sortOrder === SortOrder.ASCENDING ? compareResult : -compareResult;
          });
        }
        
        // 清空先前的数据
        xAxisData = [];
        seriesValues = seriesIndices.map(() => []);
        
        // 填充排序后的数据
        allData.forEach(item => {
          xAxisData.push(item.x);
          item.values.forEach((value, i) => {
            seriesValues[i].push(value);
          });
        });
      } else {
        // 标准数据处理（不排序）
        chartData.forEach(row => {
          if (xAxisIndex >= 0) {
            // 如果是日期字段，进行格式化
            const xValue = isXAxisDate ? formatExcelDate(row[xAxisIndex]) : String(row[xAxisIndex]);
            xAxisData.push(xValue);
            
            seriesIndices.forEach((seriesIndex, i) => {
              if (seriesIndex >= 0) {
                // 应用基数设置
                const value = parseFloat(String(row[seriesIndex])) + baseValue;
                seriesValues[i].push(isNaN(value) ? baseValue : value);
              } else {
                seriesValues[i].push(baseValue);
              }
            });
          }
        });
      }
      
      // 基于图表类型创建不同的配置
      switch (config.type) {
        case ChartType.BAR:
          return {
            title: {
              text: config.title
            },
            tooltip: {},
            xAxis: {
              data: xAxisData,
              name: config.xAxis?.title
            },
            yAxis: {
              name: config.yAxis?.title,
              min: baseValue > 0 ? baseValue : undefined
            },
            series: validSeries.map((s, index) => ({
              name: s.name || s.field,
              type: 'bar',
              data: seriesValues[index],
              // 应用样式配置
              barWidth: `${barWidth}%`, // 设置柱子宽度
              itemStyle: {
                borderRadius: borderRadius, // 设置圆角
                opacity: seriesOpacity, // 设置不透明度
                // 支持阴影效果
                shadowBlur: config.options?.shadowBlur || 0,
                shadowColor: config.options?.shadowColor || 'rgba(0,0,0,0)',
                shadowOffsetX: config.options?.shadowOffsetX || 0,
                shadowOffsetY: config.options?.shadowOffsetY || 0
              },
              label: {
                show: showDataLabels,
                position: 'top',
                formatter: '{c}',
                color: labelColor // 应用数据标签颜色
              }
            }))
          };
          
        case ChartType.LINE:
          return {
            title: {
              text: config.title
            },
            tooltip: {},
            xAxis: {
              data: xAxisData,
              name: config.xAxis?.title
            },
            yAxis: {
              name: config.yAxis?.title,
              min: baseValue > 0 ? baseValue : undefined
            },
            series: validSeries.map((s, index) => ({
              name: s.name || s.field,
              type: 'line',
              data: seriesValues[index].map(val => val + baseValue),
              // 添加区域样式，使线图转为面积图并应用不透明度
              areaStyle: config.options?.areaStyle ? {
                opacity: config.options?.areaOpacity || seriesOpacity * 0.7  // 面积透明度
              } : undefined,
              // 应用样式配置
              smooth: config.options?.smooth || false, // 平滑曲线
              symbolSize: config.options?.symbolSize || 4, // 标记点大小
              lineStyle: {
                width: config.options?.lineWidth || 2, // 线宽
                type: config.options?.lineType || 'solid', // 线条类型
                opacity: seriesOpacity
              },
              itemStyle: {
                opacity: seriesOpacity
              },
              label: {
                show: showDataLabels,
                position: 'top',
                formatter: '{c}',
                color: labelColor // 应用数据标签颜色
              }
            }))
          };
          
        case ChartType.SCATTER:
          return {
            title: {
              text: config.title
            },
            tooltip: {
              trigger: 'item',
              formatter: function(params: any) {
                return `${params.seriesName}<br/>${xAxisData[params.dataIndex]}: ${params.value[1]}`;
              }
            },
            xAxis: {
              type: 'value',
              name: config.xAxis?.title,
              scale: true
            },
            yAxis: {
              name: countMode ? '计数' : config.yAxis?.title,
              type: 'value',
              scale: true,
              min: baseValue > 0 ? baseValue : undefined
            },
            series: validSeries.map((s, index) => ({
              name: s.name || s.field,
              type: 'scatter',
              data: xAxisData.map((name, i) => {
                // 将x轴值尝试转换为数值，不能转换则使用索引
                const xVal = isNaN(parseFloat(name)) ? i : parseFloat(name);
                return [xVal, seriesValues[index][i] + baseValue];
              }),
              // 应用样式配置
              symbolSize: function(data: any, dataIndex: number) {
                // 支持单个大小或数组大小
                if (Array.isArray(config.options?.symbolSize)) {
                  const sizes = config.options?.symbolSize || [];
                  return sizes[dataIndex % sizes.length];
                }
                return config.options?.symbolSize || 10;
              },
              itemStyle: {
                opacity: seriesOpacity,
                // 支持渐变效果
                color: config.options?.effectGradient ? {
                  type: 'radial',
                  x: 0.5,
                  y: 0.5,
                  r: 0.5,
                  colorStops: [
                    {offset: 0, color: (Array.isArray(colors) ? colors[0] : colors) || '#5470c6'},
                    {offset: 1, color: 'rgba(255,255,255,0.2)'}
                  ]
                } : (Array.isArray(colors) ? colors[0] : colors),
                shadowBlur: config.options?.effectShadow ? 10 : (config.options?.shadowBlur || 0),
                shadowColor: config.options?.shadowColor || 'rgba(0, 0, 0, 0.3)'
              },
              label: {
                show: showDataLabels,
                position: 'right',
                formatter: '{@[1]}',
                color: labelColor // 应用数据标签颜色
              }
            }))
          };
        
        // 添加其他图表类型
        case ChartType.PIE:
          // 创建多个系列的饼图
          const standardPieSeriesConfigs = [];
          
          // 处理每个数据系列
          for (let seriesIdx = 0; seriesIdx < validSeries.length; seriesIdx++) {
            const currentSeries = validSeries[seriesIdx];
            const currentSeriesIndex = seriesIndices[seriesIdx];
            
            // 确保只处理有效的数据系列
            if (currentSeriesIndex >= 0) {
              // 为当前系列创建数据聚合对象
              const aggregatedData = new Map<string, number>();
              
              // 对于饼图，我们需要重新思考如何处理数据
              // 在标准模式下，我们使用每个系列字段的唯一值作为饼图分段
              // 收集该系列字段的所有唯一值
              const uniqueSeriesValues = new Set<string>();
              chartData.forEach(row => {
                if (currentSeriesIndex >= 0 && row[currentSeriesIndex] !== undefined) {
                  uniqueSeriesValues.add(String(row[currentSeriesIndex]));
                }
              });
              
              // 转换为数组并排序（如果需要）
              let uniqueValues = Array.from(uniqueSeriesValues);
              if (sortOrder !== SortOrder.NONE) {
                uniqueValues.sort((a, b) => {
                  const numA = Number(a);
                  const numB = Number(b);
                  
                  let compareResult = 0;
                  if (!isNaN(numA) && !isNaN(numB)) {
                    compareResult = numA - numB;
                  } else {
                    compareResult = a.localeCompare(b);
                  }
                  
                  return sortOrder === SortOrder.ASCENDING ? compareResult : -compareResult;
                });
              }
              
              // 统计每个唯一值的出现次数
              uniqueValues.forEach(value => {
                if (value !== undefined && value !== null && value !== '') {
                  const count = chartData.filter(row => 
                    String(row[currentSeriesIndex]) === value
                  ).length;
                  aggregatedData.set(value, count + baseValue);
                }
              });
              
              // 将聚合的数据转换为饼图数据格式
              const pieData = Array.from(aggregatedData.entries())
                .map(([name, value]) => ({ name, value }))
                .filter(item => item.value > 0); // 过滤掉值为0的项
              
              // 如果需要排序，按值进行排序
              if (sortOrder !== SortOrder.NONE) {
                pieData.sort((a, b) => {
                  const result = a.value - b.value;
                  return sortOrder === SortOrder.ASCENDING ? result : -result;
                });
              }
              
              // 如果有数据，添加这个系列的配置 (标准模式)
              if (pieData.length > 0) {
                standardPieSeriesConfigs.push({
                  name: currentSeries.name || currentSeries.field,
                  type: 'pie',
                  radius: [0, '65%'],  // 适当的饼图大小
                  center: ['40%', '50%'], // 将饼图居中，留出右侧空间给图例
                  data: pieData,
                  label: {
                    show: showDataLabels,
                    position: 'outside',
                    formatter: '{b}: {c} ({d}%)',
                    color: labelColor,
                    textStyle: { 
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: labelColor
                    }
                  },
                  labelLine: {
                    show: showDataLabels,
                    length: 10,
                    length2: 10
                  },
                  itemStyle: {
                    opacity: seriesOpacity
                  },
                  emphasis: {
                    itemStyle: {
                      shadowBlur: 10,
                      shadowOffsetX: 0,
                      shadowColor: 'rgba(0, 0, 0, 0.5)',
                      opacity: seriesOpacity
                    },
                    label: {
                      show: true
                    }
                  }
                });
              }
            }
          }
          
          // 如果没有有效系列，创建一个默认的空饼图配置 (标准模式)
          if (standardPieSeriesConfigs.length === 0) {
            standardPieSeriesConfigs.push({
              name: '数据',
              type: 'pie',
              radius: '65%',
              center: ['40%', '50%'], // 将饼图居中，留出右侧空间给图例
              data: [],
              label: {
                show: showDataLabels,
                color: labelColor
              }
            });
          }
          
          // 标准模式饼图配置
          return {
            ...styleConfig,
            tooltip: {
              trigger: 'item',
              formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            xAxis: { show: false },
            yAxis: { show: false },
            legend: {
              ...styleConfig.legend,
              orient: 'vertical',
              left: '65%', // 图例位于饼图右侧
              top: 'middle',
              itemGap: 15, // 增加图例项之间的间距
              textStyle: {
                ...styleConfig.legend.textStyle,
                padding: [0, 0, 0, 5]
              }
            },
            series: standardPieSeriesConfigs
          };
          
        // 其他类型的图表...
        default:
          return { title: { text: config.title } };
      }
    }
  };

  // 删除图表
  const deleteChart = (chartId: string) => {
    setActiveCharts(activeCharts.filter(chart => chart.id !== chartId));
    if (selectedChartId === chartId) {
      setSelectedChartId(null);
    }
    message.success('已删除图表');
  };

  // 处理图表锁定
  const handleLockChart = (chartId: string) => {
    const chart = activeCharts.find(c => c.id === chartId);
    if (chart && onChartLock) {
      onChartLock(chartId, chart.config);
      message.success('图表已锁定，切换工作表后仍可查看');
    }
  };

  // 处理模板创建
  const handleCreateTemplate = () => {
    templateForm.validateFields().then(values => {
      if (onCreateTemplate) {
        // 创建模板
        const templateId = onCreateTemplate(values.name, values.description);
        
        // 添加图表文本内容
        if (templateId && templates) {
          const template = templates.find(t => t.id === templateId);
          if (template) {
            // 从锁定图表中复制预后分析文本
            template.charts = template.charts.map((chart, index) => {
              const lockedChart = lockedCharts[index];
              if (lockedChart && chartTexts[lockedChart.id]) {
                return {
                  ...chart,
                  preAnalysis: chartTexts[lockedChart.id].preAnalysis || '',
                  postAnalysis: chartTexts[lockedChart.id].postAnalysis || ''
                };
              }
              return chart;
            });
          }
        }
        
        setShowTemplateModal(false);
        templateForm.resetFields();
      }
    });
  };

  // 准备应用模板
  const prepareApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setTemplateModalMode('apply');
    setApplyStrategy('exact');
    setHeaderMappings({});
    
    // 初始化表头映射
    const template = templates.find(t => t.id === templateId);
    if (template && template.charts.length > 0) {
      const originalHeaders = template.charts[0].originalHeaders;
      const newHeaderMappings: Record<string, string> = {};
      
      originalHeaders.forEach(header => {
        // 默认使用相同的表头
        if (data.headers.includes(header)) {
          newHeaderMappings[header] = header;
        } else {
          newHeaderMappings[header] = '';
        }
      });
      
      setHeaderMappings(newHeaderMappings);
    }
    
    setShowTemplateModal(true);
  };

  // 处理应用模板
  const handleApplyTemplate = () => {
    if (selectedTemplateId && onApplyTemplate) {
      onApplyTemplate(
        selectedTemplateId,
        applyStrategy,
        applyStrategy === 'manual' ? headerMappings : undefined
      );
      
      // 关闭模态框并重置状态
      setShowTemplateModal(false);
      setSelectedTemplateId(null);
    }
  };

  // 处理删除模板
  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    Modal.confirm({
      title: '确认删除模板',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除模板"${templateName}"吗？此操作无法撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        if (onDeleteTemplate) {
          onDeleteTemplate(templateId);
          message.success(`模板"${templateName}"已删除`);
        }
      }
    });
  };

  // 渲染模板列表
  const renderTemplatesList = () => {
    return (
      <>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0 0 16px 0', 
          borderBottom: '1px solid #f0f0f0',
          marginBottom: 16
        }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            已保存的模板 ({templates.length})
          </Typography.Title>
          <Space>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={() => {
                setTemplateModalMode('create');
                setShowTemplateModal(true);
              }}
              disabled={lockedCharts.length === 0}
            >
              创建新模板
            </Button>
          </Space>
        </div>
        <List
          itemLayout="horizontal"
          dataSource={templates}
          renderItem={template => (
            <List.Item
              actions={[
                <Tooltip title="应用此模板">
                  <Button 
                    icon={<StarOutlined />} 
                    type="primary" 
                    onClick={() => prepareApplyTemplate(template.id)}
                  >
                    应用
                  </Button>
                </Tooltip>,
                <Tooltip title="删除此模板">
                  <Button 
                    icon={<DeleteOutlined />} 
                    danger 
                    onClick={() => handleDeleteTemplate(template.id, template.name)}
                  >
                    删除
                  </Button>
                </Tooltip>
              ]}
            >
              <List.Item.Meta
                title={template.name}
                description={
                  <div>
                    <div>{template.description}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      包含 {template.charts.length} 个图表 • 创建于 {new Date(template.createdAt).toLocaleString()}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </>
    );
  };

  // 渲染模板模态框
  const renderTemplateModal = () => {
    return (
      <Modal
        title={templateModalMode === 'create' ? '创建图表模板' : '应用图表模板'}
        open={showTemplateModal}
        onCancel={() => setShowTemplateModal(false)}
        footer={templateModalMode === 'create' ? [
          <Button key="cancel" onClick={() => setShowTemplateModal(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleCreateTemplate}>
            创建模板
          </Button>
        ] : [
          <Button key="cancel" onClick={() => setShowTemplateModal(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleApplyTemplate}>
            应用模板
          </Button>
        ]}
        width={700}
      >
        {templateModalMode === 'create' ? (
          <Form form={templateForm} layout="vertical">
            <Form.Item
              name="name"
              label="模板名称"
              rules={[{ required: true, message: '请输入模板名称' }]}
            >
              <Input placeholder="输入一个有意义的模板名称" />
            </Form.Item>
            <Form.Item
              name="description"
              label="模板描述"
            >
              <Input.TextArea placeholder="描述此模板的用途和特点" rows={4} />
            </Form.Item>
            <div>
              <Typography.Title level={5}>将包含的图表</Typography.Title>
              <List
                size="small"
                dataSource={lockedCharts}
                renderItem={chart => (
                  <List.Item>
                    <List.Item.Meta
                      title={chart.config.title}
                      description={`来源: ${chart.sourceData.sheetName}`}
                    />
                  </List.Item>
                )}
              />
            </div>
          </Form>
        ) : (
          <div>
            {selectedTemplateId && (
              <>
                <Typography.Title level={5}>
                  匹配策略
                  <Tooltip title="选择如何将模板中的字段与当前表格匹配">
                    <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                  </Tooltip>
                </Typography.Title>
                <Radio.Group
                  value={applyStrategy}
                  onChange={e => setApplyStrategy(e.target.value)}
                  style={{ marginBottom: 16 }}
                >
                  <Radio.Button value="exact">精确匹配</Radio.Button>
                  <Radio.Button value="fuzzy">智能匹配</Radio.Button>
                  <Radio.Button value="manual">手动映射</Radio.Button>
                </Radio.Group>
                
                {applyStrategy === 'manual' && (
                  <div style={{ marginBottom: 16 }}>
                    <Typography.Title level={5}>字段映射</Typography.Title>
                    <Typography.Paragraph type="secondary">
                      为模板中的每个字段选择对应的当前表格字段
                    </Typography.Paragraph>
                    
                    {Object.keys(headerMappings).map(originalHeader => (
                      <Form.Item
                        key={originalHeader}
                        label={`原字段: ${originalHeader}`}
                      >
                        <Select
                          style={{ width: '100%' }}
                          value={headerMappings[originalHeader] || undefined}
                          onChange={value => {
                            setHeaderMappings({
                              ...headerMappings,
                              [originalHeader]: value
                            });
                          }}
                          placeholder="选择匹配的新字段"
                        >
                          <Select.Option value="">不映射</Select.Option>
                          {data.headers.map(header => (
                            <Select.Option key={header} value={header}>
                              {header}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    ))}
                  </div>
                )}
                
                <Typography.Title level={5}>将创建的图表</Typography.Title>
                <List
                  size="small"
                  dataSource={templates.find(t => t.id === selectedTemplateId)?.charts || []}
                  renderItem={chart => (
                    <List.Item>
                      <List.Item.Meta
                        title={chart.config.title}
                        description={`包含${chart.preAnalysis ? '前分析, ' : ''}${chart.postAnalysis ? '后分析' : ''}`}
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </div>
        )}
      </Modal>
    );
  };

  // 渲染图表工作区中的ReactECharts组件
  const renderChartOption = (chart: ActiveChart) => {
    return generateChartOptions(
      chart.config,
      chart.sourceData.headers,
      chart.sourceData.data
    );
  };

  // 导出为长图
  const exportToLongImage = async () => {
    try {
      // 显示加载提示，使用固定元素避免影响布局
      const loadingOverlay = document.createElement('div');
      Object.assign(loadingOverlay.style, {
        position: 'fixed',
        zIndex: '9999',
        left: '0',
        top: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontSize: '20px',
      });
      loadingOverlay.textContent = '正在准备导出长图...';
      document.body.appendChild(loadingOverlay);
      
      // 记录原始样式
      const originalBodyWidth = document.body.style.width;
      const originalBodyOverflow = document.body.style.overflow;
      
      try {
        // 防止滚动，但不改变宽度，避免影响图表尺寸
        document.body.style.overflow = 'hidden';
        
        // 设置输出图像的宽度和文本宽度
        const outputWidth = 1600; // 输出图像宽度
        const textWidth = 1500; // 文本宽度限制
        const padding = 40; // 内边距
        
        // 获取所有锁定图表
        const chartCards = lockedChartsContainerRef.current?.querySelectorAll('.locked-chart-card') || [];
        
        if (chartCards.length === 0 || lockedCharts.length === 0) {
          throw new Error('未找到锁定的图表');
        }
        
        loadingOverlay.textContent = '正在处理图表...';
        
        // 捕获所有图表
        const chartCaptures = [];
        for (let i = 0; i < chartCards.length; i++) {
          const card = chartCards[i] as HTMLElement;
          const chartArea = card.querySelector('.echarts-for-react') as HTMLElement;
          
          if (!chartArea || !lockedCharts[i]) continue;
          
          loadingOverlay.textContent = `正在处理图表 ${i + 1}/${chartCards.length}...`;
          
          // 直接捕获图表
          const canvas = await html2canvas(chartArea, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true
          });
          
          chartCaptures.push({
            index: i,
            canvas: canvas,
            title: lockedCharts[i].config.title,
            id: lockedCharts[i].id
          });
        }
        
        if (chartCaptures.length === 0) {
          throw new Error('未能成功捕获任何图表');
        }
        
        loadingOverlay.textContent = '正在处理文本...';
        
        // 计算总高度
        const titleHeight = 40;
        const headerHeight = 100;
        const spacing = 30;
        let totalHeight = headerHeight;
        
        // 使用html2canvas渲染富文本
        const renderHtmlToCanvas = async (html: string, width: number): Promise<{canvas: HTMLCanvasElement, height: number}> => {
          // 创建临时容器
          const container = document.createElement('div');
          Object.assign(container.style, {
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            width: `${width}px`,
            padding: '20px',
            backgroundColor: '#ffffff',
            overflow: 'hidden',
            boxSizing: 'border-box',
            zIndex: '-1'
          });
          
          // 添加内容，包含专门的样式来处理长数字
          container.innerHTML = `
            <div style="width:${width-40}px; max-width:${width-40}px; overflow-wrap:break-word; word-break:break-all;">
              <style>
                .html-content * {
                  max-width: 100% !important;
                  word-break: break-all !important; 
                  word-wrap: break-word !important;
                  white-space: normal !important;
                  overflow-wrap: break-word !important;
                }
                
                /* 特别针对数字序列 */
                .html-content span, 
                .html-content p {
                  max-width: ${width-40}px !important;
                  display: block !important;
                }
                
                /* 确保特殊格式保留 */
                .html-content b, .html-content strong { font-weight: bold !important; }
                .html-content i, .html-content em { font-style: italic !important; }
                .html-content ul, .html-content ol { padding-left: 20px !important; }
                .html-content li { margin-bottom: 5px !important; }
                
                /* 居中文本 */
                .html-content .ql-align-center { text-align: center !important; }
                .html-content .ql-align-right { text-align: right !important; }
              </style>
              <div class="html-content">${html}</div>
            </div>
          `;
          
          // 添加到DOM
          document.body.appendChild(container);
          
          // 获取内容高度
          await new Promise(resolve => setTimeout(resolve, 50)); // 等待DOM渲染
          const contentHeight = Math.max(container.scrollHeight, 50);
          
          try {
            // 使用html2canvas捕获
            const canvas = await html2canvas(container, {
              backgroundColor: '#ffffff',
              scale: 2, // 高清
              width: width,
              height: contentHeight,
              logging: false,
              useCORS: true,
              allowTaint: true
            });
            
            // 清理
            document.body.removeChild(container);
            
            return {
              canvas: canvas,
              height: contentHeight
            };
          } catch (error) {
            console.error('HTML渲染失败:', error);
            document.body.removeChild(container);
            
            // 创建应急画布
            const fallbackCanvas = document.createElement('canvas');
            fallbackCanvas.width = width;
            fallbackCanvas.height = 50;
            const ctx = fallbackCanvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, width, 50);
              ctx.fillStyle = '#333333';
              ctx.font = '16px Arial';
              ctx.fillText('内容渲染失败', 20, 30);
            }
            
            return {
              canvas: fallbackCanvas,
              height: 50
            };
          }
        };
        
        // 处理文本内容并计算高度
        const textRenderings = [];
        
        for (const capture of chartCaptures) {
          const chartId = capture.id;
          const chartText = chartTexts[chartId] || { preAnalysis: '', postAnalysis: '' };
          
          let itemHeight = titleHeight + capture.canvas.height / 2 + spacing;
          
          // 处理前置分析
          let preAnalysisRendering = null;
          if (chartText.preAnalysis && chartText.preAnalysis.trim()) {
            preAnalysisRendering = await renderHtmlToCanvas(chartText.preAnalysis, textWidth);
            itemHeight += preAnalysisRendering.height + 10;
          }
          
          // 处理后置分析
          let postAnalysisRendering = null;
          if (chartText.postAnalysis && chartText.postAnalysis.trim()) {
            postAnalysisRendering = await renderHtmlToCanvas(chartText.postAnalysis, textWidth);
            itemHeight += postAnalysisRendering.height + 10;
          }
          
          textRenderings.push({
            captureIndex: capture.index,
            preAnalysis: preAnalysisRendering,
            postAnalysis: postAnalysisRendering
          });
          
          totalHeight += itemHeight;
        }
        
        loadingOverlay.textContent = '正在合成长图...';
        
        // 创建最终Canvas
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = outputWidth;
        finalCanvas.height = totalHeight;
        const ctx = finalCanvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('无法创建画布上下文');
        }
        
        // 填充白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outputWidth, totalHeight);
        
        // 绘制页眉
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 32px Arial, "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('锁定图表集合', outputWidth / 2, 50);
        
        ctx.font = '16px Arial, "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText(`导出时间: ${new Date().toLocaleString()}`, outputWidth / 2, 80);
        
        // 绘制内容
        let yPos = headerHeight;
        
        for (let i = 0; i < chartCaptures.length; i++) {
          const capture = chartCaptures[i];
          const rendering = textRenderings.find(r => r.captureIndex === capture.index);
          
          if (!rendering) continue;
          
          // 绘制标题
          ctx.fillStyle = '#444444';
          ctx.font = 'bold 22px Arial, "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${i + 1}. ${capture.title}`, padding, yPos + 25);
          yPos += titleHeight;
          
          // 绘制前置分析
          if (rendering.preAnalysis) {
            const centerX = (outputWidth - textWidth) / 2;
            ctx.drawImage(rendering.preAnalysis.canvas, centerX, yPos, textWidth, rendering.preAnalysis.height);
            yPos += rendering.preAnalysis.height + 10;
          }
          
          // 绘制图表
          const chartWidth = capture.canvas.width / 2;
          const chartHeight = capture.canvas.height / 2;
          const chartX = (outputWidth - chartWidth) / 2;
          
          ctx.drawImage(
            capture.canvas,
            0, 0, capture.canvas.width, capture.canvas.height,
            chartX, yPos, chartWidth, chartHeight
          );
          
          yPos += chartHeight + 10;
          
          // 绘制后置分析
          if (rendering.postAnalysis) {
            const centerX = (outputWidth - textWidth) / 2;
            ctx.drawImage(rendering.postAnalysis.canvas, centerX, yPos, textWidth, rendering.postAnalysis.height);
            yPos += rendering.postAnalysis.height + 10;
          }
          
          // 添加分隔线
          if (i < chartCaptures.length - 1) {
            yPos += 10;
            
            ctx.strokeStyle = '#eeeeee';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(outputWidth * 0.2, yPos);
            ctx.lineTo(outputWidth * 0.8, yPos);
            ctx.stroke();
            
            ctx.fillStyle = '#dddddd';
            ctx.beginPath();
            ctx.arc(outputWidth * 0.2 - 5, yPos, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(outputWidth * 0.8 + 5, yPos, 3, 0, Math.PI * 2);
            ctx.fill();
            
            yPos += spacing;
          }
        }
        
        // 导出图像
        const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.95);
        const fetchResponse = await fetch(dataUrl);
        const blob = await fetchResponse.blob();
        saveAs(blob, `图表分析报告_${new Date().toISOString().slice(0, 10)}.jpg`);
        
        message.success('长图导出完成！');
      } finally {
        // 恢复原始样式
        document.body.style.width = originalBodyWidth;
        document.body.style.overflow = originalBodyOverflow;
        
        // 移除加载提示
        if (document.body.contains(loadingOverlay)) {
          document.body.removeChild(loadingOverlay);
        }
      }
    } catch (error) {
      console.error('导出长图时出错:', error);
      message.error('导出长图时出错');
    }
  };

  return (
    <Card title="图表生成器" style={{ marginTop: 24 }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Space>
            <Button 
              type={showLockedCharts ? 'primary' : 'default'}
              onClick={() => setShowLockedCharts(!showLockedCharts)}
            >
              {showLockedCharts ? '返回当前工作表图表' : `查看已锁定图表 (${lockedCharts.length})`}
            </Button>
            
            {onCreateTemplate && lockedCharts.length > 0 && (
              <Button
                icon={<SaveOutlined />}
                onClick={() => {
                  setTemplateModalMode('create');
                  setShowTemplateModal(true);
                }}
              >
                创建模板
              </Button>
            )}
            
            {templates.length > 0 && (
              <Dropdown
                menu={{
                  items: templates.map(template => ({
                    key: template.id,
                    label: template.name,
                    onClick: () => prepareApplyTemplate(template.id)
                  }))
                }}
              >
                <Button>
                  应用模板 <DownOutlined />
                </Button>
              </Dropdown>
            )}
          </Space>
        </Col>
      </Row>

      {showLockedCharts ? (
        // 显示已锁定的图表
        <div className="locked-charts-container" ref={lockedChartsContainerRef}>
          <Tabs defaultActiveKey="charts" items={[
            {
              key: 'charts',
              label: '已锁定图表',
              children: (
                <>
                  <Paragraph>
                    这些图表已锁定，不会随工作表切换而改变。
                  </Paragraph>

                  {lockedCharts.length === 0 ? (
                    <Empty description="暂无锁定的图表" />
                  ) : (
                    <>
                      <div style={{ marginBottom: 16, textAlign: 'right' }}>
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: 'excel',
                                label: 'Excel数据导出',
                                icon: <FileExcelOutlined />,
                                onClick: () => exportLockedCharts('excel')
                              },
                              {
                                key: 'images',
                                label: 'PNG图片打包导出',
                                icon: <FileZipOutlined />,
                                onClick: () => exportLockedCharts('images')
                              },
                              {
                                key: 'pdf',
                                label: 'PDF文档导出',
                                icon: <FilePdfOutlined />,
                                onClick: () => exportLockedCharts('pdf')
                              },
                              {
                                key: 'long-image',
                                label: '长图导出',
                                icon: <FileImageOutlined />,
                                onClick: () => exportLockedCharts('long-image')
                              }
                            ]
                          }}
                        >
                          <Button 
                            type="primary"
                            icon={<DownloadOutlined />}
                          >
                            导出锁定图表 <DownOutlined />
                          </Button>
                        </Dropdown>
                      </div>
                      
                      {/* 锁定图表内容 */}
                      <Row gutter={[16, 16]} style={{ display: 'flex', flexDirection: 'column' }}>
                        {lockedCharts.map(chart => (
                          <Col span={24} key={chart.id}>
                            <Card 
                              title={
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{chart.config.title}</span>
                                  <small>
                                    来源: {chart.sourceData.sheetName} 
                                    {chart.sourceFileName ? ` (${chart.sourceFileName})` : ''}
                                  </small>
                                </div>
                              }
                              extra={
                                onDeleteLockedChart && (
                                  <Button 
                                    danger
                                    size="small" 
                                    onClick={() => {
                                      if (onDeleteLockedChart) {
                                        onDeleteLockedChart(chart.id);
                                        message.success('已删除锁定图表');
                                      }
                                    }}
                                  >
                                    删除
                                  </Button>
                                )
                              }
                              className="locked-chart-card"
                              style={{ 
                                marginBottom: 16,
                                height: 'auto',
                                overflow: 'hidden' 
                              }}
                            >
                              {/* 图表前分析区域 */}
                              <div style={{ marginBottom: 16 }}>
                                <Typography.Title level={5}>图表前分析</Typography.Title>
                                <Typography.Paragraph>
                                  <ReactQuill 
                                    theme="snow"
                                    value={chartTexts[chart.id]?.preAnalysis || ''}
                                    onChange={(value) => updateChartText(chart.id, 'preAnalysis', value)}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="在此输入对图表的前置分析和解释..."
                                    style={{ minHeight: '120px' }}
                                  />
                                </Typography.Paragraph>
                              </div>

                              {/* 图表区域 */}
                              <ReactECharts 
                                key={`chart-${chart.id}-${JSON.stringify(chart.config.series)}`}
                                option={generateChartOptions(
                                  chart.config,
                                  chart.sourceData.headers,
                                  chart.sourceData.data
                                )} 
                                style={{ height: 400 }}
                                notMerge={true}
                                opts={{ renderer: 'canvas' }}
                              />

                              {/* 图表后分析区域 */}
                              <div style={{ marginTop: 16 }}>
                                <Typography.Title level={5}>图表后分析</Typography.Title>
                                <Typography.Paragraph>
                                  <ReactQuill 
                                    theme="snow"
                                    value={chartTexts[chart.id]?.postAnalysis || ''}
                                    onChange={(value) => updateChartText(chart.id, 'postAnalysis', value)}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="在此输入对图表结果的分析和结论..."
                                    style={{ minHeight: '120px' }}
                                  />
                                </Typography.Paragraph>
                              </div>

                              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                                锁定时间: {new Date(chart.lockedAt).toLocaleString()}
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </>
                  )}
                </>
              )
            },
            {
              key: 'templates',
              label: '图表模板管理',
              children: (
                <>
                  <Paragraph>
                    您可以将锁定的图表另存为模板，以便在导入新数据时快速应用。
                  </Paragraph>
                  
                  {templates.length === 0 ? (
                    <Empty description="暂无保存的模板">
                      {lockedCharts.length > 0 && (
                        <Button 
                          type="primary" 
                          onClick={() => {
                            setTemplateModalMode('create');
                            setShowTemplateModal(true);
                          }}
                        >
                          创建模板
                        </Button>
                      )}
                    </Empty>
                  ) : (
                    <>
                      {renderTemplatesList()}
                    </>
                  )}
                </>
              )
            }
          ]} />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Title level={4}>拖拽图表类型到工作区</Title>
              <Paragraph>
                选择一个图表类型拖到下方工作区，或直接点击添加。配置完成后可以导出图表。
              </Paragraph>
            </Col>
            
            <Col span={24}>
              <Droppable droppableId="chart-types" direction="horizontal">
                {(provided) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: 16 }}
                  >
                    {chartTypes.map((chart, index) => (
                      <Draggable key={chart.id} draggableId={chart.id} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="chart-type-card"
                            style={{ 
                              width: 120, 
                              textAlign: 'center',
                              margin: '8px',
                              ...provided.draggableProps.style 
                            }}
                            hoverable
                            onClick={() => addChart(chart.type)}
                          >
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{chart.icon}</div>
                            <div>{chart.name}</div>
                            <small style={{ color: '#666', display: 'block', marginTop: 4 }}>
                              {chart.description}
                            </small>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </Col>
            
            <Divider orientation="left">工作区</Divider>
            
            <Col span={24}>
              <Tabs 
                type="card" 
                activeKey={selectedChartId || ''}
                onChange={key => setSelectedChartId(key)}
              >
                {activeCharts.map(chart => (
                  <TabPane 
                    tab={chart.config.title || '未命名图表'} 
                    key={chart.id}
                  >
                    <Row gutter={[16, 16]} style={{ display: 'flex', flexDirection: 'column' }}>
                      <Col span={24}>
                        <Card 
                          className="chart-wrapper"
                          style={{ 
                            height: 'auto', 
                            overflow: 'hidden',
                            marginBottom: 16
                          }}
                          extra={
                            onChartLock && (
                              <Button 
                                type="primary"
                                size="small"
                                onClick={() => handleLockChart(chart.id)}
                                icon={<LockOutlined />}
                              >
                                锁定图表
                              </Button>
                            )
                          }
                        >
                          <ReactECharts 
                            key={`chart-${chart.id}-${JSON.stringify(chart.config.series)}`}
                            option={renderChartOption(chart)} 
                            style={{ height: 400 }}
                            notMerge={true}
                            opts={{ renderer: 'canvas' }}
                          />
                        </Card>
                      </Col>
                      <Col span={24}>
                        <ChartConfigPanel 
                          config={chart.config}
                          headers={data.headers}
                          onConfigChange={(newConfig) => updateChartConfig(chart.id, newConfig)}
                          onDelete={() => deleteChart(chart.id)}
                        />
                      </Col>
                    </Row>
                  </TabPane>
                ))}
              </Tabs>
              
              {activeCharts.length === 0 && (
                <div style={{ 
                  padding: 100, 
                  textAlign: 'center', 
                  background: '#f9f9f9',
                  border: '1px dashed #ddd',
                  borderRadius: 4
                }}>
                  <Paragraph>
                    从上方拖拽图表类型到此处开始创建图表
                  </Paragraph>
                </div>
              )}
            </Col>
          </Row>
        </DragDropContext>
      )}
      
      {/* 模板模态框 */}
      {renderTemplateModal()}
    </Card>
  );
};

export default ChartGenerator; 