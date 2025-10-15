'''
Business: OCR распознавание показаний электросчётчиков через Mistral AI Vision
Args: event - dict с httpMethod, body (base64 изображение)
      context - object с атрибутами request_id, function_name
Returns: HTTP response dict с meterNumber и reading
'''

import json
import os
import random
from typing import Dict, Any
from io import BytesIO
from PIL import Image, ImageEnhance
import requests

def generate_demo_reading(image: Image.Image) -> Dict[str, Any]:
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
        
        seed = sample_sum % 10000
    except:
        seed = random.randint(1000, 9999)
    
    random.seed(seed)
    reading = random.randint(1000, 9999)
    
    meter_prefixes = ['AM', 'BK', 'CM', 'DL', 'EM', 'FK']
    meter_suffix = str(seed)[:3].zfill(3)
    meter_number = random.choice(meter_prefixes) + meter_suffix + 'V'
    
    return {
        'meterNumber': meter_number,
        'reading': reading,
        'demo': True
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
        
        mistral_api_key = os.environ.get('MISTRAL_API_KEY')
        
        if not mistral_api_key:
            demo_result = generate_demo_reading(image)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(demo_result),
                'isBase64Encoded': False
            }
        
        prompt = '''Проанализируй это изображение электросчётчика и извлеки:

1. Номер счётчика - найди QR-код или штрих-код. Если есть наклейка с QR-кодом, используй текст рядом с ним (например "AM051V"). Если нет - используй серийный номер.

2. Показания счётчика - прочитай цифры на табло. Игнорируй дробную часть (красные цифры). Считай только целую часть.

Верни ТОЛЬКО JSON без лишнего текста:
{
  "meterNumber": "найденный номер",
  "reading": числовое_значение
}'''
        
        response = requests.post(
            'https://api.mistral.ai/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {mistral_api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'pixtral-12b-2409',
                'messages': [
                    {
                        'role': 'user',
                        'content': [
                            {
                                'type': 'text',
                                'text': prompt
                            },
                            {
                                'type': 'image_url',
                                'image_url': f'data:image/jpeg;base64,{image_base64}'
                            }
                        ]
                    }
                ],
                'max_tokens': 300
            },
            timeout=30
        )
        
        if response.status_code != 200:
            demo_result = generate_demo_reading(image)
            demo_result['error'] = 'Mistral API error, using demo mode'
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(demo_result),
                'isBase64Encoded': False
            }
        
        result = response.json()
        content = result['choices'][0]['message']['content'].strip()
        
        if content.startswith('```json'):
            content = content[7:]
        if content.startswith('```'):
            content = content[3:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        ocr_result = json.loads(content)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(ocr_result),
            'isBase64Encoded': False
        }
    
    except json.JSONDecodeError as e:
        image_bytes = base64.b64decode(image_base64.split(',')[1] if ',' in image_base64 else image_base64)
        image = Image.open(BytesIO(image_bytes))
        demo_result = generate_demo_reading(image)
        demo_result['error'] = 'Failed to parse AI response, using demo mode'
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(demo_result),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
