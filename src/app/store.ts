import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "../store/reducer";
import { router } from "./router";
import { api } from "../store/api";

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: {
          router,
        },
      },
    }).concat(api.middleware),
});
