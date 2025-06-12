// Auth middleware for request processing
// Note: This is a Vite project, not Next.js. The following types are for compatibility
type NextRequest = {
  nextUrl: { pathname: string };
  cookies: { get: (name: string) => { value?: string } | undefined };
  url: string;
  headers: { authorization?: string };
};

type NextResponse = {
  next: () => NextResponse;
  redirect: (url: URL) => NextResponse;
};

const NextResponse = {
  next: () => ({ type: 'next' } as any),
  redirect: (url: URL) => ({ type: 'redirect', url } as any)
};

export interface AuthMiddlewareConfig {
  publicRoutes: string[];
  protectedRoutes: string[];
  adminRoutes: string[];
}

export const defaultConfig: AuthMiddlewareConfig = {
  publicRoutes: ['/', '/login', '/signup', '/reset-password'],
  protectedRoutes: ['/dashboard', '/profile', '/settings'],
  adminRoutes: ['/admin', '/compliance', '/policies'],
};

export const createAuthMiddleware = (config: AuthMiddlewareConfig = defaultConfig) => {
  return async (request: NextRequest) => {
    const { pathname } = request.nextUrl;

    // Check if route is public
    if (config.publicRoutes.includes(pathname)) {
      return NextResponse.next();
    }

    // TODO: Implement actual token validation
    const isAuthenticated = validateToken(request);
    const userRole = getUserRole(request);

    // Check protected routes
    if (config.protectedRoutes.some(route => pathname.startsWith(route))) {
      if (!isAuthenticated) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    // Check admin routes
    if (config.adminRoutes.some(route => pathname.startsWith(route))) {
      if (!isAuthenticated) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      if (!['admin', 'compliance'].includes(userRole)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    return NextResponse.next();
  };
};

// Helper functions
const validateToken = (request: NextRequest): boolean => {
  // TODO: Implement actual token validation
  const token = request.cookies.get('auth-token')?.value;
  return !!token;
};

const getUserRole = (request: NextRequest): string => {
  // TODO: Implement actual role extraction
  const role = request.cookies.get('user-role')?.value;
  return role || 'user';
};

// Express middleware for API routes
export const expresAuthMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // TODO: Implement actual token validation
  try {
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based middleware
export const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    const userRole = req.user?.role;
    
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
