// This file serves as a workaround for React JSX scope errors
// It provides the React namespace that can be imported when needed
// without requiring the actual React types

// Define a minimal React namespace
const React = {
  createElement: (...args: any[]) => {},
  Fragment: Symbol('Fragment'),
  createContext: (defaultValue: any) => ({
    Provider: Symbol('Provider'),
    Consumer: Symbol('Consumer'),
    displayName: '',
  }),
};

export default React;

// Export types that can be used for props
export type ReactNode = any;
export type ReactElement = any;

// Export hooks types
export type useState<T> = [T, (value: T) => void];
export type useEffect = (effect: () => void | (() => void), deps?: any[]) => void; 