import { CHROME_STORAGE_VOLUME_STEP_KEY } from "./const";

export type ChromeStorageItems = {
  [CHROME_STORAGE_VOLUME_STEP_KEY]?: number;
}

export const isHTMLElement = (node: Node): node is HTMLElement => {
  return !!(node as HTMLElement).tagName;
}
