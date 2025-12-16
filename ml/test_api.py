"""
API Test Script - Test the Flask ML API endpoints
"""

import requests
import json

# API Configuration
API_URL = "http://localhost:5000"

def print_response(title, response):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"TEST: {title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    print(f"Response:")
    print(json.dumps(response.json(), indent=2))
    print(f"{'='*60}\n")

def test_health_check():
    """Test health check endpoint"""
    response = requests.get(f"{API_URL}/")
    print_response("Health Check", response)

def test_model_info():
    """Test model info endpoint"""
    response = requests.get(f"{API_URL}/info")
    print_response("Model Info", response)

def test_single_prediction():
    """Test single prediction"""
    test_cases = [
        "The Dark Knight",
        "Toy Story",
        "The Conjuring",
        "Iron Man",
        "The Notebook",
        "Finding Nemo"
    ]
    
    for title in test_cases:
        response = requests.post(
            f"{API_URL}/predict",
            json={"title": title},
            headers={"Content-Type": "application/json"}
        )
        print_response(f"Prediction: '{title}'", response)

def test_batch_prediction():
    """Test batch prediction"""
    titles = [
        "Inception",
        "Toy Story",
        "The Conjuring",
        "Interstellar",
        "Frozen"
    ]
    
    response = requests.post(
        f"{API_URL}/batch-predict",
        json={"titles": titles},
        headers={"Content-Type": "application/json"}
    )
    print_response("Batch Prediction", response)

def test_error_cases():
    """Test error handling"""
    print("\n" + "="*60)
    print("TESTING ERROR CASES")
    print("="*60)
    
    # Empty title
    response = requests.post(
        f"{API_URL}/predict",
        json={"title": ""},
        headers={"Content-Type": "application/json"}
    )
    print_response("Empty Title Error", response)
    
    # Missing title field
    response = requests.post(
        f"{API_URL}/predict",
        json={},
        headers={"Content-Type": "application/json"}
    )
    print_response("Missing Title Field Error", response)
    
    # Invalid endpoint
    response = requests.get(f"{API_URL}/invalid")
    print_response("Invalid Endpoint Error", response)

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🧪 ML API TEST SUITE")
    print("="*60)
    print(f"Testing API at: {API_URL}")
    print("="*60 + "\n")
    
    try:
        # Run all tests
        test_health_check()
        test_model_info()
        test_single_prediction()
        test_batch_prediction()
        test_error_cases()
        
        print("\n✅ All tests completed!\n")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to API")
        print("Make sure the Flask server is running on http://localhost:5000\n")
        print("Start it with: python app.py\n")
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}\n")
