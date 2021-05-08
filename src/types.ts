export const isHTMLElement = (node: Node): node is HTMLElement => {
  return !!(node as HTMLElement).tagName;
}
