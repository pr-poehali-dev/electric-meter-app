'''
Business: API для управления показаниями электросчётчиков
Args: event - dict с httpMethod, body, queryStringParameters
      context - object с атрибутами request_id, function_name
Returns: HTTP response dict с statusCode, headers, body
'''

import json
import os
from typing import Dict, Any, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError('DATABASE_URL not found')
    return psycopg2.connect(database_url)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            user_id = query_params.get('userId', 'default_user')
            
            cursor.execute(
                "SELECT id, meter_number, reading, photo_url, created_at FROM t_p51427126_electric_meter_app.readings WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,)
            )
            
            readings = cursor.fetchall()
            
            result = []
            for r in readings:
                result.append({
                    'id': str(r['id']),
                    'meterNumber': r['meter_number'],
                    'reading': r['reading'],
                    'photoUrl': r['photo_url'],
                    'timestamp': r['created_at'].isoformat() if r['created_at'] else None
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'readings': result}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            meter_number = body_data.get('meterNumber')
            reading = body_data.get('reading')
            photo_url = body_data.get('photoUrl')
            user_id = body_data.get('userId', 'default_user')
            
            if not meter_number or reading is None:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'meterNumber and reading are required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                "INSERT INTO t_p51427126_electric_meter_app.readings (meter_number, reading, photo_url, user_id) VALUES (%s, %s, %s, %s) RETURNING id, created_at",
                (meter_number, reading, photo_url, user_id)
            )
            
            result = cursor.fetchone()
            conn.commit()
            
            new_reading = {
                'id': str(result['id']),
                'meterNumber': meter_number,
                'reading': reading,
                'photoUrl': photo_url,
                'timestamp': result['created_at'].isoformat()
            }
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps({'reading': new_reading}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters') or {}
            reading_id = query_params.get('id')
            
            if not reading_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'id is required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                "DELETE FROM t_p51427126_electric_meter_app.readings WHERE id = %s",
                (reading_id,)
            )
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
