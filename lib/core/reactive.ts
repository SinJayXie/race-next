const arrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];

const arrayTargetWatch = function(arr: any[], update: () => void) {
  arrayMethods.forEach(method => {
    // @ts-ignore
    const originalMethod = Array.prototype[method];
    Object.defineProperty(arr, method, {
      value: function(...args: any[]) {
        const result = originalMethod.apply(this, args);
        update();
        return result;
      },
      writable: true,
      enumerable: false,
      configurable: true
    });
  });

  arr.forEach((item, index) => {
    if (typeof item === 'object' && item !== null) {
      arr[index] = createReactiveData(update, item);
    }
  });
};

export const createReactiveData = function<T extends object>(update: () => void, data: T): T {
  if (Array.isArray(data)) {
    arrayTargetWatch(data as any[], update);
  }

  return new Proxy(data, {
    get(target: T, p: string | symbol, receiver: any): any {
      const value = Reflect.get(target, p, receiver);
      if (typeof value === 'object' && value !== null) {
        return createReactiveData(update, value);
      }
      return value;
    },
    set(target: T, p: string | symbol, newValue: any, receiver: any): boolean {
      const result = Reflect.set(target, p, newValue, receiver);
      if (result) update();
      return result;
    }
  });
};
