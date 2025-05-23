import {
  Card,
  Button,
  List,
  Typography,
  message,
  Space,
  Avatar,
  Spin,
} from "antd";
import { httpClient } from "../core/http";
import { useNavigate } from "react-router";
import { useAppSelector } from "../store/reducer";
import { UserOutlined } from "@ant-design/icons";
import { api } from "../store/api";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

interface Post {
  id: number;
  username: string;
  body: string;
  createdAt: string;
  isLiked: boolean;
  likesCount?: number;
}

interface ProfileData {
  name: string;
  birthday: string;
  photo?: string;
  description?: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { data: user } = useAppSelector(api.endpoints.getMe.select({}));

  const { data, isLoading, isError } = api.useGetProfileQuery({});

  // Явно указываем типы для profile и posts
  const profile: ProfileData | undefined = data?.profile;
  const posts: Post[] = data?.posts || [];

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format("DD.MM.YYYY");
  };

  const handleLike = async (postId: number) => {
    if (!user) {
      message.info("Необходимо войти в систему для выполнения этого действия");
      navigate("/login");
      return;
    }

    try {
      const response = await httpClient(
        `http://localhost:3001/posts/${postId}/like`,
        {
          credentials: "include",
          method: "POST",
        },
      );

      const data = await response.json();

      message.success(data.liked ? "Лайк добавлен" : "Лайк удален");
    } catch (error) {
      console.error("Error liking post:", error);
      message.error("Не удалось выполнить действие");
    }
  };

  if (isLoading) {
    return (
      <Spin
        size="large"
        style={{ display: "flex", justifyContent: "center", marginTop: 50 }}
      />
    );
  }

  if (isError) {
    return <div>Ошибка загрузки профиля</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Title level={2}>Профиль пользователя</Title>

      {profile ? (
        <Card style={{ marginBottom: 24 }}>
          <Space size="large" align="center">
            <div>
              {profile.photo ? (
                <Avatar src={profile.photo} size={64} />
              ) : (
                <Avatar size={64} icon={<UserOutlined />} />
              )}
              <Title level={4}>{profile.name}</Title>
              {profile.birthday && (
                <Text type="secondary">{formatDate(profile.birthday)}</Text>
              )}
              <div>
                <Text>{profile.description}</Text>
              </div>
              <Button
                style={{ marginTop: "15px" }}
                type="primary"
                onClick={() => navigate("/profile/edit")}
              >
                Изменить
              </Button>
            </div>
          </Space>
        </Card>
      ) : (
        <Card style={{ marginBottom: 24 }}>
          <Text>Профиль не найден</Text>
        </Card>
      )}

      <Title level={3}>Посты пользователя</Title>

      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={posts}
        renderItem={(
          post: Post, // Явно указываем тип для post
        ) => (
          <List.Item>
            <Card
              title={
                <div>
                  <div>{post.username}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>
                    {new Date(post.createdAt).toLocaleString()}
                  </div>
                </div>
              }
            >
              <Paragraph>{post.body}</Paragraph>
              <Button
                type={post.isLiked ? "primary" : "default"}
                onClick={() => handleLike(post.id)}
                loading={isLoading}
              >
                {post.isLiked ? "Убрать лайк" : "Лайкнуть"}
                {post.likesCount !== undefined && ` (${post.likesCount})`}
              </Button>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
