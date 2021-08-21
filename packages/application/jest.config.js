const config = {
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
      useESM: true
    }
  }
};

export default config;
