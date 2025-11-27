#!/usr/bin/env python3
"""
Example: Render a biwheel chart using the Nocturna Chart Service

This script demonstrates how to:
1. Create a biwheel chart request (Natal + Progressed)
2. Send it to the API
3. Save the resulting image
"""

import os
import base64
import requests
from typing import Dict, Any


class NocturnaChartClient:
    """Client for Nocturna Chart Service API"""
    
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def render_biwheel_chart(self, inner_chart: Dict[str, Any], 
                            outer_chart: Dict[str, Any],
                            biwheel_settings: Dict[str, Any] = None,
                            render_options: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Render a biwheel chart
        
        Args:
            inner_chart: Inner chart data (typically natal)
            outer_chart: Outer chart data (typically progressed, solar return, etc.)
            biwheel_settings: Biwheel configuration (optional)
            render_options: Rendering options (optional)
            
        Returns:
            API response with base64-encoded image
        """
        payload = {
            'inner': inner_chart,
            'outer': outer_chart
        }
        
        if biwheel_settings:
            payload['biwheelSettings'] = biwheel_settings
        
        if render_options:
            payload['renderOptions'] = render_options
        
        response = requests.post(
            f'{self.api_url}/api/v1/chart/render/biwheel',
            json=payload,
            headers=self.headers,
            timeout=30
        )
        
        response.raise_for_status()
        return response.json()
    
    def save_chart_image(self, response: Dict[str, Any], filename: str):
        """Save chart image from API response to file"""
        image_data = response['data']['image']
        image_bytes = base64.b64decode(image_data)
        
        with open(filename, 'wb') as f:
            f.write(image_bytes)
        
        print(f"Chart saved to {filename}")
        print(f"Size: {len(image_bytes)} bytes")
        print(f"Dimensions: {response['data']['dimensions']}")
        print(f"Render time: {response['meta']['renderTime']}ms")


def main():
    # Configuration
    API_URL = os.getenv('API_URL', 'http://localhost:3000')
    API_KEY = os.getenv('API_KEY', 'your-api-key-here')
    
    # Create client
    client = NocturnaChartClient(API_URL, API_KEY)
    
    # Define inner chart (Natal)
    inner_chart = {
        'name': 'Natal Chart',
        'planets': {
            'sun': {'lon': 85.83, 'lat': 0.0, 'retrograde': False},
            'moon': {'lon': 133.21, 'lat': 5.12, 'retrograde': False},
            'mercury': {'lon': 95.45, 'lat': -2.3, 'retrograde': True},
            'venus': {'lon': 110.20, 'lat': 1.5, 'retrograde': False},
            'mars': {'lon': 45.30, 'lat': -0.8, 'retrograde': True},
            'jupiter': {'lon': 200.15, 'lat': 0.5, 'retrograde': False},
            'saturn': {'lon': 290.45, 'lat': 2.1, 'retrograde': False},
            'uranus': {'lon': 15.60, 'lat': -0.3, 'retrograde': False},
            'neptune': {'lon': 325.80, 'lat': 1.2, 'retrograde': False},
            'pluto': {'lon': 270.25, 'lat': 15.0, 'retrograde': False}
        },
        'houses': [
            {'lon': 300.32},
            {'lon': 330.15},
            {'lon': 355.24},
            {'lon': 20.32},
            {'lon': 45.15},
            {'lon': 75.24},
            {'lon': 120.32},
            {'lon': 150.15},
            {'lon': 175.24},
            {'lon': 200.32},
            {'lon': 225.15},
            {'lon': 255.24}
        ]
    }
    
    # Define outer chart (Progressed)
    outer_chart = {
        'name': 'Progressed Chart',
        'planets': {
            'sun': {'lon': 115.20, 'lat': 0.0, 'retrograde': False},
            'moon': {'lon': 200.45, 'lat': 4.8, 'retrograde': False},
            'mercury': {'lon': 125.30, 'lat': -1.5, 'retrograde': False},
            'venus': {'lon': 140.50, 'lat': 2.0, 'retrograde': False},
            'mars': {'lon': 75.80, 'lat': -1.2, 'retrograde': False},
            'jupiter': {'lon': 210.30, 'lat': 0.8, 'retrograde': False},
            'saturn': {'lon': 295.60, 'lat': 2.3, 'retrograde': False},
            'uranus': {'lon': 18.40, 'lat': -0.5, 'retrograde': False},
            'neptune': {'lon': 327.90, 'lat': 1.4, 'retrograde': False},
            'pluto': {'lon': 272.10, 'lat': 14.8, 'retrograde': False}
        }
        # Note: houses are optional for outer chart
    }
    
    # Configure biwheel settings
    biwheel_settings = {
        'useHousesFrom': 'inner',
        'aspectSettings': {
            'inner': {
                'enabled': True,
                'orb': 6,
                'types': {
                    'conjunction': {'enabled': True},
                    'opposition': {'enabled': True},
                    'trine': {'enabled': True},
                    'square': {'enabled': True},
                    'sextile': {'enabled': True}
                }
            },
            'outer': {
                'enabled': True,
                'orb': 6,
                'types': {
                    'conjunction': {'enabled': True},
                    'opposition': {'enabled': True},
                    'trine': {'enabled': True},
                    'square': {'enabled': True},
                    'sextile': {'enabled': True}
                }
            },
            'crossAspects': {
                'enabled': True,
                'orb': 3,
                'types': {
                    'conjunction': {'enabled': True},
                    'opposition': {'enabled': True},
                    'trine': {'enabled': True},
                    'square': {'enabled': True},
                    'sextile': {'enabled': True}
                }
            }
        }
    }
    
    # Configure render options
    render_options = {
        'format': 'png',
        'width': 1000,
        'height': 1000,
        'quality': 90,
        'theme': 'light'
    }
    
    try:
        print("Rendering biwheel chart...")
        response = client.render_biwheel_chart(
            inner_chart=inner_chart,
            outer_chart=outer_chart,
            biwheel_settings=biwheel_settings,
            render_options=render_options
        )
        
        # Save the chart
        client.save_chart_image(response, 'biwheel-chart.png')
        
        # Print chart info
        chart_info = response['data']['chartInfo']
        print(f"\nChart Info:")
        print(f"  Type: {chart_info['type']}")
        print(f"  Inner: {chart_info.get('innerName', 'N/A')}")
        print(f"  Outer: {chart_info.get('outerName', 'N/A')}")
        print(f"  Aspects found:")
        print(f"    - Cross aspects: {chart_info['aspectsFound']['crossAspects']}")
        print(f"    - Inner aspects: {chart_info['aspectsFound']['inner']}")
        print(f"    - Outer aspects: {chart_info['aspectsFound']['outer']}")
        
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e}")
        print(f"Response: {e.response.text}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == '__main__':
    main()

