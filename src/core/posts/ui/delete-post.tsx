import { Button } from "antd";
import { useDeletePost } from "../model/useDeletePost";
import type { FC } from "react";

type Props = {
  postId: number;
  userId: number;
  postCreatorId: number;
};

export const DeletePost: FC<Props> = ({ postId, userId, postCreatorId }) => {
  const { canDeletePost, deletePost } = useDeletePost();

  if (!canDeletePost({ postCreatorId, userId })) return null;

  return <Button onClick={() => deletePost(postId)}>удалить</Button>;
};
