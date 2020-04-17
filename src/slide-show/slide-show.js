/**
 *
 * Slide Show (JS)
 *
 * @author Takuto Yanagida @ Space-Time Inc.
 * @version 2020-04-17
 *
 */


// eslint-disable-next-line no-unused-vars
function st_slide_show_page(id, pageIdx) {
	const pageBtn = document.getElementById(id + '-page-label-' + pageIdx);
	if (pageBtn) pageBtn.click();
}

// eslint-disable-next-line complexity, no-unused-vars
function st_slide_show_initialize(id, opts) {
	const NS             = 'st-slide-show';
	const CLS_STRIP      = NS + '-strip';
	const CLS_SLIDES     = NS + '-slides';
	const CLS_PREV       = NS + '-prev';
	const CLS_NEXT       = NS + '-next';
	const CLS_RIVETS     = NS + '-rivets';
	const CLS_CAP        = NS + '-caption';
	const CLS_PIC        = NS + '-picture';
	const CLS_VIDEO      = NS + '-video';
	const CLS_BG_FRAME   = NS + '-background-frame';
	const CLS_SLIDE_CNT  = NS + '-slide-count';
	const CLS_SLIDE_IDX  = NS + '-slide-index';
	const CLS_PAUSE      = 'pause';
	const CLS_DUAL       = 'dual';
	const CLS_PIC_SCROLL = 'scroll';
	const CLS_DO         = 'do';
	const OFFSET_VIEW    = 100;
	const RANDOM_RATE    = 10;

	if (opts === undefined) opts = {};
	const effect_type   = (opts['effect_type']           === undefined) ? 'slide' : opts['effect_type'];
	const dur_time      = (opts['duration_time']         === undefined) ? 8       : opts['duration_time']; // [second]
	const tran_time     = (opts['transition_time']       === undefined) ? 1       : opts['transition_time']; // [second]
	const bg_opacity    = (opts['background_opacity']    === undefined) ? 0.33    : opts['background_opacity'];
	const pic_scroll    = (opts['is_picture_scroll']     === undefined) ? false   : opts['is_picture_scroll'];
	const random_timing = (opts['is_random_timing']      === undefined) ? false   : opts['is_random_timing'];
	let bg_visible      = (opts['is_background_visible'] === undefined) ? true    : opts['is_background_visible'];
	let side_slide      = (opts['is_side_slide_visible'] === undefined) ? false   : opts['is_side_slide_visible'];
	let zoom_rate       = (opts['zoom_rate']             === undefined) ? 1.05    : opts['zoom_rate'];

	if (effect_type !== 'scroll') side_slide = false;
	if (side_slide) bg_visible = false;
	if (pic_scroll) zoom_rate = 1;  // Exclusive Option

	const root = (id === undefined) ? document.getElementsByClassName(NS)[0] : document.getElementById(id);
	if (!root) return;

	const slides = Array.prototype.slice.call(root.querySelectorAll('.' + CLS_SLIDES + ' > li'));
	const slideNum = slides.length;

	const pictures = [], captions = [], backgrounds = [], rivets = [], thumbs = [], videos = [];
	let curSlideIdx = 0;

	const slidesParent = root.querySelector('.' + CLS_SLIDES);
	if (side_slide) slidesParent.style.overflow = 'visible';

	let slideCntElms = [];
	let slideIdxElms = [];


	// -------------------------------------------------------------------------


	for (let i = 0; i < slides.length; i += 1) fallbackDatasetUrl(slides[i]);

	initImages();
	if (bg_visible) initBackgrounds();
	initRivets();
	initTransitionButtons();
	if (window.ontouchstart === null) initFlick();
	document.addEventListener('DOMContentLoaded', () => {
		initThumbs();
		initSlideIndexIndicator();
		transition(0, 0);
	});


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

	function initSlideIndexIndicator() {
		slideCntElms = root.querySelectorAll('.' + CLS_SLIDE_CNT);
		slideIdxElms = root.querySelectorAll('.' + CLS_SLIDE_IDX);
		for (let i = 0; i < slideCntElms.length; i += 1) slideCntElms[i].innerHTML = slideNum;
		for (let i = 0; i < slideIdxElms.length; i += 1) slideIdxElms[i].innerHTML = 1;
	}


	// -------------------------------------------------------------------------


	function initImages() {
		if (effect_type === 'scroll' && 1 < slideNum && slideNum < 4) {
			cloneSlides();
		}
		for (let i = 0; i < slides.length; i += 1) {
			if (slides[i].dataset.video) {
				const [p, v] = initVideoOne(slides[i]);
				pictures.push(p);
				videos.push(v);
			} else {
				const p = initImageOne(slides[i]);
				pictures.push(p);
				videos.push(null);
			}
		}
		switch (effect_type) {
			case 'slide':  return init_slide();
			case 'scroll': return init_scroll();
			case 'fade':   return init_fade();
			default:       return init_slide();
		}
	}

	function cloneSlides() {
		for (let i = 0; i < slideNum; i += 1) {
			const sl = slides[i];
			const nsl = sl.cloneNode(true);
			slides.push(nsl);
			sl.parentNode.appendChild(nsl);
		}
	}

	function initImageOne(sl) {
		const isPhone = (window.ST.MEDIA_WIDTH === 'phone-landscape');

		sl.style.opacity = 0;  // for avoiding flickering slides on page loading
		createCaption(sl);

		const p = document.createElement('div');
		p.classList.add(CLS_PIC);
		if (pic_scroll) p.classList.add(CLS_PIC_SCROLL);

		const url     = (isPhone && sl.dataset.imgPhone)    ? sl.dataset.imgPhone    : sl.dataset.img;
		const url_sub = (isPhone && sl.dataset.imgSubPhone) ? sl.dataset.imgSubPhone : sl.dataset.imgSub;
		if (url && url_sub) {
			p.classList.add(CLS_DUAL);
			const pl = document.createElement('div');
			const pr = document.createElement('div');
			pl.style.backgroundImage = "url('" + url + "')";
			pr.style.backgroundImage = "url('" + url_sub + "')";
			p.insertBefore(pr, p.firstChild);
			p.insertBefore(pl, p.firstChild);
		} else {
			const pc = document.createElement('div');
			pc.style.backgroundImage = "url('" + url + "')";
			p.insertBefore(pc, p.firstChild);
		}
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
		createCaption(sl);

		const p = document.createElement('div');
		p.classList.add(CLS_VIDEO);

		const v = document.createElement('video');
		v.muted = true;
		v.playsinline = true;
		v.setAttribute('muted', true);
		v.setAttribute('playsinline', true);
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

	function createCaption(slide) {
		const c = slide.querySelector('div');
		if (c) {
			c.style.transitionDuration = tran_time + 's';
			if (c.className === '') {
				c.classList.add(CLS_CAP);
				c.classList.add('subtitle');
			}
			const ds = getElementsByTagNameAndParent('DIV', c);
			for (let i = 0; i < ds.length; i += 1) {
				wrapTextWithSpan(ds[i]);
			}
			wrapTextWithSpan(c);

			const ss = getElementsByTagNameAndParent('SPAN', c);
			if (0 < ss.length) {
				const div = document.createElement('div');
				for (let i = 0; i < ss.length; i += 1) {
					div.appendChild(c.removeChild(ss[i]));
				}
				c.appendChild(div);
			}
		}
		captions.push(c);
	}

	function getElementsByTagNameAndParent(tagName, parent) {
		const es = parent.getElementsByTagName(tagName);
		const ret = [];
		for (let i = 0; i < es.length; i += 1) {
			if (es[i].parentNode === parent) {
				ret.push(es[i]);
			}
		}
		return ret;
	}

	function wrapTextWithSpan(c) {
		for (let i = 0; i < c.childNodes.length; i += 1) {
			const cs = c.childNodes[i];
			if (cs.nodeType === 3/*TEXT_NODE*/) {
				if (cs.nodeValue.trim() === '') continue;
				const span = document.createElement('span');
				span.appendChild(document.createTextNode(cs.nodeValue));
				cs.parentNode.replaceChild(span, cs);
			}
		}
	}

	function initBackgrounds() {
		const frame = root.getElementsByClassName(CLS_STRIP)[0];
		const bgFrame = document.createElement('div');
		bgFrame.classList.add(CLS_BG_FRAME);
		frame.insertBefore(bgFrame, frame.firstChild);

		window.ST.onResize(() => {  // Using Stile
			const r = frame.getBoundingClientRect();
			bgFrame.style.left = -(r.left + window.pageXOffset) + 'px';
		});
		document.addEventListener('DOMContentLoaded', () => {
			const r = frame.getBoundingClientRect();
			bgFrame.style.left = -(r.left + window.pageXOffset) + 'px';
		});

		for (let i = 0; i < slideNum; i += 1) {
			const val = slides[i].dataset.img ? slides[i].dataset.img : slides[i].dataset.imgLeft;
			const bg = document.createElement('div');
			if (val) {
				bg.style.backgroundImage = "url('" + val + "')";
				bg.style.transition = 'opacity ' + tran_time * 2 + 's';
			}
			bgFrame.appendChild(bg);
			backgrounds.push(bg);
		}
	}

	function initRivets() {
		if (slideNum === 1) return;
		const rsElm = root.getElementsByClassName(CLS_RIVETS)[0];

		if (rsElm) {
			const dir = slideNum === 2 ? 1 : 0;
			for (let i = 0; i < slideNum; i += 1) {
				const btn = document.createElement('input');
				btn.type = 'radio';
				btn.name = id + '-buttons';
				btn.id = id + '-page-' + i;
				btn.style.display = 'none';
				if (i === 0) btn.checked = true;
				rivets.push(btn);
				rsElm.appendChild(btn);

				const btnLab = document.createElement('label');
				btnLab.id = id + '-page-label-' + i;
				btnLab.htmlFor = btn.id;
				btnLab.addEventListener('click', function (idx) { return function () { transition(idx, dir);}}(i));
				rsElm.appendChild(btnLab);
			}
		}
	}

	function initThumbs() {
		if (slideNum === 1) return;
		for (let i = 0; i < slideNum; i += 1) {
			const tid = id + '-' + i;
			let it = document.querySelector('*[data-id="' + tid + '"]');
			if (!it) it = document.getElementById(tid);
			thumbs.push(it);
		}
	}

	function initTransitionButtons() {
		const hide = (slideNum === 1);
		const prevBtn = root.getElementsByClassName(CLS_PREV)[0];
		if (prevBtn) {
			if (hide) {
				prevBtn.style.display = 'none';
			} else {
				prevBtn.addEventListener('click', () => {
					transition((curSlideIdx === 0) ? (slideNum - 1) : (curSlideIdx - 1), -1);
				});
			}
		}
		const nextBtn = root.getElementsByClassName(CLS_NEXT)[0];
		if (nextBtn) {
			if (hide) {
				nextBtn.style.display = 'none';
			} else {
				nextBtn.addEventListener('click', () => {
					transition((curSlideIdx === slideNum - 1) ? 0 : (curSlideIdx + 1), 1);
				});
			}
		}
	}

	function initFlick() {
		const DX = 50;
		let stX, mvX, mvY;

		const prevBtn = root.getElementsByClassName(CLS_PREV)[0];
		const nextBtn = root.getElementsByClassName(CLS_NEXT)[0];
		if (!prevBtn || !nextBtn) return;

		const frame = root.getElementsByClassName(CLS_STRIP)[0];
		frame.addEventListener('touchstart', (e) => {
			stX = e.touches[0].pageX;
			// eslint-disable-next-line no-multi-assign
			mvX = mvY = null;
		});
		frame.addEventListener('touchmove', (e) => {
			mvX = e.changedTouches[0].pageX;
			mvY = e.changedTouches[0].pageY;
		});
		frame.addEventListener('touchend', (e) => {
			if (mvX === null || mvY === null) return;
			if (mvX < stX - DX) {  // <-
				nextBtn.click();
				e.preventDefault();
			} else if (stX + DX < mvX) {  // ->
				prevBtn.click();
				e.preventDefault();
			}
		});
	}


	// -------------------------------------------------------------------------


	let stStep = null;

	function transition(idx, dir) {
		if (!doTransition(idx, dir)) return;
		for (let i = 0; i < slideIdxElms.length; i += 1) slideIdxElms[i].innerHTML = (idx + 1);
		if (thumbs.length) {
			for (let i = 0; i < thumbs.length; i += 1) {
				if (thumbs[i]) thumbs[i].classList.remove('visible');
			}
			if (thumbs[idx]) thumbs[idx].classList.add('visible');
		}
		setTimeout(() => { display(idx); }, tran_time * 1000);
	}

	function display(idx) {
		if (0 < rivets.length) rivets[idx].nextSibling.classList.add('visible');
		doDisplay(idx);
		curSlideIdx = idx;
		if (slideNum <= 1) return;

		const v  = videos[curSlideIdx];
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
		if (0 < rivets.length) rivets[curSlideIdx].nextSibling.classList.remove('visible');
		if (isInViewport() && !root.classList.contains(CLS_PAUSE)) {
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

	let lastTime = 0;
	function doTransition(idx, dir) {
		const time = window.performance.now();
		if (dir !== 0 && time - lastTime < tran_time * 1000) return false;
		lastTime = time;

		switch (effect_type) {
			case 'slide' : transition_slide(idx);       break;
			case 'scroll': transition_scroll(idx, dir); break;
			case 'fade'  : transition_fade(idx);        break;
			default      : transition_slide(idx);       break;
		}
		if (bg_visible) {
			for (let i = 0; i < slideNum; i += 1) {
				backgrounds[i].style.opacity = (i === idx) ? bg_opacity : 0;
			}
		}
		for (let i = 0; i < slides.length; i += 1) {
			const v = videos[i];
			if (v && (i % slideNum) === idx) {
				v.setAttribute('autoplay', true);
				v.play();
			}
		}
		return true;
	}

	function doDisplay(idx) {
		const isPhone = (window.ST.MEDIA_WIDTH === 'phone-landscape');
		if (isPhone) {
			for (let i = 0; i < slides.length; i += 1) pictures[i].style.transform = '';
		} else if (zoom_rate !== 1) {
			for (let i = 0; i < slides.length; i += 1) {
				const p = pictures[i], v = videos[i];
				if (v) continue;
				// Below, 'rotate(0.1deg)' is a hack for IE11
				p.style.transform = ((i % slideNum) === idx) ? 'scale(' + zoom_rate + ', ' + zoom_rate + ') rotate(0.1deg)' : '';
			}
		}
		for (let i = 0; i < slides.length; i += 1) {
			const p = pictures[i], v = videos[i];
			if (v) {
				if ((i % slideNum) !== idx) {
					v.pause();
					v.currentTime = 0;
				}
			} else {
				if ((i % slideNum) === idx) {
					p.classList.add(CLS_DO);
				} else {
					p.classList.remove(CLS_DO);
				}
			}
		}
		for (let i = 0; i < captions.length; i += 1) {
			if (!captions[i]) continue;
			if ((i % slideNum) === idx) captions[i].classList.add('visible');
			else captions[i].classList.remove('visible');
		}
		if (0 < rivets.length) rivets[idx].checked = true;
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
			if (bg_visible) {
				backgrounds[i].style.opacity = (i === idx) ? 0.33 : 0;
			}
			if (i <= idx) {
				slides[i].style.transform = 'translateX(0%)';
			} else {
				slides[i].style.transform = 'translateX(100%)';
			}
		}
	}


	// =========================================================================


	function init_scroll() {
		for (let i = 0; i < slides.length; i += 1) {
			slides[i].style.opacity = 1;
			slides[i].style.transform = 'translateX(' + (i * 100) + '%)';
		}
	}

	let stScroll = null;

	function transition_scroll(idx, dir) {
		let offset = 0;
		if (dir === 0) {
			offset = (curSlideIdx - idx) * 100;
			if (curSlideIdx === slideNum - 1 && idx === 0) offset = -100;
			if (curSlideIdx === 0 && idx === slideNum - 1) offset = 100;
		} else {
			offset = dir * -100;
		}
		const cxs = calc_position(curSlideIdx, offset);
		for (let i = 0; i < slides.length; i += 1) {
			const sl = slides[i];
			sl.style.transition = 'transform 0s';
			sl.style.transform = 'translateX(' + cxs[i] + '%)';
		}
		if (idx === curSlideIdx) return;

		if (stScroll) clearTimeout(stScroll);
		stScroll = setTimeout(() => {
			for (let i = 0; i < slides.length; i += 1) {
				const sl = slides[i];
				const nx = cxs[i] + offset;
				sl.style.transition = 'transform ' + tran_time + 's';
				sl.style.transform = 'translateX(' + nx + '%)';
			}
			stScroll = null;
		}, 100);
	}

	// eslint-disable-next-line complexity
	function calc_position(idx, offset) {
		if (slideNum === 1) return [0];
		if (slideNum === 2) {
			if (offset === 0 || offset === -100) {  // Scroll to Right
				if (idx === 0) return [0, 100, 200, -100];
				if (idx === 1) return [100, 0, -100, 200];
			} else if (offset === 100) {  // Scroll to Left
				if (idx === 0) return [0, -100, -200, 100];
				if (idx === 1) return [-100, 0, 100, -200];
			}
		}
		if (slideNum === 3) {
			if (offset === 0 || offset === -100) {  // Scroll to Right
				if (idx === 0) return [0, 100, -100, 0, 100, 200];
				if (idx === 1) return [-100, 0, 100, 200, 0, 100];
				if (idx === 2) return [100, -100, 0, 100, 200, 0];
			} else if (offset === 100) {  // Scroll to Left
				if (idx === 0) return [0, 100, -100, 0, -200, -100];
				if (idx === 1) return [-100, 0, 100, -100, 0, -200];
				if (idx === 2) return [100, -100, 0, -200, -100, 0];
			}
		}
		if (4 <= slideNum) {
			const xs = new Array(slides.length);
			for (let i = 0; i < slides.length; i += 1) {
				xs[i] = (i - idx) * 100;
			}
			if (offset === 0 || offset === -100) {  // Scroll to Right
				set_val(xs, idx - 1, -100);
				set_val(xs, idx + 1, 100);
				set_val(xs, idx + 2, 200);
			} else if (offset === 100) {  // Scroll to Left
				set_val(xs, idx + 1, 100);
				set_val(xs, idx - 1, -100);
				set_val(xs, idx - 2, -200);
			}
			return xs;
		}
	}

	function set_val(a, i, v) {
		if (i < 0) a[a.length + i] = v;
		else if (a.length - 1 < i) a[i - a.length] = v;
		else a[i] = v;
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
}
