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
      'src/**/*.js': ['rollup'],
      'test/**/*_spec.js': ['rollup']
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
          plugins: [require('rollup-plugin-babel')()]
        }
      }
    }
  })
}
