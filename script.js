/**
 * MystIQ - Advanced Interactive Quiz Platform
 * Features: Real-time questions, multiple themes, advanced scoring, analytics
 */



class MystIQ {
  constructor() {
    this.currentQuestion = 0;
    this.score = 0;
    this.questions = [];
    this.userAnswers = [];
    this.selectedTopics = [];
    this.settings = {
      difficulty: 'medium',
      questionCount: 10,
      timeLimit: 30
    };
    this.timer = null;
    this.timeRemaining = 0;
    this.startTime = null;
    this.endTime = null;
    this.hints = [];
    this.currentTheme = 'cyberpunk';

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadSavedSettings();
    this.showScreen('welcome');
    this.initializeThemes();
    this.createThemeSelector();
  }

  bindEvents() {
    // Navigation events
    document.getElementById('startQuiz').addEventListener('click', () => this.startQuiz());
    document.getElementById('nextBtn').addEventListener('click', () => this.nextQuestion());
    document.getElementById('hintBtn').addEventListener('click', () => this.showHint());
    document.getElementById('playAgainBtn').addEventListener('click', () => this.restartQuiz());
    document.getElementById('reviewBtn').addEventListener('click', () => this.showReview());
    document.getElementById('closeReview').addEventListener('click', () => this.hideReview());
    document.getElementById('themeToggle').addEventListener('click', () => this.toggleThemeSelector());
    document.getElementById('statsBtn').addEventListener('click', () => this.showStats());

    // Topic selection
    document.querySelectorAll('.topic-card').forEach(card => {
      card.addEventListener('click', () => this.toggleTopic(card));
    });

    // Settings
    document.getElementById('difficulty').addEventListener('change', (e) => {
      this.settings.difficulty = e.target.value;
    });
    document.getElementById('questionCount').addEventListener('change', (e) => {
      this.settings.questionCount = parseInt(e.target.value);
    });
    document.getElementById('timeLimit').addEventListener('change', (e) => {
      this.settings.timeLimit = parseInt(e.target.value);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Auto-save on page unload
    window.addEventListener('beforeunload', () => this.saveProgress());
  }

  handleKeyboard(e) {
    if (this.getCurrentScreen() === 'quiz') {
      if (e.key >= '1' && e.key <= '4') {
        const index = parseInt(e.key) - 1;
        const answers = document.querySelectorAll('.answer-option');
        if (answers[index]) {
          this.selectAnswer(index, answers[index]);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        const nextBtn = document.getElementById('nextBtn');
        if (!nextBtn.disabled) {
          this.nextQuestion();
        }
      } else if (e.key === 'h' || e.key === 'H') {
        this.showHint();
      }
    }
  }

  getCurrentScreen() {
    const screens = ['welcome', 'quiz', 'results', 'review', 'settings']; // Added 'settings' screen
    const visibleScreen = screens.find(screen =>
      document.getElementById(screen + 'Screen').style.display !== 'none'
    );
    return visibleScreen || 'welcome';
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.style.display = 'none';
    });
    document.getElementById(screenId + 'Screen').style.display = 'flex'; // Use 'flex' for layouts
  }

  loadSavedSettings() {
    const saved = localStorage.getItem('mystiq-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.settings = { ...this.settings, ...parsed.settings };
      this.selectedTopics = parsed.selectedTopics || [];
      this.currentTheme = parsed.currentTheme || this.currentTheme;
      this.updateSettingsUI();
      this.updateSelectedTopicsUI();
      this.applyTheme(this.currentTheme);
    }
  }

  updateSettingsUI() {
    document.getElementById('difficulty').value = this.settings.difficulty;
    document.getElementById('questionCount').value = this.settings.questionCount;
    document.getElementById('timeLimit').value = this.settings.timeLimit;
  }

  updateSelectedTopicsUI() {
    document.querySelectorAll('.topic-card').forEach(card => {
      const topic = card.dataset.topic;
      if (this.selectedTopics.includes(topic)) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
    this.updateStartButton();
  }

  saveProgress() {
    const progress = {
      settings: this.settings,
      selectedTopics: this.selectedTopics,
      currentTheme: this.currentTheme
    };
    localStorage.setItem('mystiq-settings', JSON.stringify(progress));
  }

  initializeThemes() {
    const saved = localStorage.getItem('mystiq-theme');
    if (saved) {
      this.currentTheme = saved;
      this.applyTheme(this.currentTheme);
    }
  }

  createThemeSelector() {
    const themeSelector = document.createElement('div');
    themeSelector.className = 'theme-selector';
    themeSelector.innerHTML = `
      <div class="theme-option" data-theme="cyberpunk" title="Cyberpunk"></div>
      <div class="theme-option" data-theme="forest" title="Forest"></div>
      <div class="theme-option" data-theme="ocean" title="Ocean"></div>
      <div class="theme-option" data-theme="sunset" title="Sunset"></div>
      <div class="theme-option" data-theme="cosmic" title="Cosmic"></div>
    `;

    document.body.appendChild(themeSelector);

    themeSelector.querySelectorAll('.theme-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const theme = e.target.dataset.theme;
        this.applyTheme(theme);
        this.currentTheme = theme;
        localStorage.setItem('mystiq-theme', theme);
        this.updateActiveTheme();
      });
    });

    this.updateActiveTheme();
  }

