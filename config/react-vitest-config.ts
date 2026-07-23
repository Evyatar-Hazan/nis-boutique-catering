interface ReactVitestConfig {
  readonly test: {
    readonly css: true;
    readonly environment: 'jsdom';
    readonly setupFiles: string;
  };
}

export const createReactVitestConfig = (
  setupFile: string,
): ReactVitestConfig => ({
  test: {
    css: true,
    environment: 'jsdom',
    setupFiles: setupFile,
  },
});
