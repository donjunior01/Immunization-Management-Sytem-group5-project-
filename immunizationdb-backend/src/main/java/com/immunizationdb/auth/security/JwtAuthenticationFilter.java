package com.immunizationdb.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        // #region agent log - Entry point
        try {
            final String requestURI = request.getRequestURI();
            System.out.println("[DEBUG] JwtAuthenticationFilter.doFilterInternal called for: " + requestURI);
            java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
            fw.write(String.format("{\"location\":\"JwtAuthenticationFilter.java:doFilterInternal\",\"message\":\"Filter entry\",\"data\":{\"requestURI\":\"%s\",\"method\":\"%s\"},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"H6\"}\n", 
                requestURI, request.getMethod(), System.currentTimeMillis()));
            fw.close();
            System.out.println("[DEBUG] Log written successfully for: " + requestURI);
        } catch (Exception e) {
            // Log to console if file write fails
            System.err.println("[DEBUG] LOG ERROR: " + e.getMessage());
            e.printStackTrace();
        }
        // #endregion

        // Skip filter for auth endpoints - check both with and without /api prefix
        final String servletPath = request.getServletPath();
        final String requestURI = request.getRequestURI();
        
        System.out.println("[DEBUG] After filter entry - servletPath: " + servletPath + ", requestURI: " + requestURI);
        
        if (servletPath.equals("/auth/login") || servletPath.equals("/auth/register") ||
                servletPath.equals("/auth/health") || servletPath.equals("/auth/refresh") ||
                requestURI.endsWith("/auth/login") || requestURI.endsWith("/auth/register") ||
                requestURI.endsWith("/auth/health") || requestURI.endsWith("/auth/refresh")) {
            System.out.println("[DEBUG] Skipping filter for auth endpoint");
            filterChain.doFilter(request, response);
            return;
        }

        // Extract JWT from Authorization header
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        System.out.println("[DEBUG] Auth header present: " + (authHeader != null));

        // Log requests to protected endpoints
        boolean isProtectedEndpoint = requestURI.contains("/vaccinations") || requestURI.contains("/inventory/stock");
        log.debug("Processing request to: {}, Auth header present: {}", servletPath, authHeader != null);
        // #region agent log
        try {
            System.out.println("[DEBUG] Writing 'Request received' log");
            java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
            fw.write(String.format("{\"location\":\"JwtAuthenticationFilter.java:52\",\"message\":\"Request received\",\"data\":{\"servletPath\":\"%s\",\"requestURI\":\"%s\",\"method\":\"%s\",\"hasAuthHeader\":%s,\"isProtectedEndpoint\":%s},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"E\"}\n", 
                servletPath, requestURI, request.getMethod(), authHeader != null, isProtectedEndpoint));
            fw.close();
            System.out.println("[DEBUG] 'Request received' log written successfully");
        } catch (Exception e) {
            System.err.println("[DEBUG] Error writing 'Request received' log: " + e.getMessage());
            e.printStackTrace();
        }
        // #endregion

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("[DEBUG] No valid Authorization header - authHeader is null: " + (authHeader == null));
            log.debug("No valid Authorization header found");
            // #region agent log
            try {
                java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
                fw.write(String.format("{\"location\":\"JwtAuthenticationFilter.java:79\",\"message\":\"No valid auth header\",\"data\":{\"requestURI\":\"%s\",\"hasAuthHeader\":%s},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"H8\"}\n", 
                    requestURI, authHeader != null, System.currentTimeMillis()));
                fw.close();
            } catch (Exception e) {
                System.err.println("[DEBUG] Error writing 'No auth header' log: " + e.getMessage());
            }
            // #endregion
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);

        try {
            username = jwtService.extractUsername(jwt);
            log.debug("Extracted username from token: {}", username);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                log.debug("Loaded user details for: {}, authorities: {}", username, userDetails.getAuthorities());
                // #region agent log
                try {
                    java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
                    fw.write(String.format("{\"location\":\"JwtAuthenticationFilter.java:67\",\"message\":\"User loaded from database\",\"data\":{\"username\":\"%s\",\"authorities\":\"%s\",\"enabled\":%s},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"A\"}\n", username, userDetails.getAuthorities(), userDetails.isEnabled()));
                    fw.close();
                } catch (Exception e) {}
                // #endregion

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.info("User {} authenticated successfully with authorities: {}", username, userDetails.getAuthorities());
                    // #region agent log
                    try {
                        boolean isEnabled = userDetails.isEnabled();
                        boolean isAccountNonLocked = userDetails.isAccountNonLocked();
                        boolean isAccountNonExpired = userDetails.isAccountNonExpired();
                        boolean isCredentialsNonExpired = userDetails.isCredentialsNonExpired();
                        java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
                        fw.write(String.format("{\"location\":\"JwtAuthenticationFilter.java:81\",\"message\":\"Security context set\",\"data\":{\"username\":\"%s\",\"authorities\":\"%s\",\"requestPath\":\"%s\",\"isEnabled\":%s,\"isAccountNonLocked\":%s,\"isAccountNonExpired\":%s,\"isCredentialsNonExpired\":%s},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"D\"}\n", 
                            username, userDetails.getAuthorities(), requestURI, isEnabled, isAccountNonLocked, isAccountNonExpired, isCredentialsNonExpired));
                        fw.close();
                    } catch (Exception e) {}
                    // #endregion
                } else {
                    log.warn("Token validation failed for user: {}", username);
                    // #region agent log
                    try {
                        java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
                        fw.write(String.format("{\"location\":\"JwtAuthenticationFilter.java:84\",\"message\":\"Token validation failed\",\"data\":{\"username\":\"%s\"},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"C\"}\n", username));
                        fw.close();
                    } catch (Exception e) {}
                    // #endregion
                }
            } else if (username != null) {
                // #region agent log
                try {
                    java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
                    fw.write(String.format("{\"location\":\"JwtAuthenticationFilter.java:66\",\"message\":\"Authentication already exists\",\"data\":{\"username\":\"%s\",\"hasAuth\":%s},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"D\"}\n", username, SecurityContextHolder.getContext().getAuthentication() != null));
                    fw.close();
                } catch (Exception e) {}
                // #endregion
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage(), e);
            // #region agent log
            try {
                java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
                fw.write(String.format("{\"location\":\"JwtAuthenticationFilter.java:131\",\"message\":\"Exception in filter\",\"data\":{\"exception\":\"%s\",\"requestPath\":\"%s\"},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"E\"}\n", 
                    e.getClass().getSimpleName() + ": " + e.getMessage(), requestURI));
                fw.close();
            } catch (Exception ex) {}
            // #endregion
        }

        // Log SecurityContext state after filter processing
        // #region agent log
        try {
            org.springframework.security.core.Authentication authAfterFilter = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (isProtectedEndpoint) {
                java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
                fw.write(String.format("{\"location\":\"JwtAuthenticationFilter.java:140\",\"message\":\"After filter processing\",\"data\":{\"hasAuth\":%s,\"username\":\"%s\",\"authorities\":\"%s\",\"isAuthenticated\":%s,\"requestPath\":\"%s\"},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"B\"}\n", 
                    authAfterFilter != null,
                    authAfterFilter != null ? authAfterFilter.getName() : "null",
                    authAfterFilter != null ? authAfterFilter.getAuthorities().toString() : "null",
                    authAfterFilter != null && authAfterFilter.isAuthenticated(),
                    requestURI));
                fw.close();
            }
        } catch (Exception e) {}
        // #endregion

        filterChain.doFilter(request, response);
    }
}