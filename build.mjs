import * as esbuild from "esbuild";
import { rm } from "node:fs/promises";

import { createBuildSettings } from "./setting.mjs";

const settings = await createBuildSettings({ minify: true });

await rm(settings.outdir, { recursive: true, force: true });

await esbuild.build(settings);
