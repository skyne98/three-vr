import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

export default defineConfig({
    root: "src",
    build: { sourcemap: true },
    plugins: [glsl()],
});