var gulp    = require('gulp');
var plumber = require('gulp-plumber');
var uglify  = require('gulp-uglify');
var rename  = require('gulp-rename');
var babel   = require('gulp-babel');

gulp.task('js', function() {
	gulp.src('src/slide-show/**/*.js')
	.pipe(plumber())
	.pipe(babel({presets: ['es2015']}))
	.pipe(uglify())
	.pipe(rename({extname: '.min.js'}))
	.pipe(gulp.dest('dist/slide-show'));

	gulp.src('src/background-image/**/*.js')
	.pipe(plumber())
	.pipe(babel({presets: ['es2015']}))
	.pipe(uglify())
	.pipe(rename({extname: '.min.js'}))
	.pipe(gulp.dest('dist/background-image'));
});

gulp.task('sass', function () {
	gulp.src(['src/slide-show/**/*.scss'], {base: 'src/slide-show'})
	.pipe(gulp.dest('dist/slide-show'));

	gulp.src(['src/background-image/**/*.scss'], {base: 'src/background-image'})
	.pipe(gulp.dest('dist/background-image'));
});

gulp.task('watch', function() {
	gulp.watch('src/**/*.js', ['js']);
	gulp.watch('src/**/*.scss', ['sass']);
});

gulp.task('build', ['js', 'sass']);
gulp.task('default', ['js', 'sass', 'watch']);
