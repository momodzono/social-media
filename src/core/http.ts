export const httpClient = async (
  input: RequestInfo | URL,
  init?: RequestInit,
) => {
  return await fetch(input, {
    ...init,
    credentials: "include",
  });
};
