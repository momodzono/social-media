import { createBrowserRouter, Outlet } from "react-router";
import Login from "../pages/Login";
import Home from "../pages/Home";
import Register from "../pages/Register";
import ProtectedRoute from "../components/ProtectedRoute";
import AddPost from "../pages/AddPost";
import Profile from "../pages/Profile";
import ProfileInfo from "../pages/ProfileInfo";
import { store } from "./store";
import { api } from "../store/api";
import type { BaseStore } from "../store/reducer";
import ProfileEdit from "../pages/ProfileEdit";

const loadStore = () =>
  new Promise((resolve) => {
    setTimeout(() => resolve(store), 0);
  });

export const router = createBrowserRouter([
  {
    path: "/",
    hydrateFallbackElement: <div>make loader</div>,
    lazy: () =>
      import("../App").then((page) => ({
        Component: page.AppLayout,
      })),
    children: [
      {
        index: true,
        loader: async () => {
          const store = (await loadStore()) as BaseStore;
          store.dispatch(api.endpoints.getPosts.initiate());
        },
        element: <Home />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        loader: async () => {
          const store = (await loadStore()) as BaseStore;
          store.dispatch(api.endpoints.getMe.initiate({}));
        },
        lazy: () =>
          import("../components/ProtectedRoute").then((page) => ({
            Component: page.default,
          })),
        children: [
          {
            path: "/profile",
            element: <Profile />,
          },
          {
            path: "/profile/edit",
            element: <ProfileEdit />,
          },
          {
            path: "/addpost",
            element: <AddPost />,
          },
          {
            path: "/userprofile",
            element: <ProfileInfo />,
          },
        ],
      },
      {
        path: "*",
        element: <div>not found</div>,
      },
    ],
  },
]);
