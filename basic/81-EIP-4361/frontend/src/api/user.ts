import { post, get } from "@/request";

export const getNonce = () => get<{ nonce: string }>("user/nonce");

export const login = (data: unknown) =>
  post<{ token: string }>("user/login", data);

