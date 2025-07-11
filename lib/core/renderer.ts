import { Component } from './component';
import { createRuntimeError } from '@/core/error';
import { VirtualNode } from '@/core/virtual-node';
import { setProps } from '@/utils/set-props';

export class Renderer {
  public readonly component: Component;
  public parent: HTMLElement;

  constructor(component: Component) {
    this.component = component;
    this.component.setRendererCallback(this.updateCallback.bind(this));
    this.parent = document.createElement('div');
  }

  private updateCallback() {
    const nextVNode = this.component.render();
    const prevVNode = this.component.$VNode as VirtualNode;
    this.renderVNode(prevVNode, nextVNode);
    this.component.$VNode = nextVNode;
  }

  private renderVNode(n1: VirtualNode | null, n2: VirtualNode) {
    if (n1 === null) {
      this.mountNode(n2, this.parent);
    } else {
      this.patchElement(n1, n2, this.parent);
    }
  }

  private mountNode(vNode: VirtualNode, parent: Element, referenceNode?: Node | null) {
    if (vNode.type === 'text') {
      vNode.el = document.createTextNode(vNode.children as string) as unknown as Element;
      parent.insertBefore(vNode.el as Node, referenceNode || null);
    } else if (typeof vNode.type === 'string') {
      vNode.el = document.createElement(vNode.type.trim());
      this.patchProps(null, vNode);
      parent.insertBefore(vNode.el, referenceNode || null);
      if (Array.isArray(vNode.children)) {
        vNode.children.forEach(child => {
          if (child instanceof VirtualNode) {
            this.mountNode(child, vNode.el as Element);
          }
        });
      }
    } else if (typeof vNode.type === 'function') {
      this.mountComponent(vNode, parent, referenceNode);
    } else {
      createRuntimeError(`Unsupported node type: ${typeof vNode.type}`);
    }
  }

  private mountComponent(vNode: VirtualNode, parent: Element, referenceNode?: Node | null) {
    const ComponentClass = vNode.type as typeof Component;
    // 关键修正：组件实例化时，data仅用组件自身定义的（不传入props，避免emits混入data）
    const component = new ComponentClass({
      props: vNode.props || {} // 仅传递props（含emits）
      // 不传递data: vNode.props，防止props中的emits进入组件$data
    });
    vNode.component = component;

    // 单独传递事件回调（与data完全分离）
    component.$emits = vNode.props?.emits || {};

    const subTree = component.render();
    component.$VNode = subTree;
    this.mountNode(subTree, parent, referenceNode);
    vNode.el = subTree.el;

    component.setRendererCallback(() => {
      const nextTree = component.render();
      const prevTree = component.$VNode as VirtualNode;
      const parentEl = prevTree.el?.parentElement as Element;
      this.patchElement(prevTree, nextTree, parentEl);
      component.$VNode = nextTree;
      vNode.el = nextTree.el;
    });

    component.mounted();
  }

  private patchElement(n1: VirtualNode, n2: VirtualNode, parentElement: Element) {
    if (this.isSameVNode(n1, n2)) {
      n2.el = n1.el;
      if (n1.component && n2.component) {
        this.patchComponent(n1, n2);
      } else {
        this.patchProps(n1, n2);
        if (n1.type === 'text' && n2.type === 'text' && n1.children !== n2.children) {
          (n2.el as Element).textContent = n2.children as string;
        } else {
          this.patchChildren(n1, n2);
        }
      }
    } else {
      this.unmountNode(n1);
      this.mountNode(n2, parentElement, n1.el?.nextSibling || null);
    }
  }

  private patchComponent(n1: VirtualNode, n2: VirtualNode) {
    if (n1.component && n2.component) {
      // 更新props（含emits），但不影响组件$data
      n2.component.$props = Object.freeze({ ...n1.component.$props, ...n2.props });
      // 单独更新事件回调（与data分离）
      n2.component.$emits = n2.props?.emits || {};
      n2.component.update();
    }
  }

  private isSameVNode(n1: VirtualNode, n2: VirtualNode): boolean {
    return n1.type === n2.type && n1.key === n2.key;
  }

  private patchProps(n1?: VirtualNode | null, n2?: VirtualNode | null) {
    if (!n2 || !n2.el) return;
    const el = n2.el as Element;
    const oldProps = n1?.props || {};
    const newProps = n2.props || {};

    Object.entries(newProps).forEach(([key, value]) => {
      if (oldProps[key] !== value && key !== 'emits') {
        setProps(el, key, oldProps[key], value);
      }
    });

    Object.keys(oldProps).forEach(key => {
      if (!(key in newProps)) {
        if (key.startsWith('on')) {
          const event = key.slice(2).toLowerCase();
          el.removeEventListener(event, oldProps[key]);
        } else {
          el.removeAttribute(key);
        }
      }
    });
  }

