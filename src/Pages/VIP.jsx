import React, { useEffect, useState } from "react";
import { Card, Table, Tag, message, Button, Modal, Form, Input, Select, Row, Col, DatePicker } from "antd";
import axios from "../helpers/axios";
import dayjs from "dayjs";

// vip_status: 1 = Active, 0 = Inactive
const vipStatusColorMap = {
    1: "#52c41a",
    0: "#ff4d4f",
};

const vipStatusLabelMap = {
    1: "Active",
    0: "Inactive",
};

export default function VIP() {
    const [form] = Form.useForm();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [STKpushModal, setSTKpushModal] = useState(false);
    const [STKpushModalData, setSTKpushModalData] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const canEdit = currentUser?.role === 1 || currentUser?.user_type === 1;

    useEffect(() => {
        axios.get("/users/me")
            .then((res) => setCurrentUser(res.data))
            .catch(() => {});
    }, []);

    const fetchVIP = async (page = 1, limit = 10) => {
        setLoading(true);
        try {
            const res = await axios.get("/vip", { params: { page, limit } });
            const payload = res.data;
            const rows = payload?.data || (Array.isArray(payload) ? payload : []);
            const total = payload?.pagination?.total_items ?? (Array.isArray(payload) ? payload.length : 0);

            setData(rows);
            setPagination({ current: page, pageSize: limit, total });
        } catch (error) {
            message.error(error.response?.data?.message || "Failed to fetch VIP records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVIP(1, pagination.pageSize);
    }, []);

    const openCreateModal = () => {
        setEditingRecord(null);
        form.resetFields();
        form.setFieldsValue({ vip_status: 1, vip_expiry: dayjs().add(1, 'year') });
        setIsModalOpen(true);
    };

    const openEditModal = (record) => {
        setEditingRecord(record);
        form.setFieldsValue({
            fname: record.fname,
            lname: record.lname,
            email: record.email,
            phone_number: record.phone_number,
            vehicle_number: record.vehicle_number,
            vip_status: record.vip_status,
            vip_expiry: record.vip_expiry ? dayjs(record.vip_expiry) : null,
        });
        setIsModalOpen(true);
    };

    const openSTKpushModal = (record) => {
        setSTKpushModalData(record);
        setSTKpushModal(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRecord(null);
        form.resetFields();
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setSaveLoading(true);

            const payload = {
                fname: values.fname,
                lname: values.lname,
                email: values.email,
                phone_number: values.phone_number,
                vehicle_number: values.vehicle_number,
                vip_status: Number(values.vip_status),

            };

            if (editingRecord) {
                await axios.put(`/vip/${editingRecord.id}`, payload);
                message.success("VIP record updated successfully");
            } else {
                await axios.post("/vip", payload);
                message.success("VIP record created successfully");
            }

            closeModal();
            fetchVIP(pagination.current, pagination.pageSize);
        } catch (error) {
            if (error?.errorFields) return;
            message.error(error.response?.data?.message || "Failed to save VIP record");
        } finally {
            setSaveLoading(false);
        }
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            width: 70,
        },
        {
            title: "First Name",
            dataIndex: "fname",
            width: 130,
        },
        {
            title: "Last Name",
            dataIndex: "lname",
            width: 130,
        },
        {
            title: "Email",
            dataIndex: "email",
            width: 200,
            ellipsis: true,
        },
        {
            title: "Phone",
            dataIndex: "phone_number",
            width: 150,
        },
        {
            title: "Vehicle Number",
            dataIndex: "vehicle_number",
            width: 150,
            render: (plate) => plate ? (
                <Tag style={{
                    backgroundColor: "transparent",
                    borderColor: "#1677ff",
                    color: "#1677ff",
                    borderRadius: 999,
                    paddingInline: 10,
                }}>
                    {plate}
                </Tag>
            ) : "-",
        },
        {
            title: "VIP Status",
            dataIndex: "vip_status",
            width: 120,
            render: (status) => {
                const color = vipStatusColorMap[Number(status)] ?? "#8c8c8c";
                return (
                    <Tag style={{
                        backgroundColor: "transparent",
                        borderColor: color,
                        color,
                        borderRadius: 999,
                        paddingInline: 10,
                    }}>
                        {vipStatusLabelMap[Number(status)] ?? status}
                    </Tag>
                );
            },
        },
        {
            title: "VIP Expiry",
            dataIndex: "vip_expiry",
            width: 170,
            render: (value) => value ? new Date(value).toLocaleDateString() : "-",
        },
        {
            title: "Actions",
            dataIndex: "actions",
            fixed: "right",
            width: 230,
            render: (_, record) => (
                <div style={{ display: "flex", gap: 8, flexWrap: "nowrap" }}>
                    <Button
                        type="primary"
                        disabled={!canEdit}
                        onClick={() => openEditModal(record)}
                    >
                        Edit
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => openSTKpushModal(record)}
                    >
                        M-pesa Payment
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Card
                title="VIP Records"
                style={{ margin: 24 }}
                extra={
                    <Button type="primary" onClick={openCreateModal}>
                        Add VIP
                    </Button>
                }
            >
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
                    onChange={(pager) => fetchVIP(pager.current, pager.pageSize)}
                />
            </Card>

            <Modal
                title={editingRecord ? "Edit VIP Record" : "Add VIP Record"}
                open={isModalOpen}
                onCancel={closeModal}
                onOk={handleSave}
                confirmLoading={saveLoading}
                okText={editingRecord ? "Update" : "Create"}
                destroyOnClose
            >
                <Form form={form} layout="vertical">
                    <Row gutter={12}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="fname"
                                label="First Name"
                                rules={[{ required: true, message: "Please enter first name" }]}
                            >
                                <Input placeholder="John" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="lname"
                                label="Last Name"
                                rules={[{ required: true, message: "Please enter last name" }]}
                            >
                                <Input placeholder="Doe" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: "Please enter email" },
                            { type: "email", message: "Please enter a valid email" },
                        ]}
                    >
                        <Input placeholder="john@example.com" />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="phone_number"
                                label="Phone Number"
                                rules={[
                                    { required: true, message: "Please enter phone number" },
                                    { pattern: /^\d{10,15}$/, message: "Use 10 to 15 digits" },
                                ]}
                            >
                                <Input placeholder="e.g. 0758337870" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="vehicle_number"
                                label="Vehicle Number"
                                rules={[{ required: true, message: "Please enter vehicle number" }]}
                            >
                                <Input placeholder="e.g. KBC123A" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={12}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="vip_status"
                                label="VIP Status"
                                rules={[{ required: true, message: "Please select status" }]}
                            >
                                        <Select options={[
                                    { value: 1, label: "Active" },
                                    { value: 0, label: "Inactive" },
                                ]} />
                            </Form.Item>
                        </Col>
       
                    </Row>
                </Form>
            </Modal>

                <Modal  
                    title="STK Push"
                    open={STKpushModal}
                    onCancel={() => setSTKpushModal(false)}
                    footer={null}
                >
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                        <Form
                            layout="vertical"
                            onFinish={async (values) => {
                                try {
                                    await axios.post("/payment/vip", {
                                        phone_number: values.phone_number,
                                        vip_id: STKpushModalData.id,
                                    });
                                    message.success("STK Push initiated successfully");
                                    setSTKpushModal(false);
                                }
                                catch (error) {
                                    message.error(error.response?.data?.message || "Failed to initiate STK Push");
                                }
                            }}
                        >
                            <Form.Item
                                name="phone_number"
                                label="Phone Number"
                                rules={[
                                    { required: true, message: "Please enter phone number" },
                                    { pattern: /^\d{10,15}$/, message: "Use 10 to 15 digits" },
                                ]}
                            >
                                <Input placeholder="e.g. 0758337870" />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" block>
                                    Send STK Push
                                </Button>
                            </Form.Item>
                        </Form>
                        </Col>
                    </Row>
                
                </Modal>


        </>
    );
}
