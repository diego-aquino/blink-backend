'use strict';

const gulp = require('gulp');
const tslint = require('gulp-tslint');
const typescript = require('gulp-typescript');
const nodemon = require('gulp-nodemon');

gulp.task('ts-lint', () =>
  gulp
    .src(['src/**/*.ts'])
    .pipe(tslint({ formatter: 'verbose' }))
    .pipe(tslint.report({ reportLimit: 5 })),
);

gulp.task('copy-files', () => gulp.src(['package.json']).pipe(gulp.dest('dist')));

gulp.task('watch', (done) => {
  gulp.watch('./**/*.ts');

  nodemon({
    script: 'dist/index.js',
    tasks: ['build'],
    ext: 'ts,json',
    ignore: ['node_modules/', 'package.json', 'tsconfig.json'],
  })
    .on('restart', () => {
      console.log('Server restarted.');
    })
    .on('crash', () => {
      console.error('Application crashed.');
    });

  done();
});

gulp.task(
  'build',
  gulp.series(['ts-lint', 'copy-files'], () => {
    const tsProject = typescript.createProject('tsconfig.json', { typescript: require('typescript') });

    return tsProject
      .src()
      .pipe(tsProject())
      .js.pipe(gulp.dest('dist'))
      .on('error', (error) => {
        console.error('Build error:', error.message);
      });
  }),
);

gulp.task('dev', gulp.series(['build', 'watch']));
