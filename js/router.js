let _routes = [];
let _currentUnmount = null;
let _initialized = false;

export function initRouter(routes) {
  _routes = routes;
  if (!_initialized) {
    window.addEventListener('hashchange', _handleRoute);
    _initialized = true;
  }
  _handleRoute();
}

export function navigate(hash) {
  if (window.location.hash === hash) {
    _handleRoute();
  } else {
    window.location.hash = hash;
  }
}

function _handleRoute() {
  const hash = window.location.hash || '#/';

  for (const route of _routes) {
    const match = hash.match(route.pattern);
    if (match) {
      if (_currentUnmount) {
        _currentUnmount();
        _currentUnmount = null;
      }
      _currentUnmount = route.unmount ?? null;
      route.mount(match);
      return;
    }
  }
}
