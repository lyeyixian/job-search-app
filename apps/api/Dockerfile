# Build from the repo root: docker build -f apps/api/Dockerfile .
FROM node:26-slim AS build
# Keep this version the same as "packageManager" in package.json.
RUN npm install --global pnpm@12.18.0
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmfile.cjs ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @job-search/api...
COPY tsconfig.base.json ./
COPY apps/api apps/api
RUN pnpm --filter @job-search/api build
RUN pnpm --filter @job-search/api deploy --prod --legacy /out

FROM node:26-slim
# The API runs `git pull` in the vault clone, over SSH with the deploy key.
RUN apt-get update \
  && apt-get install -y --no-install-recommends git openssh-client ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=3001
WORKDIR /app
COPY --from=build /out/package.json ./
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
USER node
EXPOSE 3001
CMD ["node", "dist/index.js"]
