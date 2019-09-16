module.exports = (api) => {
  api.cache(true)

  const presets = [
    ['@babel/preset-env', {
      modules: false,
      targets: {
        browsers: 'last 2 versions'
      }
    }]
  ]
  const plugins = [
  ]

  return {
    presets,
    plugins
  }
}
