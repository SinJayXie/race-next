import { Component, createVirtualNode } from '@/race';

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
    return createVirtualNode('div', { key: this.$props.key }, [
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
    return createVirtualNode('div', { className: 'app' }, [
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
