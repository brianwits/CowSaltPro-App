const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const portfinder = require('portfinder');

// Set base port and allow environment override
portfinder.basePort = process.env.PORT || 3000;

const isDevelopment = process.env.NODE_ENV !== 'production';

// Create a function to get the webpack configs, allowing for dynamic port selection
const getWebpackConfigs = async () => {
  // Find an available port for dev server
  let port = process.env.PORT || 3000;
  
  if (isDevelopment) {
    try {
      port = await portfinder.getPortPromise();
      console.log(`Found available port: ${port}`);
    } catch (err) {
      console.error('Failed to find available port, using default:', err);
    }
  }

  const commonConfig = {
    mode: isDevelopment ? 'development' : 'production',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      publicPath: isDevelopment ? '/' : './',
      // Ensure assets are handled consistently
      assetModuleFilename: 'assets/[hash][ext][query]'
    },
    node: {
      __dirname: false,
      __filename: false,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@models': path.resolve(__dirname, 'src/models'),
        '@context': path.resolve(__dirname, 'src/context'),
        '@theme': path.resolve(__dirname, 'src/theme'),
      },
      fallback: {
        "url": require.resolve("url/"),
        "path": require.resolve("path-browserify"),
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "assert": require.resolve("assert/"),
        "os": require.resolve("os-browserify/browser"),
        "vm": false, // Add explicit fallback for vm
        fs: false,
        net: false,
        tls: false,
        child_process: false
      }
    },
    devtool: isDevelopment ? 'source-map' : false,
    plugins: [
      new ForkTsCheckerWebpackPlugin({
        async: true, 
        typescript: {
          diagnosticOptions: {
            semantic: true,
            syntactic: false // Disable syntactic errors
          },
          mode: 'write-references'
        },
        issue: {
          // Only report errors, not warnings
          exclude: [
            { severity: 'warning' },
            { file: '**/node_modules/**' }
          ]
        }
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'process.env.PORT': JSON.stringify(port),
        'process.type': JSON.stringify(process.type || 'renderer')
      }),
      // Add polyfills for node modules
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
  };

  const mainConfig = {
    ...commonConfig,
    target: 'electron-main',
    entry: {
      main: './src/main/main.ts',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              // Ignore type errors in main process
              ignoreDiagnostics: [2304, 2345, 2322, 2339] 
            },
          },
        },
      ],
    },
  };

  const preloadConfig = {
    ...commonConfig,
    target: 'electron-preload',
    entry: {
      preload: './src/preload/preload.ts',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              // Ignore type errors in preload
              ignoreDiagnostics: [2304, 2345, 2322, 2339]
            },
          },
        },
      ],
    },
  };

  const rendererConfig = {
    ...commonConfig,
    target: isDevelopment ? 'web' : 'electron-renderer',
    entry: {
      renderer: './src/renderer/index.tsx',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              // Ignore type errors in renderer
              ignoreDiagnostics: [2304, 2345, 2322, 2339]
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                sourceMap: isDevelopment,
              }
            },
            'postcss-loader'
          ],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'images/[hash][ext][query]'
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[hash][ext][query]'
          }
        },
      ],
    },
    plugins: [
      ...commonConfig.plugins,
      new HtmlWebpackPlugin({
        template: path.join(__dirname, 'src', 'renderer', 'index.html'),
        minify: !isDevelopment ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        } : false,
        inject: true,
        // Add cache busting
        hash: true,
      }),
      new MiniCssExtractPlugin({
        filename: isDevelopment ? '[name].css' : '[name].[contenthash].css',
        chunkFilename: isDevelopment ? '[id].css' : '[id].[contenthash].css',
      }),
      new CleanWebpackPlugin(),
      new ESLintPlugin({
        extensions: ['ts', 'tsx'],
        emitError: false,
        emitWarning: true,
        failOnError: false,
        failOnWarning: false,
        quiet: true
      }),
      isDevelopment && new webpack.HotModuleReplacementPlugin(),
      // Uncomment to analyze bundle size
      // new BundleAnalyzerPlugin()
    ].filter(Boolean),
    optimization: {
      minimize: !isDevelopment,
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            compress: {
              drop_console: !isDevelopment,
            },
          },
        }),
      ],
      splitChunks: {
        chunks: 'all',
        name: false,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
      runtimeChunk: 'single',
    },
    // Configure dev server with proper fallback and error handling
    devServer: isDevelopment
      ? {
          static: {
            directory: path.join(__dirname, 'dist'),
            publicPath: '/',
            watch: true,
            serveIndex: true
          },
          compress: true,
          hot: true,
          port: port,
          historyApiFallback: {
            disableDotRule: true,
            rewrites: [
              { from: /^\/api/, to: '/index.html' },
              { from: /./, to: '/index.html' }
            ]
          },
          devMiddleware: {
            publicPath: '/',
            writeToDisk: true
          },
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
          },
          client: {
            overlay: {
              errors: true,
              warnings: false,
            },
            logging: 'info',
            // Show progress
            progress: true,
          },
          setupMiddlewares: (middlewares, devServer) => {
            if (!devServer) {
              throw new Error('webpack-dev-server is not defined');
            }
            
            // Add middleware to handle port discovery
            middlewares.unshift({
              name: 'port-info',
              middleware: (req, res, next) => {
                if (req.url === '/__port') {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ port }));
                  return;
                }
                next();
              }
            });
            
            return middlewares;
          }
        }
      : undefined,
  };

  return isDevelopment ? rendererConfig : [mainConfig, preloadConfig, rendererConfig];
};

// Export the configs
module.exports = getWebpackConfigs(); 
