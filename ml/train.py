"""
Movie Genre Classification Model Training Pipeline
Optimized for performance, scalability, and interview readiness
"""

import pandas as pd
import joblib
import os
from pathlib import Path
import time

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, 
    classification_report, 
    confusion_matrix,
    f1_score
)

# ===================================
# CONFIGURATION
# ===================================
PROCESSED_DATA_PATH = "data/processed/movies_clean.csv"
MODEL_OUTPUT_PATH = "model/genre_model.pkl"
VECTORIZER_OUTPUT_PATH = "model/tfidf_vectorizer.pkl"

# Model Hyperparameters
TEST_SIZE = 0.2
RANDOM_STATE = 42
TFIDF_MAX_FEATURES = 8000  # Increased for better feature coverage
TFIDF_NGRAM_RANGE = (1, 2)
MODEL_MAX_ITER = 1000
CV_FOLDS = 5  # Cross-validation folds

# Minimum samples per genre (for quality filtering)
MIN_SAMPLES_PER_GENRE = 20


# ===================================
# UTILITY FUNCTIONS
# ===================================
def validate_data_file(file_path):
    """Validate that processed data exists and is readable"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"❌ Processed data not found: {file_path}")
    
    file_size = os.path.getsize(file_path) / 1024  # KB
    print(f"📊 Dataset file size: {file_size:.2f} KB")
    return True


def load_and_validate_data(file_path):
    """Load dataset and perform validation checks"""
    print("\n📥 Loading processed dataset...")
    
    try:
        df = pd.read_csv(file_path)
        
        # Validate required columns
        required_cols = ["title", "genre"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns: {missing_cols}")
        
        # Remove any null values
        initial_count = len(df)
        df = df.dropna(subset=["title", "genre"])
        if len(df) < initial_count:
            print(f"⚠️  Removed {initial_count - len(df)} rows with missing values")
        
        # Remove empty strings
        df = df[(df["title"].str.len() > 0) & (df["genre"].str.len() > 0)]
        
        print(f"✅ Loaded {len(df):,} samples")
        return df
        
    except Exception as e:
        raise RuntimeError(f"❌ Error loading data: {str(e)}")


def filter_rare_genres(df, min_samples):
    """Remove genres with too few samples for reliable training"""
    genre_counts = df["genre"].value_counts()
    valid_genres = genre_counts[genre_counts >= min_samples].index
    
    initial_count = len(df)
    df = df[df["genre"].isin(valid_genres)]
    
    removed = initial_count - len(df)
    if removed > 0:
        print(f"🧹 Filtered out {removed} samples from rare genres (< {min_samples} samples)")
    
    return df


def print_dataset_stats(X, y):
    """Print comprehensive dataset statistics"""
    print("\n" + "="*60)
    print("📊 DATASET STATISTICS")
    print("="*60)
    print(f"Total samples: {len(X):,}")
    print(f"Unique genres: {y.nunique()}")
    print(f"Average title length: {X.str.len().mean():.1f} characters")
    print(f"\nGenre distribution:")
    print(y.value_counts().to_string())
    print("="*60)


def create_features(X_train, X_test, vectorizer_params):
    """Create TF-IDF features from text data"""
    print("\n🔧 Creating TF-IDF features...")
    
    start_time = time.time()
    
    vectorizer = TfidfVectorizer(**vectorizer_params)
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    elapsed = time.time() - start_time
    
    print(f"✅ Vectorization complete in {elapsed:.2f}s")
    print(f"   Feature matrix shape: {X_train_vec.shape}")
    print(f"   Vocabulary size: {len(vectorizer.vocabulary_):,}")
    
    return X_train_vec, X_test_vec, vectorizer


def train_model(X_train, y_train, model_params):
    """Train the classification model"""
    print("\n🚀 Training model...")
    
    start_time = time.time()
    
    model = LogisticRegression(**model_params)
    model.fit(X_train, y_train)
    
    elapsed = time.time() - start_time
    
    print(f"✅ Training complete in {elapsed:.2f}s")
    print(f"   Model coefficients shape: {model.coef_.shape}")
    
    return model


def evaluate_model(model, X_train, X_test, y_train, y_test):
    """Comprehensive model evaluation"""
    print("\n📈 EVALUATING MODEL PERFORMANCE")
    print("="*60)
    
    # Training accuracy
    train_pred = model.predict(X_train)
    train_accuracy = accuracy_score(y_train, train_pred)
    print(f"Training Accuracy: {train_accuracy * 100:.2f}%")
    
    # Test accuracy
    test_pred = model.predict(X_test)
    test_accuracy = accuracy_score(y_test, test_pred)
    print(f"Test Accuracy: {test_accuracy * 100:.2f}%")
    
    # F1 Score (weighted average)
    f1 = f1_score(y_test, test_pred, average='weighted')
    print(f"F1 Score (weighted): {f1:.4f}")
    
    # Check for overfitting
    overfit_diff = train_accuracy - test_accuracy
    if overfit_diff > 0.1:
        print(f"⚠️  WARNING: Potential overfitting detected (diff: {overfit_diff*100:.2f}%)")
    
    # Detailed classification report
    print("\n📋 Classification Report:")
    print("-" * 60)
    print(classification_report(y_test, test_pred, zero_division=0))
    
    return test_accuracy, f1, test_pred


def perform_cross_validation(model, X_train, y_train, cv_folds):
    """Perform k-fold cross-validation for robustness check"""
    print(f"\n🔄 Running {cv_folds}-fold cross-validation...")
    
    start_time = time.time()
    cv_scores = cross_val_score(model, X_train, y_train, cv=cv_folds)
    elapsed = time.time() - start_time
    
    print(f"✅ Cross-validation complete in {elapsed:.2f}s")
    print(f"   CV Scores: {[f'{score:.4f}' for score in cv_scores]}")
    print(f"   Mean CV Accuracy: {cv_scores.mean() * 100:.2f}% (±{cv_scores.std() * 100:.2f}%)")
    
    return cv_scores


def save_artifacts(model, vectorizer, model_path, vectorizer_path):
    """Save trained model and vectorizer to disk"""
    print("\n💾 Saving model artifacts...")
    
    # Ensure output directory exists
    Path(model_path).parent.mkdir(parents=True, exist_ok=True)
    
    # Save with compression
    joblib.dump(model, model_path, compress=3)
    joblib.dump(vectorizer, vectorizer_path, compress=3)
    
    model_size = os.path.getsize(model_path) / 1024  # KB
    vec_size = os.path.getsize(vectorizer_path) / 1024  # KB
    
    print(f"✅ Model saved: {model_path} ({model_size:.2f} KB)")
    print(f"✅ Vectorizer saved: {vectorizer_path} ({vec_size:.2f} KB)")


def print_training_summary(accuracy, f1, cv_scores):
    """Print final training summary"""
    print("\n" + "="*60)
    print("🎯 TRAINING SUMMARY")
    print("="*60)
    print(f"✅ Test Accuracy: {accuracy * 100:.2f}%")
    print(f"✅ F1 Score: {f1:.4f}")
    print(f"✅ CV Mean Accuracy: {cv_scores.mean() * 100:.2f}%")
    print("="*60)
    print("\n🎉 Model training completed successfully!\n")


# ===================================
# MAIN TRAINING PIPELINE
# ===================================
def main():
    """Main training pipeline orchestrator"""
    print("\n" + "="*60)
    print("🚀 MOVIE GENRE CLASSIFICATION - TRAINING PIPELINE")
    print("="*60)
    
    try:
        # Step 1: Validate and load data
        validate_data_file(PROCESSED_DATA_PATH)
        df = load_and_validate_data(PROCESSED_DATA_PATH)
        
        # Step 2: Filter rare genres
        df = filter_rare_genres(df, MIN_SAMPLES_PER_GENRE)
        
        # Step 3: Prepare features and labels
        X = df["title"]
        y = df["genre"]
        print_dataset_stats(X, y)
        
        # Step 4: Split data
        print(f"\n✂️  Splitting data (test size: {TEST_SIZE * 100}%)...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=TEST_SIZE, 
            random_state=RANDOM_STATE, 
            stratify=y
        )
        print(f"   Training samples: {len(X_train):,}")
        print(f"   Test samples: {len(X_test):,}")
        
        # Step 5: Create TF-IDF features
        vectorizer_params = {
            "ngram_range": TFIDF_NGRAM_RANGE,
            "stop_words": "english",
            "max_features": TFIDF_MAX_FEATURES,
            "min_df": 2,  # Ignore terms that appear in fewer than 2 documents
            "sublinear_tf": True  # Apply sublinear tf scaling (1 + log(tf))
        }
        X_train_vec, X_test_vec, vectorizer = create_features(
            X_train, X_test, vectorizer_params
        )
        
        # Step 6: Train model
        model_params = {
            "max_iter": MODEL_MAX_ITER,
            "random_state": RANDOM_STATE,
            "solver": "lbfgs",  # Good for multiclass problems (auto-handles multiclass)
            "class_weight": "balanced"  # Handle imbalanced genres - CRITICAL for accuracy!
        }
        model = train_model(X_train_vec, y_train, model_params)
        
        # Step 7: Cross-validation
        cv_scores = perform_cross_validation(model, X_train_vec, y_train, CV_FOLDS)
        
        # Step 8: Evaluate on test set
        accuracy, f1, predictions = evaluate_model(
            model, X_train_vec, X_test_vec, y_train, y_test
        )
        
        # Step 9: Save model artifacts
        save_artifacts(model, vectorizer, MODEL_OUTPUT_PATH, VECTORIZER_OUTPUT_PATH)
        
        # Step 10: Print summary
        print_training_summary(accuracy, f1, cv_scores)
        
    except Exception as e:
        print(f"\n❌ Training failed: {str(e)}\n")
        raise


if __name__ == "__main__":
    main()
    
    # ===================================
    # QUICK TEST - Sample Predictions
    # ===================================
    print("\n" + "="*60)
    print("🧪 TESTING MODEL WITH SAMPLE PREDICTIONS")
    print("="*60)
    
    # Load saved model and vectorizer
    model = joblib.load(MODEL_OUTPUT_PATH)
    vectorizer = joblib.load(VECTORIZER_OUTPUT_PATH)
    
    # Test samples
    sample_titles = ["the conjuring", "iron man", "toy story"]
    sample_vec = vectorizer.transform(sample_titles)
    predictions = model.predict(sample_vec)
    
    print("\nSample Predictions:")
    for title, genre in zip(sample_titles, predictions):
        print(f"  '{title}' → {genre}")
    
    print("\n✅ Model test complete!")
    print("="*60 + "\n")
