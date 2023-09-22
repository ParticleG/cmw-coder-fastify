import esbuildPluginTsc from "esbuild-plugin-tsc";
import glob from "tiny-glob";

export const createBuildSettings = async (options) => {
  return {
    bundle: true,
    entryPoints: ["server.ts", ...(await glob("src/plugins/**/*.ts")), ...(await glob("src/routes/**/*.ts"))],
    format: "cjs",
    outdir: "build",
    platform: "node",
    plugins: [esbuildPluginTsc({ force: true })],
    target: "node12",
    ...options
  };
};
