import React, { useEffect, useState, useContext } from "react";
import { Button, Card, Col, DatePicker, Grid, Row, Space, Statistic, Typography, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.png";
import axios from "../helpers/axios";
import { TitleContext } from "../context/TitleContext";

const { Text } = Typography;

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

export default function Financial() {
  const { setPageTitle } = useContext(TitleContext);
  const screens = Grid.useBreakpoint();
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryDateRange, setSummaryDateRange] = useState([dayjs().subtract(30, "day"), dayjs()]);
  const [summaryAnalytics, setSummaryAnalytics] = useState({
    expected_revenue: 0,
    collected_revenue: 0,
    successful_exits: 0,
    pending_exits: 0,
    unpaid_exits: 0,
    pending_amount: 0,
    manual_revenue: 0,
    mpesa_revenue: 0,
    all_entries: 0,
    manual_exits: 0,
    mpesa_exits: 0,
    tenant_exits: 0,
  });

  useEffect(() => {
    setPageTitle("Financial");
    return () => setPageTitle("");
  }, [setPageTitle]);

  const fetchSummaryAnalytics = async () => {
    setSummaryLoading(true);
    try {
      const params = {
        from: summaryDateRange?.[0] ? summaryDateRange[0].format("YYYY-MM-DD") : undefined,
        to: summaryDateRange?.[1] ? summaryDateRange[1].format("YYYY-MM-DD") : undefined,
      };
      const res = await axios.get("/analytics/summary", { params });
      setSummaryAnalytics(res.data);
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to fetch summary analytics");
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryAnalytics();
  }, [summaryDateRange]);

  const handleDownloadSummaryPDF = async () => {
    try {
      message.loading({ content: "Generating summary PDF...", key: "summary-pdf" });

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      const selectedPeriod =
        summaryDateRange?.[0] && summaryDateRange?.[1]
          ? `${summaryDateRange[0].format("YYYY-MM-DD")} to ${summaryDateRange[1].format("YYYY-MM-DD")}`
          : "All Time";

      const logoImage = await loadLogoImage();
      const logoWidth = 35;
      const logoHeight = (logoImage.naturalHeight / logoImage.naturalWidth) * logoWidth;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const logoX = pageWidth - 10 - logoWidth;
      const logoY = 10;

      const rows = [
        ["Collected Revenue", `KES ${Number(summaryAnalytics.collected_revenue).toLocaleString()}`],
        ["Cash Collections", `KES ${Number(summaryAnalytics.manual_revenue).toLocaleString()}`],
        ["Mpesa Collections", `KES ${Number(summaryAnalytics.mpesa_revenue).toLocaleString()}`],
        ["All Entries (Visits)", summaryAnalytics.all_entries?.toString() || "0"],
        ["All Exits", summaryAnalytics.successful_exits?.toString() || "0"],
        ["Cash Exits", summaryAnalytics.manual_exits?.toString() || "0"],
        ["Mpesa Exits", summaryAnalytics.mpesa_exits?.toString() || "0"],
        ["Pending Exits", summaryAnalytics.pending_exits?.toString() || "0"],
        ["Free Exits", summaryAnalytics.unpaid_exits?.toString() || "0"],
        ["Tenant Exits", summaryAnalytics.tenant_exits?.toString() || "0"],
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
      pdf.text(`Period: ${selectedPeriod}`, 10, 35);

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
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card loading={summaryLoading}>
          <Space
            direction={screens.md ? "horizontal" : "vertical"}
            size={12}
            style={{ width: "100%", justifyContent: "space-between" }}
            wrap
          >
            <DatePicker.RangePicker
              value={summaryDateRange}
              onChange={setSummaryDateRange}
              format="YYYY-MM-DD"
              style={{ width: screens.md ? "auto" : "100%" }}
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
            Showing data from {summaryDateRange?.[0]?.format("YYYY-MM-DD")} to {summaryDateRange?.[1]?.format("YYYY-MM-DD")}
          </Text>
        </Card>

        {/* Section 1: Revenue & Exit Status Overview */}
        <Row gutter={[16, 16]}>
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
            <Card loading={summaryLoading}>
              <Statistic
                title="Free Exits"
                value={summaryAnalytics.unpaid_exits}
                valueStyle={{ color: "#eb2f96" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card loading={summaryLoading}>
              <Statistic
                title="Tenant Exits"
                value={summaryAnalytics.tenant_exits}
                valueStyle={{ color: "#1d39c4" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Section 2: Financial & Entry Totals */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card loading={summaryLoading}>
              <Statistic
                title="Cash Revenue"
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

        {/* Section 3: Exit Channels */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card loading={summaryLoading}>
              <Statistic
                title="Cash Exits"
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