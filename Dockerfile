FROM node:20-alpine AS admin-build
WORKDIR /admin
COPY admin/package*.json ./
RUN npm install
COPY admin/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/src ./src
COPY --from=admin-build /server/admin-dist ./admin-dist
COPY index.html styles.css ./public/
EXPOSE 3000
CMD ["node", "src/index.js"]
