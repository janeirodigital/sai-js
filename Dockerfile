FROM node:16-alpine AS RUNTIME

WORKDIR /service

COPY . .

# Add envsubst, needed by the bootstrap script
RUN apk add gettext

EXPOSE 4000

CMD ["sh", "deploy/bootstrap.sh"]
