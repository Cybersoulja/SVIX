import { initAuth } from './views/auth.js';
import { mountAppsView, unmountAppsView } from './views/apps.js';
import { mountAppDetail, unmountAppDetail } from './views/app-detail.js';
import { initRouter, navigate } from './router.js';
import { initModal } from './modal.js';

document.addEventListener('DOMContentLoaded', () => {
  initModal();

  initAuth({
    onConnect(client) {
      initRouter([
        {
          pattern: /^(#\/?)?$/,
          mount: () => {
            unmountAppDetail();
            mountAppsView(client);
          },
          unmount: unmountAppsView,
        },
        {
          pattern: /^#\/apps\/([^/]+)$/,
          mount: (match) => {
            unmountAppsView();
            mountAppDetail(client, match[1]);
          },
          unmount: unmountAppDetail,
        },
      ]);
      navigate('#/');
    },
    onDisconnect() {
      unmountAppsView();
      unmountAppDetail();
    },
  });
});
