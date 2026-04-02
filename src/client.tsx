import "./styles.css";
import { createRoot } from "react-dom/client";
import App from "./app";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found");
}

const root = createRoot(rootElement);
root.render(<App />);
