import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { mapBackendRoleToFrontendRole } from '../models/user.model';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    // #region agent log
    try {
      const logData = {location:'role.guard.ts:7',message:'RoleGuard activated',data:{route:state.url,allowedRoles},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
      fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData),keepalive:true}).catch((e)=>{console.debug('[DebugLog] Failed to send log (expected if server not running):',e.message||'Connection refused')});
    } catch(e) {
      console.debug('[DebugLog] Failed to create log request:',e);
    }
    // #endregion
    
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      // #region agent log
      try {
        const logData = {location:'role.guard.ts:15',message:'User not authenticated',data:{route:state.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'};
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData),keepalive:true}).catch((e)=>{console.debug('[DebugLog] Failed to send log (expected if server not running):',e.message||'Connection refused')});
      } catch(e) {
        console.debug('[DebugLog] Failed to create log request:',e);
      }
      // #endregion
      
      console.warn('[RoleGuard] User not authenticated, redirecting to login');
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const user = authService.getCurrentUser();
    if (!user) {
      // #region agent log
      try {
        const logData = {location:'role.guard.ts:26',message:'No user found',data:{route:state.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData),keepalive:true}).catch((e)=>{console.debug('[DebugLog] Failed to send log (expected if server not running):',e.message||'Connection refused')});
      } catch(e) {
        console.debug('[DebugLog] Failed to create log request:',e);
      }
      // #endregion
      
      console.warn('[RoleGuard] No user found, redirecting to login');
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Normalize role to uppercase for comparison
    // Handle both enum values and string roles
    const userRoleRaw = user.role;
    let userRole = '';
    if (typeof userRoleRaw === 'string') {
      userRole = userRoleRaw.toUpperCase().trim();
    } else if (userRoleRaw) {
      // If it's an enum or object, convert to string
      userRole = String(userRoleRaw).toUpperCase().trim();
    } else {
      console.error('[RoleGuard] User role is null or undefined:', user);
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
    
    // Normalize allowed roles to uppercase
    const normalizedAllowedRoles = allowedRoles.map(r => r.toUpperCase());
    
    // #region agent log
    try {
      const logData = {location:'role.guard.ts:59',message:'Role comparison',data:{userRole,normalizedAllowedRoles,route:state.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'};
      fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData),keepalive:true}).catch((e)=>{console.debug('[DebugLog] Failed to send log (expected if server not running):',e.message||'Connection refused')});
    } catch(e) {
      console.debug('[DebugLog] Failed to create log request:',e);
    }
    // #endregion
    
    // Check if user's role matches any allowed role (direct match only - no aliases)
    const hasAccess = normalizedAllowedRoles.includes(userRole);

    // #region agent log
    try {
      const logData = {location:'role.guard.ts:75',message:'Access check result',data:{hasAccess,userRole,normalizedAllowedRoles,route:state.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
      fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData),keepalive:true}).catch((e)=>{console.debug('[DebugLog] Failed to send log (expected if server not running):',e.message||'Connection refused')});
    } catch(e) {
      console.debug('[DebugLog] Failed to create log request:',e);
    }
    // #endregion

    if (hasAccess) {
      console.log('[RoleGuard] Access granted. User role:', userRole, 'Route:', state.url);
      return true;
    }

    console.warn('[RoleGuard] Access denied. User role:', userRole, 'Required roles:', normalizedAllowedRoles, 'Route:', state.url);
    router.navigate(['/login'], { queryParams: { returnUrl: state.url, accessDenied: 'true' } });
    return false;
  };
};
