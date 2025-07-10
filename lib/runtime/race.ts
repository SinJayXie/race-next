/**
 * Core Race framework implementation
 */

import { Component, ComponentOptions } from './component';
import { createRenderer, getDefaultRendererOption } from './renderer';

export interface App {
  mount: (rootContainer: string | Element) => void
  unmount: () => void
}

type ComponentConstructor = new (...args: any[]) => Component
type ComponentInstance = ComponentConstructor | ComponentOptions<any, any>

// Create default renderer with DOM operations
export const renderer = createRenderer(getDefaultRendererOption());

/**
 * Creates a component instance from a constructor or options
 */
function createComponentInstance(Comp: ComponentInstance): Component {
  if (typeof Comp === 'function') {
    return new Comp();
  }
  return new Component(Comp);
}

/**
 * Creates a Race application instance
 */
export function createApp(rootComponent: ComponentInstance): App {
  const app = createComponentInstance(rootComponent);

  return {
    mount(rootContainer: string | Element): void {
      const container = typeof rootContainer === 'string'
        ? document.querySelector(rootContainer)
        : rootContainer;

      if (!container) {
        throw new Error(`Unable to find container: ${rootContainer}`);
      }

      app.mount(container as Element);
    },

    unmount(): void {
      app.unmount();
    }
  };
}
