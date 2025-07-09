import { VNode, h, HelperFunction } from './vnode';
import { createRenderer } from './renderer';

// 创建渲染器
const renderer = createRenderer({
  // 创建DOM元素
  createElement: (type) => document.createElement(type),
  // 设置元素文本内容
  setElementText: (node, text) => { node.textContent = text; },
  // 插入DOM节点
  insert: (child, parent, anchor) => parent.insertBefore(child, anchor || null),
  // 更新DOM属性
  patchProps: (el, key, prevValue, nextValue) => {
    if (key.startsWith('on')) {
      // 处理事件监听器
      const eventName = key.slice(2).toLowerCase();
      if (prevValue && typeof prevValue === 'function') el.removeEventListener(eventName, prevValue as any);
      if (nextValue && typeof nextValue === 'function') el.addEventListener(eventName, nextValue as any);
    } else {
      // 处理普通属性
      if (nextValue === null) {
        el.removeAttribute(key);
      } else {
        el.setAttribute(key, String(nextValue));
      }
    }
  }
});

// 默认属性类型
type DefaultProps = Record<string, any>
// 默认数据类型
type DefaultData = Record<string, any>

/**
 * 组件选项接口
 */
export interface ComponentOptions<P extends DefaultProps, D extends DefaultData> {
  name?: string // 组件名称
  props?: P // 组件属性
  data?: () => D // 组件数据
  methods?: Record<string, Function> // 组件方法
  mounted?: () => void // 挂载后钩子
  unmounted?: () => void // 卸载后钩子
  render?: () => VNode // 渲染函数
}

// 组件方法类型
type ComponentMethods = {
  [K in keyof Component]: Component[K] extends Function ? K : never
}[keyof Component]

/**
 * 基础组件类
 */
export class Component<P extends DefaultProps = DefaultProps, D extends DefaultData = DefaultData> {
  $props!: P; // 组件属性
  $data!: D; // 组件数据
  $vnode: VNode | null = null; // 虚拟节点
  $el: Element | null = null; // 真实DOM元素

  static defaultProps: Record<string, string | number | boolean | null | undefined> = {};

  /**
   * 组件构造函数
   * @param options 组件选项
   */
  constructor(options: ComponentOptions<P, D> = {} as ComponentOptions<P, D>) {
    // 用静态默认属性和提供的属性初始化props
    const ctor = this.constructor as typeof Component;
    this.$props = { ...(ctor.defaultProps || {}), ...(options.props || {}) } as P;

    // 初始化数据
    const dataFn = this.data || options.data;
    const rawData = (dataFn ? dataFn.call(this) : {}) as D;

    // 使用Proxy使数据具有响应性
    this.$data = this.makeReactive(rawData);

    // 绑定类原型上的方法
    this.bindMethods();
  }

  /**
   * 绑定类方法到实例
   */
  private bindMethods(): void {
    const prototype = Object.getPrototypeOf(this);
    const propertyNames = Object.getOwnPropertyNames(prototype) as Array<ComponentMethods>;

    propertyNames.forEach(key => {
      if (typeof this[key] === 'function' && !Object.is(key, 'constructor')) {
        const method = this[key] as unknown as Function;
        this[key] = method.bind(this) as any;
      }
    });
  }

  // 可选的数据方法，可由子类重写
  protected data?(): D

  /**
   * 使对象具有响应性
   * @param target 目标对象
   */
  private makeReactive<T extends object>(target: T): T {
    // 保存当前实例引用
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _self = this;
    return new Proxy(target, {
      // 拦截属性读取
      get(obj, key: string) {
        return Reflect.get(obj, key);
      },
      // 拦截属性设置
      set(obj, key: string, value) {
        const result = Reflect.set(obj, key, value);
        if (result) {
          // 数据变化时更新组件
          _self.update();
        }
        return result;
      },
      // 拦截属性删除
      deleteProperty(obj, key: string) {
        const result = Reflect.deleteProperty(obj, key);
        if (result) {
          // 数据变化时更新组件
          _self.update();
        }
        return result;
      }
    });
  }

  /**
   * 挂载组件到DOM
   * @param el 目标DOM元素
   */
  mount(el: Element): void {
    this.$el = el;
    this.update();
    // 调用挂载后生命周期钩子
    if (typeof this.mounted === 'function') {
      this.mounted();
    }
  }

  /**
   * 卸载组件
   */
  unmount(): void {
    // 调用卸载后生命周期钩子
    if (typeof this.unmounted === 'function') {
      this.unmounted();
    }
    this.$vnode = null;
    this.$el = null;
  }

  // 可选的生命周期钩子，可由子类重写
  protected mounted?(): void
  protected unmounted?(): void

  /**
   * 更新组件
   */
  protected update(): void {
    try {
      const newVNode = this.render(h);
      if (newVNode && this.$el) {
        if (this.$vnode) {
          // 执行差异更新
          renderer.patch(this.$vnode, newVNode, this.$el);
        } else {
          // 首次渲染
          renderer.patch(null, newVNode, this.$el);
        }
        this.$vnode = newVNode;
      }
    } catch (e) {

    }
  }

  /**
   * 渲染组件（需由子类实现）
   * @param h 创建虚拟节点的帮助函数
   */
  public render(h: HelperFunction): VNode {
    // 默认创建空文本
    return h('text', null, '');
  }
}
