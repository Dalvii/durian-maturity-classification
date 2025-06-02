FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /server

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "server.py"]
