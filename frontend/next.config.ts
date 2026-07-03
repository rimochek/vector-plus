import type { NextConfig } from "next"
import { loadEnvConfig } from "@next/env"
import path from "path"

// Load env from project root (.env), not frontend/.env.local
loadEnvConfig(path.resolve(__dirname, ".."))

const nextConfig: NextConfig = {}

export default nextConfig
