import { handleEvent } from "./helpers";
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

  window.addEventListener('message', handleEvent({
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