  updateActiveTheme() {
    document.querySelectorAll('.theme-option').forEach(option => {
      option.classList.toggle('active', option.dataset.theme === this.currentTheme);
    });
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggleThemeSelector() {
    const selector = document.querySelector('.theme-selector');
    selector.classList.toggle('active');
  }

  toggleTopic(card) {
    const topic = card.dataset.topic;
    const index = this.selectedTopics.indexOf(topic);

    if (index === -1) {
      this.selectedTopics.push(topic);
      card.classList.add('selected');
    } else {
      this.selectedTopics.splice(index, 1);
      card.classList.remove('selected');
    }

    this.updateStartButton();
  }

  updateStartButton() {
    const startBtn = document.getElementById('startQuiz');
    startBtn.disabled = this.selectedTopics.length === 0;
    startBtn.textContent = this.selectedTopics.length === 0 ? 'Select at least one topic' : 'Start Quiz';
  }

  async startQuiz() {
    if (this.selectedTopics.length === 0) {
      this.showNotification('Please select at least one topic', 'warning');
      return;
    }

    this.showLoading('Preparing your quiz...');

    try {
      await this.loadQuestions();
      this.hideLoading();
      this.initializeQuiz();
      this.showScreen('quiz');
      window.location.href = '#quizScreen'; // Navigate to quiz screen
    } catch (error) {
      this.hideLoading();
      this.showNotification('Failed to load questions. Please try again.', 'error');
      console.error('Quiz loading error:', error);
    }
  }

  async loadQuestions() {
    // Simulate API call with fallback questions
    const fallbackQuestions = this.generateFallbackQuestions();

    try {
      // Try to fetch from Open Trivia Database
      const questions = await this.fetchTriviaQuestions();
      this.questions = questions.length > 0 ? questions : fallbackQuestions;
    } catch (error) {
      console.warn('Failed to fetch online questions, using fallback');
      this.questions = fallbackQuestions;
    }

    // Shuffle questions
    this.questions = this.shuffleArray(this.questions).slice(0, this.settings.questionCount);
  }

  async fetchTriviaQuestions() {
    const categoryMap = {
      'general': [9, 17, 22, 23],
      'science': [17, 18, 19],
      'technology': [18, 30],
      'history': [23],
      'sports': [21],
      'entertainment': [11, 12, 13, 14, 15, 16]
    };

    const questions = [];

    for (const topic of this.selectedTopics) {
      const categories = categoryMap[topic] || [9];
      const category = categories[Math.floor(Math.random() * categories.length)];

      const difficultyMap = { easy: 'easy', medium: 'medium', hard: 'hard' };
      const difficulty = difficultyMap[this.settings.difficulty];

      const url = `https://opentdb.com/api.php?amount=${Math.ceil(this.settings.questionCount / this.selectedTopics.length)}&category=${category}&difficulty=${difficulty}&type=multiple`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.results) {
          questions.push(...data.results.map(q => ({
            question: this.decodeHTML(q.question),
            answers: this.shuffleArray([...q.incorrect_answers, q.correct_answer]).map(a => this.decodeHTML(a)),
            correct: this.decodeHTML(q.correct_answer),
            topic: topic,
            difficulty: q.difficulty,
            explanation: this.generateExplanation(q.category, this.decodeHTML(q.correct_answer))
          })));
        }
      } catch (error) {
        console.warn(`Failed to fetch questions for ${topic}:`, error);
      }
    }

