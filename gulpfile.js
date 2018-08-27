'use strict';

const gulp = require('gulp');
const $ = require('gulp-load-plugins')({ pattern: ['gulp-*'] });


gulp.task('js-slide-show', () => {
	return gulp.src('src/slide-show/**/*.js')
		.pipe($.plumber())
		.pipe($.babel({ presets: [['env', { targets: { ie: 11 } }]] }))
		.pipe($.uglify())
		.pipe($.rename({ extname: '.min.js' }))
		.pipe(gulp.dest('dist/slide-show'));
});

gulp.task('js-background-image', () => {
	return gulp.src('src/background-image/**/*.js')
		.pipe($.plumber())
		.pipe($.babel({ presets: [['env', { targets: { ie: 11 } }]] }))
		.pipe($.uglify())
		.pipe($.rename({ extname: '.min.js' }))
		.pipe(gulp.dest('dist/background-image'));
});

gulp.task('js', gulp.parallel('js-slide-show', 'js-background-image'));

gulp.task('sass-slide-show', () => {
	return gulp.src(['src/slide-show/**/*.scss'], { base: 'src/slide-show' })
		.pipe(gulp.dest('dist/slide-show'));
});

gulp.task('sass-background-image', () => {
	return gulp.src(['src/background-image/**/*.scss'], { base: 'src/background-image' })
		.pipe(gulp.dest('dist/background-image'));
});

gulp.task('sass', gulp.parallel('sass-slide-show', 'sass-background-image'));

gulp.task('watch', () => {
	gulp.watch('src/**/*.js', gulp.series('js'));
	gulp.watch('src/**/*.scss', gulp.series('sass'));
});

gulp.task('build', gulp.parallel('js', 'sass'));

gulp.task('default', gulp.series('build', 'watch'));
