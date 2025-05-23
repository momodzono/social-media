import {
  combineSlices,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import { useDispatch, useSelector, useStore } from "react-redux";
import type { store } from "../app/store";
import type { router } from "../app/router";
import { api } from "./api";

export const rootReducer = combineSlices({
  [api.reducerPath]: api.reducer,
});

export type BaseStore = typeof store;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppState = any;
export type AppDispatch = typeof store.dispatch;

export const useAppSelector = useSelector.withTypes<AppState>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppStore = useStore.withTypes<typeof store>();
export const createAppSelector = createSelector.withTypes<AppState>();
export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: AppState;
  dispatch: AppDispatch;
  extra: ExtraArgument;
}>();

export type ExtraArgument = {
  router: typeof router;
};
