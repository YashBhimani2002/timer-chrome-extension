const path = require('path');
const copyWebpackPlugin = require('copy-webpack-plugin');
const htmlWebpackPlugin = require('html-webpack-plugin');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
module.exports = {
    entry:{
        popup:path.resolve('./src/popup/index.tsx'),
        background:path.resolve('./src/background/background.ts'),
        content:path.resolve('./src/content/content.ts'),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader',{
                    loader: "postcss-loader",
                    options: {
                      postcssOptions: {
                        plugins: [
                          tailwindcss,
                          autoprefixer
                        ],
                      },
                    },
                }],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
        ],
    },
    plugins: [
        new copyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve('./src/static/'),
                    to: path.resolve('dist'),
                },
                {
                    from: path.resolve('./src/assets'),
                    to: path.resolve('dist/assets'),
                },
            ],
        }),
        ...htmlPlugin(['popup', 'background']),
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
        },
    },
    output: {
        filename: '[name].js',
    },
}

function htmlPlugin(chunks) {
    return chunks.map((chunk) => {
        return new htmlWebpackPlugin({
            title:'React extension',
            filename: `${chunk}.html`,
            chunks: [chunk],
        });
    });
}