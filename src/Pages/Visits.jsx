import React, { useEffect, useState } from "react";
import { Card, Table, Tag, message, Button, Modal, Descriptions } from "antd";
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

export default function Visits() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const openVisitModal = (transaction) => {
    setSelectedTransaction(transaction || null);
    setIsVisitModalOpen(true);
  };

  const closeVisitModal = () => {
    setSelectedTransaction(null);
    setIsVisitModalOpen(false);
  };

  const fetchTransactions = async (current = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await axios.get("/transactions/transactions", {
        params: {
          current,
          pageSize,
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
      width: 130,
      render: (_, record) => (
        <Button onClick={() => openVisitModal(record)}>
          View Visit
        </Button>
      ),
    },
  ];

  const visit = selectedTransaction?.Visit;

  return (
    <>
      <Card title="Transactions / Visits" style={{ margin: 24 }}>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          scroll={{ x: "max-content" }}
          pagination={pagination}
          onChange={(pager) => fetchTransactions(pager.current, pager.pageSize)}
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
    </>
  );
}
