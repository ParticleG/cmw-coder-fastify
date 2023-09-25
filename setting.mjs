import esbuildPluginTsc from "esbuild-plugin-tsc";

export const createBuildSettings = async (options) => {
  return {
    bundle: true,
    entryPoints: ["server.ts"],
    format: "cjs",
    outdir: "build",
    platform: "node",
    plugins: [esbuildPluginTsc({ force: true })],
    target: "node12",
    ...options
  };
};
