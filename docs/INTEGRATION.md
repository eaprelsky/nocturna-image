# Integration Guide

## Python Client for Telegram Bot

### Installation

Add to your bot's `requirements.txt`:

```
requests>=2.31.0
```

### Client Implementation

Create `chart_service_client.py` in your bot project:

```python
import requests
import base64
import logging
from typing import Dict, List, Optional, Literal
from io import BytesIO

logger = logging.getLogger(__name__)


class ChartServiceError(Exception):
    """Base exception for Chart Service errors"""
    
    def __init__(self, message: str, code: str = None, details: dict = None):
        self.message = message
        self.code = code
        self.details = details
        super().__init__(self.message)


class ChartServiceClient:
    """Client for Nocturna Chart Rendering Service"""
    
    def __init__(
        self, 
        base_url: str, 
        api_key: str,
        timeout: int = 15,
        max_retries: int = 3
    ):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        self.max_retries = max_retries
        
    def render_chart(
        self,
        planets: Dict[str, Dict[str, float]],
        houses: List[Dict[str, float]],
        format: Literal["png", "svg", "jpeg"] = "png",
        width: int = 800,
        height: int = 800,
        theme: Literal["light", "dark"] = "light"
    ) -> bytes:
        """Render natal chart and return image bytes"""
        url = f"{self.base_url}/api/v1/chart/render"
        
        payload = {
            "planets": planets,
            "houses": houses,
            "renderOptions": {
                "format": format,
                "width": width,
                "height": height,
                "quality": 90,
                "theme": theme
            }
        }
        
        return self._make_request(url, payload)
    
    def _make_request(self, url: str, payload: dict) -> bytes:
        """Make HTTP request with retry logic"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        for attempt in range(self.max_retries):
            try:
                response = requests.post(
                    url, 
                    json=payload, 
                    headers=headers,
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    data = response.json()
                    image_base64 = data['data']['image']
                    return base64.b64decode(image_base64)
                    
                elif response.status_code == 429:
                    retry_after = response.headers.get('Retry-After', 60)
                    raise ChartServiceError(
                        "Rate limit exceeded",
                        code="RATE_LIMIT_EXCEEDED"
                    )
                    
                else:
                    error_data = response.json()
                    raise ChartServiceError(
                        error_data['error']['message'],
                        code=error_data['error']['code']
                    )
                    
            except requests.exceptions.Timeout:
                if attempt == self.max_retries - 1:
                    raise ChartServiceError("Service timeout", code="TIMEOUT")
                    
            except requests.exceptions.ConnectionError:
                if attempt == self.max_retries - 1:
                    raise ChartServiceError(
                        "Service unavailable",
                        code="CONNECTION_ERROR"
                    )
        
        raise ChartServiceError("Max retries exceeded")
```

### Configuration

Add to your bot's `.env`:

```bash
CHART_SERVICE_URL=http://localhost:3000
CHART_SERVICE_API_KEY=your-api-key-here
```

Add to `config.py`:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    chart_service_url: str = "http://localhost:3000"
    chart_service_api_key: str
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### Usage in Bot Handlers

```python
from telegram import Update
from telegram.ext import ContextTypes
from io import BytesIO
from chart_service_client import ChartServiceClient, ChartServiceError
from config import settings

# Initialize client
chart_client = ChartServiceClient(
    base_url=settings.chart_service_url,
    api_key=settings.chart_service_api_key
)

async def natal_chart_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /natal command"""
    try:
        # Get chart data from nocturna-calculations API
        natal_data = await get_natal_data(user_id=update.effective_user.id)
        
        # Render chart image
        image_bytes = chart_client.render_chart(
            planets=natal_data['planets'],
            houses=natal_data['houses'],
            format="png",
            width=800,
            height=800
        )
        
        # Send to Telegram
        await update.message.reply_photo(
            photo=BytesIO(image_bytes),
            caption="Ваша натальная карта ✨"
        )
        
    except ChartServiceError as e:
        logger.error(f"Chart rendering failed: {e}")
        await update.message.reply_text(
            "Извините, не удалось сгенерировать изображение карты. "
            "Попробуйте позже."
        )
```

## Node.js Client

### Installation

```bash
npm install axios
```

### Client Implementation

```javascript
const axios = require('axios');

class ChartServiceClient {
  constructor(baseUrl, apiKey, timeout = 15000) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async renderChart(planets, houses, options = {}) {
    try {
      const response = await this.client.post('/api/v1/chart/render', {
        planets,
        houses,
        renderOptions: {
          format: options.format || 'png',
          width: options.width || 800,
          height: options.height || 800,
          quality: options.quality || 90,
          theme: options.theme || 'light'
        }
      });

      // Decode base64 image
      const imageBuffer = Buffer.from(response.data.data.image, 'base64');
      return imageBuffer;
    } catch (error) {
      if (error.response) {
        throw new Error(
          `Chart service error: ${error.response.data.error.message}`
        );
      }
      throw error;
    }
  }
}

module.exports = ChartServiceClient;
```

### Usage

```javascript
const ChartServiceClient = require('./chart-service-client');

const client = new ChartServiceClient(
  'http://localhost:3000',
  'your-api-key'
);

// Render chart
const imageBuffer = await client.renderChart(
  planets,
  houses,
  { format: 'png', width: 800, height: 800 }
);

// Save to file
const fs = require('fs');
fs.writeFileSync('chart.png', imageBuffer);
```

## Testing Integration

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### Test Chart Rendering

```bash
curl -X POST http://localhost:3000/api/v1/chart/render \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @test-chart.json \
  | jq -r '.data.image' \
  | base64 -d > chart.png
```

## Error Handling

### Common Errors

| Error Code | Status | Cause | Solution |
|------------|--------|-------|----------|
| `AUTHENTICATION_ERROR` | 401 | Invalid API key | Check API key |
| `VALIDATION_ERROR` | 400 | Invalid data | Validate input |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Implement backoff |
| `TIMEOUT_ERROR` | 504 | Render timeout | Retry request |
| `RENDER_ERROR` | 500 | Rendering failed | Check logs |

### Retry Strategy

```python
import time

def render_with_retry(client, planets, houses, max_attempts=3):
    for attempt in range(max_attempts):
        try:
            return client.render_chart(planets, houses)
        except ChartServiceError as e:
            if e.code == 'RATE_LIMIT_EXCEEDED':
                time.sleep(60)  # Wait before retry
            elif attempt == max_attempts - 1:
                raise  # Re-raise on last attempt
            else:
                time.sleep(2 ** attempt)  # Exponential backoff
```

## Performance Tips

1. **Cache Results**: Cache rendered images for identical inputs
2. **Optimize Size**: Use lower resolution for previews
3. **Batch Requests**: Group multiple chart requests if possible
4. **Monitor Metrics**: Track response times and error rates
5. **Handle Timeouts**: Set appropriate timeout values

## Monitoring Integration

### Prometheus Scraping

Add to your Prometheus config:

```yaml
- job_name: 'chart-service'
  static_configs:
    - targets: ['chart-service:3000']
  metrics_path: '/metrics'
```

### Grafana Alerts

Create alerts for:
- High error rate (> 5%)
- Slow response time (> 5s)
- Service down

## Production Checklist

- [ ] API key configured
- [ ] Base URL set correctly
- [ ] Timeout values tuned
- [ ] Error handling implemented
- [ ] Retry logic added
- [ ] Logging configured
- [ ] Metrics monitored
- [ ] Rate limiting handled

