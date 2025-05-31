import requests
import base64
from pdf2image import convert_from_bytes
from google.oauth2 import service_account
from google.auth.transport.requests import Request

# 1. S3에서 다운로드
s3_url = "https://goodjobucket.s3.ap-northeast-2.amazonaws.com/cv/test.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20250530T114335Z&X-Amz-SignedHeaders=host&X-Amz-Expires=600&X-Amz-Credential=AKIAXKPUZP5J7IIVZVMD%2F20250530%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-Signature=044d10d8992331421e95324e79c484c8e1dd6d1ddb9ee7525af5cecd0534c623"
response = requests.get(s3_url)
print(response.status_code)
print(response.headers.get("Content-Type"))
pdf_bytes = response.content

# 2. PDF → 이미지 변환 (1페이지만)
images = convert_from_bytes(pdf_bytes, dpi=300)
image = images[0]

# 3. 이미지 → base64
import io
buf = io.BytesIO()
image.save(buf, format='PNG')
encoded_image = base64.b64encode(buf.getvalue()).decode()

key_path = "./capstone-461411-6906e44fef88.json"

# 올바른 OAuth Scope 설정
SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]

# credentials 생성
credentials = service_account.Credentials.from_service_account_file(
    key_path,
    scopes=SCOPES
)

credentials.refresh(Request())
access_token = credentials.token

endpoint = "https://vision.googleapis.com/v1/images:annotate"
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

body = {
    "requests": [
        {
            "image": {
                "content": encoded_image
            },
            "features": [
                {"type": "TEXT_DETECTION"}
            ]
        }
    ]
}

res = requests.post(endpoint, headers=headers, json=body)
print(res.json())