import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";{}
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthPage from "./components/AuthPage";
import MainPage from "./components/MainPage";
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <Router>
            <Toaster />
            <Routes>
                <Route path="/" element={ <AuthPage /> } />
                <Route path="/main" element={ <MainPage /> } />
            </Routes>
        </Router>
    </QueryClientProvider>
);

export default App;
