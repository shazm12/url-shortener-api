export default {
    testMatch: ["**/?(*.)+(spec|test).[m]js"],
    transform: {
        '^.+\\.m?js$': 'babel-jest', // Use Babel to handle ESM transformation
    },
};