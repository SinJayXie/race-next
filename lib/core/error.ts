
export const createRuntimeError = function(message: string, isThrow?: boolean, ...argv: any): void {
  if (isThrow) throw Error(message);
  console.error(message, ...argv);
};
