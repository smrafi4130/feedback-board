/** @type {import('next').NextConfig} */
const nextConfig = {
  // PGlite ships a WASM binary; keep it external to the server bundle so Next
  // doesn't try to bundle the .wasm. Swap to node-postgres in production and
  // this can be removed.
  serverExternalPackages: ["@electric-sql/pglite"],
};
export default nextConfig;
