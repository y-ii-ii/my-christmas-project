// webpack.config.js (已修复静态资源服务)
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/main.jsx',
  devtool: 'source-map', // 解决 CSP 报错
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|mp3|glb|gltf)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  devServer: {
    // 🚨 关键修改在这里：告诉服务器托管 public 文件夹
    static: {
      directory: path.join(__dirname, 'public'), 
    },
    historyApiFallback: true,
    port: 3000,
    hot: true,
    client: {
      overlay: false, // 关闭恼人的全屏报错覆盖层
    },
  },
};