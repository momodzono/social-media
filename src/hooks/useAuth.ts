import { useAppSelector } from "../store/reducer";
import { useNavigate } from "react-router";
import { api } from "../store/api";

export function useAuth() {
  const { data: user } = useAppSelector(api.endpoints.getMe.select({}));
  const navigate = useNavigate();

  const requireAuth = (callback: () => void) => {
    if (!user) {
      navigate("/login");
      return false;
    }
    callback();
    return true;
  };

  return {
    isAuthenticated: !!user,
    user,
    requireAuth,
  };
}
