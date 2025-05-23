import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Button, Typography, Alert, Space } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { httpClient } from "../core/http";

const { Title } = Typography;

const registerSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setRegisterError(null);

    try {
      const response = await httpClient("http://localhost:3001/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log("Успешная регистрация:", responseData);
        navigate("/login");
      } else {
        setRegisterError("Ошибка при регистрации");
      }
    } catch (error) {
      console.error("Register error:", error);
      setRegisterError("Произошла ошибка при попытке регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "2rem 1rem" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Title level={2} style={{ textAlign: "center", margin: 0 }}>
          Регистрация
        </Title>

        {registerError && (
          <Alert message={registerError} type="error" showIcon closable />
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <div>
                  <Input
                    {...field}
                    prefix={<UserOutlined />}
                    placeholder="your.email@example.com"
                    size="large"
                    status={errors.email ? "error" : undefined}
                  />
                  {errors.email && (
                    <div style={{ color: "#ff4d4f", marginTop: 4 }}>
                      {errors.email.message}
                    </div>
                  )}
                </div>
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <div>
                  <Input.Password
                    {...field}
                    prefix={<LockOutlined />}
                    placeholder="Введите пароль"
                    size="large"
                    status={errors.password ? "error" : undefined}
                  />
                  {errors.password && (
                    <div style={{ color: "#ff4d4f", marginTop: 4 }}>
                      {errors.password.message}
                    </div>
                  )}
                </div>
              )}
            />

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Зарегистрироваться
            </Button>
          </Space>
        </form>
        <a href="/login">Уже есть аакаунт</a>
      </Space>
    </div>
  );
}
