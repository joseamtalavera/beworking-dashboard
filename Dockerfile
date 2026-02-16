# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_PAYMENTS_BASE_URL
ARG VITE_STRIPE_TENANT

ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_PAYMENTS_BASE_URL=$VITE_PAYMENTS_BASE_URL
ENV VITE_STRIPE_TENANT=$VITE_STRIPE_TENANT

RUN npm run build

# --- Production stage ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
