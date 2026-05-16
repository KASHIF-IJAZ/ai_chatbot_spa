FROM python:3.11-slim

WORKDIR /app

# Dependencies copy karke install karo
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code copy karo
COPY . .

# HF Spaces port 7860 use karta hai
EXPOSE 7860

# Server start command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]