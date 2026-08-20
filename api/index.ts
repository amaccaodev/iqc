import "../backend/src/loadEnv.js";
import { createApp } from "../backend/src/app.js";

/** Vercel serverless — Express xử lý mọi /api/* (cùng domain, không CORS) */
export default createApp();
