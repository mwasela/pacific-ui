import React, { createContext, useState } from "react";

export const TitleContext = createContext();

export function TitleProvider({ children }) {
    const [pageTitle, setPageTitle] = useState("");

    return (
        <TitleContext.Provider value={{ pageTitle, setPageTitle }}>
            {children}
        </TitleContext.Provider>
    );
}
