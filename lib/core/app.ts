import { Component } from './component';
import { Renderer } from './renderer';
import { VirtualNodeOptionProps } from './virtual-node';

export type RaceAppOptions = {
  Component: new () => Component,
  props?: VirtualNodeOptionProps
}

export const createApp = function(opt: RaceAppOptions) {
  const component = new opt.Component();
  component.$props = Object.freeze({ ...(component.$props || {}), ...(opt.props || {}) });
  const renderer = new Renderer(component);

  return {
    mount: function(element: string | HTMLElement) {
      if (element instanceof HTMLElement) {
        renderer.render(element);
      } else {
        renderer.render(document.querySelector(element)!);
      }
    }
  };
};
