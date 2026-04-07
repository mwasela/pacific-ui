import { Outlet, Link, useNavigate } from "react-router-dom";
import { FiUsers, FiMap, FiHome, FiDribbble, FiClipboard, FiSettings } from "react-icons/fi";
import React, { useEffect, useState } from "react";
import axios from "../helpers/axios";
import { Layout, Menu, Avatar, Dropdown, message } from "antd";
import { UserOutlined, LogoutOutlined  } from "@ant-design/icons";

const { Header, Sider, Content, Footer } = Layout;



export default function MainLayout() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);


    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get("/users/me");
                setUser(response.data);
            } catch (error) {
                message.error("Failed to fetch user data");
            }
        };
        if (token) {
            fetchUser();
        }
    }, [token, navigate]);

    const menuItems = [
        {
            key: "/",
            icon: <FiHome />,
            label: <Link to="/">Home</Link>,
        },
        {
            key: "/visits",
            icon: <FiMap />,
            label: <Link to="/visits">Visits</Link>,
        },
        {
            key: "/vipcash",
            icon: <FiClipboard />,
            label: <Link to="/vipcash">VIP Payments</Link>,
        },
        {
            key: "/vip",
            icon: <FiDribbble />,
            label: <Link to="/vip">VIP</Link>,
        },
        user && user.role === 1 && {
            key: "/users",
            icon: <FiUsers />,
            label: <Link to="/users">Users</Link>,
        },
        user && user.role === 1 && {
            key: "/settings",
            icon: <FiSettings />,
            label: <Link to="/settings">Settings</Link>,
        },
    ];

    const userMenuItems = [
        {
            key: "profile",
            icon: <UserOutlined />,
            label: "Profile",
            onClick: () => message.info("Profile page coming soon"),
        },
        {
            type: "divider",
        },
        {
            key: "logout",
            icon: <LogoutOutlined />,
            danger: true,
            label: "Log-out",
            onClick: () => {
                localStorage.removeItem("token");
                message.success("Logged out successfully");
                navigate("/login");
            },
        },
    ];

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider theme="dark" breakpoint="lg" collapsedWidth="0">
                <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, padding: "16px 20px" }}>
                    Pacific
                </div>
                <Menu theme="dark" mode="inline" items={menuItems} defaultSelectedKeys={["/"]} />
            </Sider>

            <Layout>
                <Header
                    style={{
                        background: "#fff",
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        padding: "0 20px",
                        borderBottom: "1px solid #f0f0f0",
                    }}
                >
                    <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                            <Avatar src="https://joeschmoe.io/api/v1/random" size="small" />
                            <span>{user ? user.username : "User"}</span>
                        </div>
                    </Dropdown>
                </Header>

                <Content style={{ padding: 24, minHeight: 360 }}>
                    <Outlet />
                </Content>

                <Footer style={{ textAlign: "center", background: "#fff", borderTop: "1px solid #f0f0f0" }}>
                    Medici Secure Services Limited powered by Nuricha (c) {new Date().getFullYear()}
                </Footer>
            </Layout>
        </Layout>
    );
}
