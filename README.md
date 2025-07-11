Race Js



一个轻量级、高性能的前端框架，专注于提供简洁的组件化开发体验和高效的虚拟 DOM 渲染机制。


简介



Race Js 是一个基于虚拟 DOM 的前端框架，设计目标是提供核心的组件化能力和高效的 DOM 更新机制。它包含以下核心模块：




*   虚拟节点系统（Virtual Node）


*   组件系统（Component）


*   渲染器（Renderer）


框架的设计理念是简洁、高效，提供必要的抽象而不引入过多复杂性，适合用于构建中小型前端应用或作为学习前端框架实现原理的参考。


核心特性





*   **组件化开发**：基于类的组件系统，支持 props、状态管理和生命周期钩子


*   **响应式数据**：通过 Proxy 实现的数据响应式，数据变化自动触发视图更新


*   **虚拟 DOM**：高效的虚拟节点表示和 diff 算法，最小化 DOM 操作


*   **灵活的渲染器**：可配置的渲染器，便于适配不同环境


快速开始



### 安装&#xA;



```bash
>git clone https://github.com/SinJayXie/race-next.git
>cd race-js
```

### 基本使用示例


```typescript
import {Component, createVirtualNode, createApp} from 'race-next';

// 输入组件数据类型
type InputCompData = {
    value: string;
};

// 输入组件
class InputComp extends Component<{ key: string }, InputCompData> {
    protected data(): InputCompData {
        return {
            value: ''
        };
    }

    // 输入事件处理
    private handleInput(ev: InputEvent) {
        this.$data.value = (ev.target as HTMLInputElement).value;
    }

    // 挂载生命周期
    public mounted() {
        console.log('InputComp mounted');
    }

    render() {
        return createVirtualNode('div', {key: this.$props.key}, [
            createVirtualNode('input', {
                onInput: this.handleInput.bind(this),
                value: this.$data.value
            }),
            createVirtualNode('button', {
                onClick: () => {
                    // 触发deleteElement事件，传递当前值和key
                    this.$emit('deleteElement', this.$props.key, this.$data.value);
                }
            }, 'Delete'),
            createVirtualNode('span', null, `Current: ${this.$data.value}`)
        ]);
    }
}

// 根组件数据类型
type AppData = {
    count: number;
    list: string[];
};

// 根组件
export default class App extends Component<object, AppData> {
    protected data(): AppData {
        return {
            count: 1,
            list: []
        };
    }

    // 删除元素处理
    private handleDelete(key: string, value: string) {
        console.log(`Delete: key=${key}, value=${value}`);
        this.$data.list = this.$data.list.filter(item => item !== key);
    }

    render() {
        return createVirtualNode('div', {className: 'app'}, [
            createVirtualNode('h1', null, 'Todo List'),
            createVirtualNode('div', null, `Count: ${this.$data.count}`),
            createVirtualNode('button', {
                onClick: () => {
                    // 添加新元素
                    this.$data.list.push(String(this.$data.count));
                    this.$data.count++;
                }
            }, 'Add Item'),
            // 渲染列表
            ...this.$data.list.map(key =>
                createVirtualNode(InputComp, {
                    key,
                    emits: {
                        deleteElement: this.handleDelete.bind(this)
                    }
                })
            ),
            createVirtualNode('div', null, 'End of list')
        ]);
    }
}

createApp({
    Component: App
}).mount('#root');


```
