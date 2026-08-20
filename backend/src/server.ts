import "./loadEnv.js";
import { createApp } from "./app.js";

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const app = createApp();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`IQC Backend running on http://localhost:${PORT}`);
});
