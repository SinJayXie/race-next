
// 事件处理函数类型
export type EventHandler = (event: Event) => any;

// 节点元素类型（包含各种 HTML 元素）
export type NodeElementType =
// 块级元素
    | 'div' | 'view' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    | 'header' | 'footer' | 'main' | 'section' | 'article' | 'aside'
    | 'nav' | 'ul' | 'ol' | 'li' | 'pre' | 'blockquote' | 'figure'
    | 'table' | 'thead' | 'tbody' | 'tfoot' | 'tr' | 'th' | 'td'
    | 'form' | 'fieldset' | 'legend' | 'dl' | 'dt' | 'dd'

    // 内联元素
    | 'span' | 'a' | 'img' | 'em' | 'strong' | 'i' | 'b' | 'u'
    | 's' | 'del' | 'ins' | 'mark' | 'code' | 'kbd' | 'samp'
    | 'var' | 'cite' | 'dfn' | 'abbr' | 'time' | 'data' | 'ruby'
    | 'rt' | 'rp' | 'wbr' | 'br' | 'sub' | 'sup' | 'small' | 'text'

    // 表单元素
    | 'input' | 'button' | 'select' | 'textarea' | 'label'
    | 'optgroup' | 'option' | 'datalist' | 'output' | 'progress'
    | 'meter' | 'keygen'

    // 交互元素
    | 'details' | 'summary' | 'dialog' | 'menu' | 'menuitem'

    // HTML5 新增语义化元素
    | 'canvas' | 'audio' | 'video' | 'source' | 'track' | 'embed'
    | 'object' | 'param' | 'map' | 'area' | 'svg' | 'math'

    // 其他元素
    | 'template' | 'noscript' | 'style' | 'script' | 'link'
    | 'meta' | 'title' | 'base';

// 虚拟节点属性接口
export interface VNodeProps {
    key?: string | number // 节点唯一标识，用于 diff 算法优化
    class?: string | string[] | Record<string, boolean>// CSS 类名
    style?: Partial<CSSStyleDeclaration> | string // 内联样式

    // 事件处理函数（以 on 开头的属性）
    [key: `on${string}`]: EventHandler

    // 其他属性（字符串、数字、事件处理函数、样式对象等）
    [key: string]: any
}

// 组件类型（可以是元素类型、字符串或组件类）
export type ComponentType = NodeElementType | string | (new (...args: any[]) => Component)

/**
 * 虚拟节点类（VNode）
 * 用于描述 DOM 结构的抽象表示
 */
export class VNode {
  type: ComponentType; // 节点类型（元素或组件）
  props: VNodeProps | null; // 节点属性
  children: (VNode | string)[] | string | null; // 子节点
  el: Node | null; // 对应的真实 DOM 节点

  /**
     * 构造函数
     * @param type 节点类型
     * @param props 节点属性
     * @param children 子节点
     * @param el 对应的真实 DOM 节点
     */
  constructor(
    type: ComponentType,
    props: VNodeProps | null = null,
    children: (VNode | string)[] | string | null = null,
    el: Node | null = null
  ) {
    this.type = type;
    this.props = props;
    this.children = children;
    this.el = el;
  }

  /**
     * 比较两个虚拟节点是否相等
     * @param other 要比较的另一个虚拟节点
     * @returns 是否相等
     */
  equals(other: VNode): boolean {
    if (this.type !== other.type) return false; // 类型不同则不相等
    if (!this.deepEqual(this.props, other.props)) return false; // 属性不同则不相等
    return this.childrenEqual(this.children, other.children); // 子节点不同则不相等
  }

  /**
     * 深比较两个值是否相等
     * @param a 第一个值
     * @param b 第二个值
     * @returns 是否相等
     */
  private deepEqual(a: any, b: any): boolean {
    // 处理 null 和 undefined 的相等性
    if (a === b || (a == null && b == null)) return true;

    // 处理日期比较
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    // 处理正则表达式比较
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.source === b.source && a.flags === b.flags;
    }

    // 处理函数比较 - 认为函数引用变化不影响节点相等性
    if (typeof a === 'function' && typeof b === 'function') {
      return true;
    }

    // 非对象类型直接比较
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
      return false;
    }

    // 处理数组比较
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false; // 长度不同则不相等
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) return false; // 元素不同则不相等
      }
      return true;
    }

    // 一个是数组另一个不是，则不相等
    if (Array.isArray(a) || Array.isArray(b)) {
      return false;
    }

    // 处理对象比较
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false; // 属性数量不同则不相等

    // 比较每个属性的值
    for (const key of keysA) {
      if (!keysB.includes(key) || !this.deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  /**
     * 比较两个子节点集合是否相等
     * @param a 第一个子节点集合
     * @param b 第二个子节点集合
     * @returns 是否相等
     */
  private childrenEqual(a: any, b: any): boolean {
    if (a === b) return true; // 引用相同则相等
    if (typeof a !== typeof b) return false; // 类型不同则不相等

    // 字符串子节点直接比较
    if (typeof a === 'string') {
      return a === b;
    }

    // 数组子节点比较
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false; // 长度不同则不相等

      // 逐个比较子节点
      for (let i = 0; i < a.length; i++) {
        const childA = a[i];
        const childB = b[i];

        if (typeof childA === 'string' && typeof childB === 'string') {
          if (childA !== childB) return false; // 字符串子节点内容不同则不相等
        } else if (childA instanceof VNode && childB instanceof VNode) {
          if (!childA.equals(childB)) return false; // 虚拟节点不相等则不相等
        } else {
          return false; // 类型不同则不相等
        }
      }

      return true;
    }

    return false;
  }
}

// 前向声明，避免循环依赖
declare class Component {
}

/**
 * 创建虚拟节点（VNode）
 * @param type 节点类型
 * @param props 节点属性
 * @param children 子节点
 * @returns 新创建的虚拟节点
 */
export function createVNode(
  type: ComponentType,
  props: VNodeProps | null = null,
  children: (VNode | string)[] | string | null = null
): VNode {
  return new VNode(type, props, children);
}

/**
 * 创建文本虚拟节点
 * @param text 文本内容
 * @returns 文本虚拟节点
 */
export function createTextVNode(text: string): VNode {
  return new VNode('text', null, text);
}

// 创建虚拟节点的帮助函数类型
export type HelperFunction = (type: ComponentType, props?: VNodeProps | null, children?: (VNode | string)[] | string | VNode | null) => VNode;

/**
 * 从模板创建虚拟节点的帮助函数
 * @param type 节点类型
 * @param props 节点属性
 * @param children 子节点
 * @returns 新创建的虚拟节点
 */
export function h(
  type: ComponentType,
  props?: VNodeProps | null,
  children?: (VNode | string)[] | string | VNode | null
): VNode {
  // 规范化子节点为数组
  if (children == null) {
    children = [];
  } else if (!Array.isArray(children)) {
    // 将单个子节点包装成数组
    // 将所有原始类型转换为 TextVNode
    children = [typeof children === 'string' ? createTextVNode(children)
      : (children instanceof VNode ? children : createTextVNode(String(children)))];
  } else {
    // 处理数组子节点
    children = children.map(child =>
      typeof child === 'string' ? createTextVNode(child) : child
    );
  }
  return createVNode(type, props, children);
}
