module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json'
    }
  },
  moduleFileExtensions: [
    'js',
    'ts'
  ],
  transform: {
    '^.+\\.(ts)?$': 'ts-jest'
  },
  testMatch: [
    '**/test/**/*.test.ts'
  ],
  testEnvironment: 'node'
}
