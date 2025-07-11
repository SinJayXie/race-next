
export const createRuntimeError = function(message: string, isThrow?: boolean): void {
  if (isThrow) throw Error(message);
  console.error(message);
};
