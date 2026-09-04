FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder
WORKDIR /app
COPY AgentUtils.MCP.csproj ./
RUN dotnet restore --no-cache
COPY src/ ./src/
RUN dotnet publish -c Release -o /publish

FROM mcr.microsoft.com/dotnet/runtime:8.0
COPY --from=builder /publish /app
EXPOSE 3102
ENTRYPOINT ["/app/AgentUtils.MCP"]
