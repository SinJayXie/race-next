export const setProps = function(el: Element, key: string, prevValue: any, nextVal: any) {
  if (key.startsWith('on')) {
    // 监听on事件
    const eventName = key.slice(2).trim().toLocaleLowerCase();
    el.removeEventListener(eventName, prevValue);
    el.addEventListener(eventName, nextVal);
  } else if (key === 'className') {
    // 处理 class
    const oldClassName = el.className || '';
    if (Array.isArray(nextVal)) {
      // 数组类型的 class list
      const newClassName = nextVal.filter(key => typeof key === 'string')
        .map(key => key.trim())
        .join(' ');
      if (oldClassName !== newClassName) el.className = newClassName;
    } else if (typeof nextVal === 'object') {
      const classList: string[] = [];
      Object.keys(nextVal).forEach(key => {
        if (nextVal[key] === true) classList.push(key);
      });
      const classResult = classList.join(' ');
      if (oldClassName !== classResult) el.className = classResult;
    } else if (typeof nextVal === 'string') {
      if (nextVal !== oldClassName) el.className = nextVal;
    } else {
      el.removeAttribute('class');
    }
  } else if (key === 'style' && el instanceof HTMLElement) {
    // style 样式处理
    if (typeof nextVal === 'object') {
      Object.assign(el.style, nextVal as CSSStyleDeclaration);
    } else if (typeof nextVal === 'string') {
      if (nextVal !== el.getAttribute('style')) {
        el.setAttribute('style', nextVal as string);
      }
    }
  } else {
    const oldVal = String(prevValue);
    const newVal = String(nextVal);
    if (oldVal !== newVal) el.setAttribute(key, nextVal);
  }
};

