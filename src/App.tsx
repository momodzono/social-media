import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import { Layout } from "antd";
import "./App.css";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Header from "./components/Header";

const { Content, Footer } = Layout;

// Pages
const About = () => <h1>About Page</h1>;
const NotFound = () => <h1>404 - Page Not Found</h1>;

// Layout component with header
const AppLayout = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header />
      <Content style={{ padding: "24px 50px", marginTop: 16 }}>
        <div style={{ background: "#fff", padding: 24, borderRadius: 4 }}>
          <Outlet />
        </div>
      </Content>
      <Footer style={{ textAlign: "center" }}>
        Социальная сеть ©{new Date().getFullYear()} Создано с использованием
        React и Ant Design
      </Footer>
    </Layout>
  );
};

// Create router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "about",
        element: <About />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
