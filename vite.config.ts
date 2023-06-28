import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
// https://github.com/nshen/vite-plugin-wasm-pack
// import wasmPack from "vite-plugin-wasm-pack";

export default defineConfig({
    root: "src",
    build: { sourcemap: true },
    plugins: [glsl(), wasm(), topLevelAwait()],
});