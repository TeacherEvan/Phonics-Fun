# Phonics Fun - Docker Configuration
# Optimized static web server for the phonics game with Android compatibility

FROM nginx:alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Install required tools for optimizations
RUN apk --no-cache add bash findutils gzip

# Copy game files to nginx html directory
COPY . .

# Remove unnecessary files
RUN rm -f Dockerfile README.md run.bat
RUN rm -rf .git .snapshots

# Optimize images for mobile (if optipng and jpegoptim were available)
# This is commented out since alpine doesn't have these by default
# RUN find . -name "*.png" -exec optipng -o5 {} \; || true
# RUN find . -name "*.jpg" -exec jpegoptim --max=85 {} \; || true

# Pre-compress static assets for faster serving
RUN find . -type f -name "*.js" -exec gzip -9 -k {} \;
RUN find . -type f -name "*.css" -exec gzip -9 -k {} \;
RUN find . -type f -name "*.svg" -exec gzip -9 -k {} \;
RUN find . -type f -name "*.html" -exec gzip -9 -k {} \;

# Create custom nginx configuration for SPA with Android optimizations
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Enable gzip compression \
    gzip on; \
    gzip_static on; \
    gzip_vary on; \
    gzip_min_length 256; \
    gzip_comp_level 9; \
    gzip_proxied any; \
    gzip_types \
        text/plain \
        text/css \
        text/xml \
        text/javascript \
        application/javascript \
        application/x-javascript \
        application/xml \
        application/json \
        application/ld+json \
        application/manifest+json \
        application/vnd.geo+json \
        image/svg+xml; \
    \
    # Cache static assets with appropriate times \
    location ~* \.(js|css)$ { \
        expires 7d; \
        add_header Cache-Control "public, max-age=604800"; \
    } \
    \
    location ~* \.(png|jpg|jpeg|gif|ico|svg|mp3|ogg|wav)$ { \
        expires 30d; \
        add_header Cache-Control "public, max-age=2592000"; \
        add_header Access-Control-Allow-Origin "*"; \
    } \
    \
    location ~* \.(woff|woff2|ttf|eot)$ { \
        expires 30d; \
        add_header Cache-Control "public, max-age=2592000"; \
    } \
    \
    # Main route - ensure SPA routing works \
    location / { \
        try_files $uri $uri/ /index.html; \
        add_header Cache-Control "no-store, no-cache, must-revalidate"; \
    } \
    \
    # Cross-origin resource sharing for audio/images on Android \
    add_header Access-Control-Allow-Origin "*"; \
    add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS"; \
    \
    # Security headers with compatibility for WebView \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    \
    # Disable server signature \
    server_tokens off; \
}' > /etc/nginx/conf.d/default.conf

# Create healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
