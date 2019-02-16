const path = require('path'),
    webpack = require('webpack'),
    CopyWebpackPlugin = require('copy-webpack-plugin'),
    VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
    mode: process.env.NODE_ENV,
    entry: {
        background: './src/background.ts',
        options: './src/options.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                use: 'vue-loader'
            },
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {appendTsSuffixTo: [/\.vue$/]}
            },
            {
                test: /\.css$/,
                use: ['css-loader', 'vue-style-loader']
            }
        ]
    },
    plugins: [
        new VueLoaderPlugin(),
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'development',
            DEBUG: false
        }),
        new CopyWebpackPlugin(
            [
                {
                    from: path.join(__dirname, 'src', 'manifest.json'),
                    to: path.join(__dirname, 'dist')
                },
                {
                    from: path.join(__dirname, 'src', 'options.html'),
                    to: path.join(__dirname, 'dist')
                }
            ]
        )
    ]
};

