import { VNode, VNodeProps, createTextVNode } from './vnode';

/**
 * 渲染器配置选项接口
 */
export interface RendererOptions {
  // 创建DOM元素
  createElement: (type: string) => Element
  // 设置元素文本内容
  setElementText: (node: Node, text: string) => void
  // 插入DOM节点
  insert: (child: Node, parent: Node, anchor?: Node | null) => void
  // 更新DOM属性
  patchProps: (el: Element, key: string, prevValue: VNodeProps[string] | null, nextValue: VNodeProps[string] | null) => void
}

// 类型定义
type PatchFn = (n1: VNode | null, n2: VNode, container: Element) => void
type UnmountFn = (vnode: VNode) => void
type MountElementFn = (vnode: VNode, container: Element) => void
type PatchElementFn = (n1: VNode, n2: VNode) => void
type PatchChildrenFn = (n1: VNode, n2: VNode, container: Element) => void

/**
 * 创建自定义渲染器
 * @param options 渲染器配置选项
 */
export function createRenderer(options: RendererOptions) {
  // 解构配置选项
  const {
    createElement,
    setElementText,
    insert,
    patchProps
  } = options;

  /**
   * 虚拟DOM打补丁函数
   * @param n1 旧虚拟节点
   * @param n2 新虚拟节点
   * @param container 容器元素
   */
  const patch: PatchFn = (n1, n2, container) => {
    if (n1 === null) {
      // 挂载新元素
      mountElement(n2, container);
    } else if (n2 === null) {
      // 如果新虚拟节点为空，则卸载旧节点
      removeVNode(n1);
    } else if (n1.type !== n2.type) {
      // 如果节点类型不同，则替换节点
      removeVNode(n1);
      mountElement(n2, container);
    } else {
      // 更新现有元素
      patchElement(n1, n2);
    }
  };

  /**
   * 挂载元素
   * @param vnode 虚拟节点
   * @param container 容器元素
   */
  const mountElement: MountElementFn = (vnode, container) => {
    // 如果节点类型不是字符串，则返回
    if (typeof vnode.type !== 'string') return;

    // 创建DOM节点
    const el = vnode.type === 'text' ? document.createTextNode('') : createElement(vnode.type);
    vnode.el = el;

    // 处理props属性
    if (vnode.props && el instanceof Element) {
      Object.entries(vnode.props).forEach(([key, value]) => {
        patchProps(el, key, null, value);
      });
    }

    // 处理子节点
    if (typeof vnode.children === 'string') {
      // 子节点是文本
      setElementText(el, vnode.children);
    } else if (Array.isArray(vnode.children)) {
      // 子节点是数组
      vnode.children.forEach(child => {
        if (typeof child === 'string') {
          // 字符串子节点创建文本虚拟节点
          const textNode = createTextVNode(child);
          patch(null, textNode, el as Element);
        } else {
          // 递归挂载子虚拟节点
          patch(null, child, el as Element);
        }
      });
    }

    // 将元素插入容器
    insert(el, container);
  };

  /**
   * 更新元素
   * @param n1 旧虚拟节点
   * @param n2 新虚拟节点
   */
  const patchElement: PatchElementFn = (n1, n2) => {
    // 获取DOM元素引用
    const el = n2.el = n1.el;
    if (!el || typeof n2.type !== 'string') return;

    // 更新props
    const oldProps = n1.props || {};
    const newProps = n2.props || {};

    // 添加/更新新属性
    Object.entries(newProps).forEach(([key, next]) => {
      const prev = oldProps[key];
      if (next !== prev) {
        patchProps(el as Element, key, prev, next);
      }
    });

    // 移除旧属性
    Object.keys(oldProps).forEach(key => {
      if (!(key in newProps)) {
        patchProps(el as Element, key, oldProps[key], null);
      }
    });

    // 更新子节点
    patchChildren(n1, n2, el as Element);
  };

  /**
   * 更新子节点
   * @param n1 旧虚拟节点
   * @param n2 新虚拟节点
   * @param container 容器元素
   */
  const patchChildren: PatchChildrenFn = (n1, n2, container) => {
    if (typeof n2.children === 'string') {
      // 新子节点是文本
      if (Array.isArray(n1.children)) {
        // 移除旧的子节点数组
        n1.children.forEach(c => {
          if (typeof c !== 'string') {
            removeVNode(c);
          }
        });
      }
      // 设置文本内容
      setElementText(container, n2.children);
    } else if (Array.isArray(n2.children)) {
      // 新子节点是数组
      if (Array.isArray(n1.children)) {
        // 新旧子节点都是数组，执行diff算法
        // 将字符串子节点转换为文本虚拟节点
        const oldChildren = (n1.children as (VNode | string)[]).map(child =>
          typeof child === 'string' ? createTextVNode(child) : child
        );
        const newChildren = (n2.children as (VNode | string)[]).map(child =>
          typeof child === 'string' ? createTextVNode(child) : child
        );

        const oldLen = oldChildren.length;
        const newLen = newChildren.length;
        const commonLen = Math.min(oldLen, newLen);

        // 处理公共部分
        for (let i = 0; i < commonLen; i++) {
          const oldChild = oldChildren[i];
          const newChild = newChildren[i];

          if (oldChild.children === newChild.children) {
            // 内容相同，复用DOM节点
            newChild.el = oldChild.el;
          } else if (oldChild.type === 'text' && newChild.type === 'text') {
            // 都是文本节点但内容不同
            if (oldChild.children !== newChild.children) {
              // 替换文本节点
              const textNode = document.createTextNode(newChild.children as string);

              if (oldChild.el) {
                container.replaceChild(textNode, oldChild.el);
              } else {
                container.appendChild(textNode);
              }
              newChild.el = textNode;
            }
          } else if (oldChild.type === 'text' && newChild.type !== 'text') {
            // 用元素节点替换文本节点
            if (oldChild.el) container.removeChild(oldChild.el);
            patch(null, newChild as VNode, container);
          } else if (oldChild.type !== 'text' && newChild.type === 'text') {
            // 用文本节点替换元素节点
            removeVNode(oldChild as VNode);
            const textNode = document.createTextNode(newChild.children as string);
            container.appendChild(textNode);
            newChild.el = textNode;
          } else {
            // 两个都是VNode，递归打补丁
            patch(oldChild as VNode, newChild as VNode, container);
          }
        }

        // 移除多余的旧节点
        if (oldLen > newLen) {
          for (let i = newLen; i < oldLen; i++) {
            const child = oldChildren[i];
            if (child.type !== 'text') {
              removeVNode(child);
            } else if (child.el) {
              container.removeChild(child.el);
            }
          }
        }

        // 添加新节点
        if (newLen > oldLen) {
          for (let i = oldLen; i < newLen; i++) {
            const child = newChildren[i];
            if (typeof child === 'string') {
              // 创建文本节点
              const textNode = document.createTextNode(child);
              container.appendChild(textNode);
              // 创建对应的文本虚拟节点并设置el引用
              const textVNode = createTextVNode(child);
              textVNode.el = textNode;
            } else {
              // 递归挂载新节点
              patch(null, child, container);
            }
          }
        }
      } else {
        // 旧子节点不是数组，清空容器并添加新子节点
        setElementText(container, '');
        n2.children.forEach(c => {
          if (typeof c === 'string') {
            // 创建文本节点
            const textNode = document.createTextNode(c);
            container.appendChild(textNode);
          } else {
            // 递归挂载新节点
            patch(null, c, container);
          }
        });
      }
    } else {
      // 新子节点为空，移除所有旧子节点
      if (Array.isArray(n1.children)) {
        n1.children.forEach(c => {
          if (typeof c !== 'string') {
            removeVNode(c);
          }
        });
      } else if (typeof n1.children === 'string') {
        setElementText(container, '');
      }
    }
  };

  /**
   * 卸载虚拟节点
   * @param vnode 虚拟节点
   */
  const removeVNode: UnmountFn = (vnode) => {
    if (vnode.el) {
      const parent = vnode.el.parentNode;
      if (parent) parent.removeChild(vnode.el);
    }
  };

  // 返回渲染器实例
  return {
    patch,
    render(vnode: VNode | null, container: Element) {
      const prevVNode = (container as any).__vnode as VNode | null;
      if (vnode === null) {
        if (prevVNode) {
          // 卸载
          container.innerHTML = '';
          (container as any).__vnode = null;
        }
      } else {
        // 如果存在旧虚拟节点，则打补丁
        patch(prevVNode, vnode, container);
        // 在容器上存储新虚拟节点
        (container as any).__vnode = vnode;
      }
    }
  };
}
