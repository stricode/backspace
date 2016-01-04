var gulp = require('gulp');
var prompt = require('gulp-prompt');
var minifyjs = require('gulp-minify');
var minifycss = require('gulp-minify-css');
var rename = require('gulp-rename');
var exec = require('child_process').exec;
var vinylPaths = require('vinyl-paths');
var del = require('del');

/* Clean build and vendor dirs */
gulp.task('clean', function () {
    return del(['build/*', 'www/vendor/*']);
});

/* Compiles .ts files using tsc */
gulp.task('tsc', ['clean'], function (cb) {
    exec('tsc backspace.ts', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

/* Minify .js files and dest to build */
gulp.task('minify-js', ['tsc', 'clean'], function () {
    var stream = gulp.src(['*.js', '!gulpfile.js', '!backspace.*.js'])
        .pipe(minifyjs())
        .pipe(vinylPaths(del))
        .pipe(gulp.dest('build'));
    return stream;
});

/* Minify .css files and dest to build */
gulp.task('minify-css', ['clean'], function () {
    var stream = gulp.src('*.css')
        .pipe(minifycss())
        .pipe(rename({ suffix: '-min' }))
        .pipe(gulp.dest('build'));
    return stream;
});

/* Minify files and dest to www/vendor */
gulp.task('vendor', ['minify-js', 'minify-css'], function () {
    return gulp.src(['build/*-min.*'])
        .pipe(gulp.dest('www/vendor'));
});

/* Run tsc and vendor by default (default will run from VS Code as build command) */
gulp.task('default', ['tsc', 'vendor']);

/* Stage files to local repository folder */
var local_repo_path = process.env.stricode_repo + "/backspace/";

// Clean local repo directory excluding .md files
gulp.task('clean:repo', function () {
    var patterns = [
        local_repo_path + '*',
        '!' + local_repo_path + '*.md'
    ];
    return del(patterns, { force: true });
});

// a) Stage files to master branch (also including minified files in the lib directory)
gulp.task('stage:master', ['default', 'clean:repo'], function () {
    gulp.src(['*.*', '!backspace.*.js', '!tconfig.json'])
        .pipe(prompt.confirm("Ready to stage files in the master branch. Proceed?"))
        .pipe(gulp.dest(local_repo_path))
        .on('end', function () {
            gulp.src('build/*-min.*')
                .pipe(gulp.dest(local_repo_path + 'lib'))
                .on('end', function () {
                    console.log("Staging complete. Commit changes and push to Git.");
                });
        });
});

// b) Stage files to gh-pages branch (www directory contains website content)
gulp.task('stage:gh-pages', ['default', 'clean:repo'], function () {
    gulp.src('www/**')
        .pipe(prompt.confirm("Staging to gh-pages. Proceed?"))
        .pipe(gulp.dest(local_repo_path))
        .on('end', function () {
            console.log("Staging complete. Commit changes and push to Git.");
        });
});