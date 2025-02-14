export default {
    testMatch: ["**/?(*.)+(spec|test).mjs"],
    transform: {
        '^.+\\.m?js$': 'babel-jest', // Use Babel to handle ESM transformation
    },
    testEnvironment: "node"
};