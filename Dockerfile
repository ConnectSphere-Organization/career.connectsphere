FROM mirror.gcr.io/library/node:24-alpine AS dependencies
WORKDIR /app/apps/career-portal
RUN corepack enable
COPY apps/career-portal/package.json apps/career-portal/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM mirror.gcr.io/library/node:24-alpine AS builder
WORKDIR /app/apps/career-portal
RUN corepack enable
RUN apk add --no-cache openssl

ARG APP_URL=http://localhost:3001
ARG BETTER_AUTH_URL=http://localhost:3001
ARG NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NODE_ENV=production
ENV APP_URL=$APP_URL
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=$NEXT_PUBLIC_GOOGLE_AUTH_ENABLED
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV MONGODB_URI=mongodb://localhost:27017/connectsphere
ENV BETTER_AUTH_SECRET=connectsphere-career-build-secret-only-000000000000

COPY --from=dependencies /app/apps/career-portal/node_modules ./node_modules
COPY apps/career-portal ./
RUN pnpm build

FROM mirror.gcr.io/library/node:24-alpine AS runner
WORKDIR /app/apps/career-portal
RUN apk add --no-cache openssl ttf-dejavu
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/apps/career-portal/package.json ./package.json
COPY --from=builder /app/apps/career-portal/node_modules ./node_modules
COPY --from=builder /app/apps/career-portal/.next ./.next
COPY --from=builder /app/apps/career-portal/prisma ./prisma
COPY --from=builder /app/apps/career-portal/next.config.ts ./next.config.ts
RUN rm -rf /usr/local/lib/node_modules/npm

EXPOSE 3001
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3001"]
