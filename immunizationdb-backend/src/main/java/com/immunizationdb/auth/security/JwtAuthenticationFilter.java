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

        // Skip filter for auth endpoints - check both with and without /api prefix
        final String servletPath = request.getServletPath();
        final String requestURI = request.getRequestURI();
        
        if (servletPath.equals("/auth/login") || servletPath.equals("/auth/register") ||
                servletPath.equals("/auth/health") || servletPath.equals("/auth/refresh") ||
                requestURI.endsWith("/auth/login") || requestURI.endsWith("/auth/register") ||
                requestURI.endsWith("/auth/health") || requestURI.endsWith("/auth/refresh")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract JWT from Authorization header
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        log.debug("Processing request to: {}, Auth header present: {}", servletPath, authHeader != null);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.debug("No valid Authorization header found");
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
                } else {
                    log.warn("Token validation failed for user: {}", username);
                }
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage(), e);
        }

        filterChain.doFilter(request, response);
    }
}
