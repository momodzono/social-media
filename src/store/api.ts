import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:3001",
  credentials: "include",
});

export const api = createApi({
  reducerPath: "baseApi",
  baseQuery,
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (credentials: {
        email: string;
        password: string;
        name: string;
      }) => ({
        url: "/register",
        method: "POST",
        body: credentials,
      }),
    }),
    login: builder.mutation({
      query: (credentials: { email: string; password: string }) => ({
        url: "/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["user"],
    }),
    getMe: builder.query({
      query: () => "/me",
      providesTags: ["user"],
    }),
    getPosts: builder.query<
      {
        id: number;
        body: string;
        userId: number;
        createdAt: string;
        likes: null | number;
        username: string;
        userEmail: string;
        likesCount: number;
        isLiked: boolean;
      }[],
      void
    >({
      query: () => "/posts",
      providesTags: ["posts"],
    }),
    getProfile: builder.query({
      query: () => "/profile/info",
      providesTags: ["profile"],
    }),
    updateProfile: builder.mutation({
      query: (body: {
        name: string;
        birthday: Date;
        description?: string;
        photo?: File;
      }) => {
        const formData = new FormData();
        Object.entries(body).map(([key, value]) =>
          formData.set(String(key), String(value)),
        );
        if (body.photo) formData.set("photo", body.photo);

        return {
          url: "/profile/edit",
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: ["profile"],
    }),
    addprofile: builder.mutation({
      query: (body: {
        name: string;
        birthday: Date;
        description?: string;
        photo?: File;
      }) => {
        const formData = new FormData();
        Object.entries(body).map(([key, value]) =>
          formData.set(String(key), String(value)),
        );
        formData.set("photo", body.photo);

        return {
          url: "/userprofile",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["profile"],
    }),
    logout: builder.mutation<unknown, void>({
      query: () => ({
        url: "logout",
        method: "POST",
      }),
      invalidatesTags: ["user"],
    }),
    deletePost: builder.mutation<unknown, { postId: number }>({
      query: (body) => ({
        url: "/posts",
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["posts"],
    }),
  }),
  tagTypes: ["user", "profile", "posts"],
});
