FROM python:3.11-slim
WORKDIR /app
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e "."
COPY agent_mcp_python/ ./agent_mcp_python/
EXPOSE 3103
CMD ["agent-mcp-python"]
