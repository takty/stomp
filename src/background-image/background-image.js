/**
 *
 * Background Images (JS)
 *
 * @author Takuto Yanagida @ Space-Time Inc.
 * @version 2020-02-17
 *
 */


// eslint-disable-next-line no-unused-vars
function st_background_image_initialize(id, opts) {
	const NS          = 'st-background-image';
	const CLS_SLIDES  = NS + '-slides';
	const CLS_PIC     = NS + '-picture';
	const CLS_VIDEO   = NS + '-video';
	const CLS_PAUSE   = 'pause';
	const OFFSET_VIEW = 100;
	const RANDOM_RATE = 10;

	if (opts === undefined) opts = {};
	const effect_type   = (opts['effect_type']      === undefined) ? 'slide' : opts['effect_type'];
	const dur_time      = (opts['duration_time']    === undefined) ? 8       : opts['duration_time']; // [second]
	const tran_time     = (opts['transition_time']  === undefined) ? 1       : opts['transition_time']; // [second]
	const random_timing = (opts['is_random_timing'] === undefined) ? true    : opts['is_random_timing'];
	const autoplay      = (opts['is_autoplay']      === undefined) ? true    : opts['is_autoplay'];
	const zoom_rate     = (opts['zoom_rate']        === undefined) ? 1.05    : opts['zoom_rate'];

	const root = (id === undefined) ? document.getElementsByClassName(NS)[0] : document.getElementById(id);
	if (!root) return;

	const slides = Array.prototype.slice.call(root.querySelectorAll('.' + CLS_SLIDES + ' > li'));
	const slideNum = slides.length;

	const pictures = [], videos = [];
	let curSlideIdx = 0;

	let prevXs = [];  // for Scroll Effect
	let hasVideo = false;
	let onTransitionEnd = null;


	// -------------------------------------------------------------------------


	for (let i = 0; i < slides.length; i += 1) fallbackDatasetUrl(slides[i]);

	initImages();
	document.addEventListener('DOMContentLoaded', () => { transition(0, 0); });
	if (hasVideo) setTimeout(tryResizeVideo, 100);

	function tryResizeVideo() {
		const finish = resizeVideo();
		if (!finish) setTimeout(tryResizeVideo, 100);
	}


	// -------------------------------------------------------------------------


	function fallbackDatasetUrl(elm) {
		const style = elm.getAttribute('style');
		if (!style) return;
		const ps = style.split(';')
			.map((e) => e.trim())
			.filter((e) => e.length > 0);

		for (let i = 0; i < ps.length; i += 1) {
			const kv = ps[i].split(':').map((e) => e.trim());
			if (kv.length < 2) continue;
			if (kv[0].indexOf('data-') === 0) {
				const urls = (kv[1] + ':' + kv[2]).match(/url\(\s*["']?([^)"']+)/);
				if (!urls) return;
				elm.setAttribute(kv[0], urls[1]);
			}
		}
	}


	// -------------------------------------------------------------------------


	function initImages() {
		for (let i = 0; i < slideNum; i += 1) {
			if (slides[i].dataset.video) {
				const [p, v] = initVideoOne(slides[i]);
				pictures.push(p);
				videos.push(v);
				hasVideo = true;
			} else {
				const p = initImageOne(slides[i]);
				pictures.push(p);
				videos.push(null);
			}
		}
		if (hasVideo) window.ST.onResize(resizeVideo);
		switch (effect_type) {
			case 'slide' : return init_slide();
			case 'scroll': return init_scroll();
			case 'fade'  : return init_fade();
			default      : return init_slide();
		}
	}

	function resizeVideo() {
		let finish = true;
		for (let i = 0; i < slideNum; i += 1) {
			const p = pictures[i];
			if (!p.classList.contains(CLS_VIDEO)) continue;
			const v = p.getElementsByTagName('VIDEO')[0];
			const ar = v.dataset['ar'];
			if (!ar) {
				finish = false;
				continue;
			}
			const arVal = parseFloat(ar);
			const arFrame = p.clientWidth / p.clientHeight;
			if (arVal < arFrame) {
				v.classList.remove('height');
				v.classList.add('width');
			} else {
				v.classList.remove('width');
				v.classList.add('height');
			}
		}
		return finish;
	}

	function initImageOne(sl) {
		const isPhone = (window.ST.MEDIA_WIDTH === 'phone-landscape');

		sl.style.opacity = 0;  // for avoiding flickering slides on page loading

		const p = document.createElement('div');
		p.classList.add(CLS_PIC);

		const url = (isPhone && sl.dataset.imgPhone) ? sl.dataset.imgPhone : sl.dataset.img;
		p.style.backgroundImage = 'url(' + url + ')';

		const a = sl.querySelector('a');
		if (a) {
			a.insertBefore(p, a.firstChild);
		} else {
			sl.insertBefore(p, sl.firstChild);
		}
		return p;
	}

	function initVideoOne(sl) {
		sl.style.opacity = 0;  // for avoiding flickering slides on page loading

		const p = document.createElement('div');
		p.classList.add(CLS_VIDEO);

		const v = document.createElement('video');
		v.muted = true;
		v.playsinline = true;
		v.setAttribute('muted', true);
		v.setAttribute('playsinline', true);
		v.addEventListener('loadedmetadata', () => {
			const ar = v.clientWidth / v.clientHeight;
			v.dataset.ar = (0 | (ar * 1000)) / 1000;
		});
		p.appendChild(v);

		const url = sl.dataset.video;
		const s = document.createElement('source');
		s.setAttribute('src', url);
		v.appendChild(s);

		const a = sl.querySelector('a');
		if (a) {
			a.insertBefore(p, a.firstChild);
		} else {
			sl.insertBefore(p, sl.firstChild);
		}
		return [p, v];
	}


	// -------------------------------------------------------------------------


	let stStep = null;

	function transition(idx, dir) {
		if (!doTransition(idx, dir)) return;
		setTimeout(() => {
			if (onTransitionEnd) onTransitionEnd();
			display(idx);
		}, tran_time * 1000);
	}

	function display(idx) {
		doDisplay(idx);
		curSlideIdx = idx;
		if (slideNum <= 1) return;

		const v = videos[curSlideIdx];
		let dt = dur_time;
		if (v) {
			dt = v.duration - tran_time;
		} else if (random_timing) {
			const r = (RANDOM_RATE - Math.random() * (RANDOM_RATE * 2)) / 100;
			dt *= (1 + r);
		}

		if (stStep) clearTimeout(stStep);
		stStep = setTimeout(step, Math.ceil(dt * 1000));
	}

	function step() {
		if (autoplay && isInViewport() && !root.classList.contains(CLS_PAUSE)) {
			const next = (curSlideIdx === slideNum - 1) ? 0 : (curSlideIdx + 1);
			transition(next, 1);
		} else {
			setTimeout(step, dur_time * 1000);
		}
	}


	// -------------------------------------------------------------------------


	function isInViewport() {
		const r = root.getBoundingClientRect();
		return (-OFFSET_VIEW < r.bottom && r.top < window.innerHeight + OFFSET_VIEW);
	}

	let lastTime = window.performance.now();
	function doTransition(idx, dir) {
		const time = window.performance.now();
		if (dir !== 0 && time - lastTime < tran_time * 1000) return false;
		lastTime = time;

		switch (effect_type) {
			case 'slide' : transition_slide(idx);  break;
			case 'scroll': transition_scroll(idx); break;
			case 'fade'  : transition_fade(idx);   break;
			default      : transition_slide(idx);  break;
		}
		for (let i = 0; i < slideNum; i += 1) {
			const v = videos[i];
			if (v && i === idx) {
				v.setAttribute('autoplay', true);
				v.play();
			}
		}
		return true;
	}

	function doDisplay(idx) {
		const isPhone = (window.ST.MEDIA_WIDTH === 'phone-landscape');
		if (isPhone) {
			for (let i = 0; i < slideNum; i += 1) pictures[i].style.transform = '';
		} else if (zoom_rate !== 1) {
			for (let i = 0; i < slideNum; i += 1) {
				if (videos[i]) continue;
				// Below, 'rotate(0.1deg)' is a hack for IE11
				const t = (i === idx) ? ('scale(' + zoom_rate + ', ' + zoom_rate + ') rotate(0.1deg)') : '';
				pictures[i].style.transform = t;
			}
		}
		for (let i = 0; i < slideNum; i += 1) {
			const v = videos[i];
			if (v) {
				if (i !== idx) {
					v.pause();
					v.currentTime = 0;
				}
			}
		}
	}


	// =========================================================================


	function init_slide() {
		for (let i = 0; i < slideNum; i += 1) {
			slides[i].style.transform = 'translateX(' + ((i === 0) ? 0 : 100) + '%)';
		}
		setTimeout(() => {
			for (let i = 0; i < slideNum; i += 1) {
				slides[i].style.opacity = 1;
				slides[i].style.transition = 'transform ' + tran_time + 's';
			}
		}, 0);
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


	return {
		previous: () => {
			transition((curSlideIdx === 0) ? (slideNum - 1) : (curSlideIdx - 1), -1);
		},
		next: () => {
			transition((curSlideIdx === slideNum - 1) ? 0 : (curSlideIdx + 1), 1);
		},
		onTransitionEnd: (fn) => {
			onTransitionEnd = fn;
		}
	};

}
