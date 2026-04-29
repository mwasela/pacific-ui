import { createBrowserRouter } from "react-router-dom";
import Home from "./Pages/Home";
import MainLayout from "./Layouts/MainLayout";
import Login from "./Pages/auth/login";
import Register from "./Pages/auth/register";
import Users from "./Pages/Users";
import Visits from "./Pages/Visits";
import VIP from "./Pages/VIP";
import Reports from "./Pages/Reports";
import Financial from "./src/Pages/Financial";


const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                path: "/",
                element: <Home />
            },
            {
                path: "/register",
                element: <Register />
            },
            {
                path: "/users",
                element: <Users />
            },
            {
                path: "/visits",
                element: <Visits />
            },
            {
                path: "/vip",
                element: <VIP />
            },
            {
                path: "/reports",
                element: <Reports />
            },
            {
                path: "/financial",
                element: <Financial />
            }
        ]
    },
    {
        path: "/login",
        element: <Login />
    },
]);

export default router;  