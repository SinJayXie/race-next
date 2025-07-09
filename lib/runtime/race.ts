/**
 * Core Race framework implementation
 */

import { Component, ComponentOptions } from './component';
import { createRenderer } from './renderer';
import { VNodeProps } from './vnode';

export interface App {
  mount: (rootContainer: string | Element) => void
  unmount: () => void
}

type ComponentConstructor = new (...args: any[]) => Component
type ComponentInstance = ComponentConstructor | ComponentOptions<any, any>

// Create default renderer with DOM operations
export const renderer = createRenderer({
  createElement(type: string): Element {
    return document.createElement(type);
  },

  setElementText(node: Node, text: string): void {
    node.textContent = text;
  },

  insert(child: Node, parent: Node, anchor: Node | null = null): void {
    parent.insertBefore(child, anchor);
  },

  patchProps(el: Element, key: string, prevValue: VNodeProps[string] | null, nextValue: VNodeProps[string] | null): void {
    if (key.startsWith('on')) {
      const eventName = key.slice(2).toLowerCase();
      if (prevValue) {
        el.removeEventListener(eventName, prevValue as (ev: Event) => void);
      }
      if (nextValue) {
        el.addEventListener(eventName, nextValue as (ev: Event) => void);
      }
    } else if (key === 'style') {
      if (nextValue && el instanceof HTMLElement) {
        Object.assign(el.style, nextValue as Partial<CSSStyleDeclaration>);
      } else {
        el.removeAttribute('style');
      }
    } else {
      if (nextValue === null || nextValue === undefined) {
        el.removeAttribute(key);
      } else {
        el.setAttribute(key, String(nextValue));
      }
    }
  }
});

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
