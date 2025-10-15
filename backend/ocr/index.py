'''
Business: OCR распознавание показаний электросчётчиков через OpenAI Vision (с демо-режимом)
Args: event - dict с httpMethod, body (base64 изображение)
      context - object с атрибутами request_id, function_name
Returns: HTTP response dict с meterNumber и reading
'''

import json
import os
import random
from typing import Dict, Any
import requests

def generate_demo_reading() -> Dict[str, Any]:
    meter_numbers = ['AM051V', 'BK123X', 'CM456Z', 'DL789Y']
    return {
        'meterNumber': random.choice(meter_numbers),
        'reading': random.randint(1000, 9999)
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
        
        openai_api_key = os.environ.get('OPENAI_API_KEY')
        
        if not openai_api_key:
            demo_result = generate_demo_reading()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    **demo_result,
                    'demo': True,
                    'message': 'Демо-режим: добавьте OPENAI_API_KEY для реального распознавания'
                }),
                'isBase64Encoded': False
            }
        
        prompt = '''Проанализируй это изображение электросчётчика и извлеки:

1. Номер счётчика - найди QR-код или штрих-код рядом со счётчиком. Если есть наклейка с QR-кодом, используй текст рядом с ним (например "AM051V" или номер под штрих-кодом). Если нет - используй любой видимый серийный номер.

2. Показания счётчика - прочитай цифры на механическом или электронном табло. Игнорируй цифры после запятой (обычно красные или в отдельной секции). Считай только целую часть.

Верни ответ СТРОГО в JSON формате:
{
  "meterNumber": "найденный номер",
  "reading": числовое_значение
}

Пример ответа:
{
  "meterNumber": "AM051V",
  "reading": 4451
}'''
        
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {openai_api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'gpt-4o',
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
                                'image_url': {
                                    'url': f'data:image/jpeg;base64,{image_base64}'
                                }
                            }
                        ]
                    }
                ],
                'max_tokens': 300
            },
            timeout=30
        )
        
        if response.status_code != 200:
            return {
                'statusCode': response.status_code,
                'headers': headers,
                'body': json.dumps({'error': 'OpenAI API error', 'details': response.text}),
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
