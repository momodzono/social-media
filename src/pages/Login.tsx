import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Button, Typography, Alert, Space, Spin } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { api } from "../store/api";

const { Title } = Typography;

import { createAsyncThunk } from "@reduxjs/toolkit";
import type { ExtraArgument } from "../store/reducer";
import { useAppDispatch } from "../store/reducer";

export const loginUser = createAsyncThunk<
  unknown,
  {
    email: string;
    password: string;
  }
>("auth/login", async (credentials, { dispatch, rejectWithValue, extra }) => {
  const { router } = extra as ExtraArgument;
  try {
    await dispatch(api.endpoints.login.initiate(credentials)).unwrap();

    try {
      await dispatch(api.endpoints.getProfile.initiate({})).unwrap();
    } catch {
      router.navigate("/userprofile");
      return rejectWithValue("Не заполненный профиль");
    }

    router.navigate("/");
  } catch (error) {
    console.error("Login error:", error);
    return rejectWithValue("Неверный email или пароль");
  }
});

// Создаем схему валидации с помощью Zod
const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

// Тип данных формы на основе схемы
type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [loginError, setLoginError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const isLoading = false;

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
    setLoginError(null);

    dispatch(loginUser(data)).catch(setLoginError);
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "2rem 1rem" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Title level={2} style={{ textAlign: "center", margin: 0 }}>
          Вход в систему
        </Title>

        {loginError && (
          <Alert
            message={loginError}
            type="error"
            showIcon
            closable
            onClose={() => setLoginError(null)}
          />
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
              loading={isLoading}
              icon={isLoading ? <Spin size="small" /> : null}
            >
              {isLoading ? "Вход..." : "Войти"}
            </Button>
          </Space>
        </form>

        <div>
          Нет аккаунта? <a href="/register">Зарегистрироваться</a>
        </div>
      </Space>
    </div>
  );
}
