/**
 * Example component using Race framework
 */

import { Component, HelperFunction } from '@/race';

interface CounterProps {
  initialCount?: number
}

interface CounterData {
  count: number;
  count2: number;
  isShow: boolean;
}

export class Counter extends Component<CounterProps, CounterData> {
  static defaultProps: Record<string, number> = {
    initialCount: 0
  };

  protected data(): CounterData {
    return {
      count: 0,
      count2: 0,
      isShow: true
    };
  }

  increment(): void {
    this.$data.count++;
  }

  protected mounted(): void {
    console.log('mounted');
  }

  render(h: HelperFunction) {
    return h('div', null, [
      h('div', { class: { counter: true }}, [
        h('h1', { style: { fontSize: this.$data.count + 'px' }}, ['Count:', h('span', null, this.$data.count + '')]),
        h('button', { onClick: this.increment }, 'Increment' + this.$data.count),
        h('button', { onClick: () => this.$data.count-- }, 'Sub' + this.$data.count),
        ...new Array(this.$data.count).fill(null).map((_, i) => h('div', { key: i }, String(i)))
      ]),
      h('div', {}, [
        h('div', { style: { display: this.$data.isShow ? 'block' : 'none' }}, 'Show'),
        h('button', {
          onClick: () => {
            this.$data.isShow = !this.$data.isShow;
          }
        }, this.$data.isShow ? 'Hide' : 'Show')
      ])
    ]);
  }
}
