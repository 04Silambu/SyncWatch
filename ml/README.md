# Movie Genre Prediction API

A production-ready Flask REST API for predicting movie genres using machine learning.

## 📊 Model Performance
- **Accuracy**: 57.17%
- **Genres**: Action, Adventure, Animation, Comedy, Drama
- **Model**: Logistic Regression with TF-IDF features
- **Model Size**: 24KB

## 🚀 Quick Start

### 1. Activate Virtual Environment
```bash
cd ml
# Windows
env\Scripts\activate

# Linux/Mac
source env/bin/activate
```

### 2. Install Dependencies
```bash
pip install flask flask-cors joblib scikit-learn
```

### 3. Start API Server
```bash
python app.py
```

The API will start on `http://localhost:5000`

## 📡 API Endpoints

### Health Check
```bash
GET /
```

**Response:**
```json
{
  "status": "running",
  "service": "Movie Genre Prediction API",
  "model_loaded": true,
  "timestamp": "2025-12-16T19:03:00"
}
```

### Model Information
```bash
GET /info
```

**Response:**
```json
{
  "status": "success",
  "metadata": {
    "model_type": "LogisticRegression",
    "classes": ["Action", "Adventure", "Animation", "Comedy", "Drama"],
    "vocab_size": 697,
    "num_classes": 5
  }
}
```

### Single Prediction
```bash
POST /predict
Content-Type: application/json

{
  "title": "The Dark Knight"
}
```

**Response:**
```json
{
  "status": "success",
  "input": {
    "original_title": "The Dark Knight",
    "processed_title": "the dark knight"
  },
  "prediction": {
    "predicted_genre": "Action",
    "confidence": 0.7234,
    "all_probabilities": {
      "Action": 0.7234,
      "Drama": 0.1523,
      "Adventure": 0.0821,
      "Comedy": 0.0312,
      "Animation": 0.0110
    }
  },
  "timestamp": "2025-12-16T19:03:00"
}
```

### Batch Prediction
```bash
POST /batch-predict
Content-Type: application/json

{
  "titles": ["Inception", "Toy Story", "The Conjuring"]
}
```

**Response:**
```json
{
  "status": "success",
  "results": [
    {
      "index": 0,
      "original_title": "Inception",
      "processed_title": "inception",
      "prediction": {
        "predicted_genre": "Action",
        "confidence": 0.65
      }
    }
  ],
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0
  }
}
```

## 🧪 Testing

Run the test script:
```bash
python test_api.py
```

Or use curl:
```bash
# Health check
curl http://localhost:5000/

# Prediction
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"title": "Iron Man"}'
```

## 🔧 Features

✅ **CORS Enabled** - Works with frontend applications  
✅ **Error Handling** - Comprehensive validation and error messages  
✅ **Logging** - Request and error logging to `api.log`  
✅ **Batch Processing** - Predict up to 100 titles at once  
✅ **Confidence Scores** - Probability distribution for all genres  
✅ **Input Validation** - Title length and format checks  

## 📝 Error Responses

### Invalid Input
```json
{
  "status": "error",
  "error": "Title cannot be empty"
}
```

### Model Not Loaded
```json
{
  "status": "error",
  "error": "Model not loaded. Please contact administrator."
}
```

## 🔒 Production Considerations

- Set `debug=False` in production
- Use a production WSGI server (gunicorn, uwsgi)
- Add rate limiting
- Implement authentication if needed
- Add monitoring and metrics

## 📂 File Structure

```
ml/
├── app.py                    # Flask API server
├── test_api.py               # API test script
├── model/
│   ├── genre_model.pkl      # Trained model (24KB)
│   └── tfidf_vectorizer.pkl # TF-IDF vectorizer (7KB)
├── api.log                  # API logs
└── requirements.txt         # Python dependencies
```

## 🎯 Use Cases

- Integrate with movie recommendation systems
- Auto-tag uploaded videos
- Content categorization
- Movie database enrichment
- Interview/portfolio demonstration
