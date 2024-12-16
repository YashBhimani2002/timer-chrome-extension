import React from "react";
import {createRoot} from "react-dom/client";
import Popup from "./popup";

const appElement = document.createElement("div");
document.body.appendChild(appElement);
if(!appElement){
    throw new Error("App element not found");
}
const root = createRoot(appElement);
root.render(<Popup/>);