    return questions;
  }

  decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  generateExplanation(category, answer) {
    const explanations = {
      'General Knowledge': `The correct answer is "${answer}". This is a well-established fact in general knowledge.`,
      'Science': `"${answer}" is the correct answer based on scientific principles and research.`,
      'Technology': `"${answer}" is the accurate answer according to current technology standards.`,
      'History': `"${answer}" is historically documented and verified through historical records.`,
      'Sports': `"${answer}" is the correct answer based on official sports records and statistics.`,
      'Entertainment': `"${answer}" is the right answer according to entertainment industry records.`
    };

    return explanations[category] || `The correct answer is "${answer}".`;
  }

  generateFallbackQuestions() {
    const questionBank = {
      general: [
        {
          question: "What is the capital of France?",
          answers: ["Paris", "London", "Berlin", "Madrid"],
          correct: "Paris",
          explanation: "Paris has been the capital of France since 987 AD and is the country's largest city."
        },
        {
          question: "Which planet is known as the Red Planet?",
          answers: ["Mars", "Venus", "Jupiter", "Saturn"],
          correct: "Mars",
          explanation: "Mars is called the Red Planet due to iron oxide (rust) on its surface, giving it a reddish appearance."
        },
        {
          question: "What is the largest mammal in the world?",
          answers: ["Blue Whale", "Elephant", "Giraffe", "Hippopotamus"],
          correct: "Blue Whale",
          explanation: "Blue whales can grow up to 100 feet long and weigh up to 200 tons, making them the largest animals ever known to have lived on Earth."
        },
        {
          question: "How many continents are there?",
          answers: ["7", "6", "5", "8"],
          correct: "7",
          explanation: "There are seven continents: Asia, Africa, North America, South America, Antarctica, Europe, and Australia/Oceania."
        },
        {
          question: "What is the smallest country in the world?",
          answers: ["Vatican City", "Monaco", "San Marino", "Liechtenstein"],
          correct: "Vatican City",
          explanation: "Vatican City is the smallest country in the world with an area of just 0.17 square miles (0.44 square kilometers)."
        }
      ],
      science: [
        {
          question: "What is the chemical symbol for gold?",
          answers: ["Au", "Ag", "Fe", "Cu"],
          correct: "Au",
          explanation: "Au comes from the Latin word 'aurum', meaning gold. It's element 79 on the periodic table."
        },
        {
          question: "How many chambers does a human heart have?",
          answers: ["4", "3", "2", "5"],
          correct: "4",
          explanation: "The human heart has four chambers: two atria (upper chambers) and two ventricles (lower chambers)."
        },
        {
          question: "What is the fastest land animal?",
          answers: ["Cheetah", "Lion", "Leopard", "Gazelle"],
          correct: "Cheetah",
          explanation: "Cheetahs can reach speeds of up to 70 mph (112 km/h) in short bursts."
        },
        {
          question: "What gas do plants absorb from the atmosphere?",
          answers: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"],
          correct: "Carbon dioxide",
          explanation: "Plants absorb carbon dioxide from the atmosphere during photosynthesis to produce glucose and oxygen."
        }
      ],
      technology: [
        {
          question: "What does 'HTTP' stand for?",
          answers: ["HyperText Transfer Protocol", "High Tech Transfer Protocol", "Home Tool Transfer Protocol", "Hyperlink Text Transfer Protocol"],
          correct: "HyperText Transfer Protocol",
          explanation: "HTTP is the foundation of data communication on the World Wide Web, defining how messages are formatted and transmitted."
        },
        {
          question: "Which company developed the first iPhone?",
          answers: ["Apple", "Samsung", "Google", "Microsoft"],
          correct: "Apple",
          explanation: "Apple introduced the first iPhone on January 9, 2007, revolutionizing the smartphone industry."
        },
        {
          question: "What does 'AI' stand for?",
          answers: ["Artificial Intelligence", "Automated Intelligence", "Advanced Intelligence", "Algorithmic Intelligence"],
          correct: "Artificial Intelligence",
          explanation: "AI refers to the simulation of human intelligence in machines that are programmed to think and learn."
        },
        {
          question: "What is the most popular programming language in 2024?",
          answers: ["Python", "JavaScript", "Java", "C++"],
          correct: "Python",
          explanation: "Python has become the most popular programming language due to its simplicity and versatility in various fields."
        }
      ],
      history: [
        {
          question: "In which year did World War II end?",
          answers: ["1945", "1944", "1946", "1943"],
          correct: "1945",
          explanation: "World War II ended in 1945 with the surrender of Japan on September 2, following the atomic bombings of Hiroshima and Nagasaki."
        },
        {
          question: "Who was the first person to walk on the moon?",
          answers: ["Neil Armstrong", "Buzz Aldrin", "John Glenn", "Alan Shepard"],
          correct: "Neil Armstrong",
          explanation: "Neil Armstrong was the first person to walk on the moon on July 20, 1969, during the Apollo 11 mission."
        },
        {
          question: "Which ancient wonder of the world still exists today?",
          answers: ["Great Pyramid of Giza", "Hanging Gardens of Babylon", "Colossus of Rhodes", "Lighthouse of Alexandria"],
          correct: "Great Pyramid of Giza",
          explanation: "The Great Pyramid of Giza is the only ancient wonder of the world that still exists today, built around 2580-2560 BCE."
        }
      ],
      sports: [
        {
          question: "How many players are on a basketball team on the court at one time?",
          answers: ["5", "6", "7", "4"],
          correct: "5",
          explanation: "A basketball team has 5 players on the court: point guard, shooting guard, small forward, power forward, and center."
        },
        {
          question: "Which sport is known as 'The Beautiful Game'?",
          answers: ["Soccer/Football", "Basketball", "Tennis", "Cricket"],
          correct: "Soccer/Football",
          explanation: "Soccer (or football) is often called 'The Beautiful Game' due to its flowing, artistic nature and global popularity."
        },
        {
          question: "How often are the Summer Olympics held?",
          answers: ["Every 4 years", "Every 2 years", "Every 6 years", "Every 8 years"],
          correct: "Every 4 years",
          explanation: "The Summer Olympics are held every four years, with the most recent being Tokyo 2020 (held in 2021) and Paris 2024."
        }
      ],
      entertainment: [
        {
          question: "Which movie won the Academy Award for Best Picture in 2020?",
          answers: ["Parasite", "1917", "Joker", "Once Upon a Time in Hollywood"],
          correct: "Parasite",
          explanation: "Parasite made history as the first non-English language film to win Best Picture at the Academy Awards."
        },
        {
          question: "Who directed the movie 'Inception'?",
          answers: ["Christopher Nolan", "Steven Spielberg", "Martin Scorsese", "Quentin Tarantino"],
          correct: "Christopher Nolan",
          explanation: "Christopher Nolan directed Inception (2010), a science fiction thriller about dream manipulation."
        },
        {
          question: "Which streaming service produced 'Stranger Things'?",
          answers: ["Netflix", "Disney+", "Amazon Prime", "HBO Max"],
          correct: "Netflix",
          explanation: "Stranger Things is a Netflix original series that premiered in 2016 and became one of the platform's most popular shows."
        }
      ]
    };

    let questions = [];

    for (const topic of this.selectedTopics) {
      if (questionBank[topic]) {
        questions.push(...questionBank[topic].map(q => ({
          ...q,
          topic: topic,
          difficulty: this.settings.difficulty
        })));
      }
    }

    // If no topics selected or no questions found, use general knowledge
    if (questions.length === 0) {
      questions = questionBank.general.map(q => ({
        ...q,
        topic: 'general',
        difficulty: this.settings.difficulty
      }));
    }

    return questions;
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  initializeQuiz() {
    this.currentQuestion = 0;
    this.score = 0;
    this.userAnswers = [];
    this.startTime = new Date();
    this.displayQuestion();
    this.updateProgress();
    this.updateScore();

    if (this.settings.timeLimit > 0) {
      document.getElementById('timerContainer').style.display = 'block'; // Ensure timer is visible
      this.startTimer();
    } else {
      document.getElementById('timerContainer').style.display = 'none';
    }
  }

  displayQuestion() {
    const question = this.questions[this.currentQuestion];
    const questionText = document.getElementById('questionText');
    const questionNumber = document.getElementById('questionNumber');
    const answersContainer = document.getElementById('answersContainer');
    const nextBtn = document.getElementById('nextBtn');

    questionNumber.textContent = `Question ${this.currentQuestion + 1}`;
    questionText.textContent = question.question;

    // Clear previous answers
    answersContainer.innerHTML = '';

    // Create answer options
    question.answers.forEach((answer, index) => {
      const answerDiv = document.createElement('div');
      answerDiv.className = 'answer-option';
      answerDiv.textContent = answer;
      answerDiv.addEventListener('click', () => this.selectAnswer(index, answerDiv));
      answersContainer.appendChild(answerDiv);
    });

    nextBtn.disabled = true;
    nextBtn.textContent = this.currentQuestion === this.questions.length - 1 ? 'Finish Quiz' : 'Next Question →';

    // Reset timer if enabled
    if (this.settings.timeLimit > 0) {
      this.resetTimer();
    }
  }

  selectAnswer(index, element) {
    // Remove previous selections
    document.querySelectorAll('.answer-option').forEach(option => {
      option.classList.remove('selected');
      option.classList.remove('correct'); // Clear feedback from previous question
      option.classList.remove('incorrect'); // Clear feedback from previous question
    });

    // Select current answer
    element.classList.add('selected');

    // Store answer
    this.userAnswers[this.currentQuestion] = {
      selected: index,
      text: element.textContent,
      correct: this.questions[this.currentQuestion].correct === element.textContent
    };

    // Enable next button
    document.getElementById('nextBtn').disabled = false;

    // Auto-advance after selection (optional, only if time limit is not enforced for individual questions)
    // If you want to auto-advance, remove or adjust the nextQuestion call from timer
    // if (this.settings.timeLimit === 0) { // Only auto-advance if no overall time limit or per-question time limit
    //   setTimeout(() => {
    //     if (!document.getElementById('nextBtn').disabled) {
    //       this.nextQuestion();
    //     }
    //   }, 1000);
    // }
  }

  nextQuestion() {
    // Stop timer
    if (this.timer) {
      clearInterval(this.timer);
    }

    // Check if answer was selected (or if time ran out)
    if (!this.userAnswers[this.currentQuestion]) {
      this.userAnswers[this.currentQuestion] = {
        selected: -1,
        text: 'No answer',
        correct: false
      };
    }

    // Apply feedback immediately after selection/timeout before moving
    this.showFeedback(this.userAnswers[this.currentQuestion].correct ? 'correct' : 'incorrect');

    // Update score
    if (this.userAnswers[this.currentQuestion].correct) {
      this.score++;
    }

    this.updateScore();

    // Move to next question or finish after a short delay for feedback to be seen
    setTimeout(() => {
      if (this.currentQuestion < this.questions.length - 1) {
        this.currentQuestion++;
        this.updateProgress();
        this.displayQuestion();
      } else {
        this.endQuiz();
      }
    }, 1000); // 1-second delay to show feedback
  }

  showFeedback(type) {
    const question = this.questions[this.currentQuestion];
    const answers = document.querySelectorAll('.answer-option');

    answers.forEach(answer => {
      if (answer.textContent === question.correct) {
        answer.classList.add('correct');
      } else if (answer.classList.contains('selected') && type === 'incorrect') {
        answer.classList.add('incorrect');
      }
    });

    // Show notification
    if (type === 'correct') {
      this.showNotification('Correct! Well done!', 'success');
    } else {
      this.showNotification(`Incorrect. The answer was: ${question.correct}`, 'error');
    }
  }

  showHint() {
    const question = this.questions[this.currentQuestion];
    const hints = [
      `This question is about ${question.topic}.`,
      `The difficulty level is ${question.difficulty}.`,
      `Think about what you know regarding this topic.`,
      `Consider eliminating obviously wrong answers first.`
    ];

    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    this.showNotification(`💡 Hint: ${randomHint}`, 'info');
  }

  startTimer() {
    // Clear any existing timer before starting a new one
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.timeRemaining = this.settings.timeLimit;
    this.updateTimer();

    this.timer = setInterval(() => {
      // Decrement and clamp at 0 to avoid negatives
      this.timeRemaining = Math.max(0, this.timeRemaining - 1);
      this.updateTimer();

      if (this.timeRemaining <= 0) {
        // Ensure the interval stops before moving on
        clearInterval(this.timer);
        this.timer = null;
        this.nextQuestion(); // Auto-advance on time out
      }
    }, 1000);
  }

  resetTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.timeRemaining = this.settings.timeLimit; // Reset time for the new question
    this.updateTimer();
    this.startTimer();
  }

  updateTimer() {
    const timerElement = document.getElementById('timeLeft');
    const timerContainer = document.getElementById('timerContainer');

    // Never display negative values
    timerElement.textContent = Math.max(0, this.timeRemaining);

    // Visual feedback for time running out
    if (this.timeRemaining <= 5) {
      timerContainer.classList.add('danger');
      timerContainer.classList.remove('warning');
    } else if (this.timeRemaining <= 10) {
      timerContainer.classList.add('warning');
      timerContainer.classList.remove('danger');
    } else {
      timerContainer.classList.remove('warning', 'danger');
    }
  }

  updateProgress() {
    const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${this.currentQuestion + 1} / ${this.questions.length}`;
  }

  updateScore() {
    document.getElementById('currentScore').textContent = this.score;
  }

  endQuiz() {
    this.endTime = new Date();
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.showResults();
    this.showScreen('results');
    window.location.href = '#resultsScreen'; // Navigate to results screen
  }

  showResults() {
    const totalQuestions = this.questions.length;
    const correctAnswers = this.score;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const timeTaken = Math.round((this.endTime - this.startTime) / 1000);

    // Update result elements
    document.getElementById('finalScore').textContent = correctAnswers;
    document.getElementById('totalQuestions').textContent = `/ ${totalQuestions}`;
    document.getElementById('scorePercentage').textContent = `${percentage}%`;
    document.getElementById('correctAnswers').textContent = correctAnswers;
    document.getElementById('incorrectAnswers').textContent = incorrectAnswers;
    document.getElementById('totalTime').textContent = `${timeTaken}s`;

    // Update trophy and message based on performance
    const trophyIcon = document.getElementById('trophyIcon');
    const subtitle = document.getElementById('resultsSubtitle');

    if (percentage >= 90) {
      trophyIcon.textContent = '🏆';
      subtitle.textContent = 'Outstanding! You\'re a true quiz master!';
    } else if (percentage >= 70) {
      trophyIcon.textContent = '🥈';
      subtitle.textContent = 'Great job! You really know your stuff!';
    } else if (percentage >= 50) {
      trophyIcon.textContent = '🥉';
      subtitle.textContent = 'Good effort! Keep learning and improving!';
    } else {
      trophyIcon.textContent = '📚';
      subtitle.textContent = 'Don\'t worry, practice makes perfect!';
    }

    // Save stats
    this.saveStats({
      score: correctAnswers,
      total: totalQuestions,
      percentage: percentage,
      timeTaken: timeTaken,
      topics: this.selectedTopics,
      difficulty: this.settings.difficulty,
      date: new Date().toISOString()
    });
  }

  saveStats(stats) {
    const savedStats = JSON.parse(localStorage.getItem('mystiq-stats') || '[]');
    savedStats.push(stats);

    // Keep only last 50 results
    if (savedStats.length > 50) {
      savedStats.splice(0, savedStats.length - 50);
    }

    localStorage.setItem('mystiq-stats', JSON.stringify(savedStats));
  }

  showStats() {
    const stats = JSON.parse(localStorage.getItem('mystiq-stats') || '[]');

    if (stats.length === 0) {
      this.showNotification('No statistics available yet. Complete a quiz first!', 'info');
      return;
    }

    const avgScore = stats.reduce((sum, stat) => sum + stat.percentage, 0) / stats.length;
    const totalQuizzes = stats.length;
    const bestScore = Math.max(...stats.map(s => s.percentage));

    const statsContent = `
      <div class="stats-modal" id="statsContent">
        <h3>Your Quiz Statistics</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">${totalQuizzes}</span>
            <span class="stat-label">Quizzes Taken</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${Math.round(avgScore)}%</span>
            <span class="stat-label">Average Score</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${bestScore}%</span>
            <span class="stat-label">Best Score</span>
          </div>
        </div>
        <h3 class="recentScoreText">Recent Scores</h3>
        <div class="recent-scores">
          ${stats.slice(-5).reverse().map(stat => `
            <div class="recent-score">
            <div class="recent-score-info">
              <span class="percentage-info">${stat.percentage}%</span>
              <span class="topic-info">${stat.topics.join(', ').toUpperCase()}</span>
              <span class="date-info">${new Date(stat.date).toLocaleDateString()}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.showModal('Statistics', statsContent);
    window.location.href = '#statsContent'; // Ensure focus is on top
  }

  showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  showReview() {
    const reviewContent = document.getElementById('reviewContent');
    reviewContent.innerHTML = '';

    this.questions.forEach((question, index) => {
      const userAnswer = this.userAnswers[index];
      const isCorrect = userAnswer && userAnswer.correct;
      const selectedAnswerText = userAnswer ? userAnswer.text : 'No answer selected';

      const reviewItem = document.createElement('div');
      reviewItem.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;
      reviewItem.innerHTML = `
        <div class="review-question">
          <h3>Question ${index + 1}: ${question.question}</h3>
        </div>
        <div class="review-answers">
          <p>Your Answer: <span class="${isCorrect ? 'correct-text' : 'incorrect-text'}">${selectedAnswerText}</span></p>
          <p>Correct Answer: <span class="correct-text">${question.correct}</span></p>
        </div>
        <div class="review-explanation">
          <p><strong>Explanation:</strong> ${question.explanation}</p>
        </div>
      `;
      reviewContent.appendChild(reviewItem);
    });
    this.showScreen('review');
  }

  hideReview() {
    this.showScreen('results');
  }

  restartQuiz() {
    this.selectedTopics = []; // Clear selected topics
    this.updateSelectedTopicsUI(); // Update UI to reflect cleared topics
    this.showScreen('welcome');
    window.location.href = '#welcomeScreen'; // Reload to reset quiz to play from start
  }

  showLoading(message) {
    let loadingScreen = document.getElementById('loadingScreen');
    if (!loadingScreen) {
      loadingScreen = document.createElement('div');
      loadingScreen.id = 'loadingScreen';
      loadingScreen.className = 'loading-overlay';
      loadingScreen.innerHTML = `
        <div class="loading-content">
          <div class="spinner"></div>
          <p id="loadingMessage">${message}</p>
        </div>
      `;
      document.body.appendChild(loadingScreen);
    } else {
      document.getElementById('loadingMessage').textContent = message;
      loadingScreen.style.display = 'flex';
    }
  }

  hideLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
  }

  showNotification(message, type = 'info') {
    let notification = document.getElementById('notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'notification';
      document.body.appendChild(notification);
    }
    notification.className = `notification ${type} show`;
    notification.textContent = message;

    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000); // Notification disappears after 3 seconds
  }
}

// Initialize the quiz when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  new MystIQ();
});