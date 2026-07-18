import { createBrowserRouter } from "react-router-dom";
import Home from "./Pages/Home";
import MainLayout from "./Layouts/MainLayout";
import Login from "./Pages/auth/login";
import Register from "./Pages/auth/register";
import Users from "./Pages/Users";
import Visits from "./Pages/Visits";
import VIP from "./Pages/VIP";
import Settings from "./Pages/Settings";
import VIPcash from "./Pages/VIPcash";
import Reports from "./Pages/Reports";
import Financial from "./Pages/Financial";
import Viplogs from "./Pages/Viplogs";
import Timeslots from "./Pages/Timeslots";
import Manual from "./Pages/Manual";
import Confee from "./Pages/Confee";


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
                path: "/vip",
                element: <VIP />

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
                path: "/settings",
                element: <Settings />
            },
            {
                path: "/vipcash",
                element: <VIPcash />
            },
            {
                path: "/reports",
                element: <Reports />    
            },
            {
                path: "/financial",
                element: <Financial />
            },
            {
                path: "/viplogs",
                element: <Viplogs />
            },
            {
                path: "/timeslots",
                element: <Timeslots />
            },
            {
                path: "/manual",
                element: <Manual />
            },
            {
                path: "/confee",
                element: <Confee />
            }

        ]
    },
    {
        path: "/login",
        element: <Login />
    },
]);

export default router;  