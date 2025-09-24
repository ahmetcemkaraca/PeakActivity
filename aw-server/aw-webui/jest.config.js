module.exports = {
  moduleFileExtensions: [
    'js',
    'ts',
    'json',
    'vue',
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
    '.*\\.(vue)$' : '@vue/vue2-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$' : '<rootDir>/src/$1',
  },
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost/',
  },
  testMatch: [
    '<rootDir>/test/unit/**/*.test.(js|ts)',
    '<rootDir>/test/unit/**/*.spec.(js|ts)',
  ],
}; 