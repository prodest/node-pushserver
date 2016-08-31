FROM mhart/alpine-node:6.4.0

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

# add project to build
COPY . /root/server/
WORKDIR /root/server

RUN npm install

ENV PORT 4242

EXPOSE 4242

CMD ["node", "bin/pushserver", "-c", "./config.json"]
