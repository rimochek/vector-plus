export function getApiUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"
  return value.replace(/\/+$/, "")
}
