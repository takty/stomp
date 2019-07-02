/* eslint-disable no-undef */
'use strict';

const path = require('path');
const gulp = require('gulp');
const $ = require('gulp-load-plugins')({ pattern: ['gulp-*'] });


gulp.task('js-slide-show', () => gulp.src('src/slide-show/**/*.js')
	.pipe($.plumber())
	.pipe($.babel())
	.pipe($.terser())
	.pipe($.rename({ extname: '.min.js' }))
	.pipe(gulp.dest('./dist/slide-show'))
);

gulp.task('js-background-image', () => gulp.src('src/background-image/**/*.js')
	.pipe($.plumber())
	.pipe($.babel())
	.pipe($.terser())
	.pipe($.rename({ extname: '.min.js' }))
	.pipe(gulp.dest('./dist/background-image'))
);

gulp.task('js', gulp.parallel('js-slide-show', 'js-background-image'));

gulp.task('sass-slide-show', () => gulp.src(['src/slide-show/**/*.scss'], { base: 'src/slide-show' })
	.pipe($.plumber())
	.pipe($.changed('./dist/slide-show'))
	.pipe(gulp.dest('./dist/slide-show'))
);

gulp.task('sass-background-image', () => gulp.src(['src/background-image/**/*.scss'], { base: 'src/background-image' })
	.pipe($.plumber())
	.pipe($.changed('./dist/background-image'))
	.pipe(gulp.dest('./dist/background-image'))
);

gulp.task('sass', gulp.parallel('sass-slide-show', 'sass-background-image'));

gulp.task('watch', () => {
	gulp.watch('src/**/*.js', gulp.series('js'));
	gulp.watch('src/**/*.scss', gulp.series('sass'));
});

gulp.task('build', gulp.parallel('js', 'sass'));

gulp.task('default', gulp.series('build', 'watch'));


// -----------------------------------------------------------------------------


gulp.task('docs-lib', () => gulp.src(['node_modules/stile/dist/**/*'])
	.pipe($.plumber())
	.pipe($.rename((p) => {
		p.dirname = p.dirname.replace(path.sep + 'dist', '');
	}))
	.pipe(gulp.dest('./stile/'))
);

gulp.task('docs-sass', gulp.series('docs-lib', () => gulp.src('docs/style.scss')
	.pipe($.plumber())
	.pipe($.sourcemaps.init())
	.pipe($.sass({ outputStyle: 'compressed' }))
	.pipe($.autoprefixer({ remove: false }))
	.pipe($.rename({ extname: '.min.css' }))
	.pipe($.sourcemaps.write('.'))
	.pipe(gulp.dest('./docs/css')))
);

gulp.task('docs-js', gulp.series('js', () => gulp.src([
		'node_modules/stile/dist/js/stile-full.min.js',
		'dist/background-image/background-image.min.js',
		'dist/slide-show/slide-show.min.js'
	])
	.pipe($.plumber())
	.pipe(gulp.dest('./docs')))
);

gulp.task('docs-watch', () => {
	gulp.watch('src/**/*.js',     gulp.series('js', 'docs-js'));
	gulp.watch('src/**/*.scss',   gulp.series('sass', 'docs-sass'));
	gulp.watch('docs/style.scss', gulp.series('docs-sass'));
});

gulp.task('docs-build', gulp.parallel('docs-js', 'docs-sass'));

gulp.task('docs-default', gulp.series('docs-build', 'docs-watch'));

gulp.task('docs', gulp.parallel('default', 'docs-default'));
