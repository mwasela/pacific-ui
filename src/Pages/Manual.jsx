import React, { useEffect, useState, useContext } from 'react'
import { Card, Modal, Form, Input, Button, Table, message, Tag, Space, Tooltip, DatePicker, Row, Col } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import axios from "../helpers/axios";
import dayjs from "dayjs";
import { TitleContext } from "../context/TitleContext";

export default function Manual() {
  const { setPageTitle } = useContext(TitleContext);
  const [form] = Form.useForm();
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [numberPlate, setNumberPlate] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [openedBy, setOpenedBy] = useState("");

  useEffect(() => {
    setPageTitle("Manual Exits");
    return () => setPageTitle("");
  }, [setPageTitle]);

  const fetchManualBarrierOpenings = async (plate = numberPlate, start = startDate, end = endDate, user = openedBy) => {
    setTableLoading(true);
    try {
      const params = {};
      
      if (plate) {
        params.number_plate = plate;
      }
      
      if (start) {
        params.start_date = start.toISOString();
      }
      
      if (end) {
        params.end_date = end.toISOString();
      }
      
      if (user) {
        params.user = user;
      }
      
      const res = await axios.get("/manual", { params });
        setTableData(res.data);
    } catch (error) {
      message.error("Failed to fetch manual barrier openings");
    }
    setTableLoading(false);
  }


  useEffect(() => {
    fetchManualBarrierOpenings();
  }, []);

  const handleFilterApply = () => {
    fetchManualBarrierOpenings(numberPlate, startDate, endDate, openedBy);
  };

  const handleClearFilters = () => {
    setNumberPlate("");
    setStartDate(null);
    setEndDate(null);
    setOpenedBy("");
    fetchManualBarrierOpenings("", null, null, "");
  };

  const handleBarrierClick = async (barrier, number_plate, reason) => {
    try {
      setLoading(true);
      const response = await axios.post("/manual", { barrier, reason, number_plate });
      message.success("Barrier opened successfully");
      form.resetFields();
      setEntryModalOpen(false);
      setExitModalOpen(false);
      fetchManualBarrierOpenings();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to open barrier");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = (values) => {
    const barrier = entryModalOpen ? 1 : 2;
    handleBarrierClick(barrier, values.number_plate, values.reason);
  };

  const openEntryModal = () => {
    form.resetFields();
    setEntryModalOpen(true);
  };

  const openExitModal = () => {
    form.resetFields();
    setExitModalOpen(true);
  };

  const closeModals = () => {
    setEntryModalOpen(false);
    setExitModalOpen(false);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
    },
    {
      title: "Direction",
      dataIndex: "barrier",
      width: 120,
      render: (barrier) => {
        const isEntry = barrier === 1;
        return (
          <Tag
            style={{
              backgroundColor: isEntry ? "#e6f7ff" : "#fff1f0",
              borderColor: isEntry ? "#1890ff" : "#ff4d4f",
              color: isEntry ? "#1890ff" : "#ff4d4f",
              borderRadius: "4px",
              fontWeight: "bold",
            }}
          >
            {isEntry ? "Entry" : barrier === 2 ? "Exit" : barrier}
          </Tag>
        );
      },
    },
    {
      title: "Vehicle Plate",
      dataIndex: "number_plate",
      width: 130,
    },
    {
      title: "Reason",
      dataIndex: "reason",
      width: 200,
      render: (reason) => {
        if (!reason) return "-";
        if (reason.length > 100) {
          return (
            <span>
              {reason.substring(0, 50)}...
              <Tooltip title={reason}>
                <InfoCircleOutlined style={{ marginLeft: "8px", cursor: "pointer", color: "#1890ff" }} />
              </Tooltip>
            </span>
          );
        }
        return reason;
      },
    },
    {
      title: "Opened At",
      dataIndex: "createdAt",
      width: 180,
      render: (value) => {
        if (!value) return "-";
        const date = new Date(value);
        return date.toLocaleString();
      },
    },
    {
        title: "Opened By",
        dataIndex: ["user", "username"],
        width: 150,
        render: (username) => {
          if (!username) return "-";
          return (
            <Tag
              style={{
                backgroundColor: "#f0f5ff",
                borderColor: "#1890ff",
                color: "#1890ff",
                borderRadius: "4px",
                fontWeight: "500",
              }}
            >
              {username}
            </Tag>
          );
        },
    }
    // {
    //   title: "Actions",
    //   dataIndex: "actions",
    //   width: 150,
    //   render: (_, record) => (
    //     <Space>
    //       <Button
    //         type={record.barrier === 1 ? "primary" : "default"}
    //         size="small"
    //         onClick={() => message.info(`Entry Direction: ${record.number_plate}`)}
    //       >
    //         Entry
    //       </Button>
    //       <Button
    //         type={record.barrier === 2 ? "primary" : "default"}
    //         size="small"
    //         onClick={() => message.info(`Exit Direction: ${record.number_plate}`)}
    //       >
    //         Exit
    //       </Button>
    //     </Space>
    //   ),
    // },
  ];

  return (
    <div style={{ padding: "14px" }}>
  
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <Card
          title="Entry Barrier"
          style={{ flex: 1, minWidth: "280px" }}
          onClick={openEntryModal}
        >
          <Button type="primary" block size="large">
            Open Entry Barrier
          </Button>
        </Card>
        <Card
          title="Exit Barrier"
          style={{ flex: 1, minWidth: "280px" }}
          onClick={openExitModal}
        >
          <Button type="primary" block size="large">
            Open Exit Barrier
          </Button>
        </Card>
      </div>

      <Card title="Manual Barrier Filters" style={{ marginBottom: "24px" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
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
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Start Date
            </label>
            <DatePicker
              value={startDate ? dayjs(startDate) : null}
              onChange={(date) => setStartDate(date ? date.toDate() : null)}
              style={{ width: "100%" }}
              placeholder="Select start date"
              showTime
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
              showTime
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Opened By
            </label>
            <Input
              value={openedBy}
              onChange={(e) => setOpenedBy(e.target.value)}
              placeholder="Search by user ID or name"
              allowClear
            />
          </Col>
          <Col xs={24} style={{ display: "flex", gap: "8px" }}>
            <Button type="primary" onClick={handleFilterApply} style={{ flex: 1 }}>
              Apply Filters
            </Button>
            <Button onClick={handleClearFilters} style={{ flex: 1 }}>
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      <Card title="Manual Barrier Openings">
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table
            rowKey="id"
            loading={tableLoading}
            columns={columns}
            dataSource={tableData}
            size="small"
            scroll={{ x: 1200 }}
          />
        </div>
      </Card>

      <Modal
        title="Open Entry Barrier"
        open={entryModalOpen}
        onCancel={closeModals}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Vehicle Plate"
            name="number_plate"
            rules={[{ required: true, message: "Vehicle plate is required" }]}
          >
            <Input placeholder="Enter vehicle plate" />
          </Form.Item>
          <Form.Item
            label="Reason"
            name="reason"
            rules={[{ required: true, message: "Reason is required" }]}
          >
            <Input.TextArea
              placeholder="Enter reason for manual opening"
              rows={4}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Open Barrier
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Open Exit Barrier"
        open={exitModalOpen}
        onCancel={closeModals}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Vehicle Plate"
            name="number_plate"
            rules={[{ required: true, message: "Vehicle plate is required" }]}
          >
            <Input placeholder="Enter vehicle plate" />
          </Form.Item>
          <Form.Item
            label="Reason"
            name="reason"
            rules={[{ required: true, message: "Reason is required" }]}
          >
            <Input.TextArea
              placeholder="Enter reason for manual opening"
              rows={4}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Open Barrier
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
