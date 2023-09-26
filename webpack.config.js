const path = require("path");

module.exports = {
  entry: {
    'panel/devtools-panel': "./src/devtools-panel.js",
    'devtools': "./src/devtools.js"
  },
  output: {
    path: path.resolve(__dirname, "addon"),
    filename: "devtools/[name].js"
  },
  module: {
    rules: [
      {
        test: /\.wasm$/i,
        type: 'asset/resource',
      }
    ]
  },
  mode: 'none',
  resolve: {
    fallback: {
      assert: false,
      fs: false,
      path: false,
      os: false,
      url: false,
      util: false,
      zlib: false,
      stream: false
    }
  }
};