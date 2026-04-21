import React, { useEffect, useState } from "react";
import { Card, Table, Tag, message, Button, Modal, Descriptions, Form, Input, Space } from "antd";
import axios from "../helpers/axios";

const statusColorMap = {
  COMPLETED: "#52c41a",
  PENDING: "#fa8c16",
  FAILED: "#ff4d4f",
};

const visitStatusMap = {
  0: "Open",
  1: "Closed",
  2: "Exited",
};

const paidStatusMap = {
  0: "Paid",
  1: "Unpaid",
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const normalizeKenyanPhone = (value = "") => {
  const sanitized = value.replace(/[\s-]/g, "");
  if (sanitized.startsWith("+254")) return `0${sanitized.slice(4)}`;
  if (sanitized.startsWith("254")) return `0${sanitized.slice(3)}`;
  return sanitized;
};

const isValidKenyanPhone = (value = "") => {
  const normalized = normalizeKenyanPhone(value);
  return /^0(7\d{8}|1\d{8})$/.test(normalized);
};

export default function Visits() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [numberPlate, setNumberPlate] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isStkModalOpen, setIsStkModalOpen] = useState(false);
  const [stkVisitId, setStkVisitId] = useState(null);
  const [sendingStk, setSendingStk] = useState(false);
  const [stkForm] = Form.useForm();

  const getVisitId = (transaction) => transaction?.visit_id ?? transaction?.Visit?.id;
  const isUnpaid = (transaction) => {
    const paidStatus = transaction?.Visit?.paid_status ?? transaction?.paid_status;
    return Number(paidStatus) === 1;
  };

  const openVisitModal = (transaction) => {
    setSelectedTransaction(transaction || null);
    setIsVisitModalOpen(true);
  };

  const closeVisitModal = () => {
    setSelectedTransaction(null);
    setIsVisitModalOpen(false);
  };

  const openStkModal = (transaction) => {
    setStkVisitId(getVisitId(transaction) ?? null);
    stkForm.resetFields();
    setIsStkModalOpen(true);
  };

  const closeStkModal = () => {
    setStkVisitId(null);
    setIsStkModalOpen(false);
    stkForm.resetFields();
  };

  const sendStkPush = async () => {
    try {
      const values = await stkForm.validateFields();

      if (!stkVisitId) {
        message.error("Visit ID is missing for this record");
        return;
      }

      setSendingStk(true);
      await axios.post("/payment/unpaid/stk", {
        visit_id: stkVisitId,
        phone_no: normalizeKenyanPhone(values.phone_no),
      });

      message.success("STK push sent successfully");
      closeStkModal();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.response?.data?.message || "Failed to send STK push");
    } finally {
      setSendingStk(false);
    }
  };

  const fetchTransactions = async (current = 1, pageSize = 10, plate = numberPlate) => {
    setLoading(true);
    try {
      const res = await axios.get("/transactions/transactions", {
        params: {
          current,
          pageSize,
          number_plate: plate || undefined,
        },
      });

      const payload = res.data;
      const rows = Array.isArray(payload) ? payload : payload?.data || [];
      const total = Array.isArray(payload) ? payload.length : payload?.total || 0;

      setData(rows);
      setPagination({
        current,
        pageSize,
        total,
      });
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1, pagination.pageSize);
  }, []);

  const handleNumberPlateSearch = (event) => {
    const value = event.target.value;
    setNumberPlate(value);
    fetchTransactions(1, pagination.pageSize, value);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
    },
    {
      title: "Visit ID",
      dataIndex: "visit_id",
      width: 90,
    },
    {
      title: "Number Plate",
      dataIndex: "number_plate",
      width: 130,
      key:"number_plate",
    },
    {
      title: "Phone",
      dataIndex: "phone_number",
      width: 150,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      width: 100,
      render: (amount) => `KES ${amount}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 140,
      render: (status) => {
        const color = statusColorMap[status] || "#1677ff";
        return (
          <Tag
            style={{
              backgroundColor: "transparent",
              borderColor: color,
              color,
              borderRadius: 999,
              paddingInline: 10,
            }}
          >
            {status}
          </Tag>
        );
      },
    },
        {
      title: "Transaction Code",
      dataIndex: "transaction_code",
      width: 170,
      render: (code) => {
        if (!code) return "-";
        return (
          <Tag
            style={{
              backgroundColor: "transparent",
              borderColor: "#1677ff",
              color: "#1677ff",
              borderRadius: 999,
              paddingInline: 10,
            }}
          >
            {code}
          </Tag>
        );
      },
    },

    {
      title: "Transaction Time",
      dataIndex: "Transaction_timestamp",
      width: 190,
      render: (value) => formatDate(value),
    },
    {
      title: "Payment Time",
      dataIndex: "payment_timestamp",
      width: 190,
      render: (value) => formatDate(value),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      fixed: "right",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button onClick={() => openVisitModal(record)}>
            View Visit
          </Button>
          <Button
            type="primary"
            onClick={() => openStkModal(record)}
            disabled={!isUnpaid(record)}
          >
            Send STK Push
          </Button>
        </Space>
      ),
    },
  ];

  const visit = selectedTransaction?.Visit;

  return (
    <>
      <Card title="Transactions / Visits" style={{ margin: 24 }}>
        <Input
          allowClear
          placeholder="Search by number plate"
          value={numberPlate}
          onChange={handleNumberPlateSearch}
          style={{ width: 320, marginBottom: 16 }}
        />
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          size="small"
          dataSource={data}
          scroll={{ x: "max-content" }}
          pagination={pagination}
          onChange={(pager) => fetchTransactions(pager.current, pager.pageSize, numberPlate)}
        />
      </Card>

      <Modal title="Visit Details" open={isVisitModalOpen} onCancel={closeVisitModal} footer={null}>
        {visit ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Visit ID">{visit.id ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Vehicle Number">{visit.vehicle_number ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Ticket ID">{visit.ticket_id ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Checkout ID">{selectedTransaction?.checkoutID ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Paid Status">
              {paidStatusMap[visit.paid_status] || visit.paid_status || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Visit Time">{formatDate(visit.visit_timestamp)}</Descriptions.Item>
            <Descriptions.Item label="Exit Time">{formatDate(visit.exit_timestamp)}</Descriptions.Item>
            <Descriptions.Item label="Amount">{visit.amount ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Hours">{visit.hours ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Status">
              {visitStatusMap[visit.status] || visit.status || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="User Type">{visit.user_type ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Created At">{formatDate(visit.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Updated At">{formatDate(visit.updatedAt)}</Descriptions.Item>
          </Descriptions>
        ) : (
          <div>No visit details available.</div>
        )}
      </Modal>

      <Modal
        title="Send STK Push"
        open={isStkModalOpen}
        onCancel={closeStkModal}
        onOk={sendStkPush}
        okText="Send STK Push"
        confirmLoading={sendingStk}
      >
        <Form form={stkForm} layout="vertical">
          <Form.Item label="Visit ID">
            <Input value={stkVisitId ?? "-"} disabled />
          </Form.Item>
          <Form.Item
            label="Phone Number"
            name="phone_no"
            rules={[
              { required: true, message: "Phone number is required" },
              {
                validator: (_, value) => {
                  if (!value || isValidKenyanPhone(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Enter a valid Kenyan phone number (e.g. 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX)")
                  );
                },
              },
            ]}
          >
            <Input placeholder="e.g. 0758337870" maxLength={13} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
