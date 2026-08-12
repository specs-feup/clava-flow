import { weaverConfig } from "@specs-feup/clava/code/WeaverConfiguration.js";

const config = {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "@specs-feup/lara/jest/jestEnvironment.js",
    testEnvironmentOptions: {
        weaverConfig,
    },
    globalSetup: "@specs-feup/lara/jest/jestGlobalSetup.js",
    globalTeardown: "@specs-feup/lara/jest/jestGlobalTeardown.js",
    setupFiles: ["@specs-feup/lara/jest/setupFiles/sharedJavaModule.js"],
    transform: {
        "^.+\\.m?tsx?$": [
            "ts-jest",
            {
                useESM: true,
                tsconfig: "./tsconfig.jest.json",
            },
        ],
    },
    transformIgnorePatterns: ["/node_modules/(?!@specs-feup/lara/jest/)"],
    moduleNameMapper: {
        "^@specs-feup/clava-flow/(.*)$": "<rootDir>/src/$1",
        "(.+)\\.js": "$1",
    },
};

export default config;
