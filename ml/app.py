"""
Movie Genre Prediction API - Flask Inference Service
Production-ready ML API with error handling, logging, and CORS support
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import logging
from datetime import datetime
from pathlib import Path

# ===================================
# CONFIGURATION
# ===================================
MODEL_PATH = "model/genre_model.pkl"
VECTORIZER_PATH = "model/tfidf_vectorizer.pkl"
LOG_FILE = "api.log"
HOST = "0.0.0.0"
PORT = 5000

# ===================================
# LOGGING SETUP
# ===================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ===================================
# FLASK APP INITIALIZATION
# ===================================
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# ===================================
# GLOBAL MODEL STORAGE
# ===================================
model = None
vectorizer = None
model_metadata = {}

# ===================================
# MODEL LOADING
# ===================================
def load_models():
    """Load trained model and vectorizer on startup"""
    global model, vectorizer, model_metadata
    
    try:
        logger.info("🚀 Starting model loading...")
        
        # Validate file existence
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
        if not os.path.exists(VECTORIZER_PATH):
            raise FileNotFoundError(f"Vectorizer file not found: {VECTORIZER_PATH}")
        
        # Load artifacts
        model = joblib.load(MODEL_PATH)
        vectorizer = joblib.load(VECTORIZER_PATH)
        
        # Store metadata
        model_metadata = {
            "model_loaded": True,
            "model_type": type(model).__name__,
            "vocab_size": len(vectorizer.vocabulary_),
            "num_classes": len(model.classes_),
            "classes": model.classes_.tolist(),
            "model_size_kb": round(os.path.getsize(MODEL_PATH) / 1024, 2),
            "vectorizer_size_kb": round(os.path.getsize(VECTORIZER_PATH) / 1024, 2),
            "loaded_at": datetime.now().isoformat()
        }
        
        logger.info("✅ Model and vectorizer loaded successfully")
        logger.info(f"   Model type: {model_metadata['model_type']}")
        logger.info(f"   Classes: {model_metadata['classes']}")
        logger.info(f"   Vocabulary size: {model_metadata['vocab_size']}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to load models: {str(e)}")
        raise

# ===================================
# INPUT VALIDATION
# ===================================
def validate_title(title):
    """Validate and clean input title"""
    if not title:
        return None, "Title cannot be empty"
    
    # Clean and normalize
    title = title.strip().lower()
    
    if len(title) < 2:
        return None, "Title must be at least 2 characters long"
    
    if len(title) > 200:
        return None, "Title too long (max 200 characters)"
    
    return title, None

# ===================================
# PREDICTION ENGINE
# ===================================
def predict_genre(title):
    """Make genre prediction for a given title"""
    try:
        # Transform input using TF-IDF vectorizer
        title_vec = vectorizer.transform([title])
        
        # Get prediction and probability
        prediction = model.predict(title_vec)[0]
        probabilities = model.predict_proba(title_vec)[0]
        
        # Get confidence (max probability)
        confidence = float(max(probabilities))
        
        # Get all class probabilities
        class_probs = {
            genre: round(float(prob), 4)
            for genre, prob in zip(model.classes_, probabilities)
        }
        
        return {
            "predicted_genre": prediction,
            "confidence": round(confidence, 4),
            "all_probabilities": class_probs
        }
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise

# ===================================
# API ROUTES
# ===================================

@app.route("/", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "running",
        "service": "Movie Genre Prediction API",
        "model_loaded": model is not None,
        "timestamp": datetime.now().isoformat()
    }), 200


@app.route("/info", methods=["GET"])
def model_info():
    """Get model metadata and information"""
    if not model:
        return jsonify({
            "error": "Model not loaded"
        }), 503
    
    return jsonify({
        "status": "success",
        "metadata": model_metadata
    }), 200


@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict genre for a movie title
    
    Request body:
    {
        "title": "The Dark Knight"
    }
    
    Response:
    {
        "status": "success",
        "input": {
            "original_title": "The Dark Knight",
            "processed_title": "the dark knight"
        },
        "prediction": {
            "predicted_genre": "Action",
            "confidence": 0.85,
            "all_probabilities": {
                "Action": 0.85,
                "Drama": 0.10,
                ...
            }
        },
        "timestamp": "2025-12-16T19:03:00"
    }
    """
    
    # Check if model is loaded
    if not model or not vectorizer:
        logger.error("Prediction attempt with unloaded model")
        return jsonify({
            "status": "error",
            "error": "Model not loaded. Please contact administrator."
        }), 503
    
    # Parse request
    try:
        data = request.get_json()
    except Exception as e:
        logger.warning(f"Invalid JSON received: {str(e)}")
        return jsonify({
            "status": "error",
            "error": "Invalid JSON format"
        }), 400
    
    # Validate input
    if not data:
        return jsonify({
            "status": "error",
            "error": "Request body is required"
        }), 400
    
    if "title" not in data:
        return jsonify({
            "status": "error",
            "error": "Missing 'title' field in request body"
        }), 400
    
    original_title = data["title"]
    
    # Validate and clean title
    processed_title, error = validate_title(original_title)
    if error:
        return jsonify({
            "status": "error",
            "error": error
        }), 400
    
    # Make prediction
    try:
        result = predict_genre(processed_title)
        
        logger.info(f"Prediction made: '{processed_title}' → {result['predicted_genre']} (confidence: {result['confidence']})")
        
        return jsonify({
            "status": "success",
            "input": {
                "original_title": original_title,
                "processed_title": processed_title
            },
            "prediction": result,
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        return jsonify({
            "status": "error",
            "error": "Prediction failed. Please try again."
        }), 500


@app.route("/batch-predict", methods=["POST"])
def batch_predict():
    """
    Predict genres for multiple titles at once
    
    Request body:
    {
        "titles": ["Inception", "Toy Story", "The Conjuring"]
    }
    """
    
    if not model or not vectorizer:
        return jsonify({
            "status": "error",
            "error": "Model not loaded"
        }), 503
    
    try:
        data = request.get_json()
    except:
        return jsonify({
            "status": "error",
            "error": "Invalid JSON format"
        }), 400
    
    if not data or "titles" not in data:
        return jsonify({
            "status": "error",
            "error": "Missing 'titles' field"
        }), 400
    
    titles = data["titles"]
    
    if not isinstance(titles, list):
        return jsonify({
            "status": "error",
            "error": "'titles' must be an array"
        }), 400
    
    if len(titles) > 100:
        return jsonify({
            "status": "error",
            "error": "Maximum 100 titles per batch request"
        }), 400
    
    # Process each title
    results = []
    errors = []
    
    for idx, title in enumerate(titles):
        processed_title, error = validate_title(title)
        
        if error:
            errors.append({
                "index": idx,
                "title": title,
                "error": error
            })
            continue
        
        try:
            prediction = predict_genre(processed_title)
            results.append({
                "index": idx,
                "original_title": title,
                "processed_title": processed_title,
                "prediction": prediction
            })
        except Exception as e:
            errors.append({
                "index": idx,
                "title": title,
                "error": str(e)
            })
    
    logger.info(f"Batch prediction: {len(results)} successful, {len(errors)} failed")
    
    return jsonify({
        "status": "success",
        "results": results,
        "errors": errors,
        "summary": {
            "total": len(titles),
            "successful": len(results),
            "failed": len(errors)
        },
        "timestamp": datetime.now().isoformat()
    }), 200


# ===================================
# ERROR HANDLERS
# ===================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "status": "error",
        "error": "Endpoint not found"
    }), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        "status": "error",
        "error": "Internal server error"
    }), 500


# ===================================
# STARTUP
# ===================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🎬 MOVIE GENRE PREDICTION API")
    print("="*60)
    
    # Load models
    try:
        load_models()
        print(f"\n🚀 API Server starting on http://{HOST}:{PORT}")
        print(f"📊 Loaded genres: {', '.join(model_metadata['classes'])}")
        print("\n📝 Available endpoints:")
        print(f"   GET  / - Health check")
        print(f"   GET  /info - Model information")
        print(f"   POST /predict - Single prediction")
        print(f"   POST /batch-predict - Batch predictions")
        print("\n" + "="*60 + "\n")
        
        # Start Flask app
        app.run(host=HOST, port=PORT, debug=True)
        
    except Exception as e:
        logger.error(f"Failed to start API: {str(e)}")
        print(f"\n❌ Failed to start API: {str(e)}\n")
        exit(1)
