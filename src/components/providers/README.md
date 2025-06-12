# Providers

This directory contains React context providers that are used to manage global state and provide access to data and functionality throughout the application.

## Available Providers

### UserProvider

Provides user context and authentication state management.

**Features:**
- User authentication state
- User profile data
- Session management
- User preferences

**Usage:**
```tsx
import { UserProvider, useUser } from '@/components/providers/UserProvider';

// Wrap components that need user context
<UserProvider>
  <YourComponent />
</UserProvider>

// Use the hook in components
function YourComponent() {
  const { user, loading, error, refreshUser } = useUser();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>Hello, {user?.name}</div>;
}
```

### ProjectProvider

Provides project context for components that need access to the current project.

**Features:**
- Project data
- Project loading state
- Project refresh functionality

**Usage:**
```tsx
import { ProjectProvider, useProject } from '@/components/providers/ProjectProvider';

// Wrap components that need project context
<ProjectProvider projectId="project-123">
  <YourComponent />
</ProjectProvider>

// Use the hook in components
function YourComponent() {
  const { project, loading, error, refreshProject } = useProject();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>Project: {project?.name}</div>;
}
```

## Provider Structure

Each provider follows a consistent pattern:
1. A context is created using React's `createContext`
2. A provider component wraps child components and provides the context value
3. A custom hook is exported to access the context

## Best Practices

- Wrap provider components at the appropriate level in the component tree
- Use the exported hooks to access context values, not the context directly
- Keep provider components focused on a single responsibility
- Use composition over inheritance when creating new providers 