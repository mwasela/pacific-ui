import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, DatePicker, Grid, Input, Row, Select, Space, Statistic, Typography, message } from "antd";
import dayjs from "dayjs";
import axios from "../helpers/axios";

const { Title, Text } = Typography;

const toMoney = (value) => {
  const amount = Number(value || 0);
  return `KES ${amount.toLocaleString()}`;
};

export default function Financial() {
  const screens = Grid.useBreakpoint();
  const [loading, setLoading] = useState(false);
  const [numberPlateInput, setNumberPlateInput] = useState("");
  const [numberPlate, setNumberPlate] = useState("");
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, "day"), dayjs()]);
  const [paidStatus, setPaidStatus] = useState(null);
  const [freeVisit, setFreeVisit] = useState(null);
  const [analytics, setAnalytics] = useState({
    total_revenue: 0,
    unique_number_plates: 0,
    number_plate_total_amount: null,
  });

  const filters = useMemo(() => {
    return {
      from: dateRange?.[0] ? dateRange[0].format("YYYY-MM-DD") : undefined,
      to: dateRange?.[1] ? dateRange[1].format("YYYY-MM-DD") : undefined,
      number_plate: numberPlate?.trim() || undefined,
      paid_status: paidStatus !== null ? paidStatus : undefined,
      free_visit: freeVisit !== null ? freeVisit : undefined,
    };
  }, [dateRange, numberPlate, paidStatus, freeVisit]);

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/analytics/revenue", { params: filters });
      setAnalytics({
        total_revenue: Number(res.data?.total_revenue || 0),
        unique_number_plates: Number(res.data?.unique_number_plates || 0),
        number_plate_total_amount:
          res.data?.number_plate_total_amount === null ? null : Number(res.data?.number_plate_total_amount || 0),
      });
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to fetch revenue analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, [filters]);

  const applyNumberPlateFilter = () => {
    setNumberPlate(numberPlateInput.trim());
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          Financial Analytics
        </Title>
        <Text type="secondary">Revenue summary with range and payment filters</Text>
      </div>

      <Card title="Filters" loading={loading}>
        <Space
          direction={screens.md ? "horizontal" : "vertical"}
          size={12}
          style={{ width: "100%" }}
          wrap
        >
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(value) => setDateRange(value)}
            format="YYYY-MM-DD"
            placeholder={["From", "To"]}
            style={{ minWidth: screens.md ? 280 : "100%" }}
          />
          <Space.Compact style={{ minWidth: screens.md ? 320 : "100%", width: screens.md ? "auto" : "100%" }}>
            <Input
              allowClear
              value={numberPlateInput}
              onChange={(event) => setNumberPlateInput(event.target.value)}
              onPressEnter={applyNumberPlateFilter}
              placeholder="Number plate"
            />
            <Button type="primary" onClick={applyNumberPlateFilter}>
              Apply
            </Button>
          </Space.Compact>
          <Select
            allowClear
            value={paidStatus}
            onChange={setPaidStatus}
            placeholder="Paid status"
            options={[
              { label: "Paid", value: 0 },
              { label: "Pending Pay", value: 1 },
            ]}
            style={{ minWidth: screens.md ? 180 : "100%" }}
          />
          <Select
            allowClear
            value={freeVisit}
            onChange={setFreeVisit}
            placeholder="Visit type"
            options={[
              { label: "Free Visits", value: 0 },
              { label: "Paid Visits", value: 1 },
            ]}
            style={{ minWidth: screens.md ? 180 : "100%" }}
          />
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card loading={loading}>
            <Statistic
              title="Total Revenue"
              value={toMoney(analytics.total_revenue)}
              valueStyle={{ color: "#237804" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card loading={loading}>
            <Statistic title="Unique Number Plates" value={analytics.unique_number_plates} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card loading={loading}>
            <Statistic
              title="Selected Plate Revenue"
              value={
                analytics.number_plate_total_amount === null
                  ? "Select a number plate"
                  : toMoney(analytics.number_plate_total_amount)
              }
              valueStyle={{ color: analytics.number_plate_total_amount === null ? "#8c8c8c" : "#1d39c4" }}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
