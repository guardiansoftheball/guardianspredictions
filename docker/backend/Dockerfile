FROM golang:1.26.4-alpine3.22 AS builder

# Set by BuildKit to the target platform of the build
ARG TARGETARCH=amd64

WORKDIR /src
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=${TARGETARCH} go build -ldflags="-s -w" -o /app/server .

FROM alpine:3.24.1

RUN addgroup -S app && adduser -S -G app app \
	&& mkdir -p /data/socialpredict/uploads/social-share \
	&& chown -R app:app /data/socialpredict
COPY --from=builder /app/server /usr/local/bin/server
RUN chown app:app /usr/local/bin/server
USER app
ENV BACKEND_PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
	CMD wget -q -O - "http://127.0.0.1:${BACKEND_PORT:-8080}/health" | grep -qx live
ENTRYPOINT ["/usr/local/bin/server"]
