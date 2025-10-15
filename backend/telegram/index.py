'''
Business: Отправка уведомлений в Telegram о новых показаниях счётчиков
Args: event - dict с httpMethod, body (chatId, meterNumber, reading)
      context - object с атрибутами request_id, function_name
Returns: HTTP response dict с результатом отправки
'''

import json
import os
from typing import Dict, Any
import requests

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
    
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    
    if not bot_token:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'TELEGRAM_BOT_TOKEN not configured'}),
            'isBase64Encoded': False
        }
    
    body_str = event.get('body', '{}')
    body_data = json.loads(body_str)
    
    chat_id = body_data.get('chatId')
    meter_number = body_data.get('meterNumber')
    reading = body_data.get('reading')
    
    if not chat_id or not meter_number or reading is None:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'chatId, meterNumber and reading are required'}),
            'isBase64Encoded': False
        }
    
    message = f"⚡️ <b>Новые показания счётчика</b>\n\n📊 Счётчик: <code>{meter_number}</code>\n🔢 Показания: <b>{reading}</b> кВт·ч"
    
    telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    
    response = requests.post(
        telegram_url,
        json={
            'chat_id': chat_id,
            'text': message,
            'parse_mode': 'HTML'
        },
        timeout=10
    )
    
    if response.status_code != 200:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Failed to send Telegram message', 'details': response.text}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'success': True, 'message': 'Notification sent'}),
        'isBase64Encoded': False
    }
