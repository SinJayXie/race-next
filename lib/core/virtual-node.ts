import { Component } from './component';

export type VirtualNodeOptionProps = {
    className?: string | string[] | Record<string, boolean>;
    style?: Partial<CSSStyleDeclaration> | string;
    [key: string]: any;
} | null

export type VirtualNodeChildren = string[] | string | VirtualNode | VirtualNode[] | null

export type VirtualNodeOption = {
    children?: VirtualNodeChildren;
    type: string | typeof Component;
    props?: VirtualNodeOptionProps
}

export const createVirtualNode = function(type: string | typeof Component<any, any>, props?: VirtualNodeOptionProps, children?: VirtualNodeChildren) {
  return new VirtualNode({
    type,
    props,
    children
  });
};

export class VirtualNode {
  public readonly type: string | typeof Component;
  public props: VirtualNodeOptionProps | null = null;

  public children: string[] | string | VirtualNode | VirtualNode[] | null = null;
  public el: Element | null = null;
  public key: null | number | string;
  public component: Component | null = null; // 存储组件实例

  constructor(options: VirtualNodeOption) {
    this.type = options.type;
    this.children = options.children || null;
    this.props = options.props || null;
    this.el = null;
    this.key = options.props ? options.props['key'] || null : null;
    this.initialize();
  }

  public initialize() {
    if (typeof this.children === 'string' && this.type !== 'text') {
      this.children = [createVirtualNode('text', null, this.children)];
    }
  }
}
