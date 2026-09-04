FROM gradle:8.8-jdk21 AS builder
WORKDIR /app
COPY . .
RUN gradle jar --no-daemon

FROM eclipse-temurin:21-jre-alpine
COPY --from=builder /app/build/libs/*.jar /app/agent-mcp-jvm.jar
EXPOSE 3101
CMD ["java", "-Xmx512m", "-jar", "/app/agent-mcp-jvm.jar"]
