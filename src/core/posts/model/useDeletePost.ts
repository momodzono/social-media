import { api } from "../../../store/api";
import { useAuth } from "../../../hooks/useAuth";

export const useDeletePost = () => {
  const [trigger] = api.useDeletePostMutation();
  const auth = useAuth();

  const canDeletePost = ({
    postCreatorId,
    userId,
  }: {
    userId: number;
    postCreatorId: number;
  }) => postCreatorId === userId;

  const deletePost = (postId: number) =>
    auth.requireAuth(() => trigger({ postId }));

  return {
    canDeletePost,
    deletePost,
  };
};
