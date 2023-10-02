/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 24:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   handleEvent: () => (/* binding */ handleEvent)
/* harmony export */ });
function handleEvent(obj, map = (x => x)) {
  return (data) => {
    const { event, ...args } = map(data);
    obj[event]?.(args);
  }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);

window.addEventListener('load', () => {
  const contentElm = document.getElementById('content');
  const mapElm = document.getElementById('map');
  const headerElm = document.getElementById('header');
  const bundleSelectElm = document.getElementById('bundle-select');

  let selectedBundleId = '0';
  let selectBundle = () => { };

  window.addEventListener('resize', () => {
    selectBundle();
  });

  bundleSelectElm.addEventListener('change', () => {
    selectBundle(bundleSelectElm.value);
  });

  window.addEventListener('message', (0,_helpers__WEBPACK_IMPORTED_MODULE_0__.handleEvent)({
    loading() {
      contentElm.dataset.loading = true;
    },
    complete({ treeDataMap, bundles }) {
      delete contentElm.dataset.loading;

      selectBundle = (bundleId = selectedBundleId) => {
        selectedBundleId = bundleId;
        appendTreemap(mapElm, treeDataMap[selectedBundleId].data);
      }

      headerElm.style.display = bundles.length > 1 ? 'block' : 'none';

      while (bundleSelectElm.hasChildNodes()) {
        bundleSelectElm.removeChild(bundleSelectElm.firstChild);
      }

      while (mapElm.hasChildNodes()) {
        mapElm.removeChild(mapElm.firstChild);
      }

      if (bundles.length > 1) {
        bundles.forEach(({ name, size }, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.text = `${name} (${size})`;
          bundleSelectElm.appendChild(option);
        });
      }

      selectBundle(0);
    }
  }, event => event.data));
});

})();

/******/ })()
;