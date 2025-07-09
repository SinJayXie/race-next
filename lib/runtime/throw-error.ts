
export const createRuntimeError = function(message: string, isThrow?: boolean) {
  if (isThrow) {
    throw new SyntaxError('[Race Runtime Error]: ' + message);
  } else {
    console.error('[Race Runtime Error]: %s', message);
  }
};

