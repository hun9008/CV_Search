FROM python:3.8-slim

WORKDIR /app
COPY . .

# 필수 OS 패키지 설치
RUN apt-get update && apt-get install -y \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    gcc \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip

# VILA 설치
RUN git clone https://github.com/allenai/VILA.git
WORKDIR /app/VILA
RUN pip install -e .
RUN pip install -r requirements.txt

# 다시 원래 app 디렉토리로 이동하여 나머지 의존성 설치
WORKDIR /app
RUN pip install -r requirements.txt

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]