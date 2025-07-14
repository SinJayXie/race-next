import { Component, createVirtualNode, createStylesheet } from '@/race';

// 创建样式表 - 修改为使用独立类而非嵌套选择器
const styles = createStylesheet({
  app: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)'
  },
  heading: {
    color: '#333',
    textAlign: 'center'
  },
  count: {
    marginBottom: '15px',
    fontSize: '16px',
    color: '#666',
    fontWeight: 'bold'
  },
  button: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '15px',
    transition: 'backgroundColor 0.3s'
  },
  buttonHover: {
    backgroundColor: '#45a049'
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
    padding: '8px',
    backgroundColor: 'white',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  input: {
    flex: '1',
    padding: '8px',
    marginRight: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  deleteButton: {
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'backgroundColor 0.3s'
  },
  deleteButtonHover: {
    backgroundColor: '#d32f2f'
  },
  currentValue: {
    marginLeft: '10px',
    fontSize: '14px',
    color: '#666'
  },
  endOfList: {
    marginTop: '20px',
    fontSize: '14px',
    color: '#999',
    textAlign: 'center'
  }
});

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
    return createVirtualNode('div', { style: styles.inputContainer, key: this.$props.key }, [
      createVirtualNode('input', {
        style: styles.input,
        onInput: this.handleInput.bind(this),
        value: this.$data.value
      }),
      createVirtualNode('button', {
        style: styles.deleteButton,
        onClick: () => {
          this.$emit('deleteElement', this.$props.key, this.$data.value);
        }
      }, '删除'),
      createVirtualNode('div', { style: styles.currentValue }, `当前: ${this.$data.value}`)
    ]);
  }
}

// 根组件数据类型
type AppData = {
  count: {
    data: number
  };
  list: string[];
};

// 根组件
export default class App extends Component<object, AppData> {
  protected data(): AppData {
    return {
      count: {
        data: 1
      },
      list: []
    };
  }

  // 删除元素处理
  private handleDelete(key: string, value: string) {
    console.log(`删除: key=${key}, value=${value}`);
    this.$data.list = this.$data.list.filter(item => item !== key);
  }

  render() {
    return createVirtualNode('div', { style: styles.app }, [
      createVirtualNode('h1', { style: styles.heading }, '待办事项列表'),
      createVirtualNode('div', { style: styles.count }, `计数: ${this.$data.count.data}`),
      createVirtualNode('button', {
        style: styles.button,
        onClick: () => {
          this.$data.list.push(String(this.$data.count.data));
          this.$data.count.data++;
        }
      }, '添加事项'),
      // 渲染列表
      ...this.$data.list.map(key =>
        createVirtualNode(InputComp, {
          key,
          emits: {
            deleteElement: this.handleDelete.bind(this)
          }
        })
      ),
      createVirtualNode('div', { style: styles.endOfList }, '列表结束')
    ]);
  }
}
