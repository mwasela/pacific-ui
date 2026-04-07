import React, { useEffect, useState } from "react";
import { Card, Table, Tag, Button, Modal, Descriptions, message } from "antd";
import axios from "../helpers/axios";

const VIP_PAYMENTS_ENDPOINT = "/vippayments";

const statusColorMap = {
  COMPLETED: "#52c41a",
  PENDING: "#fa8c16",
  FAILED: "#ff4d4f",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatCurrency = (value) => `KES ${Number(value || 0).toLocaleString()}`;

export default function VIPcash() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchVIPPayments = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await axios.get(VIP_PAYMENTS_ENDPOINT, {
        params: { page, limit },
      });

      const payload = res.data;
      const rows = payload?.data || (Array.isArray(payload) ? payload : []);
      const total = payload?.pagination?.total_items ?? payload?.total ?? (Array.isArray(payload) ? payload.length : 0);

      setData(rows);
      setPagination({
        current: page,
        pageSize: limit,
        total,
      });
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to fetch VIP payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVIPPayments(1, pagination.pageSize);
  }, []);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 70,
    },
    {
      title: "Transaction Code",
      dataIndex: "transaction_code",
      width: 170,
      render: (code) => code ? (
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
      ) : "-",
    },
    {
      title: "Number Plate",
      dataIndex: "number_plate",
      width: 140,
      render: (plate) => plate ? (
        <Tag
          style={{
            backgroundColor: "transparent",
            borderColor: "#1677ff",
            color: "#1677ff",
            borderRadius: 999,
            paddingInline: 10,
          }}
        >
          {plate}
        </Tag>
      ) : "-",
    },
    {
      title: "Phone Number",
      dataIndex: "phone_number",
      width: 150,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      width: 110,
      render: (amount) => formatCurrency(amount),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 130,
      render: (status) => {
        const color = statusColorMap[status] || "#8c8c8c";
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
            {status || "-"}
          </Tag>
        );
      },
    },

    {
      title: "Transaction Time",
      dataIndex: "Transaction_timestamp",
      width: 190,
      render: (value) => formatDateTime(value),
    },
    {
      title: "Payment Time",
      dataIndex: "payment_timestamp",
      width: 190,
      render: (value) => formatDateTime(value),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Button type="primary" onClick={() => {
          setSelectedTransaction(record);
          setIsDetailsOpen(true);
        }}>
          View Details
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card title="VIP Payment Transactions" style={{ margin: 24 }}>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          scroll={{ x: "max-content" }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "25", "50"],
          }}
          onChange={(pager) => fetchVIPPayments(pager.current, pager.pageSize)}
        />
      </Card>

      <Modal
        title="VIP Payment Details"
        open={isDetailsOpen}
        onCancel={() => {
          setIsDetailsOpen(false);
          setSelectedTransaction(null);
        }}
        footer={null}
      >
        {selectedTransaction ? (
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="ID">{selectedTransaction.id ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Transaction Code">{selectedTransaction.transaction_code ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Number Plate">{selectedTransaction.number_plate ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Phone Number">{selectedTransaction.phone_number ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Amount">{formatCurrency(selectedTransaction.amount)}</Descriptions.Item>
            <Descriptions.Item label="Status">{selectedTransaction.status ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Checkout ID">{selectedTransaction.checkoutID ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Transaction Time">{formatDateTime(selectedTransaction.Transaction_timestamp)}</Descriptions.Item>
            <Descriptions.Item label="Payment Time">{formatDateTime(selectedTransaction.payment_timestamp)}</Descriptions.Item>
            <Descriptions.Item label="Created At">{formatDateTime(selectedTransaction.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Updated At">{formatDateTime(selectedTransaction.updatedAt)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </>
  );
}
