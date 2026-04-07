import React, { useEffect, useState } from "react";
import { Card, Descriptions, Tag, Button, Modal, Form, Input, InputNumber, Select, message } from "antd";
import axios from "../helpers/axios";

const statusLabelMap = {
  0: "Active",
  1: "Inactive",
};

const statusColorMap = {
  0: "#1677ff",
  1: "#ff4d4f",
};

export default function Settings() {
  const [form] = Form.useForm();
  const [setupRecord, setSetupRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSetup = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/setup");
      const payload = res.data;

      // Support object, array, or paginated list responses.
      const record = Array.isArray(payload)
        ? payload[0]
        : payload?.data
          ? (Array.isArray(payload.data) ? payload.data[0] : payload.data)
          : payload;

      setSetupRecord(record || null);
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to load setup details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetup();
  }, []);

  const openEditModal = () => {
    if (!setupRecord) return;

    form.setFieldsValue({
      parking_capacity: setupRecord.parking_capacity,
      parking_location: setupRecord.parking_location,
      parking_rate_monthly: setupRecord.parking_rate_monthly,
      status: Number(setupRecord.status ?? 0),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaveLoading(true);

      const payload = {
        parking_capacity: Number(values.parking_capacity),
        parking_location: values.parking_location,
        parking_rate_monthly: Number(values.parking_rate_monthly),
        status: Number(values.status),
      };

      if (setupRecord?.id) {
        await axios.put(`/setup/${setupRecord.id}`, payload);
      } else {
        await axios.post("/setup", payload);
      }

      message.success("Setup updated successfully");
      closeModal();
      fetchSetup();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.response?.data?.message || "Failed to update setup");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      <Card
        title="System Setup"
        style={{ margin: 24 }}
        loading={loading}
        extra={
          <Button type="primary" onClick={openEditModal} disabled={!setupRecord}>
            Edit
          </Button>
        }
      >
        {setupRecord ? (
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="Parking Capacity">
              {setupRecord.parking_capacity ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Parking Location">
              {setupRecord.parking_location ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Monthly Parking Rate">
              KES {Number(setupRecord.parking_rate_monthly || 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag
                style={{
                  backgroundColor: "transparent",
                  borderColor: statusColorMap[Number(setupRecord.status)] || "#8c8c8c",
                  color: statusColorMap[Number(setupRecord.status)] || "#8c8c8c",
                  borderRadius: 999,
                  paddingInline: 10,
                }}
              >
                {statusLabelMap[Number(setupRecord.status)] || setupRecord.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {setupRecord.updatedAt ? new Date(setupRecord.updatedAt).toLocaleString() : "-"}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <div>No setup record found.</div>
        )}
      </Card>

      <Modal
        title="Edit Setup"
        open={isModalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        okText="Save"
        confirmLoading={saveLoading}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="parking_capacity"
            label="Parking Capacity"
            rules={[{ required: true, message: "Please enter parking capacity" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="parking_location"
            label="Parking Location"
            rules={[{ required: true, message: "Please enter parking location" }]}
          >
            <Input placeholder="e.g. Nairobi CBD" />
          </Form.Item>

          <Form.Item
            name="parking_rate_monthly"
            label="Monthly Parking Rate"
            rules={[{ required: true, message: "Please enter monthly parking rate" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select
              options={[
                { value: 0, label: "Active" },
                { value: 1, label: "Inactive" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
