import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { FdCalculator } from "./components/FdCalculator";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FdCalculator />
  </StrictMode>,
);
