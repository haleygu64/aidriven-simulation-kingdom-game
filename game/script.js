document.addEventListener('DOMContentLoaded', () => {
  const boardSize = 10;
  const numKingdoms = 5;
  const board = document.getElementById('game-board');
  const startButton = document.getElementById('start-button');
  const scoreboard = document.getElementById('scoreboard');
  const scoreList = document.getElementById('score-list');
  const resetButton = document.getElementById('reset-button');
  const timeLimit = 0.5 * 60 * 1000; // 5 minutes in milliseconds
  const expansionThreshold = 200; // Adjust this value as needed

  let gameInterval;
  let timer;

  const generateNamesButton = document.getElementById('generate-names-button');
  let kingdomNames = [];

  function generateRandomName() {
    const prefixes = ['North', 'South', 'East', 'West', 'New', 'Old', 'Great', 'Little'];
    const suffixes = ['land', 'dom', 'nia', 'topia', 'ria', 'burg', 'ville', 'ton'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return randomPrefix + randomSuffix;
  }

  function generateKingdomNames() {
    kingdomNames = [];
    for (let i = 0; i < numKingdoms; i++) {
      let name;
      do {
        name = generateRandomName();
      } while (kingdomNames.includes(name));
      kingdomNames.push(name);
    }
    alert('Kingdom names generated: ' + kingdomNames.join(', '));
  }

  generateNamesButton.addEventListener('click', generateKingdomNames);

  // Initialize kingdoms
  function initializeKingdoms() {
    const kingdoms = [];
    for (let i = 0; i < numKingdoms; i++) {
      const economy = Math.floor(Math.random() * 10) + 1;
      const military = Math.floor(Math.random() * 10) + 1;
      const resources = Math.floor(Math.random() * 100) + 50;
      const warlikeness = Math.floor(Math.random() * 10) + 1;
      kingdoms.push({
        name: kingdomNames[i] || `Kingdom ${i + 1}`,
        mainPosition: Math.floor(Math.random() * boardSize * boardSize),
        territories: [0], // Relative positions to mainPosition
        economy,
        military,
        resources,
        warlikeness,
        troops: economy * 10,
        history: []
      });
    }
    return kingdoms;
  }

  let kingdoms = initializeKingdoms();

  // Place kingdoms on the board
  function updateBoard() {
    board.innerHTML = ''; // Clear existing board
    for (let i = 0; i < boardSize * boardSize; i++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      board.appendChild(cell);
    }

    kingdoms.forEach((kingdom) => {
      kingdom.territories.forEach((relativePos, index) => {
        const position = (kingdom.mainPosition + relativePos + boardSize * boardSize) % (boardSize * boardSize);
        const cell = board.children[position];
        const kingdomElement = document.createElement('div');
        kingdomElement.classList.add('kingdom');

        if (index === 0) {
          // Only display name and stats for the main territory
          kingdomElement.innerHTML = `
                    <span class="kingdom-name">${kingdom.name}</span>
                    <div class="kingdom-overlay">
                        <p>R:${kingdom.resources}</p>
                        <p>E:${kingdom.economy}</p>
                        <p>M:${kingdom.military}</p>
                        <p>W:${kingdom.warlikeness}</p>
                        <p>T:${kingdom.troops}</p>
                    </div>
                `;
        } else {
          kingdomElement.classList.add('extension');
        }

        cell.appendChild(kingdomElement);
      });
    });
  }

  // Calculate combat power
  function calculateCombatPower(kingdom) {
    return kingdom.troops * kingdom.military * (kingdom.warlikeness / 10);
  }

  // Simulate kingdom movement
  function simulateTurn() {
    kingdoms.forEach((kingdom) => {
      // Check for expansion or contraction
      if (kingdom.resources >= expansionThreshold && kingdom.territories.length < 4) {
        expandKingdom(kingdom);
      } else if (kingdom.resources < expansionThreshold && kingdom.territories.length > 1) {
        contractKingdom(kingdom);
      }

      // Move the entire kingdom
      moveKingdom(kingdom);
    });

    // Check for encounters and resolve battles or trade
    for (let i = 0; i < kingdoms.length; i++) {
      for (let j = i + 1; j < kingdoms.length; j++) {
        const k1 = kingdoms[i];
        const k2 = kingdoms[j];

        if (hasOverlap(k1, k2)) {
          // Kingdoms overlap, trigger war
          resolveBattle(k1, k2);
        } else if (areAdjacent(k1, k2)) {
          // Kingdoms are adjacent, trigger trade
          handleTrade(k1, k2);
        }
      }
    }

    updateBoard();
  }

  function expandKingdom(kingdom) {
    const possibleExpansions = [1, -1, boardSize, -boardSize];
    const validExpansions = possibleExpansions.filter(
      (exp) => !kingdom.territories.includes(exp) && isValidPosition(kingdom.mainPosition + exp)
    );

    if (validExpansions.length > 0) {
      const newTerritory = validExpansions[Math.floor(Math.random() * validExpansions.length)];
      kingdom.territories.push(newTerritory);
      logEvent(`E: EXPAND ${kingdom.name} gained new territory`);
    }
  }

  function contractKingdom(kingdom) {
    if (kingdom.territories.length > 1) {
      kingdom.territories.pop();
      logEvent(`E: CONTRACT ${kingdom.name} lost territory`);
    }
  }

  function moveKingdom(kingdom) {
    const moveDirection = Math.floor(Math.random() * 4);
    let newPosition;

    switch (moveDirection) {
      case 0: // Move up
        newPosition = kingdom.mainPosition - boardSize;
        break;
      case 1: // Move down
        newPosition = kingdom.mainPosition + boardSize;
        break;
      case 2: // Move left
        newPosition = kingdom.mainPosition - 1;
        break;
      case 3: // Move right
        newPosition = kingdom.mainPosition + 1;
        break;
    }

    if (isValidPosition(newPosition)) {
      kingdom.mainPosition = newPosition;
    }
  }

  function isValidPosition(position) {
    return position >= 0 && position < boardSize * boardSize;
  }

  function hasOverlap(k1, k2) {
    return k1.territories.some((t1) =>
      k2.territories.some(
        (t2) =>
          (k1.mainPosition + t1 + boardSize * boardSize) % (boardSize * boardSize) ===
          (k2.mainPosition + t2 + boardSize * boardSize) % (boardSize * boardSize)
      )
    );
  }

  function areAdjacent(k1, k2) {
    return k1.territories.some((t1) =>
      k2.territories.some((t2) => {
        const pos1 = (k1.mainPosition + t1 + boardSize * boardSize) % (boardSize * boardSize);
        const pos2 = (k2.mainPosition + t2 + boardSize * boardSize) % (boardSize * boardSize);
        return (
          (Math.abs((pos1 % boardSize) - (pos2 % boardSize)) === 1 && Math.floor(pos1 / boardSize) === Math.floor(pos2 / boardSize)) ||
          (Math.abs(Math.floor(pos1 / boardSize) - Math.floor(pos2 / boardSize)) === 1 && pos1 % boardSize === pos2 % boardSize)
        );
      })
    );
  }

  // Resolve battles between kingdoms
  function resolveBattle(kingdom1, kingdom2) {
    const combatPower1 = calculateCombatPower(kingdom1);
    const combatPower2 = calculateCombatPower(kingdom2);

    let winner, loser;
    if (combatPower1 > combatPower2) {
      winner = kingdom1;
      loser = kingdom2;
    } else {
      winner = kingdom2;
      loser = kingdom1;
    }

    const resourcesLost = Math.floor(loser.resources * 0.1);
    winner.resources += resourcesLost;
    loser.resources -= resourcesLost;

    winner.troops = Math.floor(winner.troops * 0.9);
    loser.troops = Math.floor(loser.troops * 0.9);
    loser.warlikeness += 1;

    // The loser loses a territory if they have more than one
    if (loser.territories.length > 1) {
      loser.territories.pop();
      if (winner.territories.length < 4) {
        winner.territories.push(0); // Add a new territory to the winner's main position
      }
    }

    logEvent(`E: BATTLE ${winner.name} G: ${resourcesLost} ${loser.name} L: ${resourcesLost}`);
  }

  // Handle trade between kingdoms
  function handleTrade(kingdom1, kingdom2) {
    const tradeValue = Math.floor(Math.random() * 20) + 10;
    kingdom1.resources += tradeValue;
    kingdom2.resources += tradeValue;

    logEvent(`E: TRADE ${kingdom1.name} G: ${tradeValue} ${kingdom2.name} G: ${tradeValue}`);
  }

  // Add this function to log events
  function logEvent(event) {
    const eventList = document.getElementById('event-list');
    const eventItem = document.createElement('li');
    // Split the event string into parts
    const parts = event.split(' ');

    // Create the formatted HTML string
    let formattedEvent = `<span class="event-type">${parts[1]}</span> `;
    for (let i = 2; i < parts.length; i++) {
      if (parts[i] === 'G:') {
        const value = parseInt(parts[i + 1]);
        formattedEvent += `<span class="gain">+${value}</span> `;
        i++;
      } else if (parts[i] === 'L:') {
        const value = parseInt(parts[i + 1]);
        formattedEvent += `<span class="loss">-${value}</span> `;
        i++;
      } else {
        formattedEvent += parts[i] + ' ';
      }
    }

    eventItem.innerHTML = formattedEvent;
    eventList.insertBefore(eventItem, eventList.firstChild);

    // Store event in kingdom histories
    const involvedKingdoms = event.split(' ').filter((word) => kingdoms.some((k) => k.name === word));
    involvedKingdoms.forEach((kingdomName) => {
      const kingdom = kingdoms.find((k) => k.name === kingdomName);
      if (kingdom) {
        kingdom.history.push(event);
      }
    });

    // Limit the number of displayed events (e.g., keep only the last 10)
    while (eventList.children.length > 100) {
      eventList.removeChild(eventList.lastChild);
    }
  }

  function testGenerateEpic(kingdom) {
    const epicIntros = [
      `In the annals of ${kingdom.name},`,
      `The saga of ${kingdom.name} unfolds,`,
      `Hear ye, hear ye! The tale of ${kingdom.name},`,
      `From the chronicles of ${kingdom.name},`,
      `In the realm of ${kingdom.name},`
    ];

    const epicMiddles = [
      'a kingdom of great ambition rose.',
      'a land of prosperity and strife emerged.',
      'legends were born and history was forged.',
      'mighty rulers shaped the destiny of their people.',
      'epic battles and prosperous trades defined an era.'
    ];

    const epicConclusions = [
      'Their legacy shall echo through the ages.',
      'May their deeds be remembered for generations to come.',
      'Thus, a new chapter in history was written.',
      'And so, the kingdom marches on towards its destiny.',
      'The future of the realm hangs in the balance.'
    ];

    const intro = epicIntros[Math.floor(Math.random() * epicIntros.length)];
    const middle = epicMiddles[Math.floor(Math.random() * epicMiddles.length)];
    const conclusion = epicConclusions[Math.floor(Math.random() * epicConclusions.length)];

    let epic = `${intro} ${middle} `;

    // Add some specific events from the kingdom's history
    const significantEvents = kingdom.history
      .filter((event) => event.includes('BATTLE') || event.includes('TRADE') || event.includes('EXPAND') || event.includes('CONTRACT'))
      .slice(-3); // Get up to 3 recent significant events

    if (significantEvents.length > 0) {
      epic += 'Throughout their journey, ';
      significantEvents.forEach((event, index) => {
        if (event.includes('BATTLE')) {
          epic += `they fought valiantly in battle`;
        } else if (event.includes('TRADE')) {
          epic += `they engaged in prosperous trade`;
        } else if (event.includes('EXPAND')) {
          epic += `their borders expanded`;
        } else if (event.includes('CONTRACT')) {
          epic += `they faced challenging times`;
        }

        if (index < significantEvents.length - 1) {
          epic += ', ';
        } else {
          epic += '. ';
        }
      });
    }

    epic += conclusion;

    return epic;
  }

  async function generateEpic(kingdom) {
    console.log(kingdom, 'kingdom: ');
    try {
      const response = await fetch('http://api/generate-epic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer `
        },
        body: JSON.stringify(kingdom)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid API token');
        }
        throw new Error('API request failed');
      }

      const data = await response.json();
      return data.epic;
    } catch (error) {
      console.error('Failed to generate epic:', error);
      return `The chronicles of ${kingdom.name} are shrouded in mystery...`;
    }
  }

  async function updateEpics() {
    const epicBoard = document.getElementById('epic-board');
    epicBoard.innerHTML = '<h2>Kingdom Epics</h2>';

    for (const kingdom of kingdoms) {
      const epic = await generateEpic(kingdom);
      const epicElement = document.createElement('div');
      epicElement.classList.add('kingdom-epic');
      epicElement.innerHTML = `<h3>${kingdom.name}</h3><p>${epic}</p>`;
      epicBoard.appendChild(epicElement);
    }
  }

  // Stop the game and display the scoreboard
  async function stopGame() {
    clearInterval(gameInterval);
    clearTimeout(timer);
    document.getElementById('game-container').style.display = 'none';
    displayScoreboard();
    await updateEpics();
  }

  // Display the scoreboard
  function displayScoreboard() {
    // Sort kingdoms by resources in descending order
    kingdoms.sort((a, b) => b.resources - a.resources);

    // Clear the previous score list
    scoreList.innerHTML = '';

    // Populate the score list with sorted kingdoms
    kingdoms.forEach((kingdom) => {
      const listItem = document.createElement('li');
      listItem.textContent = `Kingdom ${kingdom.name}: Resources - ${kingdom.resources}, Warlikeness - ${kingdom.warlikeness}`;
      scoreList.appendChild(listItem);
    });

    // Show the scoreboard
    scoreboard.style.display = 'block';
    document.getElementById('game-container').style.display = 'none';
    startButton.style.display = 'none'; // Hide the start button
    generateNamesButton.style.display = 'none';
  }

  // Reset the game
  async function resetGame() {
    await stopGame(); // Ensure the previous game is fully stopped

    kingdoms = initializeKingdoms();
    updateBoard();
    scoreboard.style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    board.style.display = 'grid'; // Ensure the game board is displayed
    startButton.style.display = 'none';
    document.getElementById('event-list').innerHTML = ''; // Clear previous events
    document.getElementById('epic-board').style.display = 'none';
    gameInterval = setInterval(simulateTurn, 1000);
    timer = setTimeout(() => stopGame(), timeLimit); // Use an arrow function to call stopGame
  }

  // Start the game when the button is clicked
  startButton.addEventListener('click', () => {
    if (kingdomNames.length === 0) {
      alert('Please generate kingdom names first!');
      return;
    }
    document.getElementById('game-container').style.display = 'flex';
    board.style.display = 'grid'; // Ensure the game board is displayed
    startButton.style.display = 'none';
    generateNamesButton.style.display = 'none';
    document.getElementById('event-list').innerHTML = ''; // Clear previous events
    kingdoms = initializeKingdoms(); // Reinitialize kingdoms
    updateBoard();
    gameInterval = setInterval(simulateTurn, 1000);
    timer = setTimeout(stopGame, timeLimit);
  });

  // Reset the game when the reset button is clicked
  resetButton.addEventListener('click', async () => {
    await resetGame();
  });
  // Initial setup
  updateBoard(); // Create the initial board
  document.getElementById('game-container').style.display = 'none'; // Hide the game container initially
  // Ensure the game board and start button are properly displayed
  board.style.display = 'none'; // Hide the game board
  startButton.style.display = 'inline-block'; // Show the start button
});
