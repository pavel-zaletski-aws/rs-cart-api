FROM node:12-alpine
# Adding build tools to make yarn install work on Apple silicon / arm64 machines
RUN apk add --no-cache python2 g++ make
WORKDIR /app
COPY . .
RUN yarn install --production

# Build
RUN npm run build

# Application
USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]