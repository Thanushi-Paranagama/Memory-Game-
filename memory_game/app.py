# Memory Card Game - Full Stack Application
# Project Structure

'''
memory_game/
│
├── app.py                 # Flask application
├── requirements.txt       # Dependencies
├── static/
│   ├── css/
│   │   └── style.css      # CSS for styling
│   ├── js/
│   │   └── game.js        # JavaScript for game logic
│   └── images/            # Directory for card images
└── templates/
    └── index.html         # Main game page
'''

# app.py - Flask Backend
from flask import Flask, render_template, request, jsonify
import random
import os
import json
import time
from datetime import datetime

app = Flask(__name__)

# Set up the leaderboard data storage
LEADERBOARD_FILE = "leaderboard.json"

def get_leaderboard():
    if os.path.exists(LEADERBOARD_FILE):
        with open(LEADERBOARD_FILE, 'r') as f:
            return json.load(f)
    return []

def save_leaderboard(leaderboard):
    with open(LEADERBOARD_FILE, 'w') as f:
        json.dump(leaderboard, f)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/cards', methods=['GET'])
def get_cards():
    # Game difficulty settings
    difficulty = request.args.get('difficulty', 'medium')
    
    difficulty_settings = {
        'easy': {'pairs': 6, 'time': 60},
        'medium': {'pairs': 8, 'time': 90},
        'hard': {'pairs': 12, 'time': 120}
    }
    
    settings = difficulty_settings.get(difficulty, difficulty_settings['medium'])
    
    # Generate card pairs
    card_types = [
        "diamond", "heart", "club", "spade", "star", "moon", 
        "sun", "cloud", "tree", "flower", "key", "crown"
    ]
    
    selected_cards = random.sample(card_types, settings['pairs'])
    cards = []
    
    for i, card_type in enumerate(selected_cards):
        # Create pairs
        cards.append({
            "id": i * 2,
            "type": card_type,
            "flipped": False,
            "matched": False
        })
        cards.append({
            "id": i * 2 + 1,
            "type": card_type,
            "flipped": False,
            "matched": False
        })
    
    # Shuffle cards
    random.shuffle(cards)
    
    return jsonify({
        "cards": cards,
        "gameTime": settings['time']
    })

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard_api():
    return jsonify(get_leaderboard())

@app.route('/api/leaderboard', methods=['POST'])
def add_score():
    data = request.json
    
    if not data or 'name' not in data or 'score' not in data or 'difficulty' not in data:
        return jsonify({"error": "Invalid data"}), 400
    
    leaderboard = get_leaderboard()
    
    new_entry = {
        "name": data['name'],
        "score": data['score'],
        "difficulty": data['difficulty'],
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    leaderboard.append(new_entry)
    # Sort by score (higher is better)
    leaderboard.sort(key=lambda x: x['score'], reverse=True)
    # Keep only top 10
    leaderboard = leaderboard[:10]
    
    save_leaderboard(leaderboard)
    
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True)