  private patchChildren(n1: VirtualNode, n2: VirtualNode) {
    const oldChildren = this.normalizeChildren(n1.children);
    const newChildren = this.normalizeChildren(n2.children);
    const parentEl = n1.el as Element;

    let oldStartIdx = 0; let oldEndIdx = oldChildren.length - 1;
    let newStartIdx = 0; let newEndIdx = newChildren.length - 1;
    const oldKeyToIdx = this.createKeyToIndexMap(oldChildren);

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      const oldStart = oldChildren[oldStartIdx];
      const oldEnd = oldChildren[oldEndIdx];
      const newStart = newChildren[newStartIdx];
      const newEnd = newChildren[newEndIdx];

      if (!oldStart) {
        oldStartIdx++;
        continue;
      }
      if (!oldEnd) {
        oldEndIdx--;
        continue;
      }

      if (this.isSameVNode(oldStart, newStart)) {
        this.patchElement(oldStart, newStart, parentEl);
        oldStartIdx++;
        newStartIdx++;
      } else if (this.isSameVNode(oldEnd, newEnd)) {
        this.patchElement(oldEnd, newEnd, parentEl);
        oldEndIdx--;
        newEndIdx--;
      } else if (this.isSameVNode(oldStart, newEnd)) {
        this.patchElement(oldStart, newEnd, parentEl);
        parentEl.insertBefore(oldStart.el as Node, oldEnd.el?.nextSibling as Node);
        oldStartIdx++;
        newEndIdx--;
      } else if (this.isSameVNode(oldEnd, newStart)) {
        this.patchElement(oldEnd, newStart, parentEl);
        parentEl.insertBefore(oldEnd.el as Node, oldStart.el as Node);
        oldEndIdx--;
        newStartIdx++;
      } else {
        const key = newStart.key;
        if (key !== null) {
          const oldIdx = oldKeyToIdx.get(key);
          if (oldIdx !== undefined) {
            const oldNode = oldChildren[oldIdx];
            if (this.isSameVNode(oldNode, newStart)) {
              this.patchElement(oldNode, newStart, parentEl);
              oldChildren[oldIdx] = null as any;
              parentEl.insertBefore(oldNode.el as Node, oldStart.el as Node);
            } else {
              this.mountNode(newStart, parentEl, oldStart.el as Node);
            }
          } else {
            this.mountNode(newStart, parentEl, oldStart.el as Node);
          }
        } else {
          this.mountNode(newStart, parentEl, oldStart.el as Node);
        }
        newStartIdx++;
      }
    }

    if (oldStartIdx <= oldEndIdx) {
      oldChildren.slice(oldStartIdx, oldEndIdx + 1).forEach(node => {
        if (node) this.unmountNode(node);
      });
    } else if (newStartIdx <= newEndIdx) {
      const referenceNode = newChildren[newEndIdx + 1]?.el as Node | null;
      newChildren.slice(newStartIdx, newEndIdx + 1).forEach(node => {
        this.mountNode(node, parentEl, referenceNode);
      });
    }
  }

  private unmountNode(vNode: VirtualNode) {
    if (vNode.component) {
      vNode.component.unmounted();
    }
    if (vNode.el) {
      vNode.el.remove();
    }
    const children = this.normalizeChildren(vNode.children);
    children.forEach(child => this.unmountNode(child));
  }

  private normalizeChildren(children: any): VirtualNode[] {
    return Array.isArray(children)
      ? children.filter(c => c instanceof VirtualNode)
      : [];
  }

  private createKeyToIndexMap(children: VirtualNode[]): Map<string | number | null, number> {
    const map = new Map();
    children.forEach((child, index) => {
      if (child && child.key !== null) {
        map.set(child.key, index);
      }
    });
    return map;
  }

  public render(parentElement: HTMLElement) {
    if (!(parentElement instanceof HTMLElement)) {
      createRuntimeError('Parent must be an HTMLElement');
      return;
    }
    this.parent = parentElement;
    const initialVNode = this.component.render();
    initialVNode.props = { ...this.component.$props, ...initialVNode.props };
    this.component.$VNode = initialVNode;
    this.renderVNode(null, initialVNode);
    this.component.mounted();
  }
}
