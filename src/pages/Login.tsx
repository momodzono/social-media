import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, Input, Button, Card, Typography, Alert, Space } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { httpClient } from "../core/http";

const { Title } = Typography;

// Создаем схему валидации с помощью Zod
const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

// Тип данных формы на основе схемы
type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log("data", data);
    setLoading(true);
    setLoginError(null);

    try {
      const credentials: { email: string; password: string } = {
        email: data.email,
        password: data.password,
      };

      const response = await httpClient("http://localhost:3001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const responseData = await response.json();

      if (response.ok) {
        // В реальном приложении здесь можно сохранить токен в localStorage
        // и информацию о пользователе в состоянии приложения
        console.log("Успешный вход:", responseData);

        // Перенаправляем на главную страницу
        // navigate("/");
      } else {
        setLoginError("Ошибка при входе");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Произошла ошибка при попытке входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "2rem 1rem" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Title level={2} style={{ textAlign: "center", margin: 0 }}>
          Вход в систему
        </Title>

        {loginError && (
          <Alert message={loginError} type="error" showIcon closable />
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                prefix={<UserOutlined />}
                placeholder="your.email@example.com"
                size="large"
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                prefix={<LockOutlined />}
                placeholder="Введите пароль"
                size="large"
              />
            )}
          />

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
          >
            Войти
          </Button>
        </form>
      </Space>
    </div>
  );
}
