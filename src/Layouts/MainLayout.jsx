import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { FiUsers, FiMap, FiHome, FiDribbble, FiClipboard, FiSettings, FiClock, FiCheckCircle, FiCreditCard, FiActivity, FiAward, FiMenu } from "react-icons/fi";
import React, { useEffect, useState, useContext } from "react";
import axios from "../helpers/axios";
import { Layout, Menu, Avatar, Dropdown, message, Typography, Grid, Button } from "antd";
import { UserOutlined, LogoutOutlined  } from "@ant-design/icons";
import logo from "../assets/logo.png";
import avatarIcon from "../assets/avatar.png";
import { TitleContext } from "../context/TitleContext";


const { Title } = Typography;


const { Header, Sider, Content, Footer } = Layout;


export default function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const { pageTitle } = useContext(TitleContext);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const screens = Grid.useBreakpoint();
    const [touchStart, setTouchStart] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    // Close sidebar when route changes
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    // Touch handlers for swipe detection
    const handleTouchStart = (e) => {
        setTouchStart(e.touches[0].clientX);
    };

    const handleTouchEnd = (e) => {
        if (!touchStart) return;
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchEnd - touchStart;

        // Swipe from left edge (0-50px) to the right
        if (touchStart < 50 && diff > 50 && !screens.lg) {
            setSidebarOpen(true);
        }
        setTouchStart(null);
    };

    useEffect(() => {
        document.addEventListener("touchstart", handleTouchStart);
        document.addEventListener("touchend", handleTouchEnd);
        return () => {
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    }, [touchStart, screens.lg]);


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
            {screens.lg && (
                <Sider 
                    theme="dark"
                    style={{ 
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        height: '100vh',
                        zIndex: 999,
                        overflow: 'auto'
                    }}
                    width={200}
                >
                    <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, padding: "16px 20px" }}>
                        Pacific Crest Mall
                    </div>
                    <Menu theme="dark" mode="inline" items={menuItems} defaultSelectedKeys={["/"]} />
                </Sider>
            )}

            {!screens.lg && sidebarOpen && (
                <>
                    {/* Overlay backdrop */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 998,
                            transition: 'opacity 0.3s'
                        }}
                        onClick={() => setSidebarOpen(false)}
                    />
                    <Sider 
                        theme="dark"
                        style={{ 
                            position: 'fixed',
                            left: 0,
                            top: 0,
                            height: '100vh',
                            zIndex: 999,
                            overflow: 'auto'
                        }}
                        width={200}
                    >
                        <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, padding: "16px 20px" }}>
                            Pacific Crest Mall
                        </div>
                        <Menu 
                            theme="dark" 
                            mode="inline" 
                            items={menuItems} 
                            defaultSelectedKeys={["/"]}
                            onClick={() => setSidebarOpen(false)}
                        />
                    </Sider>
                </>
            )}

            <Layout style={{ marginLeft: screens.lg ? 200 : 0 }}>
                <Header
                    style={{
                        background: "#fff",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0 20px",
                        borderBottom: "1px solid #f0f0f0",
                        height: 64,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        {!screens.lg && (
                            <Button 
                                type="text" 
                                icon={<FiMenu size={20} />}
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                            />
                        )}
                        {pageTitle && (
                            <Title level={3} style={{ margin: 0 }}>
                                {pageTitle}
                            </Title>
                        )}
                    </div>
                    <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                            <Avatar src={avatarIcon} size="small" />
                            <span>{user ? user.username : "User"}</span>
                        </div>
                    </Dropdown>
                </Header>

                <Content 
                    style={{ padding: 24, minHeight: 360, overflow: 'auto' }}
                    onClick={() => !screens.lg && sidebarOpen && setSidebarOpen(false)}
                >
                    <Outlet />
                </Content>

                <Footer style={{ textAlign: "center", background: "#fff", borderTop: "1px solid #f0f0f0" }}>
                    Medici Secure Services Limited powered by Nuricha (c) {new Date().getFullYear()}
                </Footer>
            </Layout>
        </Layout>
    );
}
