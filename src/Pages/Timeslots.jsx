import React, { useEffect, useState, useContext } from 'react'
import { Card, Row, Col, DatePicker, Button, message, Space, Statistic } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import axios from "../helpers/axios";
import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TitleContext } from "../context/TitleContext";

export default function Timeslots() {
  const { setPageTitle } = useContext(TitleContext);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [chartType, setChartType] = useState("bar"); // bar or line
  const [viewMode, setViewMode] = useState("traffic"); // traffic, income, or both
  const [tablePage, setTablePage] = useState(1);
  const pageSize = 20;
  const [stats, setStats] = useState({ 
    totalEntries: 0, 
    totalExits: 0, 
    peakHour: "", 
    peakEntries: 0,
    totalIncome: 0,
    totalTransactions: 0,
    peakIncomeHour: "",
    peakIncomeAmount: 0
  });

  useEffect(() => {
    setPageTitle("Income Graphs");
    return () => setPageTitle("");
  }, [setPageTitle]);

  const fetchTimeslotData = async (from = fromDate, to = toDate) => {
    setLoading(true);
    try {
      const params = {};
      
      if (from) {
        params.from = from.format("YYYY-MM-DD");
      }
      
      if (to) {
        params.to = to.format("YYYY-MM-DD");
      }
      
      const res = await axios.get("/analytics/income-per-slot", { params });
      
      if (res.data && res.data.data) {
        const data = res.data.data;
        setChartData(data);
        
        // Calculate traffic statistics
        const totalEntries = data.reduce((sum, slot) => sum + (slot.entries || 0), 0);
        const totalExits = data.reduce((sum, slot) => sum + (slot.exits || 0), 0);
        
        // Calculate income statistics
        const totalIncome = data.reduce((sum, slot) => sum + (slot.total_income || 0), 0);
        const totalTransactions = data.reduce((sum, slot) => sum + (slot.transaction_count || 0), 0);
        
        // Find peak traffic hour
        let maxEntries = 0;
        let peakHourSlot = "";
        data.forEach(slot => {
          if (slot.entries > maxEntries) {
            maxEntries = slot.entries;
            peakHourSlot = slot.time_slot;
          }
        });
        
        // Find peak income hour
        let maxIncome = 0;
        let peakIncomeHourSlot = "";
        data.forEach(slot => {
          if (slot.total_income > maxIncome) {
            maxIncome = slot.total_income;
            peakIncomeHourSlot = slot.time_slot;
          }
        });
        
        setStats({
          totalEntries,
          totalExits,
          peakHour: peakHourSlot,
          peakEntries: maxEntries,
          totalIncome,
          totalTransactions,
          peakIncomeHour: peakIncomeHourSlot,
          peakIncomeAmount: maxIncome
        });
      }
    } catch (error) {
      message.error("Failed to fetch timeslot data");
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTimeslotData();
  }, []);

  const handleFilterApply = () => {
    fetchTimeslotData(fromDate, toDate);
  };

  const handleClearFilters = () => {
    setFromDate(null);
    setToDate(null);
    fetchTimeslotData(null, null);
  };

  const downloadPDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Title
      doc.setFontSize(16);
      doc.text("Traffic Report Per Time Slot", pageWidth / 2, 20, { align: "center" });
      
      // Date range info
      doc.setFontSize(10);
      const dateRangeText = fromDate && toDate 
        ? `${fromDate.format("YYYY-MM-DD")} to ${toDate.format("YYYY-MM-DD")}`
        : "Past 24 Hours";
      doc.text(`Date Range: ${dateRangeText}`, pageWidth / 2, 30, { align: "center" });
      doc.text(`Generated: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`, pageWidth / 2, 36, { align: "center" });
      
      // Statistics
      doc.setFontSize(11);
      doc.text("Summary Statistics", 14, 50);
      doc.setFontSize(10);
      doc.text(`Total Entries: ${stats.totalEntries}`, 14, 58);
      doc.text(`Total Exits: ${stats.totalExits}`, 14, 64);
      doc.text(`Peak Traffic Hour: ${stats.peakHour} (${stats.peakEntries} entries)`, 14, 70);
      doc.text(`Total Income: KES ${stats.totalIncome.toLocaleString()}`, 14, 76);
      doc.text(`Total Transactions: ${stats.totalTransactions}`, 14, 82);
      doc.text(`Peak Income Hour: ${stats.peakIncomeHour} (KES ${stats.peakIncomeAmount.toLocaleString()})`, 14, 88);
      
      // Table
      const tableData = chartData.map(slot => [
        slot.time_slot,
        slot.entries,
        slot.exits,
        slot.entries + slot.exits,
        `KES ${Number(slot.total_income || 0).toLocaleString()}`,
        slot.transaction_count
      ]);
      
      autoTable(doc, {
        head: [["Time Slot", "Entries", "Exits", "Total Visits", "Income", "Transactions"]],
        body: tableData,
        startY: 100,
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
        headerStyles: { fillColor: [25, 118, 210], textColor: [255, 255, 255] }
      });
      
      doc.save(`traffic-report-${dayjs().format("YYYY-MM-DD-HHmmss")}.pdf`);
      message.success("Report downloaded successfully");
    } catch (error) {
      message.error("Failed to generate PDF report");
      console.error(error);
    }
  };

  const formatXAxis = (timeSlot) => {
    if (!timeSlot) return "";
    try {
      const date = new Date(timeSlot);
      return date.toLocaleTimeString("en-US", { hour: "2-digit", hour12: false });
    } catch {
      return timeSlot;
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: "#fff", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}>
          <p style={{ margin: "4px 0", fontSize: "12px" }}>
            <strong>{new Date(data.time_slot).toLocaleString()}</strong>
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: "4px 0", fontSize: "12px", color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: "12px" }}>
      <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "24px" }}>
        Traffic Reports Per Time Slot
      </div>

      {/* Filter Section */}
      <Card title="Filter by Time Range" style={{ marginBottom: "24px" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              From Date
            </label>
            <DatePicker
              value={fromDate}
              onChange={(date) => setFromDate(date)}
              style={{ width: "100%" }}
              placeholder="Select start date"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              To Date
            </label>
            <DatePicker
              value={toDate}
              onChange={(date) => setToDate(date)}
              style={{ width: "100%" }}
              placeholder="Select end date"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Chart Type
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
            </select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              View Mode
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            >
              <option value="traffic">Traffic Analysis</option>
              <option value="income">Income Analysis</option>
              <option value="both">Combined View</option>
            </select>
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
              disabled={chartData.length === 0}
            >
              Download PDF
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        {(viewMode === "traffic" || viewMode === "both") && (
          <>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Entries"
                  value={stats.totalEntries}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Exits"
                  value={stats.totalExits}
                  valueStyle={{ color: "#ff4d4f" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <Card>
                <Statistic
                  title="Peak Traffic Hour"
                  value={`${stats.peakHour} (${stats.peakEntries} entries)`}
                  valueStyle={{ color: "#1890ff", fontSize: "14px" }}
                />
              </Card>
            </Col>
          </>
        )}
        {(viewMode === "income" || viewMode === "both") && (
          <>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Income"
                  value={`KES ${stats.totalIncome.toLocaleString()}`}
                  valueStyle={{ color: "#faad14" }}
                //   prefix="💰 "
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Transactions"
                  value={stats.totalTransactions}
                  valueStyle={{ color: "#722ed1" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <Card>
                <Statistic
                  title="Peak Income Hour"
                  value={`${stats.peakIncomeHour} (KES ${stats.peakIncomeAmount.toLocaleString()})`}
                  valueStyle={{ color: "#faad14", fontSize: "14px" }}
                />
              </Card>
            </Col>
          </>
        )}
      </Row>

      {/* Chart Section */}
      <Card title="Hourly Traffic Distribution" loading={loading} style={{ marginBottom: "24px", display: viewMode === "traffic" || viewMode === "both" ? "block" : "none" }}>
        {chartData.length > 0 ? (
          <div style={{ width: "100%", height: "400px" }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time_slot"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                    formatter={formatXAxis}
                  />
                  <YAxis label={{ value: "Count", angle: -90, position: "insideLeft" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="entries" fill="#52c41a" name="Entries" />
                  <Bar dataKey="exits" fill="#ff4d4f" name="Exits" />
                </BarChart>
              ) : (
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time_slot"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                    formatter={formatXAxis}
                  />
                  <YAxis label={{ value: "Count", angle: -90, position: "insideLeft" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="entries"
                    stroke="#52c41a"
                    name="Entries"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="exits"
                    stroke="#ff4d4f"
                    name="Exits"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            No data available for the selected date range
          </div>
        )}
      </Card>

      {/* Income Chart Section */}
      <Card title="Hourly Income Distribution" loading={loading} style={{ marginBottom: "24px", display: viewMode === "income" || viewMode === "both" ? "block" : "none" }}>
        {chartData.length > 0 ? (
          <div style={{ width: "100%", height: "400px" }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time_slot"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                    formatter={formatXAxis}
                  />
                  <YAxis label={{ value: "Income (KES)", angle: -90, position: "insideLeft" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="total_income" fill="#faad14" name="Income (KES)" />
                </BarChart>
              ) : (
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time_slot"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                    formatter={formatXAxis}
                  />
                  <YAxis label={{ value: "Income (KES)", angle: -90, position: "insideLeft" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_income"
                    stroke="#faad14"
                    name="Income (KES)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            No data available for the selected date range
          </div>
        )}
      </Card>

      {/* Data Table */}
      <Card title="Detailed Time Slot Data">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#fafafa", borderBottom: "2px solid #d9d9d9" }}>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>Time Slot</th>
                {(viewMode === "traffic" || viewMode === "both") && (
                  <>
                    <th style={{ padding: "12px", textAlign: "center", fontWeight: 600, color: "#52c41a" }}>
                      Entries
                    </th>
                    <th style={{ padding: "12px", textAlign: "center", fontWeight: 600, color: "#ff4d4f" }}>
                      Exits
                    </th>
                    <th style={{ padding: "12px", textAlign: "center", fontWeight: 600 }}>
                      Total Visits
                    </th>
                  </>
                )}
                {(viewMode === "income" || viewMode === "both") && (
                  <>
                    <th style={{ padding: "12px", textAlign: "center", fontWeight: 600, color: "#faad14" }}>
                      Income (KES)
                    </th>
                    <th style={{ padding: "12px", textAlign: "center", fontWeight: 600, color: "#722ed1" }}>
                      Transactions
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {chartData.slice((tablePage - 1) * pageSize, tablePage * pageSize).map((slot, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    backgroundColor: index % 2 === 0 ? "#fafafa" : "white"
                  }}
                >
                  <td style={{ padding: "12px" }}>
                    {new Date(slot.time_slot).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    })}
                  </td>
                  {(viewMode === "traffic" || viewMode === "both") && (
                    <>
                      <td style={{ padding: "12px", textAlign: "center", color: "#52c41a", fontWeight: 500 }}>
                        {slot.entries}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", color: "#ff4d4f", fontWeight: 500 }}>
                        {slot.exits}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: 500 }}>
                        {slot.entries + slot.exits}
                      </td>
                    </>
                  )}
                  {(viewMode === "income" || viewMode === "both") && (
                    <>
                      <td style={{ padding: "12px", textAlign: "center", color: "#faad14", fontWeight: 500 }}>
                        KES {Number(slot.total_income || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", color: "#722ed1", fontWeight: 500 }}>
                        {slot.transaction_count || 0}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {chartData.length > pageSize && (
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
              <Button
                onClick={() => setTablePage(prev => Math.max(1, prev - 1))}
                disabled={tablePage === 1}
              >
                Previous
              </Button>
              <span style={{ lineHeight: "32px", padding: "0 12px" }}>
                Page {tablePage} of {Math.ceil(chartData.length / pageSize)}
              </span>
              <Button
                onClick={() => setTablePage(prev => Math.min(Math.ceil(chartData.length / pageSize), prev + 1))}
                disabled={tablePage >= Math.ceil(chartData.length / pageSize)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
