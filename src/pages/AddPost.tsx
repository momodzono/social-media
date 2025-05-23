import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Button, Typography, Alert, Space } from "antd";
import { useNavigate } from "react-router";
import { httpClient } from "../core/http";
import { useAppDispatch } from "../store/reducer";
import { api } from "../store/api";

const { Title, Text } = Typography;
const { TextArea } = Input;

const addpostSchema = z.object({
  body: z.string().min(1, "Введите текст поста"),
});

type AddPostFormData = z.infer<typeof addpostSchema>;

export default function AddPost() {
  const [addpostError, setAddPostError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddPostFormData>({
    resolver: zodResolver(addpostSchema),
    defaultValues: {
      body: "",
    },
  });

  const onSubmit = async (data: AddPostFormData) => {
    setLoading(true);
    setAddPostError(null);

    try {
      const response = await httpClient("http://localhost:3001/addpost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        dispatch(api.util.invalidateTags(["posts"]));

        navigate("/");
      } else {
        const errorData = await response.json();
        setAddPostError(errorData.message || "Ошибка при создании поста");
      }
    } catch (error) {
      console.error("Add post error:", error);
      setAddPostError("Произошла ошибка при попытке создании поста");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "2rem 1rem" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Title level={2} style={{ textAlign: "center", margin: 0 }}>
          Создать пост
        </Title>

        {addpostError && (
          <Alert message={addpostError} type="error" showIcon closable />
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Controller
              name="body"
              control={control}
              render={({ field }) => (
                <div>
                  <TextArea
                    {...field}
                    placeholder="Напишите что-нибудь..."
                    rows={4}
                    status={errors.body ? "error" : undefined}
                  />
                  {errors.body && (
                    <Text type="danger">{errors.body.message}</Text>
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
              Создать пост
            </Button>
          </Space>
        </form>
      </Space>
    </div>
  );
}
