import { useState } from "react";
import { Card, Button, List, Typography, message } from "antd";
import { httpClient } from "../core/http";
import { useNavigate } from "react-router";
import { api } from "../store/api";
import { useAppSelector } from "../store/reducer";
import { DeletePost } from "../core/posts/ui/delete-post";

const { Title, Paragraph } = Typography;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { data: user } = useAppSelector(api.endpoints.getMe.select({}));
  const { data: posts } = useAppSelector(api.endpoints.getPosts.select());

  const handleLike = async (postId: number) => {
    if (!user) {
      message.info("Необходимо войти в систему для выполнения этого действия");
      navigate("/login");
      return;
    }

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>Главная страница</Title>
      <Button
        style={{ marginBottom: "15px" }}
        type="primary"
        onClick={() => navigate("/addpost")}
      >
        Создать пост
      </Button>
      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={posts}
        renderItem={(post) => (
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
              <DeletePost
                postCreatorId={post.userId}
                postId={post.id}
                userId={user?.id}
              />
              <Button
                type={post.isLiked ? "primary" : "default"}
                onClick={() => handleLike(post.id)}
                loading={loading}
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
