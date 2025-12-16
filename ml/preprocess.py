"""
Data Preprocessing Pipeline for Movie Genre Classification
Optimized for memory efficiency and scalability
"""

import pandas as pd
import os
from pathlib import Path

# Configuration
RAW_DATA_PATH = "data/raw/imdb_movies.csv"
PROCESSED_DATA_PATH = "data/processed/movies_clean.csv"
REQUIRED_COLUMNS = ["movie_name", "genre"]  # Updated to match actual CSV columns
SAMPLE_SIZE = 3000
MIN_SAMPLES_PER_GENRE = 50  # Higher threshold since we have fewer genres
RANDOM_STATE = 42


def validate_input_file(file_path):
    """Validate that input file exists and is readable"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"❌ Raw data file not found: {file_path}")
    
    file_size = os.path.getsize(file_path) / (1024 * 1024)  # MB
    print(f"📊 Input file size: {file_size:.2f} MB")
    return True


def load_data(file_path, columns):
    """Load only required columns to optimize memory usage"""
    try:
        # Use usecols to load only needed columns (memory optimization)
        df = pd.read_csv(
            file_path,
            usecols=columns,
            dtype=str,  # Load as strings initially
            na_values=['', 'NA', 'N/A', 'null', 'NULL'],
            low_memory=False
        )
        print(f"✅ Loaded {len(df):,} rows from raw dataset")
        return df
    except Exception as e:
        raise RuntimeError(f"❌ Error loading data: {str(e)}")


def map_genres_to_core(genre):
    """Map genres to 5 core classes for better accuracy"""
    genre = genre.strip().lower()
    
    # Define genre mapping
    genre_map = {
        # Keep as is
        "action": "Action",
        "drama": "Drama", 
        "comedy": "Comedy",
        "animation": "Animation",
        "adventure": "Adventure",
        
        # Merge similar genres
        "biography": "Drama",      # Biography → Drama
        "history": "Drama",        # History → Drama
        "fantasy": "Adventure",    # Fantasy → Adventure
        "crime": "Action",         # Crime → Action
        "thriller": "Action",      # Thriller → Action
        "sci-fi": "Adventure",     # Sci-Fi → Adventure
        "horror": "Action",        # Horror → Action (if present)
    }
    
    return genre_map.get(genre, "Drama")  # Default to Drama if unknown


def clean_data(df):
    """Clean and transform the dataset"""
    initial_count = len(df)
    
    # Remove rows with missing values
    df = df.dropna()
    print(f"🧹 Removed {initial_count - len(df):,} rows with missing values")
    
    # Rename columns for clarity
    df.columns = ["title", "genre"]
    
    # Extract first genre only (handle multiple genres)
    df["genre"] = df["genre"].str.split(",").str[0].str.strip()
    
    # Normalize titles: lowercase and strip whitespace
    df["title"] = df["title"].str.lower().str.strip()
    
    # MAP GENRES TO 5 CORE CLASSES (NEW!)
    print("🔄 Mapping genres to 5 core classes...")
    df["genre"] = df["genre"].apply(map_genres_to_core)
    
    # Remove duplicates
    initial_count = len(df)
    df = df.drop_duplicates(subset=["title"], keep="first")
    print(f"🧹 Removed {initial_count - len(df):,} duplicate titles")
    
    # Remove empty strings after processing
    df = df[(df["title"].str.len() > 0) & (df["genre"].str.len() > 0)]
    
    return df


def sample_data(df, sample_size, random_state):
    """Sample a subset of data if dataset is large"""
    if len(df) > sample_size:
        print(f"📉 Sampling {sample_size:,} records from {len(df):,} total")
        df = df.sample(n=sample_size, random_state=random_state)
    else:
        print(f"ℹ️  Dataset size ({len(df):,}) is smaller than sample size, using all data")
    
    return df


def save_processed_data(df, output_path):
    """Save cleaned dataset to CSV"""
    # Ensure output directory exists
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    # Save with optimization
    df.to_csv(output_path, index=False, encoding='utf-8')
    
    file_size = os.path.getsize(output_path) / 1024  # KB
    print(f"💾 Saved to: {output_path}")
    print(f"📊 Output file size: {file_size:.2f} KB")


def print_summary(df):
    """Print dataset statistics"""
    print("\n" + "="*50)
    print("📊 DATASET SUMMARY")
    print("="*50)
    print(f"Total records: {len(df):,}")
    print(f"Unique titles: {df['title'].nunique():,}")
    print(f"Unique genres: {df['genre'].nunique()}")
    print(f"\nTop 5 genres:")
    print(df['genre'].value_counts().head())
    print("="*50 + "\n")


def main():
    """Main preprocessing pipeline"""
    print("\n🚀 Starting data preprocessing pipeline...\n")
    
    try:
        # Step 1: Validate input
        validate_input_file(RAW_DATA_PATH)
        
        # Step 2: Load data (optimized)
        df = load_data(RAW_DATA_PATH, REQUIRED_COLUMNS)
        
        # Step 3: Clean data
        df = clean_data(df)
        
        # Step 4: Sample data (optional)
        df = sample_data(df, SAMPLE_SIZE, RANDOM_STATE)
        
        # Step 5: Save processed data
        save_processed_data(df, PROCESSED_DATA_PATH)
        
        # Step 6: Print summary
        print_summary(df)
        
        print("✅ Dataset preprocessed & saved successfully!\n")
        
    except Exception as e:
        print(f"\n❌ Preprocessing failed: {str(e)}\n")
        raise


if __name__ == "__main__":
    main()
