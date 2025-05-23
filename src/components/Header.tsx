import { Layout, Menu, Button, Avatar, Dropdown, Skeleton } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router";
import { api } from "../store/api";
import {
  useAppDispatch,
  useAppSelector,
  type ExtraArgument,
} from "../store/reducer";
import { createAsyncThunk } from "@reduxjs/toolkit";

const { Header: AntHeader } = Layout;

export const logOut = createAsyncThunk<unknown, void>(
  "auth/logut",
  async (_, { dispatch, rejectWithValue, extra }) => {
    const { router } = extra as ExtraArgument;

    try {
      await dispatch(api.endpoints.logout.initiate()).unwrap();
      dispatch(api.util.resetApiState());

      router.navigate("/login");
    } catch (error) {
      console.error("Login error:", error);
      return rejectWithValue("Неверный email или пароль");
    }
  },
);

export default function Header() {
  const { data: user } = useAppSelector(api.endpoints.getMe.select({}));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  // Добавляем обработку состояния загрузки
  const { data: profileData, isLoading: isProfileLoading } =
    api.useGetProfileQuery({});
  const profile = profileData?.profile;

  const handleLogout = () => {
    dispatch(logOut());
  };

  // Определяем активный ключ меню на основе текущего пути
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === "/") return ["home"];
    if (path === "/about") return ["about"];
    if (path === "/login") return ["login"];
    if (path === "/profile") return ["profile"];
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
              {isProfileLoading ? (
                <Skeleton.Avatar active size="small" />
              ) : (
                <>
                  <Avatar src={profile?.photo} icon={<UserOutlined />} />
                  <span style={{ marginLeft: 8 }}>
                    {profile?.name || user.email}
                  </span>
                </>
              )}
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
