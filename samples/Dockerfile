# Local preview image with shell and JSON forms.
FROM node:24-alpine AS build
WORKDIR /app
ARG APP_ENV=production
ENV NODE_ENV=${APP_ENV}
COPY package*.json ./
RUN if [ "$NODE_ENV" = "production" ]; then npm ci; else npm install; fi
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s CMD wget --spider http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
