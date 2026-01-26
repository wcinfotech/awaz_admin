import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force dark theme across the app regardless of system preference
if (!document.documentElement.classList.contains("dark")) {
	document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
