import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, DatePicker, Grid, Input, Row, Select, Space, Statistic, Typography, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
  const [manualPay, setManualPay] = useState(null);
  const [visitStatus, setVisitStatus] = useState(null);
  const [analytics, setAnalytics] = useState({
    total_revenue: 0,
    unique_number_plates: 0,
    number_plate_total_amount: null,
    raw_visit_records: 0,
    open_visit_records: 0,  
  });

  const filters = useMemo(() => {
    return {
      from: dateRange?.[0] ? dateRange[0].format("YYYY-MM-DD") : undefined,
      to: dateRange?.[1] ? dateRange[1].format("YYYY-MM-DD") : undefined,
      number_plate: numberPlate?.trim() || undefined,
      paid_status: paidStatus !== null ? paidStatus : undefined,
      free_visit: freeVisit !== null ? freeVisit : undefined,
      manual_pay: manualPay !== null ? manualPay : undefined,
      visit_status: visitStatus !== null ? visitStatus : undefined,
    };
  }, [dateRange, numberPlate, paidStatus, freeVisit, manualPay, visitStatus]);

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/analytics/revenue", { params: filters });
      console.log("Revenue analytics response:", res.data);
      setAnalytics({
        total_revenue: Number(res.data?.total_revenue || 0),
        open_visit_records: Number(res.data?.open_visit_records || 0),
        raw_visit_records: Number(res.data?.raw_visit_records || 0),
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

  const handleDownloadPDF = async () => {
    try {
      message.loading({ content: "Generating PDF...", key: "pdf" });

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      const selectedPeriod =
        dateRange?.[0] && dateRange?.[1]
          ? `${dateRange[0].format("YYYY-MM-DD")} to ${dateRange[1].format("YYYY-MM-DD")}`
          : "All Time";

      const metricRows = [
        ["Total Revenue", `KES ${Number(analytics.total_revenue).toLocaleString()}`],
        ["Unique Number Plates", analytics.unique_number_plates.toString()],
        ["Raw Visit Records (All vehicles)", analytics.raw_visit_records.toString()],
        ["Current Vehicles in the Malls", analytics.open_visit_records.toString()],
        [
          "Selected Plate Revenue",
          analytics.number_plate_total_amount === null
            ? "N/A"
            : `KES ${Number(analytics.number_plate_total_amount).toLocaleString()}`,
        ],
      ];

      const filterRows = [];
      if (numberPlate) filterRows.push(["Number Plate", numberPlate]);
      if (paidStatus !== null) {
        filterRows.push(["Paid Status", paidStatus === 0 ? "Paid" : "Pending Pay"]);
      }
      if (freeVisit !== null) {
        filterRows.push(["Visit Type", freeVisit === 0 ? "Free Visits" : "Paid Visits"]);
      }
      if (manualPay !== null) {
        filterRows.push(["Payment Type", manualPay === 1 ? "Manual Payments" : "Mpesa Payments"]);
      }
      if (visitStatus !== null) {
        filterRows.push(["Visit Status", visitStatus === 1 ? "Open" : "Closed"]);
      }

      if (filterRows.length === 0) {
        filterRows.push(["Applied Filters", "None"]);
      }

      autoTable(pdf, {
        head: [["Metric", "Value"]],
        body: metricRows,
        startY: 40,
        margin: { left: 10, right: 10, top: 10, bottom: 10 },
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: "bold" },
      });

      autoTable(pdf, {
        head: [["Selected Filters", "Value"]],
        body: filterRows,
        startY: (pdf.lastAutoTable?.finalY || 40) + 8,
        margin: { left: 10, right: 10, top: 10, bottom: 10 },
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: "bold" },
      });

      pdf.setFontSize(14);
      pdf.text("PACIFIC MALL PARKING SERVICES", 10, 15);
      pdf.setFontSize(12);
      pdf.text("Financial Analytics Report", 10, 25);

      pdf.setFontSize(9);
      pdf.text(`Period: ${selectedPeriod}`, 10, 35);

      const filename = `financial_report_${dayjs().format("YYYY-MM-DD_HHmmss")}.pdf`;
      pdf.save(filename);
      message.success({ content: "PDF downloaded successfully", key: "pdf" });
    } catch (error) {
      message.error({ content: "Failed to generate PDF", key: "pdf" });
      console.error("PDF export error:", error);
    }
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
            style={{ width: screens.md ? 280 : "100%", minWidth: screens.md ? 200 : "100%" }}
          />
          <Space.Compact style={{ width: screens.md ? "auto" : "100%", minWidth: screens.md ? 320 : "100%" }}>
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
            style={{ width: screens.md ? 180 : "100%", minWidth: screens.md ? 150 : "100%" }}
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
            style={{ width: screens.md ? 180 : "100%", minWidth: screens.md ? 150 : "100%" }}
          />
          <Select
            allowClear
            value={manualPay}
            onChange={setManualPay}
            placeholder="Payment Type"
            options={[
              { label: "Manual Payments", value: 1 },
              { label: "Mpesa Payments", value: 0 },
            ]}
            style={{ width: screens.md ? 180 : "100%", minWidth: screens.md ? 150 : "100%" }}
          />
          <Select
            allowClear
            value={visitStatus}
            onChange={setVisitStatus}
            placeholder="Visit Status"
            options={[
              { label: "Open", value: 1 },
              { label: "Closed", value: 0 },
            ]}
            style={{ width: screens.md ? 180 : "100%", minWidth: screens.md ? 150 : "100%" }}
          />
          <Button
            type="primary"
            onClick={handleDownloadPDF}
            icon={<DownloadOutlined />}
            loading={loading}
            style={{ width: screens.md ? "auto" : "100%" }}
          >
            Download PDF
          </Button>
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
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card loading={loading}>
            <Statistic
              title="Raw Visit Records (All vehicles)"
              value={analytics.raw_visit_records}
              valueStyle={{ color: "#d46b08" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
              
          <Card loading={loading}>
            <Statistic
              title="Current Vehicles in the Malls"
              value={analytics.open_visit_records}
              valueStyle={{ color: "#d46b08" }}
            />
          </Card>
        </Col>
      </Row>  
    </Space>
  );
}
