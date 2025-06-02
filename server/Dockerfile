FROM --platform=linux/amd64 python:3.12-slim 

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    libavcodec-extra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /server

COPY requirements.txt .
RUN pip install --no-cache-dir setuptools -r requirements.txt
RUN pip install --no-cache-dir setuptools

COPY . .

EXPOSE 5000

CMD ["python", "lite_server.py"]
