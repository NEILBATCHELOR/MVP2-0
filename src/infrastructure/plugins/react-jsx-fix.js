// React JSX fix plugin
export default function reactJsxFix() {
  const virtualModuleId = 'virtual:react-jsx-runtime';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'react-jsx-runtime-fix',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
      return null;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `
          import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
          export { jsx, jsxs, Fragment };
        `;
      }
      return null;
    }
  }
}
