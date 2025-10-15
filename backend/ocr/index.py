'''
Business: OCR распознавание показаний электросчётчиков через Tesseract OCR (бесплатно, без API ключей)
Args: event - dict с httpMethod, body (base64 изображение)
      context - object с атрибутами request_id, function_name
Returns: HTTP response dict с meterNumber и reading
'''

import json
import base64
import re
from typing import Dict, Any
from io import BytesIO
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract

def preprocess_image(image: Image.Image) -> Image.Image:
    image = image.convert('L')
    
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.0)
    
    enhancer = ImageEnhance.Sharpness(image)
    image = enhancer.enhance(1.5)
    
    image = image.filter(ImageFilter.MedianFilter(size=3))
    
    return image

def extract_meter_number(text: str) -> str:
    patterns = [
        r'[A-Z]{2}\d{3}[A-Z]',
        r'\d{10,}',
        r'№\s*(\w+)',
        r'N[o°]?\s*(\w+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            if len(match.groups()) > 0:
                return match.group(1)
            return match.group(0)
    
    words = text.split()
    for word in words:
        if len(word) >= 5 and any(c.isdigit() for c in word):
            return word
    
    return "UNKNOWN"

def extract_reading(text: str) -> int:
    numbers = re.findall(r'\d{3,}', text)
    
    if numbers:
        numbers_int = [int(n) for n in numbers]
        numbers_int.sort(reverse=True)
        
        for num in numbers_int:
            if 100 <= num <= 999999:
                return num
        
        return numbers_int[0] if numbers_int else 0
    
    return 0

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body_str = event.get('body', '')
        if not body_str or body_str.strip() == '':
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'image is required'}),
                'isBase64Encoded': False
            }
        
        try:
            body_data = json.loads(body_str)
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid JSON'}),
                'isBase64Encoded': False
            }
        image_base64 = body_data.get('image')
        
        if not image_base64:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'image is required'}),
                'isBase64Encoded': False
            }
        
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_bytes))
        
        processed_image = preprocess_image(image)
        
        text = pytesseract.image_to_string(
            processed_image,
            lang='eng+rus',
            config='--psm 6 --oem 3'
        )
        
        meter_number = extract_meter_number(text)
        reading = extract_reading(text)
        
        if reading == 0:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Не удалось распознать показания',
                    'debug_text': text
                }),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'meterNumber': meter_number,
                'reading': reading
            }),
            'isBase64Encoded': False
        }
    
    except json.JSONDecodeError as e:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid JSON in request body'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }