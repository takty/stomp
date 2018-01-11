/**
 *
 * Background Images (JS)
 *
 * @author Takuto Yanagida @ Space-Time Inc.
 * @version 2018-01-11
 *
 */


const st_background_image_initialize = function (id, opts) {
	const WIN_SIZE_RESPONSIVE = 600;
	const RANDOM_RATE         = 10;
	const NS         = 'st-background-image';
	const CLS_SLIDES = NS + '-slides';
	const CLS_PIC    = NS + '-picture';
	const CLS_DO     = 'do';

	if (opts === undefined) opts = {};
	const effect_type   = (opts['effect_type']     === undefined) ? 'slide' : opts['effect_type'];
	const zoom_rate     = (opts['zoom_rate']       === undefined) ? 1.05    : opts['zoom_rate'];
	const dur_time      = (opts['duration_time']   === undefined) ? 8       : opts['duration_time']; // [second]
	const tran_time     = (opts['transition_time'] === undefined) ? 1       : opts['transition_time']; // [second]
	const random_timing = (opts['random_timing']   === undefined) ? true    : opts['random_timing'];

	let root;
	if (id === undefined) {
		root = document.getElementsByClassName(NS)[0];
	} else {
		root = document.getElementById(id);
	}
	if (root === undefined) return;
	const slides = root.querySelectorAll('.' + CLS_SLIDES + ' > li');
	const slideNum = slides.length;

	const pictures = [], backgrounds = [], pageBtns = [];
	let curSlideIdx = 0;

	let prevXs = [];  // for Scroll Effect

	function initImages() {
		const isPhone = window.innerWidth < WIN_SIZE_RESPONSIVE;
		for (let i = 0; i < slideNum; i += 1) {
			const p = document.createElement('div');
			p.classList.add(CLS_PIC);
			let url = '';
			if (isPhone && slides[i].dataset.imgPhone) {
				url = slides[i].dataset.imgPhone;
			} else {
				url = slides[i].dataset.img;
			}
			slides[i].style.opacity = 0;  // for avoiding flickering slides on page loading
			p.style.backgroundImage = 'url(' + url + ')';
			const a = slides[i].querySelector('a');
			if (a) {
				a.insertBefore(p, a.firstChild);
			} else {
				slides[i].insertBefore(p, slides[i].firstChild);
			}
			pictures.push(p);
		}
		switch (effect_type) {
			case 'slide':  return init_slide();
			case 'scroll': return init_scroll();
			case 'fade':   return init_fade();
		}
	}
	initImages();


	// -------------------------------------------------------------------------

	function transition(idx) {
		switch (effect_type) {
			case 'slide':  transition_slide(idx);  break;
			case 'scroll': transition_scroll(idx); break;
			case 'fade':   transition_fade(idx);   break;
		}
		setTimeout(function () {
			const isPhone = window.innerWidth < WIN_SIZE_RESPONSIVE;
			if (isPhone) {
				for (let i = 0; i < slideNum; i += 1) pictures[i].style.transform = '';
			} else {
				for (let i = 0; i < slideNum; i += 1) {
					pictures[i].style.transform = (i === idx) ? 'scale(' + zoom_rate + ', ' + zoom_rate + ')' : '';
				}
			}
		}, tran_time * 1000);

		curSlideIdx = idx;
		if (slideNum > 1) {
			showNext();
		}
	}

	let stShowNext = null
	function showNext() {
		clearTimeout(stShowNext);
		let dt = dur_time * 1000;
		if (random_timing) {
			const r = (RANDOM_RATE - Math.random() * (RANDOM_RATE * 2)) / 100;
			dt = Math.ceil(dt * (1 + r));
		}
		stShowNext = setTimeout(function () {
			transition(curSlideIdx = (curSlideIdx === slideNum - 1) ? 0 : (curSlideIdx + 1));
			showNext();
		}, dt);
	}
	document.addEventListener('DOMContentLoaded', function () {transition(0);});

	// =========================================================================

	function init_slide() {
		for (let i = 0; i < slideNum; i += 1) {
			slides[i].style.opacity = 1;
			slides[i].style.transform = 'translateX(' + ((i === 0) ? 0 : 100) + '%)';
			slides[i].style.transition = 'transform ' + tran_time + 's';
		}
	}

	function transition_slide(idx) {
		for (let i = 0; i < slideNum; i += 1) {
			if (i <= idx) {
				slides[i].style.transform = 'translateX(0%)';
			} else {
				slides[i].style.transform = 'translateX(100%)';
			}
		}
	}

	// =========================================================================

	function init_scroll() {
		for (let i = 0; i < slideNum; i += 1) {
			slides[i].style.opacity = 1;
			prevXs.push((i === 0) ? 0 : 100);
			slides[i].style.transform = 'translateX(' + ((i === 0) ? 0 : 100) + '%)';
		}
	}

	function transition_scroll(idx) {
		const xs = [];
		for (let i = 0; i < slideNum; i += 1) {
			if (i === idx) {
				xs.push(0);
			} else if (i < idx) {
				xs.push(-100);
			} else {
				xs.push(100);
			}
		}
		if (slideNum > 1) {
			if (idx === 0) xs[slideNum - 1] = -100;
			if (idx === slideNum - 1) xs[0] = 100;
		}

		for (let i = 0; i < slideNum; i += 1) {
			const img = slides[i];
			const x = prevXs[i], nx = xs[i];
			if ((x === 100 && nx === -100) || (x === -100 && nx === 100)) {
				img.style.transition = 'transform 0s';
			} else {
				img.style.transition = 'transform ' + tran_time + 's';
			}
			img.style.transform = 'translateX(' + nx + '%)';
		}
		prevXs = xs;
	}

	// =========================================================================

	function init_fade() {
		for (let i = 0; i < slideNum; i += 1) {
			slides[i].style.opacity = (i === 0) ? 1 : 0;
			slides[i].style.transition = 'opacity ' + tran_time + 's';
		}
	}

	function transition_fade(idx) {
		for (let i = 0; i < slideNum; i += 1) {
			slides[i].style.opacity = (i === idx) ? 1 : 0;
			slides[i].style.pointerEvents = (i === idx) ? 'auto' : 'none';
		}
	}

	// =========================================================================

};
