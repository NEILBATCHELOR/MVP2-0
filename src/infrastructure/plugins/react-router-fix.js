// React Router fix plugin
export default function reactRouterFix() {
  return {
    name: 'react-router-fix',
    transform(code, id) {
      if (id.includes('react-router') || id.includes('react-router-dom')) {
        // For ESM modules in react-router, make sure they properly import React
        if (code.includes('import React from "react"') || code.includes("import * as React from 'react'")) {
          // Replace the basic import with one that includes all the necessary exports
          const newImport = `
import React, { 
  useEffect, useLayoutEffect, useState, useRef, 
  useMemo, useCallback, useContext, Fragment, 
  createContext, createElement, Component, 
  Children, isValidElement, forwardRef, memo
} from "react";
`;
          return code.replace(/import React.+from ["']react["'];?/g, newImport);
        }
      }
      return null;
    }
  };
}
