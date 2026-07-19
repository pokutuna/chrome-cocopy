import {vi} from 'vitest';

// Minimal hand-written mock of the chrome extension APIs the tests touch:
// tabs.query, storage.sync.get, storage.onChanged (add/removeListener, used
// by useSubscribeFunctions), runtime.getManifest. Each test overrides the
// relevant method with mockImplementation, mirroring the previous
// jest-chrome usage.
Object.assign(global, {
  // dnd-kit observes sortable item sizes in the browser. jsdom does not
  // provide ResizeObserver, and these tests do not need resize callbacks.
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  chrome: {
    tabs: {
      query: vi.fn(),
    },
    storage: {
      sync: {
        get: vi.fn(),
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    runtime: {
      getManifest: vi.fn(),
    },
  },
});
