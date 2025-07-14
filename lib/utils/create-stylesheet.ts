export const createStylesheet = function<T extends Record<string, Partial<CSSStyleDeclaration>>>(opt: T): T {
  return opt;
};
