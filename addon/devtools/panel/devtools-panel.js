/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
window.addEventListener('message', (event) => {
  if (event.data.type !== 'sourcemaps') return;

  const { treeDataMap, bundles, loading } = event.data;

  document.getElementById('content').dataset.loading = loading;

  if (loading) return;

  let selectedBundleId = '0';

  function selectBundle(bundleId) {
    const bundle = treeDataMap[bundleId];
    appendTreemap(map, bundle.data);
    document.title = `${bundle.name} - Source Map Explorer`;
  }

  const map = document.getElementById('map');
  const header = document.getElementById('header');
  header.style.display = bundles.length > 1 ? 'block' : 'none';

  const bundleSelect = document.getElementById('bundle-select');
  while (bundleSelect.hasChildNodes()) {
    bundleSelect.removeChild(bundleSelect.firstChild);
  }

  if (bundles.length > 1) {
    bundles.forEach(({ name, size }, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.text = `${name} (${size})`;
      bundleSelect.appendChild(option);
    });
    bundleSelect.addEventListener('change', function (event) {
      selectedBundleId = bundleSelect.value;
      selectBundle(selectedBundleId);
    })
  }

  window.addEventListener('resize', function () {
    selectBundle(selectedBundleId);
  });

  selectBundle(selectedBundleId);
})
/******/ })()
;