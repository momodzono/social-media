import { useState, useEffect } from "react";
import { Card, Button, List, Typography, message } from "antd";
import { httpClient } from "../core/http";

const { Title, Paragraph } = Typography;

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
  likesCount?: number;
  isLiked?: boolean;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await httpClient("http://localhost:3001/posts");
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
      message.error("Не удалось загрузить посты");
    }
  };

  const handleLike = async (postId: number) => {
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

      // Обновляем состояние постов
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: data.liked,
              likesCount: (post.likesCount || 0) + (data.liked ? 1 : -1),
            };
          }
          return post;
        }),
      );

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

      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={posts}
        renderItem={(post) => (
          <List.Item>
            <Card
              title={post.title}
              extra={
                <Button
                  type={post.isLiked ? "primary" : "default"}
                  onClick={() => handleLike(post.id)}
                  loading={loading}
                >
                  {post.isLiked ? "Убрать лайк" : "Лайкнуть"}
                  {post.likesCount !== undefined && ` (${post.likesCount})`}
                </Button>
              }
            >
              <Paragraph>{post.body}</Paragraph>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
