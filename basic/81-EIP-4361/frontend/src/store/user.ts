import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { IUser, getCurrentUser } from "@/api/user";

type Action = {
  updateToken: (token: string) => void;
  
};

interface State {
  token: string;
}

export const useUserStore = create<State & Action>()(
  immer((set) => ({
    token: "",

    updateToken: (token) =>
      set((state) => {
        state.token = token;
      }),
  }))
);
