var gulp = require('gulp');
var minifyjs = require('gulp-minify');
var minifycss = require('gulp-minify-css');
var rename = require('gulp-rename');


gulp.task('minify-js', function () {
    gulp.src(['*.js', '!gulpfile.js'])
        .pipe(minifyjs(
            {
                ignoreFiles: ['gulpfile.js', '-min.js']
            }
            ))
        .pipe(gulp.dest('lib'));
});

gulp.task('minify-css', function () {
    gulp.src('*.css')
        .pipe(minifycss())
        .pipe(rename({ suffix: '-min' }))
        .pipe(gulp.dest('lib'));
});

gulp.task('default', ['minify-js', 'minify-css']);
