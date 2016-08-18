FROM mhart/alpine-node:6.2.1

# add project to build
COPY . /root/server/
WORKDIR /root/server

RUN npm install -g

EXPOSE 8000

CMD ["pushserver", "-c", "config.json"]
