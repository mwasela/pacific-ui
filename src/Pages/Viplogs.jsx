import React, { useEffect, useState, useContext } from 'react';
import { Card, Table, Button, Space, DatePicker, Select, message, Row, Col, Input } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import axios from '../helpers/axios';
import dayjs from 'dayjs';
import logo from '../assets/logo.png';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TitleContext } from '../context/TitleContext';

const actionMap = {
  0: 'Entry',
  1: 'Exit',
};

const actionColorMap = {
  0: '#52c41a', // green
  1: '#ff4d4f', // red
};

const loadLogoImage = () =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = logo;
  });

export default function Viplogs() {
  const { setPageTitle } = useContext(TitleContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [limit, setLimit] = useState(10);
  const [numberPlate, setNumberPlate] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    setPageTitle("Tenant Logs");
    return () => setPageTitle("");
  }, [setPageTitle]);

  const fetchVipLogs = async (start = null, end = null, field = 'createdAt', direction = 'desc', pageSize = 10, plate = '') => {
    setLoading(true);
    try {
      const params = {
        limit: pageSize,
        sort: `${field}:${direction}`,
      };

      if (start) {
        params.start_time = start.toISOString();
      }

      if (end) {
        params.end_time = end.toISOString();
      }

      if (plate) {
        params.number_plate = plate;
      }

      const res = await axios.get('/viplogs', { params });
      const logs = Array.isArray(res.data) ? res.data : res.data?.data || [];
      
      setData(logs);
      setPagination({
        current: 1,
        pageSize,
        total: logs.length,
      });
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to fetch VIP logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVipLogs(startTime, endTime, sortField, sortDirection, limit, numberPlate);
  }, []);

  const handleFilterApply = () => {
    fetchVipLogs(startTime, endTime, sortField, sortDirection, limit, numberPlate);
  };

  const handleClearFilters = () => {
    setStartTime(null);
    setEndTime(null);
    setSortField('createdAt');
    setSortDirection('desc');
    setLimit(10);
    setNumberPlate('');
    fetchVipLogs(null, null, 'createdAt', 'desc', 10, '');
  };

  const downloadPDF = async () => {
    if (data.length === 0) {
      message.warning('No data to download');
      return;
    }

    try {
      message.loading({ content: 'Generating PDF...', key: 'pdf' });
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // Load and add logo
      const logoImage = await loadLogoImage();
      const logoWidth = 25;
      const logoHeight = (logoImage.naturalHeight / logoImage.naturalWidth) * logoWidth;
      const logoX = pageWidth - logoWidth - 10;
      const logoY = 10;

      // Add title
      doc.setFontSize(12);
      doc.text('PACIFIC MALL', 10, 12);
      doc.text('Tenant Parking Activity Report', 10, 18);

      // Add logo
      doc.addImage(logoImage, 'PNG', logoX, logoY, logoWidth, logoHeight);

      // Add filter information
      let yPosition = 28;
      doc.setFontSize(9);
      if (numberPlate) {
        doc.text(`Tenant Vehicle: ${numberPlate}`, 10, yPosition);
        yPosition += 5;
      }
      if (startTime) {
        doc.text(`Start Date: ${startTime.format('YYYY-MM-DD HH:mm:ss')}`, 10, yPosition);
        yPosition += 5;
      }
      if (endTime) {
        doc.text(`End Date: ${endTime.format('YYYY-MM-DD HH:mm:ss')}`, 10, yPosition);
        yPosition += 5;
      }

      // Prepare table data
      const tableData = data.map((row) => [
        row.vip_id,
        row.number_plate,
        row.VIP ? `${row.VIP.fname || ''} ${row.VIP.lname || ''}`.trim() : '-',
        actionMap[row.action] || row.action,
        row.VIP?.vip_expiry ? new Date(row.VIP.vip_expiry).toLocaleDateString() : '-',
        new Date(row.createdAt).toLocaleString(),
      ]);

      // Add table
      autoTable(doc, {
        head: [['Tenant ID', 'Vehicle Plate', 'VIP Name', 'Action', 'VIP Expiry', 'Timestamp']],
        body: tableData,
        startY: yPosition + 5,
        margin: { left: 10, right: 10, top: 10, bottom: 10 },
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] },
      });

      // Save PDF
      doc.save(`VIP_Activity_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      message.success({ content: 'PDF downloaded successfully', key: 'pdf' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error({ content: 'Failed to generate PDF', key: 'pdf' });
    }
  };

  const columns = [
    {
      title: 'Tenant ID',
      dataIndex: 'vip_id',
      width: 80,
      sorter: false,
    },
    {
      title: 'Vehicle Plate',
      dataIndex: 'number_plate',
      width: 120,
    },
    {
      title: 'VIP Name',
      dataIndex: ['VIP', 'fname'],
      width: 130,
      render: (text, record) => {
        const vip = record.VIP || {};
        const fname = vip.fname || '';
        const lname = vip.lname || '';
        return `${fname} ${lname}`.trim() || '-';
      },
    },
    {
      title: 'Phone',
      dataIndex: ['VIP', 'phone_number'],
      width: 130,
      render: (phone) => phone || '-',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 100,
      render: (action) => (
        <span
          style={{
            backgroundColor: actionColorMap[action] || '#1677ff',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          {actionMap[action] || action}
        </span>
      ),
    },
    {
        //expiry date under VIP.vip_expiry
        title: 'VIP Expiry',
        dataIndex: ['VIP', 'vip_expiry'],
        width: 130,
        render: (value) => {
            if (!value) return '-';
            const date = new Date(value);
            return date.toLocaleDateString();
        }
    },
    {
      title: 'Timestamp',
      dataIndex: 'createdAt',
      width: 180,
      render: (value) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleString();
      },
    },
  ];

  return (
    <div style={{ padding: '3px' }}>
      <Card
        // title="Tenants Activity Logs Filters"
        style={{ marginBottom: '6px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Vehicle Plate
            </label>
            <Input
              value={numberPlate}
              onChange={(e) => setNumberPlate(e.target.value)}
              placeholder="Search by plate"
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Start Date
            </label>
            <DatePicker
              value={startTime}
              onChange={(date) => setStartTime(date)}
              style={{ width: '100%' }}
              placeholder="Select start date"
              showTime
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              End Date
            </label>
            <DatePicker
              value={endTime}
              onChange={(date) => setEndTime(date)}
              style={{ width: '100%' }}
              placeholder="Select end date"
              showTime
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Sort By
            </label>
            <Select
              value={sortField}
              onChange={setSortField}
              style={{ width: '100%' }}
              options={[
                { label: 'Date Created', value: 'createdAt' },
                { label: 'VIP ID', value: 'vip_id' },
                { label: 'Vehicle Plate', value: 'number_plate' },
                { label: 'Action', value: 'action' },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Records per page
            </label>
            <Select
              value={limit}
              onChange={setLimit}
              style={{ width: '100%' }}
              options={[
                { label: '10', value: 10 },
                { label: '25', value: 25 },
                { label: '50', value: 50 },
                { label: '100', value: 100 },
              ]}
            />
          </Col>
          <Col xs={24} style={{ display: 'flex', gap: '8px' }}>
            <Button type="primary" onClick={handleFilterApply} style={{ flex: 1 }}>
              Apply Filters
            </Button>
            <Button onClick={handleClearFilters} style={{ flex: 1 }}>
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      <Card title="Tenants Activity Logs" extra={
        <Button 
          type="primary" 
          icon={<DownloadOutlined />} 
          onClick={downloadPDF}
        >
          Download PDF
        </Button>
      }>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          size="small"
          scroll={{ x: 'max-content' }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  );
}
