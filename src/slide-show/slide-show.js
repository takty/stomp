/**
 *
 * Slide Show (JS)
 *
 * @author Takuto Yanagida @ Space-Time Inc.
 * @version 2018-11-09
 *
 */


const st_slide_show_initialize = function (id, opts) {
	const WIN_SIZE_RESPONSIVE = 600;
	const NS             = 'st-slide-show';
	const CLS_STRIP      = NS + '-strip';
	const CLS_SLIDES     = NS + '-slides';
	const CLS_PREV       = NS + '-prev';
	const CLS_NEXT       = NS + '-next';
	const CLS_RIVETS     = NS + '-rivets';
	const CLS_CAP        = NS + '-caption';
	const CLS_PIC        = NS + '-picture';
	const CLS_BG_FRAME   = NS + '-background-frame';
	const CLS_DUAL       = 'dual';
	const CLS_PIC_SCROLL = 'scroll';
	const CLS_DO         = 'do';

	if (opts === undefined) opts = {};
	const effect_type = (opts['effect_type']           === undefined) ? 'slide' : opts['effect_type'];
	const dur_time    = (opts['duration_time']         === undefined) ? 8       : opts['duration_time']; // [second]
	const tran_time   = (opts['transition_time']       === undefined) ? 1       : opts['transition_time']; // [second]
	let bg_visible    = (opts['is_background_visible'] === undefined) ? true    : opts['is_background_visible'];
	const bg_opacity  = (opts['background_opacity']    === undefined) ? 0.33    : opts['background_opacity'];
	const pic_scroll  = (opts['picture_scroll']        === undefined) ? false   : opts['picture_scroll'];
	let side_slide    = (opts['side_slide']            === undefined) ? false   : opts['side_slide'];
	let zoom_rate     = (opts['zoom_rate']             === undefined) ? 1.05    : opts['zoom_rate'];

	if (effect_type !== 'scroll') side_slide = false;
	if (side_slide) bg_visible = false;
	if (pic_scroll) zoom_rate = 1;  // Exclusive Option

	let root;
	if (id === undefined) {
		root = document.getElementsByClassName(NS)[0];
	} else {
		root = document.getElementById(id);
	}
	if (root === undefined) return;

	const slidesParent = root.querySelector('.' + CLS_SLIDES);
	if (side_slide) slidesParent.style.overflow = 'visible';

	const slides = Array.prototype.slice.call(root.querySelectorAll('.' + CLS_SLIDES + ' > li'));
	const slideNum = slides.length;

	const pictures = [], captions = [], backgrounds = [], pageBtns = [];
	let curSlideIdx = 0;

	function initImages() {
		const isPhone = window.innerWidth < WIN_SIZE_RESPONSIVE;

		if (effect_type === 'scroll' && 1 < slideNum && slideNum < 4) {
			for (let i = 0; i < slideNum; i += 1) {
				const sl = slides[i];
				const nsl = sl.cloneNode(true);
				slides.push(nsl);
				sl.parentNode.appendChild(nsl);
			}
		}
		for (let i = 0; i < slides.length; i += 1) {
			const p = initImageOne(slides[i]);
			pictures.push(p);
		}
		switch (effect_type) {
			case 'slide':  return init_slide();
			case 'scroll': return init_scroll();
			case 'fade':   return init_fade();
			default:       return init_slide();
		}

		function initImageOne(sl) {
			sl.style.opacity = 0;  // for avoiding flickering slides on page loading
			createCaption(sl);

			const p = document.createElement('div');
			p.classList.add(CLS_PIC);
			if (pic_scroll) p.classList.add(CLS_PIC_SCROLL);

			const url = (isPhone && sl.dataset.imgPhone) ? sl.dataset.imgPhone : sl.dataset.img;
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
				p.style.backgroundImage = "url('" + url + "')";
			}
			const a = sl.querySelector('a');
			if (a) {
				a.insertBefore(p, a.firstChild);
			} else {
				sl.insertBefore(p, sl.firstChild);
			}
			return p;
		}
	}
	initImages();

	function createCaption(slide) {
		const c = slide.querySelector('div');
		if (c) {
			c.style.opacity = 0;
			c.style.transition = 'opacity ' + tran_time + 's';
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

		window.addEventListener('resize', function () {
			const r = frame.getBoundingClientRect();
			bgFrame.style.left = -(r.left + window.pageXOffset) + 'px';
		});
		document.addEventListener('DOMContentLoaded', function () {
			const r = frame.getBoundingClientRect();
			bgFrame.style.left = -(r.left + window.pageXOffset) + 'px';
		});

		for (let i = 0; i < slideNum; i += 1) {
			const val = slides[i].dataset.img ? slides[i].dataset.img : slides[i].dataset.imgLeft;
			const bg = document.createElement('div');
			bg.style.backgroundImage = "url('" + val + "')";
			bg.style.transition = 'opacity ' + tran_time * 2 + 's';
			bgFrame.appendChild(bg);
			backgrounds.push(bg);
		}
	}
	if (bg_visible) initBackgrounds();

	function initRivets() {
		if (slideNum === 1) return;
		const rsElm = root.getElementsByClassName(CLS_RIVETS)[0];

		if (rsElm) {
			for (let i = 0; i < slideNum; i += 1) {
				const btn = document.createElement('input');
				btn.type = 'radio';
				btn.name = id + '-buttons';
				btn.id = id + '-page-' + i;
				btn.style.display = 'none';
				if (i === 0) btn.checked = true;
				pageBtns.push(btn);
				rsElm.appendChild(btn);

				const btnLab = document.createElement('label');
				btnLab.id = id + '-page-label-' + i;
				btnLab.htmlFor = btn.id;
				btnLab.addEventListener('click', function (idx) {return function () {transition(idx);}}(i));
				rsElm.appendChild(btnLab);
			}
		}
	}
	initRivets();

	function initTransitionButtons() {
		const hide = (slideNum === 1);
		const prevBtn = root.getElementsByClassName(CLS_PREV)[0];
		if (prevBtn) {
			if (hide) {
				prevBtn.style.display = 'none';
			} else {
				prevBtn.addEventListener('click', function () {
					transition((curSlideIdx === 0) ? (slideNum - 1) : (curSlideIdx - 1));
				});
			}
		}
		const nextBtn = root.getElementsByClassName(CLS_NEXT)[0];
		if (nextBtn) {
			if (hide) {
				nextBtn.style.display = 'none';
			} else {
				nextBtn.addEventListener('click', function () {
					transition((curSlideIdx === slideNum - 1) ? 0 : (curSlideIdx + 1));
				});
			}
		}
	}
	initTransitionButtons();

	function initFlick() {
		const DX = 50;
		let stX, stY, mvX, mvY;

		const prevBtn = root.getElementsByClassName(CLS_PREV)[0];
		const nextBtn = root.getElementsByClassName(CLS_NEXT)[0];
		if (!prevBtn || !nextBtn) return;

		const frame = root.getElementsByClassName(CLS_STRIP)[0];
		frame.addEventListener('touchstart', function (e) {
			stX = e.touches[0].pageX;
			stY = e.touches[0].pageY;
			mvX = mvY = null;
		});
		frame.addEventListener('touchmove', function (e) {
			mvX = e.changedTouches[0].pageX;
			mvY = e.changedTouches[0].pageY;
		});
		frame.addEventListener('touchend', function (e) {
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
	if (window.ontouchstart === null) initFlick();

	// -------------------------------------------------------------------------

	function transition(idx) {
		switch (effect_type) {
			case 'slide':  transition_slide(idx);  break;
			case 'scroll': transition_scroll(idx); break;
			case 'fade':   transition_fade(idx);   break;
			default:       transition_slide(idx);  break;
		}
		if (bg_visible) {
			for (let i = 0; i < slideNum; i += 1) {
				backgrounds[i].style.opacity = (i === idx) ? bg_opacity : 0;
			}
		}
		setTimeout(function () {
			const isPhone = window.innerWidth < WIN_SIZE_RESPONSIVE;
			if (isPhone) {
				for (let i = 0; i < slides.length; i += 1) pictures[i].style.transform = '';
			} else if (zoom_rate !== 1) {
				for (let i = 0; i < slides.length; i += 1) {
					pictures[i].style.transform = ((i % slideNum) === idx) ? 'scale(' + zoom_rate + ', ' + zoom_rate + ')' : '';
				}
			}
			for (let i = 0; i < slides.length; i += 1) {
				if ((i % slideNum) === idx) {
					pictures[i].classList.add(CLS_DO);
				} else {
					pictures[i].classList.remove(CLS_DO);
				}
			}
			for (let i = 0; i < captions.length; i += 1) {
				if (captions[i]) captions[i].style.opacity = ((i % slideNum) === idx) ? 1 : 0;
			}
		}, tran_time * 1000);

		curSlideIdx = idx;
		if (slideNum > 1 && 0 < pageBtns.length) {
			pageBtns[idx].checked = true;
			showNext();
		}
	}

	let stShowNext = null
	function showNext() {
		clearTimeout(stShowNext);
		stShowNext = setTimeout(function () {
			transition((curSlideIdx === slideNum - 1) ? 0 : (curSlideIdx + 1));
			showNext();
		}, dur_time * 1000);
	}
	document.addEventListener('DOMContentLoaded', function () {transition(0);});

	// =========================================================================

	function init_slide() {
		for (let i = 0; i < slideNum; i += 1) {
			slides[i].style.transform = 'translateX(' + ((i === 0) ? 0 : 100) + '%)';
		}
		setTimeout(function () {
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

	let st = null;

	function transition_scroll(idx) {
		let offset = (curSlideIdx - idx) * 100;
		if (curSlideIdx === slideNum - 1 && idx === 0) offset = -100;
		if (curSlideIdx === 0 && idx === slideNum - 1) offset = 100;

		const cxs = calc_position(curSlideIdx, offset);
		for (let i = 0; i < slides.length; i += 1) {
			const sl = slides[i];
			sl.style.transition = 'transform 0s';
			sl.style.transform = 'translateX(' + cxs[i] + '%)';
		}
		if (idx === curSlideIdx) return;

		if (st) clearTimeout(st);
		st = setTimeout(function () {
			for (let i = 0; i < slides.length; i += 1) {
				const sl = slides[i];
				const nx = cxs[i] + offset;
				sl.style.transition = 'transform ' + tran_time + 's';
				sl.style.transform = 'translateX(' + nx + '%)';
			}
			st = null;
		}, 100);

		function calc_position(idx, offset) {
			const xs = [];
			for (let i = 0; i < slides.length; i += 1) {
				xs.push((i - idx) * 100);
			}
			if (slideNum > 1) {
				xs[idx] = 0;
				if (offset === 0) {
					set_val(xs, idx - 1, -100);
					set_val(xs, idx + 1, 100);
				} else if (offset === -100) {  // Scroll to Right
					set_val(xs, idx - 1, -100);
					set_val(xs, idx + 1,  100);
					set_val(xs, idx + 2,  200);
				} else if (offset === 100) {  // Scroll to Left
					set_val(xs, idx + 1,  100);
					set_val(xs, idx - 1, -100);
					set_val(xs, idx - 2, -200);
				}
			}
			return xs;

			function set_val(a, i, v) {
				if (i < 0) a[a.length + i] = v;
				else if (a.length - 1 < i) a[i - a.length] = v;
				else a[i] = v;
			}
		}
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

const st_slide_show_page = function (id, pageIdx) {
	const pageBtn = document.getElementById(id + '-page-label-' + pageIdx);
	if (pageBtn) pageBtn.click();
};
