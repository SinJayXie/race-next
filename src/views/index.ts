/**
 * Example component using Race framework
 */

import { Component, HelperFunction } from '@/race';

interface CounterProps {
  initialCount?: number
}

interface CounterData {
  count: number;
  count2: number
}

export class Counter extends Component<CounterProps, CounterData> {
  static defaultProps: Record<string, number> = {
    initialCount: 0
  };

  protected data(): CounterData {
    return {
      count: 0,
      count2: 0
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
      h('div', { class: 'counter' }, [
        h('h1', null, ['Count:', h('span', null, this.$data.count + '')]),
        h('button', { onClick: this.increment }, 'Increment' + this.$data.count),
        h('button', { onClick: () => this.$data.count-- }, 'Sub' + this.$data.count),
        ...new Array(this.$data.count).fill(null).map((_, i) => h('div', { key: i }, String(i)))
      ])
    ]);
  }
}
