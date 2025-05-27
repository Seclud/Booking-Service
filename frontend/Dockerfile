FROM node:16 as build
WORKDIR /app

ARG REACT_APP_LOAD_BALANCER_URL
ENV REACT_APP_LOAD_BALANCER_URL=$REACT_APP_LOAD_BALANCER_URL

COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]