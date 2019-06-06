const path = require('path')
		, os = require('os')
	  , webpack = require('webpack')
		, combineLoaders = require('webpack-combine-loaders')
		, cssStandards = require('spike-css-standards')
	  , ManifestPlugin = require('webpack-manifest-plugin')
	  , MiniCssExtractPlugin = require('mini-css-extract-plugin')
	  , HtmlWebpackPlugin = require('html-webpack-plugin')
	  , {CheckerPlugin: TsChecker} = require('awesome-typescript-loader')
		, HardSourceWebpackPlugin = require('hard-source-webpack-plugin')
		, cpus = os.cpus().length
	  , config = (env) => {
			const isProd = env && env.NODE_ENV === 'production'
					, postcssRule = (test, parser) => {
						const options = Object.assign
						( cssStandards({ parser
													 , minify: isProd
													 , warnForDuplicates: !isProd
													 })
						, {sourceMap: true}
						)
						return { test
									 , use:
										 [ ...( isProd
													? [{ loader: MiniCssExtractPlugin.loader }]
													: [ { loader: 'style-loader'
															, options: {sourceMap: true}
															}
														]
													)
										 , { loader: 'css-loader'
											 , options: { importLoaders: 1
																	, sourceMap: true
																	}
											 }
										 , { loader: 'postcss-loader'
											 , options
											 }
										 ]
									 }
					}
			return { mode: isProd
									 ? "production"
									 : "development"
						 // , context: path.resolve(__dirname, 'src')
						 , entry: './src/index.ts'
						 , output: {filename: '[name].js'}
						 , optimization: {splitChunks: {chunks: 'initial'}}
						 , devtool: isProd
												? 'source-map'
												: 'cheap-module-eval-source-map'
						 , module:
							 { noParse: /\.elm$/
							 , rules:
								 [ postcssRule(/\.css$/)
								 , postcssRule(/\.sss$/, 'sugarss')
								 , { test: /\.pug$/
									 , use:
										 [ { loader: 'pug-loader'
											 , options: {}
											 }
										 ]
									 }
								 , { test: /\.elm$/
									 , exclude:
										 [ /elm-stuff/
										 , /node_modules/
										 ]
									 , use:
										 [ ...( isProd
													? []
													: [{ loader: 'elm-hot-webpack-loader'
														 , options:
															 { useTranspileModule: true
															 , transpileOnly: true
															 }
														 }]
													)
										 , { loader: 'elm-webpack-loader'
											 , options: {debug: !isProd}
											 }
										 ]
									 }
								 , { test: /\.[jt]sx?$/
									 , use:
										 [ { loader: 'awesome-typescript-loader'
											 , options:
												 { useTranspileModule: true
												 // , transpileOnly: true
												 , configFileName: path.resolve
													 (__dirname, 'webpack.tsconfig.json')
												 , reportFiles: ['src/**/*.{ts,tsx}']
												 }
											 }
										 ]
									 }
								 , { test: /\.svg$/
									 , use: [fileLoader({publicPath: 'image/'})]
									 }
								 , { test: /\.(?:woff2?|ttf|eot)$/
									 , use: [fileLoader({publicPath: 'font/'})]
									 }
								 , { test: /\.x?html?$/
									 , exclude: /node_modules/
									 , use: [fileLoader({publicPath: ''})]
									 }
								 ]
							 }
						 , resolve:
							 { extensions:
								 [ '.js'
								 , '.json'
								 , '.mjs'
								 , '.wasm'
								 , '.ts'
								 , '.tsx'
								 ]
							 }
						 , plugins:
							 [ new HtmlWebpackPlugin
								 ({ template: 'src/index.pug'
									, filename: 'index.html'
									, xhtml: true
									})
							 , new HardSourceWebpackPlugin()
							 , new TsChecker()
							 , new ManifestPlugin
							 , new webpack.NamedModulesPlugin
							 , ...( isProd
										? [ new MiniCssExtractPlugin
												({ filename: path.join('style', '[name].css')
												 , chunkFilename: path.join('style', '[name].chunk.css')
												 })
											]
										: []
										)
							 ]

			}
		}
		, fileLoader = ({ext = '[ext]', publicPath} = {}) => {
			const options = {name: `[name].${ext}`}
			if (publicPath) {
				Object.assign
				( options
				, { outputPath: publicPath
					, publicPath
					}
				)
			}
			return { loader: 'file-loader'
						 , options
						 }
		}

module.exports = config
