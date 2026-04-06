import { ConfigProvider, notification, Form, Input, Checkbox, Button, Card } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "../../helpers/axios";


export default function Login() {
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    if (token) {
        //remove token
        localStorage.removeItem("token");
    }

    return (
        <ConfigProvider
            theme={{
                token: {
                    fontFamily: "Inter, sans-serif",
                    colorPrimary: "#091f24",
                },
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    backgroundColor: "#f0f2f5",
                }}
            >
                <Card style={{ width: 360 }}>
                    <Form
                        name="login"
                        layout="vertical"
                        initialValues={{ remember: true }}
                        onFinish={async (values) => {
                            try {
                                const response = await axios.post("/users/login", {
                                    username: values.username,
                                    password: values.password,
                                });
                                localStorage.setItem("token", response.data.token);
                                notification.success({
                                    message: "Login successful",
                                    description: "You have successfully logged in",
                                });
                                navigate("/");
                            } catch (error) {
                                notification.error({
                                    message: "Login failed",
                                    description: error.response?.data?.message || "An error occurred",
                                });
                            }
                        }}
                    >
                        <Form.Item
                            name="username"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter your username!",
                                },
                            ]}
                        >
                            <Input size="large" prefix={<UserOutlined />} placeholder="Username" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter your password!",
                                },
                            ]}
                        >
                            <Input.Password size="large" prefix={<LockOutlined />} placeholder="Password" />
                        </Form.Item>

                        <Form.Item name="remember" valuePropName="checked">
                            <Checkbox>Remember me</Checkbox>
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0 }}>
                            <Button type="primary" htmlType="submit" block size="large">
                                Login
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </ConfigProvider>
    );
}