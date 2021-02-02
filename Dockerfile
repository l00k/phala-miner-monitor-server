FROM node:14
WORKDIR /usr/src/app
EXPOSE 8080
CMD [ "./etc/run.sh" ]
