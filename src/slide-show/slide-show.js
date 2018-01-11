/**
 *
 * Slide Show (JS)
 *
 * @author Takuto Yanagida @ Space-Time Inc.
 * @version 2018-01-04
 *
 */


var st_slide_show_initialize = function (id, opts) {
	var WIN_SIZE_RESPONSIVE = 600;
	var NS             = 'st-slide-show';
	var CLS_STRIP      = NS + '-strip';
	var CLS_SLIDES     = NS + '-slides';
	var CLS_PREV       = NS + '-prev';
	var CLS_NEXT       = NS + '-next';
	var CLS_RIVETS     = NS + '-rivets';
	var CLS_CAP        = NS + '-caption';
	var CLS_PIC        = NS + '-picture';
	var CLS_BG_FRAME   = NS + '-background-frame';
	var CLS_PIC_SCROLL = 'scroll';
	var CLS_DO         = 'do';

	if (opts === undefined) opts = {};
	var effect_type = (opts['effect_type']           === undefined) ? 'slide' : opts['effect_type'];
	var zoom_rate   = (opts['zoom_rate']             === undefined) ? 1.05    : opts['zoom_rate'];
	var dur_time    = (opts['duration_time']         === undefined) ? 8       : opts['duration_time']; // [second]
	var tran_time   = (opts['transition_time']       === undefined) ? 1       : opts['transition_time']; // [second]
	var bg_visible  = (opts['is_background_visible'] === undefined) ? true    : opts['is_background_visible'];
	var bg_opacity  = (opts['background_opacity']    === undefined) ? 0.33    : opts['background_opacity'];
	var pic_scroll  = (opts['picture_scroll']        === undefined) ? false   : opts['picture_scroll'];

	if (pic_scroll) zoom_rate = 1;  // Exclusive Option

	var root;
	if (id === undefined) {
		root = document.getElementsByClassName(NS)[0];
	} else {
		root = document.getElementById(id);
	}
	if (root === undefined) return;
	var slides = root.querySelectorAll('.' + CLS_SLIDES + ' > li');
	var slideNum = slides.length;

	var pictures = [], captions = [], backgrounds = [], pageBtns = [];
	var curSlideIdx = 0;

	var prevXs = [];  // for Scroll Effect

	function initImages() {
		var isPhone = window.innerWidth < WIN_SIZE_RESPONSIVE;
		for (var i = 0; i < slideNum; i += 1) {
			var c = slides[i].querySelector('div');
			if (c) {
				c.style.opacity = 0;
				c.style.transition = 'opacity ' + tran_time + 's';
				if (c.className === '') {
					c.classList.add(CLS_CAP);
					c.classList.add('subtitle');
				}
			}
			captions.push(c);

			var p = document.createElement('div');
			p.classList.add(CLS_PIC);
			if (pic_scroll) p.classList.add(CLS_PIC_SCROLL);
			var url = '';
			if (isPhone && slides[i].dataset.imgPhone) {
				url = slides[i].dataset.imgPhone;
			} else {
				url = slides[i].dataset.img;
			}
			slides[i].style.opacity = 0;  // for avoiding flickering slides on page loading
			p.style.backgroundImage = "url('" + url + "')";
			var a = slides[i].querySelector('a');
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

	function initBackgrounds() {
		var frame = root.getElementsByClassName(CLS_STRIP)[0];
		var bgFrame = document.createElement('div');
		bgFrame.classList.add(CLS_BG_FRAME);
		frame.insertBefore(bgFrame, frame.firstChild);

		window.addEventListener('resize', function () {
			var r = frame.getBoundingClientRect();
			bgFrame.style.left = -(r.left + window.pageXOffset) + 'px';
		});
		document.addEventListener('DOMContentLoaded', function () {
			var r = frame.getBoundingClientRect();
			bgFrame.style.left = -(r.left + window.pageXOffset) + 'px';
		});

		for (var i = 0; i < slideNum; i += 1) {
			var val = slides[i].dataset.img;
			var bg = document.createElement('div');
			bg.style.backgroundImage = "url('" + val + "')";
			bg.style.transition = 'opacity ' + tran_time * 2 + 's';
			bgFrame.appendChild(bg);
			backgrounds.push(bg);
		}
	}
	if (bg_visible) initBackgrounds();

	function initRivets() {
		if (slideNum === 1) return;
		var pagesElm = root.getElementsByClassName(CLS_RIVETS)[0];

		for (var i = 0; i < slideNum; i += 1) {
			var btn = document.createElement('input');
			btn.type = 'radio';
			btn.name = id + '-buttons';
			btn.id = id + '-page-' + i;
			btn.style.display = 'none';
			if (i === 0) btn.checked = true;
			pageBtns.push(btn);
			pagesElm.appendChild(btn);

			var btnLab = document.createElement('label');
			btnLab.id = id + '-page-label-' + i;
			btnLab.htmlFor = btn.id;
			btnLab.addEventListener('click', function (idx) {return function () {transition(idx);}}(i));
			pagesElm.appendChild(btnLab);
		}
	}
	initRivets();

	function initTransitionButtons() {
		var hide = (slideNum === 1);
		var prevBtn = root.getElementsByClassName(CLS_PREV)[0];
		if (prevBtn) {
			if (hide) {
				prevBtn.style.display = 'none';
			} else {
				prevBtn.addEventListener('click', function () {
					transition((curSlideIdx === 0) ? (slideNum - 1) : (curSlideIdx - 1));
				});
			}
		}
		var nextBtn = root.getElementsByClassName(CLS_NEXT)[0];
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
		var DX = 50;
		var stX, stY, mvX, mvY;

		var prevBtn = root.getElementsByClassName(CLS_PREV)[0];
		var nextBtn = root.getElementsByClassName(CLS_NEXT)[0];
		if (!prevBtn || !nextBtn) return;

		var frame = root.getElementsByClassName(CLS_STRIP)[0];
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
		}
		if (bg_visible) {
			for (var i = 0; i < slideNum; i += 1) {
				backgrounds[i].style.opacity = (i === idx) ? bg_opacity : 0;
			}
		}
		setTimeout(function () {
			var isPhone = window.innerWidth < WIN_SIZE_RESPONSIVE;
			if (isPhone) {
				for (var i = 0; i < slideNum; i += 1) pictures[i].style.transform = '';
			} else {
				for (var i = 0; i < slideNum; i += 1) {
					pictures[i].style.transform = (i === idx) ? 'scale(' + zoom_rate + ', ' + zoom_rate + ')' : '';
				}
			}
			for (var i = 0; i < slideNum; i += 1) {
				if (i === idx) {
					pictures[i].classList.add(CLS_DO);
				} else {
					pictures[i].classList.remove(CLS_DO);
				}
			}
			for (var i = 0; i < captions.length; i += 1) {
				if (captions[i]) captions[i].style.opacity = (i === idx) ? 1 : 0;
			}
		}, tran_time * 1000);

		curSlideIdx = idx;
		if (slideNum > 1) {
			pageBtns[idx].checked = true;
			showNext();
		}
	}

	var stShowNext = null
	function showNext() {
		clearTimeout(stShowNext);
		stShowNext = setTimeout(function () {
			transition(curSlideIdx = (curSlideIdx === slideNum - 1) ? 0 : (curSlideIdx + 1));
			showNext();
		}, dur_time * 1000);
	}
	document.addEventListener('DOMContentLoaded', function () {transition(0);});

	// =========================================================================

	function init_slide() {
		for (var i = 0; i < slideNum; i += 1) {
			slides[i].style.opacity = 1;
			slides[i].style.transform = 'translateX(' + ((i === 0) ? 0 : 100) + '%)';
			slides[i].style.transition = 'transform ' + tran_time + 's';
		}
	}

	function transition_slide(idx) {
		for (var i = 0; i < slideNum; i += 1) {
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
		for (var i = 0; i < slideNum; i += 1) {
			slides[i].style.opacity = 1;
			prevXs.push((i === 0) ? 0 : 100);
			slides[i].style.transform = 'translateX(' + ((i === 0) ? 0 : 100) + '%)';
		}
	}

	function transition_scroll(idx) {
		var xs = [];
		for (var i = 0; i < slideNum; i += 1) {
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

		for (var i = 0; i < slideNum; i += 1) {
			var img = slides[i];
			var x = prevXs[i], nx = xs[i];
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
		for (var i = 0; i < slideNum; i += 1) {
			slides[i].style.opacity = (i === 0) ? 1 : 0;
			slides[i].style.transition = 'opacity ' + tran_time + 's';
		}
	}

	function transition_fade(idx) {
		for (var i = 0; i < slideNum; i += 1) {
			slides[i].style.opacity = (i === idx) ? 1 : 0;
			slides[i].style.pointerEvents = (i === idx) ? 'auto' : 'none';
		}
	}

	// =========================================================================

};

var st_slide_show_page = function (id, pageIdx) {
	var pageBtn = document.getElementById(id + '-page-label-' + pageIdx);
	if (pageBtn) pageBtn.click();
};
