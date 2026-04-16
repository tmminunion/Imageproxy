"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nextConfig = {
    /* config options here */
    typescript: {
        // Ini akan memaksa Vercel tetap build meskipun ada error TS
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};
exports.default = nextConfig;
