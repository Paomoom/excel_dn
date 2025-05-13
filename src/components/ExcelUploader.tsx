import React, { useState } from 'react';
import { Upload, Button, Alert, Card, Spin, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { ExcelData, SheetData } from '../types';
import type { RcFile } from 'antd/es/upload';

const { Dragger } = Upload;

interface ExcelUploaderProps {
  onDataLoaded: (sheetDataMap: Record<string, SheetData>) => void;
}

const ExcelUploader: React.FC<ExcelUploaderProps> = ({ 
  onDataLoaded
}) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileUpload = async (file: RcFile) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // 获取所有工作表
      const sheetNames = workbook.SheetNames;
      const sheets: Record<string, SheetData> = {};
      
      // 处理每个工作表的数据
      sheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 0) {
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          sheets[`${file.name}/${sheetName}`] = {
            sheetName,
            headers,
            data: rows
          };
        }
      });
      
      // 返回数据
      if (Object.keys(sheets).length > 0) {
        onDataLoaded(sheets);
      } else {
        setError('未能从Excel文件中获取有效数据');
        message.error('未能从Excel文件中获取有效数据');
      }
    } catch (error) {
      console.error('处理Excel文件时出错:', error);
      setError('处理Excel文件时出错');
      message.error('处理Excel文件时出错');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="上传Excel文件" className="upload-card">
      {error && (
        <Alert 
          message="错误" 
          description={error} 
          type="error" 
          showIcon 
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Dragger
        name="file"
        multiple={false}
        accept=".xlsx,.xls"
        beforeUpload={handleFileUpload}
        showUploadList={false}
        disabled={loading}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          {loading ? '处理中...' : '点击或拖拽Excel文件到此区域'}
        </p>
        <p className="ant-upload-hint">
          支持.xlsx或.xls格式的Excel文件，可处理多个工作表
        </p>
        {loading && <Spin style={{ marginTop: 16 }} />}
      </Dragger>
    </Card>
  );
};

export default ExcelUploader; 