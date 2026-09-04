FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN go build -o /bin/agent-mcp-go ./...

FROM alpine:3.20
COPY --from=builder /bin/agent-mcp-go /usr/local/bin/agent-mcp-go
EXPOSE 3100
ENTRYPOINT ["agent-mcp-go"]
