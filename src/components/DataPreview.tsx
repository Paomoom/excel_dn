import React from 'react';
import { Table, Card, Typography, Spin, Empty } from 'antd';
import { SheetData } from '../types';

const { Title } = Typography;

interface DataPreviewProps {
  headers: string[];
  data: any[][];
  loading?: boolean;
}

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

// 检查字段名称是否包含日期相关关键词
const isDateField = (fieldName: string): boolean => {
  const dateKeywords = ['date', 'time', 'day', 'month', 'year', '日期', '时间', '天', '月', '年'];
  const lowercaseName = fieldName.toLowerCase();
  return dateKeywords.some(keyword => lowercaseName.includes(keyword));
};

const DataPreview: React.FC<DataPreviewProps> = ({ headers, data, loading = false }) => {
  if (loading) {
    return (
      <Card title="数据预览" className="data-preview-card">
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin tip="正在处理数据..." />
        </div>
      </Card>
    );
  }

  if (!headers || !data || data.length === 0) {
    return (
      <Card title="数据预览" className="data-preview-card">
        <Empty description="暂无可预览的数据" />
      </Card>
    );
  }

  const columns = headers.map((header, index) => {
    const isDateColumn = isDateField(header);
    
    return {
      title: header,
      dataIndex: `col${index}`,
      key: `col${index}`,
      sorter: (a: any, b: any) => {
        const valA = a[`col${index}`];
        const valB = b[`col${index}`];
        
        if (typeof valA === 'number' && typeof valB === 'number') {
          return valA - valB;
        }
        
        return (valA?.toString() || '').localeCompare(valB?.toString() || '');
      },
      render: (value: any) => isDateColumn ? formatExcelDate(value) : value,
      ellipsis: true
    };
  });

  const tableData = data.map((row, rowIndex) => {
    const obj: Record<string, any> = { key: rowIndex.toString() };
    row.forEach((cell, cellIndex) => {
      obj[`col${cellIndex}`] = cell;
    });
    return obj;
  });

  return (
    <div className="data-table-container">
      <Table 
        columns={columns} 
        dataSource={tableData} 
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条数据`
        }}
        scroll={{ x: 'max-content' }}
        size="small"
      />
    </div>
  );
};

export default DataPreview; 