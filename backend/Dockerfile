FROM node:22-alpine

WORKDIR /app

# shared/ is imported by backend tsconfig (rootDir: ..)
COPY shared/ ./shared/
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

COPY backend/ ./backend/
RUN cd backend && npm run build

WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001
CMD ["node", "dist/backend/src/server.js"]
