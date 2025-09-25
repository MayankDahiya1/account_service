# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* tsconfig.json ./
COPY prisma ./prisma

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build TypeScript -> dist + Prisma client + GraphQL files
RUN pnpm build

# Stage 2: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# ⚠️ Important: keep this configurable
ENV NODE_ENV=${NODE_ENV:-production}

# Copy only necessary files
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
# Explicitly copy GraphQL files if missed in dist
COPY --from=build /app/src/**/*.graphql ./dist/graphql/

EXPOSE 4001

CMD ["pnpm", "start"]
