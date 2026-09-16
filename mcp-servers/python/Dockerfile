FROM python:3.11-slim
WORKDIR /app
COPY pyproject.toml README.md ./
COPY agent_mcp_python/ ./agent_mcp_python/
RUN pip install --no-cache-dir -e "."
EXPOSE 3103
CMD ["agent-mcp-python"]
