FROM node:8.9-slim

# add project to build
COPY . /root/app
WORKDIR /root/app
RUN npm install && \
    npm run build

ENV PORT 4242
ENV NODE_ENV production

EXPOSE 4242

CMD [ "npm", "start" ]