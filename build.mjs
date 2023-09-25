import * as esbuild from "esbuild";

import { createBuildSettings } from "./setting.mjs";

const settings = await createBuildSettings({ minify: true });

await esbuild.build(settings);
