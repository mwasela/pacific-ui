import React, { useEffect, useState } from "react";
import { Card, Table, message, Button, Modal, Form, Input, Select, Space, Tag } from "antd";
import axios from "../helpers/axios";


const roleMap = {
    1: "System Admin",
    2: "Site Manager",
    3: "User",
};

const statusMap = {
    0: "Active",
    1: "Inactive",
};

export default function Users() {
    const [form] = Form.useForm();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const openCreateModal = () => {
        setEditingUser(null);
        form.resetFields();
        form.setFieldsValue({ role: 3, status: 0 });
        setIsModalOpen(true);
    };

    const openEditModal = (record) => {
        setEditingUser(record);
        form.setFieldsValue({
            username: record.username,
            email: record.email,
            phone_number: record.phone_number,
            role: record.role,
            status: record.status,
            password: "",
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        form.resetFields();
    };

    const handleSaveUser = async () => {
        try {
            const values = await form.validateFields();
            setSaveLoading(true);

            const payload = {
                username: values.username,
                email: values.email,
                phone_number: values.phone_number,
                role: Number(values.role),
                status: Number(values.status),
            };

            if (values.password) {
                payload.password = values.password;
            }

            if (editingUser) {
                await axios.put(`/users/${editingUser.id}`, payload);
                message.success("User updated successfully");
            } else {
                await axios.post("/users/register", {
                    ...payload,
                    password: values.password,
                });
                message.success("User created successfully");
            }

            closeModal();
            fetchUsers(pagination.current, pagination.pageSize);
        } catch (error) {
            if (error?.errorFields) {
                return;
            }
            message.error(error.response?.data?.message || "Failed to save user");
        } finally {
            setSaveLoading(false);
        }
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
        },
        {
            title: "Name",
            dataIndex: "username",
        },
        {
            title: "Email",
            dataIndex: "email",
        },
        {
            title: "Role",
            dataIndex: "role",
            render: (role) => {
                const roleColorMap = {
                    1: "#1677ff",
                    2: "#fa8c16",
                    3: "#52c41a",
                };
                const roleColor = roleColorMap[Number(role)] || "#8c8c8c";

                return (
                    <Tag
                        style={{
                            backgroundColor: "transparent",
                            borderColor: roleColor,
                            color: roleColor,
                            borderRadius: 999,
                            paddingInline: 10,
                        }}
                    >
                        {roleMap[role] || role}
                    </Tag>
                );
            },
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (status) => {
                const isActive = Number(status) === 0;
                return (
                    <Tag
                        style={{
                            backgroundColor: "transparent",
                            borderColor: isActive ? "#1677ff" : "#ff4d4f",
                            color: isActive ? "#1677ff" : "#ff4d4f",
                            borderRadius: 999,
                            paddingInline: 10,
                        }}
                    >
                        {statusMap[status] || status}
                    </Tag>
                );
            },
        },
        {
            title: "Actions",
            dataIndex: "actions",
            render: (_, record) => (
                <Button type="primary" onClick={() => openEditModal(record)}>
                    Edit
                </Button>
            ),
        }
    ];

    const fetchUsers = async (current = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const res = await axios.get("/users", {
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
            message.error(error.response?.data?.message || "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(1, pagination.pageSize);
    }, []);

    return (
        <>
            <Card
                title="Users"
                style={{ margin: 24 }}
                extra={
                    <Button type="primary" onClick={openCreateModal}>
                        Add User
                    </Button>
                }
            >
                <Table
                    rowKey="id"
                    loading={loading}
                    scroll={{x: 'max-content'}}
                    columns={columns}
                    dataSource={data}
                    pagination={pagination}
                    onChange={(pager) => fetchUsers(pager.current, pager.pageSize)}
                />
            </Card>

            <Modal
                title={editingUser ? "Edit User" : "Add User"}
                open={isModalOpen}
                onCancel={closeModal}
                onOk={handleSaveUser}
                confirmLoading={saveLoading}
                okText={editingUser ? "Update" : "Create"}
                destroyOnClose
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="username"
                        label="Username"
                        rules={[
                            { required: true, message: "Please enter username" },
                            { min: 3, message: "Username must be at least 3 characters" },
                        ]}
                    >
                        <Input placeholder="Enter username" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[
                            {
                                required: !editingUser,
                                message: "Please enter password",
                            },
                            {
                                min: 6,
                                message: "Password must be at least 6 characters",
                            },
                        ]}
                    >
                        <Input.Password placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"} />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: "Please enter email" },
                            { type: "email", message: "Please enter a valid email" },
                        ]}
                    >
                        <Input placeholder="Enter email" />
                    </Form.Item>

                    <Form.Item
                        name="phone_number"
                        label="Phone Number"
                        rules={[
                            { required: true, message: "Please enter phone number" },
                            { pattern: /^\d{10,15}$/, message: "Use 10 to 15 digits" },
                        ]}
                    >
                        <Input placeholder="Enter phone number" />
                    </Form.Item>

                    <Space size={12} style={{ width: "100%" }}>
                        <Form.Item
                            name="role"
                            label="Role"
                            rules={[{ required: true, message: "Please select role" }]}
                            style={{ flex: 1, marginBottom: 0 }}
                        >
                            <Select
                                options={[
                                    { value: 1, label: "System Admin" },
                                    { value: 2, label: "Site Manager" },
                                    { value: 3, label: "User" },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item
                            name="status"
                            label="Status"
                            rules={[{ required: true, message: "Please select status" }]}
                            style={{ flex: 1, marginBottom: 0 }}
                        >
                            <Select
                                options={[
                                    { value: 0, label: "Active" },
                                    { value: 1, label: "Inactive" },
                                ]}
                            />
                        </Form.Item>
                    </Space>
                </Form>
            </Modal>
        </>
    );
}
