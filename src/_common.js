/**
 *
 * Common Functions (JS)
 *
 * @author Takuto Yanagida @ Space-Time Inc.
 * @version 2021-05-31
 *
 */


const resizeListeners = [];

document.addEventListener('DOMContentLoaded', () => {
	const ua = window.navigator.userAgent.toLowerCase();
	const isIe = (ua.indexOf('trident/7') !== -1);

	const opt = (isIe === 'ie11') ? false : { passive: true };
	window.addEventListener('resize', () => { for (let i = 0; i < resizeListeners.length; i += 1) resizeListeners[i](); }, opt);
});

function onResize(fn, doFirst = false) {
	if (doFirst) fn();
	resizeListeners.push(throttle(fn));

	function throttle(fn) {
		let isRunning;
		function run() {
			isRunning = false;
			fn();
		}
		return () => {
			if (isRunning) return;
			isRunning = true;
			requestAnimationFrame(run);
		};
	}
}

let isPhone = false;
onResize(() => { isPhone = (window.innerWidth < 600); }, true);