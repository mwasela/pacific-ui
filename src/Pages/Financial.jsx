import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, DatePicker, Grid, Input, Row, Select, Segmented, Space, Statistic, Typography, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.png";
import axios from "../helpers/axios";

const { Title, Text } = Typography;

const toMoney = (value) => {
  const amount = Number(value || 0);
  return `KES ${amount.toLocaleString()}`;
};

const loadLogoImage = () =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = logo;
  });

const getSummaryPeriodRange = (period) => {
  const to = dayjs();

  if (period === "24h") {
    return { from: dayjs().subtract(1, "day"), to, label: "Last 24 Hours" };
  }

  if (period === "7d") {
    return { from: dayjs().subtract(1, "week"), to, label: "Last 7 Days" };
  }

  return { from: dayjs().subtract(1, "month"), to, label: "Last 1 Month" };
};

export default function Financial() {
  const screens = Grid.useBreakpoint();
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [numberPlateInput, setNumberPlateInput] = useState("");
  const [numberPlate, setNumberPlate] = useState("");
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, "day"), dayjs()]);
  const [paidStatus, setPaidStatus] = useState('0');
  const [freeVisit, setFreeVisit] = useState(null);
  const [manualPay, setManualPay] = useState(null);
  const [visitStatus, setVisitStatus] = useState(null);
  const [summaryPeriod, setSummaryPeriod] = useState("1m");
  const [analytics, setAnalytics] = useState({
    total_revenue: 0,
    unique_number_plates: 0,
    number_plate_total_amount: null,
    raw_visit_records: 0,
    open_visit_records: 0,
    closed_visit_records: 0, // Exits
  });
  const [summaryAnalytics, setSummaryAnalytics] = useState({
    expected_revenue: 0,
    collected_revenue: 0,
    successful_exits: 0,
    pending_exits: 0,
    pending_amount: 0,
    manual_revenue: 0,
    mpesa_revenue: 0,
    all_entries: 0,
    manual_exits: 0,
    mpesa_exits: 0,
  });

  const filters = useMemo(() => {
    return {
      from: dateRange?.[0] ? dateRange[0].format("YYYY-MM-DD") : undefined,
      to: dateRange?.[1] ? dateRange[1].format("YYYY-MM-DD") : undefined,
      number_plate: numberPlate?.trim() || undefined,
      paid_status: paidStatus !== null ? paidStatus : undefined,
      free_visit: freeVisit !== null ? freeVisit : undefined,
      manual_pay: manualPay !== null ? manualPay : undefined,
      visit_status: 0,  // Always filter for closed visits only
    };
  }, [dateRange, numberPlate, paidStatus, freeVisit, manualPay]);

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/analytics/revenue", { params: filters });
      setAnalytics({
        total_revenue: Number(res.data?.total_revenue || 0),
        raw_visit_records: Number(res.data?.raw_visit_records || 0),
        open_visit_records: Number(res.data?.open_visit_records || 0),
        unique_number_plates: Number(res.data?.unique_number_plates || 0),
        number_plate_total_amount:
          res.data?.number_plate_total_amount === null ? null : Number(res.data?.number_plate_total_amount || 0),
        closed_visit_records: Number(res.data?.completed_visit_records || 0),
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

  // const fetchSummaryAnalytics = async (period = summaryPeriod) => {
  //   const range = getSummaryPeriodRange(period);
  //   setSummaryLoading(true);

  //   try {
  //     const params = {
  //       from: range.from.format("YYYY-MM-DD"),
  //       to: range.to.format("YYYY-MM-DD"),
  //     };

  //     const [totalRes, exitsRes, pendingExitsRes, pendingRes, manualRes, mpesaRes, manualExitsRes, mpesaExitsRes] = await Promise.all([
  //       axios.get("/analytics/revenue", { params }),
  //       axios.get("/analytics/revenue", { params: { ...params, visit_status: "0" } }),
  //       axios.get("/analytics/revenue", { params: { ...params, visit_status: "1" } }),
  //       axios.get("/analytics/revenue", { params: { ...params, paid_status: "1" } }),
  //       axios.get("/analytics/revenue", { params: { ...params, manual_pay: "1" } }),
  //       axios.get("/analytics/revenue", { params: { ...params, mpesa_pay: "1" } }),
  //       axios.get("/analytics/revenue", { params: { ...params, mpesa_pay: "0" } }),
  //       axios.get("/analytics/revenue", { params: { ...params, visit_status: "0", manual_pay: "1" } }),
  //       axios.get("/analytics/revenue", { params: { ...params, visit_status: "0", manual_pay: "0" } }),
  //     ]);

  //     const manualRevenue = Number(manualRes.data?.total_revenue || 0);
  //     const mpesaRevenue = Number(mpesaRes.data?.total_revenue || 0);
  //     const successfulExits = Number(exitsRes.data?.raw_visit_records || 0);
  //     const manualExits = Number(manualExitsRes.data?.raw_visit_records || 0);
  //     const mpesaExits = Number(mpesaExitsRes.data?.raw_visit_records || 0);

  //     setSummaryAnalytics({
  //       expected_revenue: Number(totalRes.data?.total_revenue || 0),
  //       collected_revenue: manualRevenue + mpesaRevenue,
  //       successful_exits: successfulExits,
  //       pending_exits: Number(pendingExitsRes.data?.raw_visit_records || 0),
  //       pending_amount: Number(pendingRes.data?.total_revenue || 0),
  //       manual_revenue: manualRevenue,
  //       mpesa_revenue: mpesaRevenue,
  //       all_entries: Number(totalRes.data?.raw_visit_records || 0),
  //       manual_exits: manualExits,
  //       mpesa_exits: mpesaExits,
  //     });
  //   } catch (error) {
  //     message.error(error.response?.data?.error || "Failed to fetch summary analytics");
  //   } finally {
  //     setSummaryLoading(false);
  //   }
  // };

  useEffect(() => {
    fetchSummaryAnalytics(summaryPeriod);
  }, [summaryPeriod]);

  const applyNumberPlateFilter = () => {
    setNumberPlate(numberPlateInput.trim());
  };

const fetchSummaryAnalytics = async (period) => {
  const res = await axios.get(`/analytics/summary?period=${summaryPeriod}`);
  //console.log("Summary analytics response:", res.data);
  setSummaryAnalytics(res.data);
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

      const logoImage = await loadLogoImage();

      const logoWidth = 35;
      const logoHeight = (logoImage.naturalHeight / logoImage.naturalWidth) * logoWidth;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const logoX = pageWidth - 10 - logoWidth;
      const logoY = 10;

      const metricRows = [
        ["Total Revenue", `KES ${Number(analytics.total_revenue).toLocaleString()}`],
        // ["Unique Number Plates", analytics.unique_number_plates.toString()],
        ["All Entries", analytics.raw_visit_records.toString()],
        ["Current Vehicles in the Mall", analytics.open_visit_records.toString()],
        ["Exits", analytics.closed_visit_records.toString()],
        [
          "Selected Plate Revenue",
          analytics.number_plate_total_amount === null
            ? "N/A"
            : `KES ${Number(analytics.number_plate_total_amount).toLocaleString()}`,
        ],
      ];

      autoTable(pdf, {
        head: [["Metric", "Value"]],
        body: metricRows,
        startY: Math.max(40, logoY + logoHeight + 4),
        margin: { left: 10, right: 10, top: 10, bottom: 10 },
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: "bold" },
      });

      pdf.setFontSize(14);
      pdf.text("PACIFIC MALL PARKING SERVICES", 10, 15);
      pdf.setFontSize(12);
      pdf.text("Financial Analytics Report", 10, 25);
      pdf.addImage(logoImage, "PNG", logoX, logoY, logoWidth, logoHeight);

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

  const handleDownloadSummaryPDF = async () => {
    try {
      message.loading({ content: "Generating summary PDF...", key: "summary-pdf" });

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      const range = getSummaryPeriodRange(summaryPeriod);
      const logoImage = await loadLogoImage();
      const logoWidth = 35;
      const logoHeight = (logoImage.naturalHeight / logoImage.naturalWidth) * logoWidth;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const logoX = pageWidth - 10 - logoWidth;
      const logoY = 10;

      const rows = [
        // ["Expected Revenue", `KES ${Number(summaryAnalytics.expected_revenue).toLocaleString()}`],
        ["Collected Revenue", `KES ${Number(summaryAnalytics.collected_revenue).toLocaleString()}`],
        ["Successful Exits", summaryAnalytics.successful_exits.toString()],
        ["Pending Exits", summaryAnalytics.pending_exits.toString()],
        //["Pending Amount", `KES ${Number(summaryAnalytics.pending_amount).toLocaleString()}`],
        ["Manual Revenue", `KES ${Number(summaryAnalytics.manual_revenue).toLocaleString()}`],
        ["Mpesa Revenue", `KES ${Number(summaryAnalytics.mpesa_revenue).toLocaleString()}`],
        ["All Entries (Visits)", summaryAnalytics.all_entries.toString()],
        ["Manual Exits", summaryAnalytics.manual_exits.toString()],
        ["Mpesa Exits", summaryAnalytics.mpesa_exits.toString()],
      ];

      autoTable(pdf, {
        head: [["Metric", "Value"]],
        body: rows,
        startY: Math.max(40, logoY + logoHeight + 4),
        margin: { left: 10, right: 10, top: 10, bottom: 10 },
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: "bold" },
      });

      pdf.setFontSize(14);
      pdf.text("PACIFIC MALL PARKING SERVICES", 10, 15);
      pdf.setFontSize(12);
      pdf.text("Period Summary Report", 10, 25);
      pdf.addImage(logoImage, "PNG", logoX, logoY, logoWidth, logoHeight);

      pdf.setFontSize(9);
      pdf.text(`Period: ${range.label}`, 10, 35);

      const filename = `financial_summary_${dayjs().format("YYYY-MM-DD_HHmmss")}.pdf`;
      pdf.save(filename);
      message.success({ content: "Summary PDF downloaded successfully", key: "summary-pdf" });
    } catch (error) {
      message.error({ content: "Failed to generate summary PDF", key: "summary-pdf" });
      console.error("Summary PDF export error:", error);
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>
          Financial Analytics
        </Title>
        <Text type="secondary">Revenue summary with detailed filters and period reporting</Text>
      </div>

      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card title="Summary Period" loading={summaryLoading}>
          <Space
            direction={screens.md ? "horizontal" : "vertical"}
            size={12}
            style={{ width: "100%", justifyContent: "space-between" }}
            wrap
          >
            <Segmented
              value={summaryPeriod}
              onChange={setSummaryPeriod}
              options={[
                { label: "Last 24 Hours", value: "24h" },
                { label: "Last 7 Days", value: "7d" },
                { label: "Last 1 Month", value: "1m" },
              ]}
            />
            <Button
              type="primary"
              onClick={handleDownloadSummaryPDF}
              icon={<DownloadOutlined />}
              loading={summaryLoading}
              style={{ width: screens.md ? "auto" : "100%" }}
            >
              Download PDF
            </Button>
          </Space>
          <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
            Showing {getSummaryPeriodRange(summaryPeriod).label}
          </Text>
        </Card>

        <Row gutter={[16, 16]}>
          {/* <Col xs={24} sm={12} lg={8}>
            <Card loading={summaryLoading}>
              <Statistic
                title="Expected Revenue"
                value={toMoney(summaryAnalytics.expected_revenue)}
                valueStyle={{ color: "#1d39c4" }}
              />
            </Card>
          </Col> */}
          <Col xs={24} sm={12} lg={8}>
            <Card loading={summaryLoading}>
              <Statistic
                title="Collected Revenue"
                value={toMoney(summaryAnalytics.collected_revenue)}
                valueStyle={{ color: "#237804" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card loading={summaryLoading}>
              <Statistic
                title="Successful Exits"
                value={summaryAnalytics.successful_exits}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card loading={summaryLoading}>
              <Statistic
                title="Pending Exits"
                value={summaryAnalytics.pending_exits}
                valueStyle={{ color: "#fa8c16" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            {/* <Card loading={summaryLoading}>
              <Statistic
                title="Pending Amount"
                value={toMoney(summaryAnalytics.pending_amount)}
                valueStyle={{ color: "#ad6800" }}
              />
            </Card> */}
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card loading={summaryLoading}>
              <Statistic
                title="Manual Revenue"
                value={toMoney(summaryAnalytics.manual_revenue)}
                valueStyle={{ color: "#d4380d" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card loading={summaryLoading}>
              <Statistic
                title="Mpesa Revenue"
                value={toMoney(summaryAnalytics.mpesa_revenue)}
                valueStyle={{ color: "#08979c" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card loading={summaryLoading}>
              <Statistic
                title="All Entries (Visits)"
                value={summaryAnalytics.all_entries}
                valueStyle={{ color: "#d46b08" }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card loading={summaryLoading}>
              <Statistic
                title="Manual Exits"
                value={summaryAnalytics.manual_exits}
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card loading={summaryLoading}>
              <Statistic
                title="Mpesa Exits"
                value={summaryAnalytics.mpesa_exits}
                valueStyle={{ color: "#13c2c2" }}
              />
            </Card>
          </Col>
        </Row>
      </Space>
    </Space>
  );
}
