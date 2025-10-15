'''
Business: OCR распознавание показаний электросчётчиков (демо-режим для теста приложения)
Args: event - dict с httpMethod, body (base64 изображение)
      context - object с атрибутами request_id, function_name
Returns: HTTP response dict с meterNumber и reading
'''

import json
import base64
import random
from typing import Dict, Any
from io import BytesIO
from PIL import Image, ImageEnhance

def analyze_image_for_seed(image: Image.Image) -> int:
    try:
        image = image.convert('L')
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.0)
        
        width, height = image.size
        pixels = image.load()
        
        sample_sum = 0
        step = max(1, width // 10)
        for x in range(0, width, step):
            for y in range(0, height, step):
                sample_sum += pixels[x, y]
        
        return sample_sum % 10000
    except:
        return random.randint(1000, 9999)

def generate_reading_from_image(image: Image.Image) -> Dict[str, Any]:
    seed = analyze_image_for_seed(image)
    random.seed(seed)
    
    reading = random.randint(1000, 9999)
    
    meter_prefixes = ['AM', 'BK', 'CM', 'DL', 'EM', 'FK']
    meter_suffix = str(seed)[:3].zfill(3)
    meter_number = random.choice(meter_prefixes) + meter_suffix + 'V'
    
    return {
        'meterNumber': meter_number,
        'reading': reading
    }

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
        
        result = generate_reading_from_image(image)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(result),
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
