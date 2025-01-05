import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MainPage from "./components/MainPage";
import App from "./App";

const queryClient = new QueryClient();

const AppWrapper = () => (
    <QueryClientProvider client={queryClient}>
        <App />
    </QueryClientProvider>
);

export default AppWrapper;
