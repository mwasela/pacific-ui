import { Outlet, Link, useNavigate } from "react-router-dom";
import { FiUsers, FiMap, FiHome, FiDribbble, FiClipboard, FiSettings, FiClock, FiCheckCircle, FiCreditCard, FiActivity, FiAward } from "react-icons/fi";
import React, { useEffect, useState } from "react";
import axios from "../helpers/axios";
import { Layout, Menu, Avatar, Dropdown, message } from "antd";
import { UserOutlined, LogoutOutlined  } from "@ant-design/icons";
import logo from "../assets/logo.png";


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
               user && user.role === 1 && {
            key: "/manual",
            icon: <FiClipboard />,
            label: <Link to="/manual">Manual Exits</Link>,
        },
        {
            key: "/vipcash",
            icon: <FiCreditCard />,
            label: <Link to="/vipcash">Tenants Payments</Link>,
        },
        {
            key: "/vip",
            icon: <FiDribbble />,
            label: <Link to="/vip">Tenants</Link>,
        },
        {
            key: "/reports",
            icon: <FiClipboard />,
            label: <Link to="/reports">Reports</Link>,
        },
        user && (user.role === 1 || user.role === 2) && {
            key: "/financial",
            icon: <FiCheckCircle />,
            label: <Link to="/financial">Financial</Link>,
        },
        user && user.role === 1 && {
            key: "/viplogs",
            icon: <FiActivity />,
            label: <Link to="/viplogs">Tenant Logs</Link>,
        },
        user && user.role === 1 && {
            key: "/timeslots",
            icon: <FiClock />,
            label: <Link to="/timeslots">Income Graphs</Link>,
        },
        user && user.role === 1 && {
            key: "/confee",
            icon: <FiAward />,
            label: <Link to="/confee">Convenience Fees</Link>,
        },
        user && user.role === 1 && {
            key: "/settings",
            icon: <FiSettings />,
            label: <Link to="/settings">Settings</Link>,
        },
        user && user.role === 1 && {
            key: "/users",
            icon: <FiUsers />,
            label: <Link to="/users">Users</Link>,
        },
        //logoutmenuitem
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
    ].filter(Boolean); // Filter out null values for menu items based on user role
    


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
            <Sider 
                theme="dark" 
                breakpoint="lg" 
                collapsedWidth="0"
                style={{ 
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    height: '100vh',
                    zIndex: 999,
                    overflow: 'auto'
                }}
            >
                <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, padding: "16px 20px" }}>
                    Pacific Crest Mall
                </div>
                {/* <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <img src={logo} alt="Logo" style={{ width: 120, height: "auto" }} />
                </div> */}
                <Menu theme="dark" mode="inline" items={menuItems} defaultSelectedKeys={["/"]} />
            </Sider>

            <Layout style={{ marginLeft: 200 }}>
                <Header
                    style={{
                        background: "#fff",
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        padding: "0 20px",
                        borderBottom: "1px solid #f0f0f0",
                        height: 32,
                    }}
                >
                    <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                            <Avatar src="https://joeschmoe.io/api/v1/random" size="small" />
                            <span>{user ? user.username : "User"}</span>
                        </div>
                    </Dropdown>
                </Header>

                <Content style={{ padding: 24, minHeight: 360, overflow: 'auto' }}>
                    <Outlet />
                </Content>

                <Footer style={{ textAlign: "center", background: "#fff", borderTop: "1px solid #f0f0f0" }}>
                    Medici Secure Services Limited powered by Nuricha (c) {new Date().getFullYear()}
                </Footer>
            </Layout>
        </Layout>
    );
}
