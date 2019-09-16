module.exports = (api) => {
  api.cache(true)

  const presets = [
    ['@babel/preset-env', {
    //   modules: false,
      targets: {
        browsers: [
          '>0.25%',
          'not ie 11',
          'not op_mini all'
        ],
        node: 'current'
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
