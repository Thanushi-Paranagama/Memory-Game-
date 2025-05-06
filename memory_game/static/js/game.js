document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const gameBoard = document.getElementById('game-board');
    const startButton = document.getElementById('start-game');
    const restartButton = document.getElementById('restart-game');
    const difficultySelect = document.getElementById('difficulty');
    const timerDisplay = document.getElementById('timer');
    const movesDisplay = document.getElementById('moves');
    const scoreDisplay = document.getElementById('score');
    const modal = document.getElementById('game-end-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const finalScoreDisplay = document.getElementById('final-score');
    const playerNameInput = document.getElementById('player-name');
    const submitScoreButton = document.getElementById('submit-score');
    const playAgainButton = document.getElementById('play-again');

    // Game state
    let cards = [];
    let gameActive = false;
    let timerInterval = null;
    let timeRemaining = 0;
    let moves = 0;
    let score = 0;
    let flippedCards = [];
    let matchedPairs = 0;
    let totalPairs = 0;
    let currentDifficulty = 'medium';
    
    // Card symbols for different card types
    const cardSymbols = {
        "diamond": "♦",
        "heart": "♥",
        "club": "♣",
        "spade": "♠",
        "star": "★",
        "moon": "☾",
        "sun": "☀",
        "cloud": "☁",
        "tree": "🌲",
        "flower": "✿",
        "key": "🗝",
        "crown": "👑"
    };

    // Card colors for different card types
    const cardColors = {
        "diamond": "#e74c3c",
        "heart": "#e74c3c",
        "club": "#2c3e50",
        "spade": "#2c3e50",
        "star": "#f39c12",
        "moon": "#9b59b6",
        "sun": "#f1c40f",
        "cloud": "#3498db",
        "tree": "#27ae60",
        "flower": "#e84393",
        "key": "#d35400",
        "crown": "#f1c40f"
    };

    // Event Listeners
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    submitScoreButton.addEventListener('click', submitScore);
    playAgainButton.addEventListener('click', closeModal);

    // Initialize the leaderboard
    loadLeaderboard();

    // Function to start the game
    function startGame() {
        gameActive = true;
        startButton.disabled = true;
        restartButton.disabled = false;
        
        // Clear the game board
        gameBoard.innerHTML = '';
        flippedCards = [];
        matchedPairs = 0;
        moves = 0;
        score = 0;
        
        // Update displays
        movesDisplay.textContent = moves;
        scoreDisplay.textContent = score;
        
        // Get the selected difficulty
        currentDifficulty = difficultySelect.value;
        
        // Fetch cards from server
        fetchCards(currentDifficulty);
    }

    // Function to restart the game
    function restartGame() {
        clearInterval(timerInterval);
        startGame();
    }

    // Function to fetch cards from the server
    function fetchCards(difficulty) {
        fetch(`/api/cards?difficulty=${difficulty}`)
            .then(response => response.json())
            .then(data => {
                cards = data.cards;
                totalPairs = cards.length / 2;
                timeRemaining = data.gameTime;
                
                // Render the cards
                renderCards();
                
                // Start the timer
                startTimer();
            })
            .catch(error => {
                console.error('Error fetching cards:', error);
                gameBoard.innerHTML = '<div class="error">Failed to load game. Please try again.</div>';
            });
    }

    // Function to render the cards on the game board
    function renderCards() {
        gameBoard.innerHTML = '';
        
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.dataset.id = card.id;
            
            // Create card front (shows symbol)
            const cardFront = document.createElement('div');
            cardFront.className = 'card-face card-front';
            cardFront.textContent = cardSymbols[card.type] || card.type;
            cardFront.style.color = cardColors[card.type] || '#000';
            
            // Create card back
            const cardBack = document.createElement('div');
            cardBack.className = 'card-face card-back';
            cardBack.textContent = '?';
            
            // Add faces to card
            cardElement.appendChild(cardFront);
            cardElement.appendChild(cardBack);
            
            // Add click event
            cardElement.addEventListener('click', () => flipCard(cardElement, card));
            
            // Add card to game board
            gameBoard.appendChild(cardElement);
        });
        
        // Set appropriate grid columns based on difficulty
        const pairsCount = totalPairs;
        if (pairsCount <= 6) {
            gameBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
        } else if (pairsCount <= 8) {
            gameBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
        } else {
            gameBoard.style.gridTemplateColumns = 'repeat(6, 1fr)';
        }
    }

    // Function to start the timer
    function startTimer() {
        clearInterval(timerInterval);
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();
            
            if (timeRemaining <= 0) {
                endGame(false);
            }
        }, 1000);
    }

    // Function to update the timer display
    function updateTimerDisplay() {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Function to handle card flipping
    function flipCard(cardElement, card) {
        // Ignore if:
        // - Game is not active
        // - Card is already flipped or matched
        // - Already have 2 cards flipped
        if (!gameActive || card.flipped || card.matched || flippedCards.length >= 2) {
            return;
        }
        
        // Flip the card
        card.flipped = true;
        cardElement.classList.add('flipped');
        flippedCards.push({ element: cardElement, card: card });
        
        // Check for match if we have 2 cards flipped
        if (flippedCards.length === 2) {
            moves++;
            movesDisplay.textContent = moves;
            
            // Check for match
            setTimeout(checkForMatch, 500);
        }
    }

    // Function to check if flipped cards match
    function checkForMatch() {
        const card1 = flippedCards[0];
        const card2 = flippedCards[1];
        
        if (card1.card.type === card2.card.type) {
            // Cards match
            card1.card.matched = true;
            card2.card.matched = true;
            card1.element.classList.add('matched');
            card2.element.classList.add('matched');
            
            // Update score based on quickness and difficulty
            const basePoints = 10;
            const difficultyMultiplier = {
                'easy': 1,
                'medium': 1.5,
                'hard': 2
            };
            const timeBonus = Math.max(1, Math.floor(timeRemaining / 10));
            
            const pointsEarned = Math.floor(
                basePoints * difficultyMultiplier[currentDifficulty] * timeBonus
            );
            
            score += pointsEarned;
            scoreDisplay.textContent = score;
            
            // Flash the score to indicate points earned
            scoreDisplay.classList.add('score-flash');
            setTimeout(() => {
                scoreDisplay.classList.remove('score-flash');
            }, 500);
            
            matchedPairs++;
            
            // Check if all pairs are matched
            if (matchedPairs === totalPairs) {
                endGame(true);
            }
        } else {
            // Cards don't match, flip them back
            card1.card.flipped = false;
            card2.card.flipped = false;
            card1.element.classList.add('wrong');
            card2.element.classList.add('wrong');
            
            setTimeout(() => {
                card1.element.classList.remove('flipped', 'wrong');
                card2.element.classList.remove('flipped', 'wrong');
            }, 1000);
        }
        
        // Clear flipped cards array
        flippedCards = [];
    }

    // Function to end the game
    function endGame(isWin) {
        clearInterval(timerInterval);
        gameActive = false;
        
        // Calculate final score with time bonus for win
        let finalScore = score;
        if (isWin) {
            const timeBonus = timeRemaining * 2;
            finalScore += timeBonus;
        }
        
        // Update score display
        scoreDisplay.textContent = finalScore;
        finalScoreDisplay.textContent = finalScore;
        
        // Set modal content
        if (isWin) {
            modalTitle.textContent = 'Congratulations!';
            modalMessage.textContent = `You won with a score of ${finalScore}!`;
        } else {
            modalTitle.textContent = 'Game Over';
            modalMessage.textContent = `Time's up! Your final score is ${finalScore}.`;
        }
        
        // Show modal
        modal.classList.add('active');
    }

    // Function to close the modal
    function closeModal() {
        modal.classList.remove('active');
        restartGame();
    }

    // Function to submit score to leaderboard
    function submitScore() {
        const playerName = playerNameInput.value.trim();
        if (!playerName) {
            alert('Please enter your name!');
            return;
        }
        
        const scoreData = {
            name: playerName,
            score: parseInt(finalScoreDisplay.textContent),
            difficulty: currentDifficulty
        };
        
        fetch('/api/leaderboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scoreData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadLeaderboard();
                closeModal();
            } else {
                alert('Failed to submit score. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error submitting score:', error);
            alert('Failed to submit score. Please try again.');
        });
    }

    // Function to load the leaderboard
    function loadLeaderboard() {
        fetch('/api/leaderboard')
            .then(response => response.json())
            .then(data => {
                renderLeaderboard(data);
            })
            .catch(error => {
                console.error('Error loading leaderboard:', error);
            });
    }

    // Function to render the leaderboard
    function renderLeaderboard(leaderboardData) {
        const leaderboardBody = document.querySelector('#leaderboard tbody');
        leaderboardBody.innerHTML = '';
        
        if (leaderboardData.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 5;
            cell.textContent = 'No scores yet. Be the first!';
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            leaderboardBody.appendChild(row);
            return;
        }
        
        leaderboardData.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            const rankCell = document.createElement('td');
            rankCell.textContent = index + 1;
            
            const nameCell = document.createElement('td');
            nameCell.textContent = entry.name;
            
            const scoreCell = document.createElement('td');
            scoreCell.textContent = entry.score;
            
            const difficultyCell = document.createElement('td');
            difficultyCell.textContent = entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1);
            
            const dateCell = document.createElement('td');
            dateCell.textContent = entry.date;
            
            row.appendChild(rankCell);
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            row.appendChild(difficultyCell);
            row.appendChild(dateCell);
            
            leaderboardBody.appendChild(row);
        });
    }
});