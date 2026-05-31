/**
 * Pure game-logic tests run in a plain Node environment via ts-jest.
 * The logic layer (src/game/logic, src/game/constants, src/game/types)
 * has zero React Native dependencies, so it is fully testable here.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  roots: ['<rootDir>/src'],
};
