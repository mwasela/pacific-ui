import * as ReactDOM from "react-dom/client";
import router from "./router.jsx";
import { ConfigProvider } from "antd";
//import enUS from "antd/lib/locale/en_US";
import {
  RouterProvider,
} from "react-router-dom";
import enUS from "antd/es/locale/en_US";


ReactDOM.createRoot(document.getElementById("root")).render(
<ConfigProvider
      locale={enUS}
      theme={{
        token: {
          fontFamily: "Inter, sans-serif",
          colorPrimary: "#091f24",
        },
      }}
    >
 <RouterProvider router={router} />
</ConfigProvider>
);



