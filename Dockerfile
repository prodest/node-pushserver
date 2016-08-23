FROM node:6.4.0

# add project to build
COPY . /root/server/
WORKDIR /root/server

RUN npm install

ENV PORT 4242

EXPOSE 4242

CMD ["node", "bin/pushserver", "-c", "./config.json"]
