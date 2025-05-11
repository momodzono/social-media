import { useState, useEffect } from "react";
import { Layout, Menu, Button, Avatar, Dropdown } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router";

const { Header: AntHeader } = Layout;

interface User {
  id: number;
  name: string;
  username?: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Проверяем, есть ли сохраненные данные пользователя
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const handleLogout = () => {
    // Удаляем данные пользователя и токен
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);

    // Перенаправляем на страницу логина
    navigate("/login");
  };

  // Определяем активный ключ меню на основе текущего пути
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === "/") return ["home"];
    if (path === "/about") return ["about"];
    if (path === "/login") return ["login"];
    return [];
  };

  const userMenu = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Профиль",
      onClick: () => navigate("/profile"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Выйти",
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <div className="logo" style={{ fontSize: "18px", fontWeight: "bold" }}>
        <Link to="/" style={{ color: "#1890ff" }}>
          Социальная сеть
        </Link>
      </div>

      <Menu
        mode="horizontal"
        selectedKeys={getSelectedKey()}
        style={{ flex: 1, justifyContent: "center", border: "none" }}
        items={[
          {
            key: "home",
            icon: <HomeOutlined />,
            label: <Link to="/">Главная</Link>,
          },
          {
            key: "about",
            icon: <InfoCircleOutlined />,
            label: <Link to="/about">О нас</Link>,
          },
        ]}
      />

      <div>
        {user ? (
          <Dropdown menu={{ items: userMenu }} placement="bottomRight" arrow>
            <div
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Avatar icon={<UserOutlined />} />
              <span style={{ marginLeft: 8 }}>{user.name}</span>
            </div>
          </Dropdown>
        ) : (
          <Button type="primary" onClick={() => navigate("/login")}>
            Войти
          </Button>
        )}
      </div>
    </AntHeader>
  );
}
