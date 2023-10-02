export function handleEvent(obj, map = (x => x)) {
  return (data) => {
    const { event, ...args } = map(data);
    obj[event]?.(args);
  }
}
