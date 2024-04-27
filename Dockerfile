FROM arm64v8/node:current-alpine3.18
WORKDIR /opt/app
EXPOSE 10928
COPY . .
# install nodemon
RUN npm install -g pm2
# install packages
RUN npm install
# start pm2 to run main.js and restart when fail
CMD ["pm2-runtime", "start", "main.js"]
