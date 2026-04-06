import { ConfigProvider, notification, Form, Input, Button, Card, Row, Col } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../helpers/axios";

export default function Register() {
  const navigate = useNavigate();

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
          minHeight: "100vh",
          backgroundColor: "#f0f2f5",
          padding: "24px 16px",
        }}
      >
        <Card title="Create account" style={{ width: "100%", maxWidth: 1100 }}>
          <Form
            name="register"
            layout="vertical"
            onFinish={async (values) => {
              try {
                await axios.post("/users/register", {
                  username: values.username,
                  password: values.password,
                  email: values.email,
                  phone_number: values.phone_number,
                });

                notification.success({
                  message: "Registration successful",
                  description: "Your account has been created. Please log in.",
                });
                navigate("/login");
              } catch (error) {
                notification.error({
                  message: "Registration failed",
                  description: error.response?.data?.message || "An error occurred",
                });
              }
            }}
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="username"
                  label="Username"
                  rules={[
                    { required: true, message: "Please enter your username" },
                    { min: 3, message: "Username must be at least 3 characters" },
                  ]}
                >
                  <Input size="large" prefix={<UserOutlined />} placeholder="Wolfking" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: "Please enter your password" },
                    { min: 6, message: "Password must be at least 6 characters" },
                  ]}
                >
                  <Input.Password size="large" prefix={<LockOutlined />} placeholder="!@#$%^" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Please enter your email" },
                    { type: "email", message: "Please enter a valid email" },
                  ]}
                >
                  <Input size="large" prefix={<MailOutlined />} placeholder="wolfking@example.com" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="phone_number"
                  label="Phone Number"
                  rules={[
                    { required: true, message: "Please enter your phone number" },
                    {
                      pattern: /^\d{10,15}$/,
                      message: "Use 10 to 15 digits",
                    },
                  ]}
                >
                  <Input size="large" prefix={<PhoneOutlined />} placeholder="0758337870" />
                </Form.Item>
              </Col>

            </Row>

            <Form.Item style={{ marginBottom: 8 }}>
              <Button type="primary" htmlType="submit" block size="large">
                Register
              </Button>
            </Form.Item>

            <div style={{ textAlign: "center" }}>
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </Form>
        </Card>
      </div>
    </ConfigProvider>
  );
}
