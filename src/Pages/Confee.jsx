import React, { useEffect, useState } from 'react'
import { Card, Row, Col, DatePicker, Button, message, Table, Tag, Input, Statistic, Modal, Space } from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import axios from "../helpers/axios";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Confee() {
  const [confeeData, setConfeeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [numberPlate, setNumberPlate] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [stats, setStats] = useState({
    totalFees: 0,
    totalAmount: 0,
    averageFee: 0,
    paidCount: 0,
    pendingCount: 0
  });
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const statusMap = {
    0: "Pending",
    1: "Paid",
    2: "Cancelled"
  };

  const statusColorMap = {
    0: "orange",
    1: "green",
    2: "red"
  };

  const fetchConfeeData = async (page = 1, limit = 10, startDt = startDate, endDt = endDate, plate = numberPlate) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit
      };

      if (startDt) {
        params.start_date = startDt.format("YYYY-MM-DD");
      }

      if (endDt) {
        params.end_date = endDt.format("YYYY-MM-DD");
      }

      if (plate) {
        params.number_plate = plate;
      }

      const res = await axios.get("/confee", { params });
      
      if (Array.isArray(res.data)) {
        setConfeeData(res.data);
        
        // Calculate statistics
        const totalAmount = res.data.reduce((sum, item) => sum + (item.con_fee || 0), 0);
        const paidCount = res.data.filter(item => item.status === 1).length;
        const pendingCount = res.data.filter(item => item.status === 0).length;
        
        setStats({
          totalFees: res.data.length,
          totalAmount,
          averageFee: res.data.length > 0 ? Math.round(totalAmount / res.data.length) : 0,
          paidCount,
          pendingCount
        });

        // Update pagination - assuming backend doesn't return total, so we estimate
        setPagination({
          current: page,
          pageSize: limit,
          total: res.data.length >= limit ? page * limit + 10 : page * limit
        });
      }
    } catch (error) {
      message.error("Failed to fetch convenience fee data");
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfeeData();
  }, []);

  const handleFilterApply = () => {
    setPagination({ ...pagination, current: 1 });
    fetchConfeeData(1, pagination.pageSize, startDate, endDate, numberPlate);
  };

  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setNumberPlate("");
    setPagination({ ...pagination, current: 1 });
    fetchConfeeData(1, pagination.pageSize, null, null, "");
  };

  const handleTableChange = (newPagination) => {
    fetchConfeeData(newPagination.current, newPagination.pageSize, startDate, endDate, numberPlate);
  };

  const showDetails = (record) => {
    setSelectedRecord(record);
    setDetailsModalOpen(true);
  };

  const downloadPDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(16);
      doc.text("Convenience Fees Report", pageWidth / 2, 20, { align: "center" });

      // Date range info
      doc.setFontSize(10);
      const dateRangeText = startDate && endDate
        ? `${startDate.format("YYYY-MM-DD")} to ${endDate.format("YYYY-MM-DD")}`
        : "All Records";
      doc.text(`Date Range: ${dateRangeText}`, pageWidth / 2, 30, { align: "center" });
      doc.text(`Generated: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`, pageWidth / 2, 36, { align: "center" });

      // Statistics
      doc.setFontSize(11);
      doc.text("Summary Statistics", 14, 50);
      doc.setFontSize(10);
      doc.text(`Total Entries: ${stats.totalFees}`, 14, 58);
      doc.text(`Total Amount: KES ${stats.totalAmount.toLocaleString()}`, 14, 64);
      doc.text(`Average Fee: KES ${stats.averageFee}`, 14, 70);
      doc.text(`Paid: ${stats.paidCount} | Pending: ${stats.pendingCount}`, 14, 76);

      // Table
      const tableData = confeeData.map(entry => [
        entry.id,
        entry.visit_id,
        entry.Visit?.number_plate || "N/A",
        `KES ${entry.con_fee}`,
        statusMap[entry.status],
        new Date(entry.createdAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        })
      ]);

      autoTable(doc, {
        head: [["Fee ID", "Visit ID", "Number Plate", "Amount", "Status", "Created At"]],
        body: tableData,
        startY: 90,
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
        headerStyles: { fillColor: [25, 118, 210], textColor: [255, 255, 255] }
      });

      doc.save(`confee-report-${dayjs().format("YYYY-MM-DD-HHmmss")}.pdf`);
      message.success("Report downloaded successfully");
    } catch (error) {
      message.error("Failed to generate PDF report");
      console.error(error);
    }
  };

  const columns = [
    {
      title: "Fee ID",
      dataIndex: "id",
      width: 80,
      key: "id"
    },
    {
      title: "Visit ID",
      dataIndex: "visit_id",
      width: 100,
      key: "visit_id"
    },
    {
      title: "Number Plate",
      dataIndex: ["Visit", "number_plate"],
      width: 130,
      key: "number_plate",
      render: (text) => text || "N/A"
    },
    {
      title: "Amount (KES)",
      dataIndex: "con_fee",
      width: 120,
      key: "con_fee",
      render: (amount) => (
        <span style={{ fontWeight: 500, color: "#faad14" }}>
          KES {Number(amount).toLocaleString()}
        </span>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      key: "status",
      render: (status) => (
        <Tag color={statusColorMap[status]}>
          {statusMap[status]}
        </Tag>
      )
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      width: 180,
      key: "createdAt",
      render: (value) => {
        if (!value) return "N/A";
        return new Date(value).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });
      }
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => showDetails(record)}
        >
          Details
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>
        Convenience Fees Management
      </div>

      {/* Filter Section */}
      <Card title="Filter Records" style={{ marginBottom: "24px" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Start Date
            </label>
            <DatePicker
              value={startDate}
              onChange={(date) => setStartDate(date)}
              style={{ width: "100%" }}
              placeholder="Select start date"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              End Date
            </label>
            <DatePicker
              value={endDate}
              onChange={(date) => setEndDate(date)}
              style={{ width: "100%" }}
              placeholder="Select end date"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Number Plate
            </label>
            <Input
              value={numberPlate}
              onChange={(e) => setNumberPlate(e.target.value)}
              placeholder="Search by plate"
              allowClear
            />
          </Col>
          <Col xs={24} style={{ display: "flex", gap: "8px" }}>
            <Button type="primary" onClick={handleFilterApply} style={{ flex: 1 }} loading={loading}>
              Apply Filters
            </Button>
            <Button onClick={handleClearFilters} style={{ flex: 1 }}>
              Clear Filters
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={downloadPDF}
              disabled={confeeData.length === 0}
            >
              Download PDF
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Entries"
              value={stats.totalFees}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={`KES ${stats.totalAmount.toLocaleString()}`}
              valueStyle={{ color: "#faad14", fontSize: "14px" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Average Fee"
              value={`KES ${stats.averageFee}`}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Paid"
                  value={stats.paidCount}
                  valueStyle={{ color: "#52c41a", fontSize: "16px" }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Pending"
                  value={stats.pendingCount}
                  valueStyle={{ color: "#ff7a45", fontSize: "16px" }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Data Table */}
      <Card title="Convenience Fee Entries" loading={loading}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={confeeData}
            loading={loading}
            size="small"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: handleTableChange,
              showSizeChanger: true,
              pageSizeOptions: ["10", "25", "50", "100"]
            }}
            scroll={{ x: 1200 }}
          />
        </div>
      </Card>

      {/* Details Modal */}
      <Modal
        title="Convenience Fee Details"
        open={detailsModalOpen}
        onCancel={() => setDetailsModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedRecord && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontWeight: 600, color: "#666" }}>Fee ID</label>
              <p>{selectedRecord.id}</p>
            </div>
            <div>
              <label style={{ fontWeight: 600, color: "#666" }}>Visit ID</label>
              <p>{selectedRecord.visit_id}</p>
            </div>
            <div>
              <label style={{ fontWeight: 600, color: "#666" }}>Convenience Fee Amount</label>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#faad14" }}>
                KES {Number(selectedRecord.con_fee).toLocaleString()}
              </p>
            </div>
            <div>
              <label style={{ fontWeight: 600, color: "#666" }}>Status</label>
              <p>
                <Tag color={statusColorMap[selectedRecord.status]}>
                  {statusMap[selectedRecord.status]}
                </Tag>
              </p>
            </div>

            {selectedRecord.Visit && (
              <>
                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "12px" }}>
                  <h3 style={{ marginBottom: "12px", fontWeight: 600 }}>Associated Visit Details</h3>
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: "#666" }}>Number Plate</label>
                  <p>{selectedRecord.Visit.number_plate || "N/A"}</p>
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: "#666" }}>Visit Entry Time</label>
                  <p>
                    {selectedRecord.Visit.visit_timestamp
                      ? new Date(selectedRecord.Visit.visit_timestamp).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: "#666" }}>Visit Exit Time</label>
                  <p>
                    {selectedRecord.Visit.exit_timestamp
                      ? new Date(selectedRecord.Visit.exit_timestamp).toLocaleString()
                      : "Not exited yet"}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: "#666" }}>Visit Amount</label>
                  <p>
                    KES {Number(selectedRecord.Visit.amount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: 600, color: "#666" }}>Visit Status</label>
                  <p>{selectedRecord.Visit.status || "N/A"}</p>
                </div>
              </>
            )}

            <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "12px" }}>
              <label style={{ fontWeight: 600, color: "#666" }}>Created At</label>
              <p>
                {new Date(selectedRecord.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true
                })}
              </p>
            </div>
            <div>
              <label style={{ fontWeight: 600, color: "#666" }}>Updated At</label>
              <p>
                {new Date(selectedRecord.updatedAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true
                })}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
