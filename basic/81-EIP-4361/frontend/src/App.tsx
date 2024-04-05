import React from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

import { config } from "./wagmi/config";
import router from "./router";


const queryClient = new QueryClient();

export const App = () => {
 
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
       
        <RouterProvider router={router}></RouterProvider>
        
      </QueryClientProvider>
    </WagmiProvider>

    // <EditorLayout></EditorLayout>
  );
};
