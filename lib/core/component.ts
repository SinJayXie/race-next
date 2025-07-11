import { createReactiveData } from '@/core/reactive';
import { createVirtualNode, VirtualNode } from '@/core/virtual-node';

export type ComponentDefaultObject = Record<string, any>

export type ComponentOptions = {
  props?: ComponentDefaultObject; // 仅存放props
  data?: ComponentDefaultObject; // 仅存放组件自身data（与props分离）
}

export class Component<P extends ComponentDefaultObject = ComponentDefaultObject, D extends ComponentDefaultObject = ComponentDefaultObject> {
  public $props: P; // 接收父组件传递的props（含emits回调）
  public readonly $data: D; // 组件自身响应式数据（不含emits）
  public $VNode: VirtualNode | null = null;
  public $emits: Record<string, (...args: any[]) => void> = {}; // 单独存储事件回调（与$data完全分离）
  private _renderUpdate: () => void = () => ({});
  private _isMounted: boolean = false;

  // 组件自身数据定义（子类重写）
  protected data(): Partial<D> {
    return {};
  }

  constructor(options?: ComponentOptions) {
    // 初始化props（冻结，防止修改）
    this.$props = Object.freeze({ ...(options?.props || {}) } as P);

    // 初始化响应式data：仅合并组件自身定义的data（options.data和this.data()）
    // 关键：不混入props，确保emits不会进入$data
    this.$data = createReactiveData(
      this.update.bind(this),
        { ...(options?.data || {}), ...this.data() } as D
    );
  }

  // 触发事件（使用单独的$emits，不依赖$data）
  public $emit(eventName: string, ...args: any[]) {
    const handler = this.$emits[eventName];
    if (typeof handler === 'function') {
      handler(...args);
    }
  }

  public setRendererCallback(cb: () => void) {
    this._renderUpdate = cb;
  }

  public render(): VirtualNode {
    return createVirtualNode('div', null, '');
  }

  public update() {
    this._renderUpdate();
  }

  public mounted() {
    this._isMounted = true;
  }

  public unmounted() {
    this._isMounted = false;
  }

  public destroy() {
    this.unmounted();
    this.$emits = {}; // 清理事件回调
  }
}
