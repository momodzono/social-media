import { Navigate, Outlet } from "react-router";
import { api } from "../store/api";
import { useAppSelector } from "../store/reducer";

export default function ProtectedRoute() {
  const { data: user, isLoading } = useAppSelector(
    api.endpoints.getMe.select({}),
  );

  if (isLoading) return <div>loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
