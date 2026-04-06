import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Col,
  Empty,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import axios from "../helpers/axios";

const { Title, Text } = Typography;

const statusColorMap = {
  COMPLETED: "#52c41a",
  PENDING: "#fa8c16",
  FAILED: "#ff4d4f",
};

const toQueryDate = (date) => date.toISOString();

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `KES ${amount.toLocaleString()}`;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

function MiniLineChart({ points }) {
  const width = 760;
  const height = 220;
  const padding = 24;

  const values = points.map((p) => Number(p.total_amount || 0));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const chartPoints = points.map((p, i) => {
    const x = padding + (i * (width - padding * 2)) / Math.max(points.length - 1, 1);
    const y = height - padding - ((Number(p.total_amount || 0) - min) / range) * (height - padding * 2);
    return { x, y, label: p.bucket, value: Number(p.total_amount || 0) };
  });

  const polyline = chartPoints.map((p) => `${p.x},${p.y}`).join(" ");

  if (!points.length) {
    return <Empty description="No chart data" />;
  }

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg width={width} height={height} role="img" aria-label="Transactions amount chart">
        <defs>
          <linearGradient id="amountGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1677ff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1677ff" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d9d9d9" />

        <polyline fill="none" stroke="#1677ff" strokeWidth="3" points={polyline} />

        {chartPoints.map((p) => (
          <g key={`${p.label}-${p.x}`}>
            <circle cx={p.x} cy={p.y} r="4" fill="#1677ff" />
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function Home() {
  const [bucket, setBucket] = useState("day");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [series, setSeries] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    return { from: toQueryDate(from), to: toQueryDate(to) };
  }, []);

  const monthRange = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth(), 1, 0, 0, 0, 0);
    return { from: toQueryDate(from), to: toQueryDate(to) };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, monthlySummaryRes, seriesRes, recentRes] = await Promise.all([
        axios.get("/analytics/dashboard", { params: range }),
        axios.get("/analytics/dashboard", { params: monthRange }),
        axios.get("/analytics/transactions-series", {
          params: {
            ...range,
            bucket,
          },
        }),
        axios.get("/transactions/transactions", {
          params: {
            limit: 5,
            sort: "Transaction_timestamp:desc",
          },
        }),
      ]);

      const summaryPayload = summaryRes.data || {};
      const monthlyPayload = monthlySummaryRes.data || {};
      const seriesPayload = seriesRes.data?.points || [];
      const recentPayload = recentRes.data;
      const recentRows = Array.isArray(recentPayload) ? recentPayload : recentPayload?.data || [];

      setSummary(summaryPayload);
      setMonthlyRevenue(Number(monthlyPayload.total_amount || 0));
      setSeries(seriesPayload);
      setRecentTransactions(recentRows);
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to load dashboard analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [bucket]);

  const recentColumns = [
    {
      title: "Code",
      dataIndex: "transaction_code",
      render: (code) => code || "-",
    },
    {
      title: "Plate",
      dataIndex: "number_plate",
      render: (plate) => plate || "-",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (amount) => formatCurrency(amount),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const color = statusColorMap[status] || "#1677ff";
        return (
          <Tag style={{ backgroundColor: "transparent", borderColor: color, color, borderRadius: 999 }}>
            {status || "-"}
          </Tag>
        );
      },
    },
    {
      title: "When",
      dataIndex: "Transaction_timestamp",
      render: (value) => formatDateTime(value),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Analytics Overview
          </Title>
          <Text type="secondary">Last 30 days summary</Text>
        </div>

        <Spin spinning={loading}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8} xl={4}>
              <Card>
                <Statistic title="Total Transactions" value={summary?.total_transactions || 0} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8} xl={4}>
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={formatCurrency(summary?.total_amount)}
                  valueStyle={{ color: "#389e0d" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8} xl={4}>
              <Card>
                <Statistic
                  title="Monthly Revenue"
                  value={formatCurrency(monthlyRevenue)}
                  valueStyle={{ color: "#389e0d" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8} xl={4}>
              <Card>
                <Statistic title="Unique Plates" value={summary?.unique_plates || 0} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8} xl={4}>
              <Card>
                <Statistic title="Pending Exits" value={summary?.pending_exits || 0} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8} xl={4}>
              <Card>
                <Statistic
                  title="Pending Unpaid"
                  value={formatCurrency(summary?.pending_unpaid_amount)}
                  valueStyle={{ color: "#cf1322" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8} xl={4}>
              <Card>
                <Statistic title="Completed Sessions" value={summary?.completed_sessions || 0} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 4 }}>
            <Col xs={24} lg={15}>
              <Card
                title="Transactions Amount Trend"
                extra={
                  <Segmented
                    options={[
                      { label: "Hour", value: "hour" },
                      { label: "Day", value: "day" },
                      { label: "Week", value: "week" },
                      { label: "Month", value: "month" },
                    ]}
                    value={bucket}
                    onChange={setBucket}
                  />
                }
              >
                <MiniLineChart points={series} />
              </Card>
            </Col>

            <Col xs={24} lg={9}>
              <Card title="Last 5 Transactions">
                <Table
                  rowKey={(record) => record.id}
                  size="small"
                  columns={recentColumns}
                  dataSource={recentTransactions}
                  pagination={false}
                  scroll={{ x: "max-content" }}
                />
              </Card>
            </Col>
          </Row>
        </Spin>
      </Space>
    </div>
  );
}
