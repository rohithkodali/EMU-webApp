// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function (config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'app/bower_components/jquery/jquery.js',
      'app/bower_components/angular/angular.js',
      'app/bower_components/angular-mocks/angular-mocks.js',
      'app/bower_components/angular-route/angular-route.js',
      'app/bower_components/angular-animate/angular-animate.js',
      'app/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'app/bower_components/angular-ui/build/angular-ui.js',
      'app/bower_components/angular-animate/angular-animate.js',
      'app/bower_components/ngprogress-lite/ngprogress-lite.min.js',
      'app/bower_components/jasmine-jquery/lib/jasmine-jquery.js',
      'app/scripts/*.js',
      'app/scripts/workers/*.js',
      'app/scripts/filters/*.js',
      'app/scripts/**/*.js',
      'test/spec/**/*.js',
      //include the directory where directive templates are stored.
      'app/views/**/*.html',

      // demoDBs JSON fixtures
      {
        pattern: 'app/demoDBs/*/*.json',
        watched: true,
        served: true,
        included: false
      }, 

      // configFiles JSON fixtures
      {
        pattern: 'app/configFiles/*.json',
        watched: true,
        served: true,
        included: false
      },

      // schemaFiles fixtures
      {
        pattern: 'app/schemaFiles/*.json',
        watched: true,
        served: true,
        included: false
      },
      // fixtures
      {
        pattern: 'app/testData/oldFormat/msajc003/*',
        watched: true,
        served: true,
        included: false
      }

    ],

    // generate js files from html templates to expose them during testing.
    preprocessors: {
      'app/views/**/*.html': 'ng-html2js',
      'app/scripts/**/*.js': 'coverage'
    },

    ngHtml2JsPreprocessor: {
      // If your build process changes the path to your templates,
      // use stripPrefix and prependPrefix to adjust it.
      stripPrefix: 'app/',
      prependPrefix: '',

      // the name of the Angular module to create
      moduleName: 'emuwebApp.templates'
    },

    proxies: {
      '/scripts/workers/': 'http://localhost:9000/scripts/workers/',
      '/img/': 'http://localhost:9000/img/'
    },

    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 8081,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // coverage reporter
    reporters: ['dots'],

    coverageReporter: {
      type: 'lcov',
      dir: 'test/coverage/',
    },

    // plugins: [
    //   'karma-coverage',
    // ],

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['Chrome'],
    
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};