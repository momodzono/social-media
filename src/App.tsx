import { RouterProvider, Outlet } from "react-router";
import { Layout } from "antd";
import "./App.css";
import Header from "./components/Header";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { router } from "./app/router";

const { Content, Footer } = Layout;

// Layout component with header
export const AppLayout = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header />
      <Content style={{ padding: "24px 50px", marginTop: 16 }}>
        <div style={{ background: "#fff", padding: 24, borderRadius: 4 }}>
          <Outlet />
        </div>
      </Content>
      <Footer style={{ textAlign: "center" }}>Социальная сеть</Footer>
    </Layout>
  );
};

function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}

export default App;
