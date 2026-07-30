/*
 * Tailwind is injected through `loaderOptions` rather than the more obvious
 * `style.postcss.plugins`.
 *
 * craco 7.1.0 assigns `postcssOptions.plugins` as a *function*
 * (dist/lib/features/webpack/style/postcss.js). postcss-loader 6.2.1 — the
 * version react-scripts 5.0.1 pins — only unwraps `postcssOptions` itself when
 * it is a function, never `postcssOptions.plugins`. A non-array lands in
 * `Object.entries(plugins)`, which is `[]` for a function, so every plugin is
 * dropped silently: the build still succeeds and `@tailwind` / `@apply` survive
 * verbatim into the emitted CSS.
 *
 * Passing a plain array sidesteps that. Tailwind is prepended so it expands
 * before CRA's postcss-preset-env runs over the result; preset-env already
 * carries autoprefixer, so it is not added again here.
 */
module.exports = {
  style: {
    postcss: {
      loaderOptions: (loaderOptions) => {
        const postcssOptions = loaderOptions.postcssOptions || {};

        const existing =
          typeof postcssOptions.plugins === "function"
            ? postcssOptions.plugins()
            : postcssOptions.plugins || [];

        loaderOptions.postcssOptions = {
          ...postcssOptions,
          plugins: [require("tailwindcss"), ...existing],
        };

        return loaderOptions;
      },
    },
  },
};
