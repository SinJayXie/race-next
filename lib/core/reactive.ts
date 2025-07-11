export const createReactiveData = function<T extends object>(update: () => void, data: T): T {
  return new Proxy(data, {
    get(target: T, p: string | symbol, receiver: any): any {
      return Reflect.get(target, p, receiver);
    },
    set(target: T, p: string | symbol, newValue: any, receiver: any): boolean {
      const result = Reflect.set(target, p, newValue, receiver);
      if (result) update();
      return result;
    }
  });
};
