module.exports = function (config) {
  config.set({
    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-rollup-preprocessor'
    ],
    frameworks: ['jasmine'],
    browsers: ['ChromeHeadless'],
    files: [{
      pattern: 'src/**/*.js',
      watched: false
    }, {
      pattern: 'test/**/*_spec.js',
      watched: false
    }],
    preprocessors: {
      'src/**/*.js': ['rollupBabel'],
      'test/**/*_spec.js': ['rollupBabel']
    },
    rollupPreprocessor: {
      output: {
        format: 'iife',
        name: 'angular_study',
        sourcemap: 'inline'
      }
    },
    customPreprocessors: {
      rollupBabel: {
        base: 'rollup',
        options: {
          plugins: [
            require('rollup-plugin-node-resolve')(),
            require('rollup-plugin-commonjs')(),
            require('rollup-plugin-babel')()
          ]
        }
      }
    }
  })
}
