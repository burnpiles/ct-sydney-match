class GameEngine {
    constructor() {
        this.board = [];
        this.selectedTile = null;
        this.foundCompanies = new Set();
        this.score = 0;
        this.isAnimating = false;
        this.boardSize = 8;
        this.moveCount = 0; // Add move counter
        this.companies = ['apple', 'tesla', 'netflix', 'starbucks', 'nike', 'spotify', 'amazon', 'openai'];
        this.companyEmojis = {
            'apple': '🍎',
            'tesla': '🚙',
            'netflix': '🎬',
            'starbucks': '☕️',
            'nike': '👟',
            'spotify': '🎵',
            'amazon': '📦',
            'openai': '🤖'
        };
        this.animations = {
            'apple': { text: "Sydney takes a selfie with her iPhone!", scene: '📱' },
            'tesla': { text: "Sydney poses next to a Tesla Model S!", scene: '🚙' },
            'netflix': { text: "Sydney binges her favorite show!", scene: '📺' },
            'starbucks': { text: "Sydney sips her signature latte!", scene: '☕' },
            'nike': { text: "Sydney shows off her new Nikes!", scene: '👟' },
            'spotify': { text: "Sydney creates the perfect playlist!", scene: '🎵' },
            'amazon': { text: "Sydney's Amazon haul goes viral!", scene: '📦' },
            'openai': { text: "Sydney chats with AI about the future!", scene: '🤖' }
        };
        
        this.listeners = new Map();
        
        // Track match counts for each company
        this.matchCounts = {
            'apple': 0,
            'tesla': 0,
            'netflix': 0,
            'starbucks': 0,
            'nike': 0,
            'spotify': 0,
            'amazon': 0,
            'openai': 0
        };

        // Highlighting state
        this.highlightedCompany = null;

        // Cache DOM elements
        this.domCache = new Map();
        this.cacheDOMElements();
        
        // Set up highlighting event listeners
        this.setupHighlightingListeners();
    }

    cacheDOMElements() {
        const elements = [
            'sydneyGif', 'animationText', 'animationBanner', 
            'bannerEmoji', 'bannerEmoji2', 'bannerCompany',
            'sydneyGifMobile', 'animationTextMobile', 'animationBannerMobile',
            'bannerEmojiMobile', 'bannerEmoji2Mobile', 'bannerCompanyMobile',
            'gameBoard', 'total-matches', 'apple-count', 'tesla-count', 'netflix-count',
            'starbucks-count', 'amazon-count', 'openai-count', 'nike-count', 'spotify-count'
        ];
        elements.forEach(id => {
            this.domCache.set(id, document.getElementById(id));
        });
    }

    // Event system for loose coupling
    addEventListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        if (!this.listeners.has(event)) {
            return;
        }
        
        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
            try {
                this.listeners.get(event).forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`Error in event listener for ${event}:`, error);
                    }
                });
            } catch (error) {
                console.error(`Error emitting event ${event}:`, error);
            }
        });
    }

    // Initialize game board
    initGame() {
        this.board = [];
        this.selectedTile = null;
        this.foundCompanies.clear();
        this.score = 0;
        this.isAnimating = false;
        this.moveCount = 0; // Reset move counter
        
        // Reset match counts
        Object.keys(this.matchCounts).forEach(company => {
            this.matchCounts[company] = 0;
        });

        // Reset highlighting state
        this.highlightedCompany = null;
        this.removeTileHighlighting();
        
        // Remove highlighting from all counter items
        const counterItems = document.querySelectorAll('.match-counter-item');
        counterItems.forEach(item => {
            item.classList.remove('highlighted');
        });

        // Emit event to update UI with reset match counts
        this.emit('matchCountsUpdated', { matchCounts: { ...this.matchCounts } });

        // Create a board with NO initial matches
        this.createBoardWithoutMatches();
        
        // Final verification - ensure no matches exist
        const finalVerification = this.findMatches();
        const totalFinalMatches = finalVerification.matches.length + finalVerification.specialMatches.length;
        if (totalFinalMatches > 0) {
            console.error('=== GAME ENGINE: Board still has matches after creation! Forcing simple pattern ===');
            this.createSimpleAlternatingBoard();
        }
        
        console.log('=== GAME ENGINE: Game initialized with move count:', this.moveCount, '===');
        this.emit('gameInitialized', this.board);
        
        return this.board;
    }

    // Create a board guaranteed to have no matches
    createBoardWithoutMatches() {
        console.log('=== GAME ENGINE: Creating board without matches ===');
        
        // Try random board generation first (most fun)
        this.createCheckerboardBoard();
        
        // Verify no matches exist
        const finalMatches = this.findMatches();
        const totalFinalMatches = finalMatches.matches.length + finalMatches.specialMatches.length;
        if (totalFinalMatches === 0) {
            console.log('=== GAME ENGINE: Random board created successfully with no matches ===');
            return;
        }
        
        // If random failed, try safe pattern
        console.log('=== GAME ENGINE: Random failed, trying safe pattern ===');
        this.createSafePatternBoard();
        
        // Final verification
        const finalMatches2 = this.findMatches();
        const totalFinalMatches2 = finalMatches2.matches.length + finalMatches2.specialMatches.length;
        if (totalFinalMatches2 === 0) {
            console.log('=== GAME ENGINE: Safe pattern board created successfully with no matches ===');
            return;
        }
        
        // If both failed, use simple alternating as last resort
        console.log('=== GAME ENGINE: All patterns failed, using simple alternating as last resort ===');
        this.createSimpleAlternatingBoard();
        
        // Final verification
        const finalMatches3 = this.findMatches();
        const totalFinalMatches3 = finalMatches3.matches.length + finalMatches3.specialMatches.length;
        if (totalFinalMatches3 === 0) {
            console.log('=== GAME ENGINE: Simple alternating board created successfully with no matches ===');
        } else {
            console.error('=== GAME ENGINE: Failed to create board without matches! ===');
        }
    }
    
    // Fix any matches in the current board by replacing problematic tiles
    fixMatchesInBoard() {
        let fixed = true;
        let iterations = 0;
        const maxIterations = 20;
        
        while (fixed && iterations < maxIterations) {
            fixed = false;
            iterations++;
            
            const matchData = this.findMatches();
            const totalMatches = matchData.matches.length + matchData.specialMatches.length;
            if (totalMatches === 0) break;
            
            // For each match, replace one of the tiles with a different company
            matchData.matches.forEach(match => {
                const matchCompany = this.board[match[0]];
                const availableCompanies = this.companies.filter(c => c !== matchCompany);
                
                if (availableCompanies.length > 0) {
                    const newCompany = availableCompanies[Math.floor(Math.random() * availableCompanies.length)];
                    this.board[match[0]] = newCompany;
                    fixed = true;
                }
            });
            
            // Also fix special matches
            matchData.specialMatches.forEach(special => {
                const matchCompany = this.board[special.indices[0]];
                const availableCompanies = this.companies.filter(c => c !== matchCompany);
                
                if (availableCompanies.length > 0) {
                    const newCompany = availableCompanies[Math.floor(Math.random() * availableCompanies.length)];
                    this.board[special.indices[0]] = newCompany;
                    fixed = true;
                }
            });
        }
    }
    
    // Create a simple alternating pattern that guarantees no matches
    createAlternatingBoard() {
        this.board = [];
        const companies = [...this.companies];
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                // Use a pattern that prevents both horizontal and vertical matches
                const index = (row * 2 + col * 3) % companies.length;
                this.board.push(companies[index]);
            }
        }
        
        // Final verification
        const matchData = this.findMatches();
        const totalMatches = matchData.matches.length + matchData.specialMatches.length;
        if (totalMatches > 0) {
            console.log('=== GAME ENGINE: Alternating pattern still has matches, using random with verification ===');
            this.createRandomBoardWithVerification();
        } else {
            console.log('=== GAME ENGINE: Alternating board created successfully ===');
        }
    }
    
    // Create a random board and verify no matches
    createRandomBoardWithVerification() {
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            attempts++;
            this.board = [];
            
            // Fill with random companies
            for (let i = 0; i < this.boardSize * this.boardSize; i++) {
                const company = this.companies[Math.floor(Math.random() * this.companies.length)];
                this.board.push(company);
            }
            
            // Check for matches
            const matchData = this.findMatches();
            const totalMatches = matchData.matches.length + matchData.specialMatches.length;
            if (totalMatches === 0) {
                console.log(`=== GAME ENGINE: Random board created successfully after ${attempts} attempts ===`);
                return;
            }
            
        } while (attempts < maxAttempts);
        
        // If we still can't create a match-free board, use a simple checkerboard pattern
        console.log('=== GAME ENGINE: Using checkerboard pattern as final fallback ===');
        this.createCheckerboardBoard();
    }
    
    // Create a checkerboard pattern that guarantees no matches
    createCheckerboardBoard() {
        this.board = [];
        const companies = [...this.companies];
        
        // Create a random board with no initial matches
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            this.board = [];
            
            // Fill the board randomly
            for (let i = 0; i < this.boardSize * this.boardSize; i++) {
                const randomCompany = companies[Math.floor(Math.random() * companies.length)];
                this.board.push(randomCompany);
            }
            
            // Check for matches
            const matchData = this.findMatches();
            attempts++;
            
            const totalMatches = matchData.matches.length + matchData.specialMatches.length;
            if (totalMatches === 0) {
                console.log('=== GAME ENGINE: Random board created successfully (no initial matches) ===');
                return;
            }
            
        } while (attempts < maxAttempts);
        
        // If we couldn't create a random board without matches, fall back to a safe pattern
        console.log('=== GAME ENGINE: Could not create random board without matches, using safe pattern ===');
        this.createSafePatternBoard();
    }
    
    // Create a safe pattern that guarantees no matches but allows for possible moves
    createSafePatternBoard() {
        this.board = [];
        const companies = [...this.companies];
        
        // Create a pattern that alternates between different companies in a way that prevents matches
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                // Use a more complex pattern that still allows for possible matches through moves
                const patternIndex = (row * 2 + col * 3 + (row * col) % 2) % companies.length;
                this.board.push(companies[patternIndex]);
            }
        }
        
        console.log('=== GAME ENGINE: Safe pattern board created ===');
    }
    
    // Create a simple alternating pattern using only 2 companies as last resort
    createSimpleAlternatingBoard() {
        this.board = [];
        const company1 = this.companies[0]; // apple
        const company2 = this.companies[1]; // tesla
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                // Simple alternating pattern: apple, tesla, apple, tesla...
                const index = (row + col) % 2;
                this.board.push(index === 0 ? company1 : company2);
            }
        }
        
        console.log('=== GAME ENGINE: Simple alternating board created as last resort ===');
    }

    // Handle tile selection with Candy Crush mechanics
    selectTile(index) {
        // Enhanced safety check: if we're stuck in animation state, force reset
        if (this.isAnimating && !this.pendingGravityIndices && !this.isProcessingQueue) {
            console.log('=== GAME ENGINE: Detected stuck animation state, forcing reset ===');
            this.forceResetAnimationState();
        }
        
        if (this.isAnimating) {
            console.log('=== GAME ENGINE: Game is animating, rejecting tile selection ===');
            return false;
        }
        
        // Validate input
        if (typeof index !== 'number' || index < 0 || index >= this.board.length) {
            console.error('Invalid tile index:', index);
            return false;
        }

        // If no tile is selected, select this one
        if (this.selectedTile === null) {
            this.selectedTile = index;
            this.emit('tileSelected', index);
            return true;
        }
        
        // If clicking the same tile, deselect it
        if (this.selectedTile === index) {
            this.selectedTile = null;
            this.emit('tileDeselected', index);
            return true;
        }
        
        // If clicking a different tile, check if it's adjacent
        if (this.isAdjacent(this.selectedTile, index)) {
            // Valid move - attempt the swap
            this.attemptSwap(this.selectedTile, index);
            return true;
        } else {
            // Invalid move - show error and deselect both
            this.handleInvalidMove(this.selectedTile, index);
            return false;
        }
    }

    // Handle swipe gestures
    handleSwipe(fromIndex, toIndex) {
        console.log('GameEngine.handleSwipe called:', fromIndex, '->', toIndex, 'isAnimating:', this.isAnimating);
        
        if (this.isAnimating) {
            console.log('Game is animating, rejecting swipe');
            return false;
        }
        
        // Check if swipe is to an adjacent tile
        if (this.isAdjacent(fromIndex, toIndex)) {
            console.log('Swipe is adjacent, attempting swap');
            this.attemptSwap(fromIndex, toIndex);
            return true;
        } else {
            console.log('Swipe is not adjacent, showing error');
            // Invalid swipe - show error
            this.handleInvalidMove(fromIndex, toIndex);
            return false;
        }
    }

    // Attempt to swap tiles and validate the move
    attemptSwap(index1, index2) {
        console.log('GameEngine.attemptSwap called:', index1, '->', index2);
        
        // Temporarily swap the tiles
        const temp = this.board[index1];
        this.board[index1] = this.board[index2];
        this.board[index2] = temp;
        
        console.log('Tiles swapped in board, checking for matches');
        
        // Check if this creates any matches
        const matchData = this.findMatches();
        const totalMatches = matchData.matches.length + matchData.specialMatches.length;
        console.log('Matches found:', totalMatches);
        
        if (totalMatches > 0) {
            console.log('Valid move - proceeding with swap');
            // Valid move - proceed with the swap
            this.moveCount++; // Increment move counter
            console.log(`=== GAME ENGINE: Move ${this.moveCount} completed ===`);
            
            this.emit('validSwap', { index1, index2, board: [...this.board] });
            
            // Clear selection state immediately after valid swap
            this.selectedTile = null;
            this.emit('tilesDeselected', [index1, index2]);
            

            
            // Process matches after a short delay to allow visual update
            setTimeout(() => {
                this.processMatches(matchData);
            }, 100);
        } else {
            console.log('Invalid move - reverting swap');
            // Invalid move - revert the swap and show error
            this.board[index2] = this.board[index1];
            this.board[index1] = temp;
            this.handleInvalidMove(index1, index2);
        }
    }

    // Handle invalid moves with visual feedback
    handleInvalidMove(index1, index2) {
        this.emit('invalidMove', { index1, index2 });
        this.selectedTile = null;
        
        // Auto-deselect after showing error
        setTimeout(() => {
            this.emit('tilesDeselected', [index1, index2]);
        }, 800);
    }

    // Check if two tiles are adjacent
    isAdjacent(index1, index2) {
        const row1 = Math.floor(index1 / this.boardSize);
        const col1 = index1 % this.boardSize;
        const row2 = Math.floor(index2 / this.boardSize);
        const col2 = index2 % this.boardSize;
        
        return (Math.abs(row1 - row2) === 1 && col1 === col2) ||
               (Math.abs(col1 - col2) === 1 && row1 === row2);
    }

    // Find all matches in the current board (optimized for performance)
    findMatches() {
        const matches = [];
        const specialMatches = [];
        const boardSize = this.boardSize;
        const board = this.board;
        
        // Check horizontal matches (3, 4, 5+ tiles)
        for (let row = 0; row < boardSize; row++) {
            let col = 0;
            while (col < boardSize - 2) {
                const index = row * boardSize + col;
                const tile = board[index];
                
                if (tile === null) {
                    col++;
                    continue;
                }
                
                // Find consecutive matches
                let matchLength = 1;
                let matchIndices = [index];
                
                // Check right
                for (let i = 1; col + i < boardSize && board[index + i] === tile; i++) {
                    matchLength++;
                    matchIndices.push(index + i);
                }
                
                // Check left
                for (let i = 1; col - i >= 0 && board[index - i] === tile; i++) {
                    matchLength++;
                    matchIndices.unshift(index - i);
                }
                
                // Add match if 3 or more
                if (matchLength >= 3) {
                    if (matchLength >= 5) {
                        specialMatches.push({ type: 'line-clear', indices: matchIndices, direction: 'horizontal' });
                    } else {
                        matches.push(matchIndices);
                    }
                    // Skip the matched tiles in next iteration
                    col += matchLength;
                } else {
                    col++;
                }
            }
        }
        
        // Check vertical matches (3, 4, 5+ tiles)
        for (let col = 0; col < boardSize; col++) {
            let row = 0;
            while (row < boardSize - 2) {
                const index = row * boardSize + col;
                const tile = board[index];
                
                if (tile === null) {
                    row++;
                    continue;
                }
                
                // Find consecutive matches
                let matchLength = 1;
                let matchIndices = [index];
                
                // Check down
                for (let i = 1; row + i < boardSize && board[index + i * boardSize] === tile; i++) {
                    matchLength++;
                    matchIndices.push(index + i * boardSize);
                }
                
                // Check up
                for (let i = 1; row - i >= 0 && board[index - i * boardSize] === tile; i++) {
                    matchLength++;
                    matchIndices.unshift(index - i * boardSize);
                }
                
                // Add match if 3 or more
                if (matchLength >= 3) {
                    if (matchLength >= 5) {
                        specialMatches.push({ type: 'line-clear', indices: matchIndices, direction: 'vertical' });
                    } else {
                        matches.push(matchIndices);
                    }
                    // Skip the matched tiles in next iteration
                    row += matchLength;
                } else {
                    row++;
                }
            }
        }
        
        // Check for L and T shapes (special combinations) - simplified for performance
        this.findLAndTMatches(matches, specialMatches);
        
        return { matches, specialMatches };
    }
    
    // Find L and T shaped matches
    findLAndTMatches(matches, specialMatches) {
        // Check for L shapes (3 horizontal + 3 vertical with shared corner)
        for (let row = 0; row < this.boardSize - 2; row++) {
            for (let col = 0; col < this.boardSize - 2; col++) {
                const centerIndex = row * this.boardSize + col;
                const tile = this.board[centerIndex];
                
                if (tile === null) continue;
                
                // Check if this could be an L or T shape
                const horizontalMatch = this.checkHorizontalMatch(row, col, tile);
                const verticalMatch = this.checkVerticalMatch(row, col, tile);
                
                if (horizontalMatch && verticalMatch) {
                    const allIndices = [...new Set([...horizontalMatch, ...verticalMatch])];
                    if (allIndices.length >= 5) {
                        specialMatches.push({ type: 'color-bomb', indices: allIndices });
                    }
                }
            }
        }
    }
    
    // Helper method to check horizontal match from a point
    checkHorizontalMatch(row, col, tile) {
        const indices = [];
        for (let i = col; i < this.boardSize; i++) {
            const index = row * this.boardSize + i;
            if (this.board[index] === tile) {
                indices.push(index);
            } else {
                break;
            }
        }
        for (let i = col - 1; i >= 0; i--) {
            const index = row * this.boardSize + i;
            if (this.board[index] === tile) {
                indices.unshift(index);
            } else {
                break;
            }
        }
        return indices.length >= 3 ? indices : null;
    }
    
    // Helper method to check vertical match from a point
    checkVerticalMatch(row, col, tile) {
        const indices = [];
        for (let i = row; i < this.boardSize; i++) {
            const index = i * this.boardSize + col;
            if (this.board[index] === tile) {
                indices.push(index);
            } else {
                break;
            }
        }
        for (let i = row - 1; i >= 0; i--) {
            const index = i * this.boardSize + col;
            if (this.board[index] === tile) {
                indices.unshift(index);
            } else {
                break;
            }
        }
        return indices.length >= 3 ? indices : null;
    }

    // Process found matches with proper animation sequence (improved for standard match-3)
    processMatches(matchData) {
        console.log('=== GAME ENGINE: processMatches called ===');
        
        // Prevent processing matches on move 0
        if (this.moveCount === 0) {
            console.log('=== GAME ENGINE: Skipping match processing on move 0 ===');
            return;
        }
        
        // Always clear company highlight after a match
        this.removeCompanyHighlight();
        
        const { matches, specialMatches } = matchData;
        const matchedCompanies = new Set();
        const matchedIndices = new Set();
        const specialTiles = [];
        // NEW: Map of tileIndex -> company
        const matchedTileToCompany = {};
        
        // Store the mapping for use in updateTileStates
        this.matchedTileToCompany = matchedTileToCompany;
        
        // Process regular matches
        matches.forEach(match => {
            match.forEach(index => {
                matchedCompanies.add(this.board[index]);
                matchedIndices.add(index);
                matchedTileToCompany[index] = this.board[index];
            });
        });
        
        // Process special matches
        specialMatches.forEach(special => {
            console.log(`=== GAME ENGINE: Processing special match type: ${special.type} with ${special.indices.length} indices ===`);
            console.log(`=== GAME ENGINE: Special match indices:`, special.indices);
            special.indices.forEach(index => {
                if (this.board[index] !== null) {
                    matchedCompanies.add(this.board[index]);
                    matchedIndices.add(index);
                    matchedTileToCompany[index] = this.board[index];
                    console.log(`=== GAME ENGINE: Added special match index ${index} with company ${this.board[index]} ===`);
                } else {
                    console.warn(`=== GAME ENGINE: Warning - special match index ${index} is null ===`);
                }
            });
            specialTiles.push(special);
        });
        
        // Calculate score based on match types
        let scoreIncrease = 0;
        matches.forEach(match => {
            scoreIncrease += match.length * 10; // 10 points per tile
        });
        
        specialMatches.forEach(special => {
            if (special.type === 'line-clear') {
                scoreIncrease += special.indices.length * 50; // 50 points per line-clear tile
            } else if (special.type === 'color-bomb') {
                scoreIncrease += special.indices.length * 100; // 100 points per color bomb tile
            }
        });
        
        // Track match counts and update score - FIXED: Only count each company once per match
        const newCompanies = [];
        matchedCompanies.forEach(company => {
            // Only increment match count if this company wasn't already found
            if (!this.foundCompanies.has(company)) {
                this.foundCompanies.add(company);
                this.score++;
                newCompanies.push(company);
                console.log(`=== GAME ENGINE: New company found: ${company}, score: ${this.score} ===`);
            }
            
            // Increment match count for this company (regardless of whether it's new)
            this.matchCounts[company]++;
            console.log(`=== GAME ENGINE: ${company} matched ${this.matchCounts[company]} times ===`);
            
            // Mark company as completed in the UI
            this.markCompanyAsCompleted(company);
        });
        
        // Emit event to update all match counts in the UI
        this.emit('matchCountsUpdated', { matchCounts: { ...this.matchCounts } });
        
        // Set up initial tile states for all matched companies (pass mapping)
        this.setupInitialTileStates(matchedTileToCompany);
        
        // Set animation state
        this.isAnimating = true;
        this.pendingGravityIndices = matchedIndices;
        
        // Add safety timeout to prevent infinite stuck state
        this.animationTimeout = setTimeout(() => {
            console.log('=== GAME ENGINE: Animation timeout reached, forcing reset ===');
            this.emergencyBoardFix();
        }, 10000); // 10 second timeout
        
        // Start the animation sequence with special tiles
        this.startMatchAnimationSequence(matchedIndices, newCompanies, specialTiles, scoreIncrease);
        
        // Check win condition after processing matches
        this.checkWinCondition();
    }
    
    // New method to handle the complete animation sequence (improved for standard match-3)
    startMatchAnimationSequence(matchedIndices, newCompanies, specialTiles, scoreIncrease) {
        console.log('=== GAME ENGINE: Starting match animation sequence ===');
        
        // Step 1: Animate the matched tiles with different effects based on type
        this.emit('matchAnimation', { 
            indices: Array.from(matchedIndices), 
            specialTiles: specialTiles,
            scoreIncrease: scoreIncrease
        });
        
        // Step 2: Apply gravity immediately after explosion animation (1 second)
        setTimeout(() => {
            console.log('=== GAME ENGINE: Applying gravity after explosion animation ===');
            this.removeMatchesAndApplyGravity(matchedIndices);
        }, 1000); // Reduced to 1 second for immediate gravity
        
        // Step 3: Show GIF pop-up in parallel (doesn't block gravity)
        if (newCompanies.length > 0) {
            setTimeout(() => {
                console.log('=== GAME ENGINE: Showing GIF pop-up for new companies ===');
                this.showGifPopups(newCompanies);
            }, 1200); // Slightly after gravity starts
        }
    }

    // GIF pop-up system with proper queue management
    showGifPopups(companies) {
        console.log(`=== GAME ENGINE: showGifPopups called with companies:`, companies);
        
        // Initialize the animation queue if it doesn't exist
        if (!this.animationQueue) {
            this.animationQueue = [];
            this.isProcessingQueue = false;
            console.log('=== GAME ENGINE: Initialized animation queue ===');
        }
        
        // Add companies to the queue
        this.animationQueue.push(...companies);
        console.log(`=== GAME ENGINE: Added companies to queue, queue length: ${this.animationQueue.length} ===`);
        
        // Start processing if not already processing
        if (!this.isProcessingQueue) {
            console.log('=== GAME ENGINE: Starting animation queue processing ===');
            this.processAnimationQueue();
        } else {
            console.log('=== GAME ENGINE: Animation queue already processing ===');
        }
    }
    
    // Process the animation queue one at a time
    processAnimationQueue() {
        console.log(`=== GAME ENGINE: processAnimationQueue called, queue length: ${this.animationQueue ? this.animationQueue.length : 'undefined'} ===`);
        
        if (!this.animationQueue || this.animationQueue.length === 0) {
            // No more GIFs to show, clear all glows
            console.log('=== GAME ENGINE: Animation queue empty, finishing sequence ===');
            this.isProcessingQueue = false;
            
            // Add a small delay to ensure the last animation is visible for the full duration
            setTimeout(() => {
                this.finishAnimationSequence();
            }, 500);
            return;
        }
        
        // Safety check to prevent infinite loops
        if (!this.isAnimating) {
            console.warn('=== GAME ENGINE: Animation queue processing called but not animating, clearing queue ===');
            this.animationQueue = [];
            this.isProcessingQueue = false;
            this.finishAnimationSequence();
            return;
        }
        
        this.isProcessingQueue = true;
        const company = this.animationQueue.shift(); // Get the first company
        
        console.log(`=== GAME ENGINE: Showing GIF for ${company} in animation panel (${this.animationQueue.length} remaining in queue) ===`);
        
        // Show transition effect if this isn't the first animation
        if (this.currentAnimationCompany) {
            this.showTransitionEffect();
        }
        
        // Update the animation panel
        this.updateAnimationPanel(company);
        
        // Show company name flash on game board
        this.showCompanyFlash(company);
        
        // Update tile states for this company
        this.updateTileStates(company);
        
        // Auto-advance to next animation after 3 seconds
        // Keep the current animation state active until the next one starts
        setTimeout(() => {
            this.processAnimationQueue();
        }, 3000);
    }
    
    // Update the animation panel with company-specific content
    updateAnimationPanel(company) {
        // Get cached elements
        const gif = this.domCache.get('sydneyGif');
        const text = this.domCache.get('animationText');
        const banner = this.domCache.get('animationBanner');
        const bannerEmoji = this.domCache.get('bannerEmoji');
        const bannerEmoji2 = this.domCache.get('bannerEmoji2');
        const bannerCompany = this.domCache.get('bannerCompany');
        
        // Get cached mobile elements
        const gifMobile = this.domCache.get('sydneyGifMobile');
        const textMobile = this.domCache.get('animationTextMobile');
        const bannerMobile = this.domCache.get('animationBannerMobile');
        const bannerEmojiMobile = this.domCache.get('bannerEmojiMobile');
        const bannerEmoji2Mobile = this.domCache.get('bannerEmoji2Mobile');
        const bannerCompanyMobile = this.domCache.get('bannerCompanyMobile');
        
        const gifMap = {
            'apple': 'sydney-apple-small.gif',
            'tesla': 'sydney-tesla-small.gif',
            'netflix': 'sydney-netflix-small.gif',
            'starbucks': 'sydney-starbucks-small.gif',
            'nike': 'sydney-nike-small.gif',
            'spotify': 'sydney-spotify-small.gif',
            'amazon': 'sydney-amazon-small.gif',
            'openai': 'sydney-openai-small.gif'
        };
        
        const gifUrl = `https://raw.githubusercontent.com/burnpiles/ct-sydney-match/main/media/${gifMap[company]}`;
        const textMap = {
            'apple': "Sydney takes a selfie with her iPhone!",
            'tesla': "Sydney poses next to a Tesla Model S!",
            'netflix': "Sydney binges her favorite show!",
            'starbucks': "Sydney sips her signature latte!",
            'nike': "Sydney shows off her new Nikes!",
            'spotify': "Sydney creates the perfect playlist!",
            'amazon': "Sydney's Amazon haul goes viral!",
            'openai': "Sydney chats with AI about the future!"
        };
        
        const animationText = textMap[company] || "Sydney makes it go viral!";
        const emoji = this.companyEmojis[company] || '';
        const companyName = company.charAt(0).toUpperCase() + company.slice(1);
        
        // Update desktop elements
        if (gif) {
            gif.src = gifUrl;
            gif.onerror = () => {
                console.log(`=== GAME ENGINE: Desktop GIF failed to load for ${company}, using general GIF ===`);
                gif.src = 'https://raw.githubusercontent.com/burnpiles/ct-sydney-match/main/media/general-sydney-small.gif';
            };
        }
        
        if (text) {
            text.textContent = animationText;
        }
        
        if (banner && bannerEmoji && bannerEmoji2 && bannerCompany) {
            bannerEmoji.textContent = emoji;
            bannerEmoji2.textContent = emoji;
            bannerCompany.textContent = companyName;
            banner.classList.add('show');
        }
        
        // Update mobile elements
        if (gifMobile) {
            gifMobile.src = gifUrl;
            gifMobile.onerror = () => {
                console.log(`=== GAME ENGINE: Mobile GIF failed to load for ${company}, using general GIF ===`);
                gifMobile.src = 'https://raw.githubusercontent.com/burnpiles/ct-sydney-match/main/media/general-sydney-small.gif';
            };
        }
        
        if (textMobile) {
            textMobile.textContent = animationText;
        }
        
        if (bannerMobile && bannerEmojiMobile && bannerEmoji2Mobile && bannerCompanyMobile) {
            bannerEmojiMobile.textContent = emoji;
            bannerEmoji2Mobile.textContent = emoji;
            bannerCompanyMobile.textContent = companyName;
            bannerMobile.classList.add('show');
        }
        
        // Update company list visual feedback
        this.updateCompanyListVisualFeedback(company);
    }
    
    // Update visual feedback for the company list
    updateCompanyListVisualFeedback(currentCompany) {
        // Only remove animating from company counters, not tiles, but DO NOT clear highlight here
        // (let it persist until finishAnimationSequence)
        // Only move the highlight when a new company is animated
        const allCompanies = document.querySelectorAll('.match-counter-item');
        allCompanies.forEach(item => {
            // Only remove animating if it's not the current company
            if (item.dataset.company !== currentCompany) {
                item.classList.remove('animating');
                // Clear inline styles for non-current companies
                if (!item.classList.contains('has-matches')) {
                    item.style.border = '';
                    item.style.boxShadow = '';
                    item.style.background = '';
                    const matchCountElement = item.querySelector('.counter-count');
                    if (matchCountElement) {
                        matchCountElement.style.color = '';
                        matchCountElement.style.textShadow = '';
                    }
                }
            }
        });
        // Add animating class to the company counter (no yellow highlight)
        const currentCompanyItem = document.querySelector('.match-counter-item[data-company="' + currentCompany + '"]');
        if (currentCompanyItem) {
            currentCompanyItem.classList.add('animating');
            // Force a reflow to ensure styles are applied
            currentCompanyItem.offsetHeight;
        }
        // Add animating class to TV screen - DISABLED
        // const tvScreen = document.querySelector('.tv-screen');
        // if (tvScreen) {
        //     tvScreen.classList.add('animating');
        // }
        this.currentAnimatingCompany = currentCompany;
    }
    
    // Show transition effect between animations
    showTransitionEffect() {
        const overlay = document.createElement('div');
        overlay.className = 'transition-overlay';
        document.body.appendChild(overlay);
        
        // Remove overlay after animation completes
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 500);
    }
    
    // Show company name flash above the play area
    showCompanyFlash(company) {
        // Update the digital channel display instead of floating text
        this.updateDigitalChannelDisplay(company);
    }
    
    // Update the digital TV channel display
    updateDigitalChannelDisplay(company) {
        const channelDisplay = document.querySelector('.digital-channel-display');
        if (!channelDisplay) return;
        
        const companyNameDisplay = channelDisplay.querySelector('.company-name-display');
        const companyEmojiDisplay = channelDisplay.querySelector('.company-emoji-display');
        const channelNumber = channelDisplay.querySelector('.channel-number');
        
        if (companyNameDisplay && companyEmojiDisplay && channelNumber) {
            // Add channel surfing animation
            channelDisplay.classList.add('channel-surfing');
            
            if (company) {
                // Show company name in channel-number (LIVE is already in live-indicator)
                const companyName = company.charAt(0).toUpperCase() + company.slice(1).toUpperCase();
                channelNumber.textContent = companyName;
                companyNameDisplay.textContent = '';
                companyEmojiDisplay.textContent = this.companyEmojis[company];
            } else {
                // Default state
                channelNumber.textContent = 'CH 00';
                companyNameDisplay.textContent = 'SYDNEY VISION';
                companyEmojiDisplay.textContent = '📺';
            }
            
            // Remove animation class after animation completes
            setTimeout(() => {
                channelDisplay.classList.remove('channel-surfing');
            }, 500);
        }
    }
    
    // Update tile states for current company
    updateTileStates(currentCompany) {
        // Remove pulsing from all tiles
        const allTiles = document.querySelectorAll('.tile');
        allTiles.forEach(tile => {
            tile.classList.remove('pulsing');
        });
        
        // Only add pulsing to tiles that were actually matched (not all tiles of that company type)
        // We need to track which specific tiles were matched for this company
        if (this.matchedTileToCompany) {
            Object.entries(this.matchedTileToCompany).forEach(([index, company]) => {
                if (company === currentCompany) {
                    const tile = document.querySelector(`.tile[data-index="${index}"]`);
                    if (tile) {
                        tile.classList.add('pulsing');
                    }
                }
            });
        }
        
        this.currentAnimationCompany = currentCompany;
    }
    
    // Set up initial tile states for all matched companies
    setupInitialTileStates(matchedTileToCompany) {
        // Clear all tile states first
        // Use the Renderer.tiles array directly for accuracy
        const renderer = window.renderer; // assumes renderer is globally accessible
        if (!renderer || !renderer.tiles) return;
        renderer.tiles.forEach(tile => {
            tile.classList.remove('pulsing', 'queued');
        });
        
        // Only add pulsing/queued to tiles that were actually matched
        // Group indices by company for pulsing/queued logic
        const companyToIndices = {};
        Object.entries(matchedTileToCompany).forEach(([index, company]) => {
            if (!companyToIndices[company]) companyToIndices[company] = [];
            companyToIndices[company].push(Number(index));
        });
        const companies = Object.keys(companyToIndices);
        companies.forEach((company, companyIdx) => {
            companyToIndices[company].forEach(tileIndex => {
                const tile = renderer.tiles[tileIndex];
                if (tile) {
                    if (companyIdx === 0) {
                        tile.classList.add('pulsing');
                    } else {
                        tile.classList.add('queued');
                    }
                }
            });
        });
    }
    
    // Mark a company as completed in the UI
    markCompanyAsCompleted(company) {
        // Only select checklist/counter items, not tiles
        const companyItem = document.querySelector(`.match-counter-item[data-company="${company}"]`);
        if (companyItem) {
            companyItem.classList.add('completed');
            
            // Also mark the company silhouette as found
            const silhouette = companyItem.querySelector('.company-silhouette');
            if (silhouette) {
                silhouette.classList.add('found');
            }
            
            // Add creative animation for newly completed company
            this.animateCompanyCompletion(companyItem, company);
        }
    }
    
    // Animate company completion with creative effects
    animateCompanyCompletion(companyItem, company) {
        // Create particle effect around the company item
        this.createCompanyParticles(companyItem, company);
        
        // Add pulsing glow effect
        companyItem.style.animation = 'companyCompletionPulse 1.5s ease-out';
        
        // Remove animation classes after completion
        setTimeout(() => {
            companyItem.style.animation = '';
        }, 1500);
    }
    
    // Create particle effect for company completion
    createCompanyParticles(companyItem, company) {
        const rect = companyItem.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const colors = ['#00ff41', '#ffff00', '#ff8800', '#ff0000'];
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'company-particle';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.width = '6px';
            particle.style.height = '6px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';
            particle.style.position = 'absolute';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            
            // Random direction and distance
            const angle = (Math.random() * 360) * (Math.PI / 180);
            const distance = 40 + Math.random() * 60;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            
            // Animate particle
            particle.style.transition = 'all 1s ease-out';
            particle.style.transform = `translate(${dx}px, ${dy}px)`;
            particle.style.opacity = '0';
            
            fragment.appendChild(particle);
            
            // Auto-remove particles
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
        
        document.body.appendChild(fragment);
    }
    
    // Finish the animation sequence and apply gravity
    finishAnimationSequence() {
        console.log('=== GAME ENGINE: Finishing animation sequence ===');
        console.log(`=== GAME ENGINE: Current animating company: ${this.currentAnimatingCompany} ===`);
        
        // Clear animation timeout
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
            this.animationTimeout = null;
        }
        
        // Hide the animation banners (desktop and mobile)
        const banner = this.domCache.get('animationBanner');
        const bannerMobile = this.domCache.get('animationBannerMobile');
        
        if (banner) {
            banner.classList.remove('show');
        }
        if (bannerMobile) {
            bannerMobile.classList.remove('show');
        }
        
        // Clear all tile states
        const allTiles = document.querySelectorAll('.tile');
        allTiles.forEach(tile => {
            tile.classList.remove('pulsing', 'queued');
        });
        
        // Reset current animation company
        this.currentAnimationCompany = null;
        this.currentAnimatingCompany = null;
        
        // Clear the matched tile mapping
        this.matchedTileToCompany = null;
        
        // Apply gravity and check for new matches
        if (this.pendingGravityIndices) {
            this.removeMatchesAndApplyGravity(this.pendingGravityIndices);
        } else {
            // No gravity needed, just clean up
            this.isAnimating = false;
            this.pendingGravityIndices = null;
            
            // Clear animation state after animation sequence is truly complete
            this.clearAnimationState();
            
            console.log('=== GAME ENGINE: Animation sequence complete, game ready ===');
        }
    }





    // Remove matches and apply gravity
    removeMatchesAndApplyGravity(matchedIndices) {
        console.log('=== GAME ENGINE: Applying gravity to indices:', Array.from(matchedIndices));
        
        try {
            // Remove matched tiles by setting them to null
            matchedIndices.forEach(index => {
                this.board[index] = null;
            });
            
            // Apply gravity column by column (like Candy Crush)
            for (let col = 0; col < this.boardSize; col++) {
                console.log(`=== GAME ENGINE: Processing column ${col} ===`);
                
                // Step 1: Collect all existing tiles in this column (from bottom to top)
                const existingTiles = [];
                for (let row = this.boardSize - 1; row >= 0; row--) {
                    const index = row * this.boardSize + col;
                    if (this.board[index] !== null) {
                        existingTiles.push(this.board[index]);
                        console.log(`Column ${col}, Row ${row}: Found tile ${this.board[index]}`);
                    }
                }
                
                console.log(`Column ${col}: Found ${existingTiles.length} existing tiles:`, existingTiles);
                
                // Step 2: Clear the entire column
                for (let row = 0; row < this.boardSize; row++) {
                    this.board[row * this.boardSize + col] = null;
                }
                
                // Step 3: Place existing tiles at the bottom (gravity effect)
                for (let i = 0; i < existingTiles.length; i++) {
                    const row = this.boardSize - 1 - i;
                    const index = row * this.boardSize + col;
                    this.board[index] = existingTiles[i];
                    console.log(`Column ${col}, Row ${row}: Placed ${existingTiles[i]} at bottom`);
                }
                
                // Step 4: Fill empty spaces at the top with new random tiles
                const emptySpaces = this.boardSize - existingTiles.length;
                for (let i = 0; i < emptySpaces; i++) {
                    const row = i;
                    const index = row * this.boardSize + col;
                    const newTile = this.companies[Math.floor(Math.random() * this.companies.length)];
                    this.board[index] = newTile;
                    console.log(`Column ${col}, Row ${row}: Added new tile ${newTile}`);
                }
            }
        } catch (error) {
            console.error('=== GAME ENGINE: ERROR in gravity application:', error);
            // Emergency board fix
            this.emergencyBoardFix();
        }
        
        // Verify no null tiles remain
        const nullCount = this.board.filter(tile => tile === null).length;
        if (nullCount > 0) {
            console.error(`=== GAME ENGINE: ERROR - ${nullCount} null tiles remain after gravity! Fixing... ===`);
            // Fill any remaining null tiles
            for (let i = 0; i < this.board.length; i++) {
                if (this.board[i] === null) {
                    this.board[i] = this.companies[Math.floor(Math.random() * this.companies.length)];
                    console.log(`Fixed null tile at index ${i} with ${this.board[i]}`);
                }
            }
        }
        
        console.log('=== GAME ENGINE: Gravity complete, new board:', this.board);
        this.emit('gravityApplied', { board: [...this.board] });
        
        // Update the board display and check for more matches
        setTimeout(() => {
            console.log('=== GAME ENGINE: Gravity complete, checking for new matches ===');
            
            setTimeout(() => {
                // Only check for new matches if we're past move 0
                if (this.moveCount > 0) {
                    const newMatchData = this.findMatches();
                    const totalNewMatches = newMatchData.matches.length + newMatchData.specialMatches.length;
                    if (totalNewMatches > 0) {
                        console.log('=== GAME ENGINE: Found new matches after gravity, processing ===');
                        this.processMatches(newMatchData);
                    } else {
                        console.log('=== GAME ENGINE: No new matches, game ready for next move ===');
                        // Reset animation state when no more matches
                        this.isAnimating = false; // CRITICAL FIX: Reset animation state
                        this.pendingGravityIndices = null; // CRITICAL FIX: Clear pending gravity
                        
                        // Clear animation state after animation is truly complete
                        this.clearAnimationState();
                        
                        console.log('=== GAME ENGINE: Animation state reset, game ready for next move ===');
                    }
                } else {
                    console.log('=== GAME ENGINE: Move 0 - skipping automatic match check ===');
                }
            }, 300);
            
            // Check win condition: all companies must have at least 1 match
            const companiesWithMatches = Object.values(this.matchCounts).filter(count => count > 0).length;
            if (companiesWithMatches === this.companies.length) {
                console.log('=== GAME ENGINE: All companies matched! Game completed! ===');
                this.emit('gameCompleted');
            }
        }, 100);
    }

    // Reset game state
    restartGame() {
        this.initGame();
        
        // Reset GIF to start state
        const sydneyGif = document.getElementById('sydneyGif');
        if (sydneyGif) {
            sydneyGif.src = 'https://raw.githubusercontent.com/burnpiles/ct-sydney-match/main/media/general-sydney-small.gif';
        }
        
        // Reset digital channel display to default state
        this.updateDigitalChannelDisplay(null);
        
        this.emit('gameRestarted');
    }

    // Reset animation state (for debugging)
    resetAnimationState() {
        console.log('Resetting animation state from:', this.isAnimating);
        this.isAnimating = false;
    }

    // Get current game state
    getGameState() {
        return {
            board: [...this.board],
            score: this.score,
            foundCompanies: Array.from(this.foundCompanies),
            isAnimating: this.isAnimating,
            selectedTile: this.selectedTile
        };
    }

    // Validate and fix game state
    validateGameState() {
        console.log('=== GAME ENGINE: Validating game state ===');
        
        // Check if board has any null values that shouldn't be there
        const nullCount = this.board.filter(tile => tile === null).length;
        if (nullCount > 0) {
            console.warn(`=== GAME ENGINE: Found ${nullCount} null tiles, fixing board ===`);
            // Fill null tiles with random companies
            for (let i = 0; i < this.board.length; i++) {
                if (this.board[i] === null) {
                    this.board[i] = this.companies[Math.floor(Math.random() * this.companies.length)];
                }
            }
        }
        
        // Check if isAnimating is stuck (simplified logic)
        if (this.isAnimating && !this.pendingGravityIndices) {
            console.warn('=== GAME ENGINE: isAnimating stuck, resetting ===');
            this.isAnimating = false;
        }
        
        console.log('=== GAME ENGINE: Game state validation complete ===');
    }

    // Force reset animation state
    forceResetAnimationState() {
        console.log('=== GAME ENGINE: Force resetting animation state ===');
        this.isAnimating = false;
        this.pendingGravityIndices = null;
        this.selectedTile = null;
        this.isProcessingQueue = false;
        this.currentAnimationCompany = null;
        this.currentAnimatingCompany = null;
        
        // Clear the matched tile mapping
        this.matchedTileToCompany = null;
        
        // Clear animation state
        this.clearAnimationState();
        
        // Force emit gravity applied to refresh the board
        if (this.board) {
            this.emit('gravityApplied', { board: [...this.board] });
        }
        
        // Emit a special event to force reset the renderer's animation state
        this.emit('forceResetAnimation', {});
    }
    
    // Emergency board fix for when gravity fails
    emergencyBoardFix() {
        console.log('=== GAME ENGINE: Emergency board fix initiated ===');
        
        // Clear animation timeout
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
            this.animationTimeout = null;
        }
        
        // Reset all animation states
        this.isAnimating = false;
        this.pendingGravityIndices = null;
        this.isProcessingQueue = false;
        this.currentAnimationCompany = null;
        this.currentAnimatingCompany = null;
        
        // Clear the matched tile mapping
        this.matchedTileToCompany = null;
        
        // Fill any null tiles with random companies
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] === null) {
                this.board[i] = this.companies[Math.floor(Math.random() * this.companies.length)];
                console.log(`Emergency fix: Filled null tile at index ${i} with ${this.board[i]}`);
            }
        }
        
        // Verify board is complete
        const nullCount = this.board.filter(tile => tile === null).length;
        if (nullCount > 0) {
            console.error(`=== GAME ENGINE: Emergency fix failed - ${nullCount} null tiles remain ===`);
        } else {
            console.log('=== GAME ENGINE: Emergency board fix completed successfully ===');
        }
        
        // Force refresh the board
        this.emit('gravityApplied', { board: [...this.board] });
        this.emit('forceResetAnimation', {});
    }

    // Get the most viral companies (most matched)
    getMostViralCompanies() {
        const maxCount = Math.max(...Object.values(this.matchCounts));
        const mostViral = Object.entries(this.matchCounts)
            .filter(([company, count]) => count === maxCount)
            .map(([company, count]) => company);
        
        console.log('=== GAME ENGINE: Most viral companies:', mostViral, 'with', maxCount, 'matches each ===');
        return { companies: mostViral, count: maxCount };
    }

    // Get match count for a specific company
    getMatchCount(company) {
        return this.matchCounts[company] || 0;
    }
    
    // Clear animation state and restore green highlights
    clearAnimationState() {
        console.log('=== GAME ENGINE: Clearing animation state ===');
        
        // Clear all animation states and restore match glows
        const allCompanies = document.querySelectorAll('.match-counter-item');
        allCompanies.forEach(item => {
            item.classList.remove('animating');
            if (item.classList.contains('has-matches')) {
                item.style.border = '2px solid #00ff41';
                item.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.8), 0 0 40px rgba(0, 255, 65, 0.4)';
                item.style.background = 'linear-gradient(135deg, rgba(0, 255, 65, 0.1), rgba(0, 0, 0, 0.8))';
                const matchCountElement = item.querySelector('.counter-count');
                if (matchCountElement) {
                    matchCountElement.style.color = '#00ff41';
                    matchCountElement.style.textShadow = '0 0 10px rgba(0, 255, 65, 0.8)';
                }
            } else {
                item.style.border = '';
                item.style.boxShadow = '';
                item.style.background = '';
                const matchCountElement = item.querySelector('.counter-count');
                if (matchCountElement) {
                    matchCountElement.style.color = '';
                    matchCountElement.style.textShadow = '';
                }
            }
        });
        
        // Remove animating class from TV screen - DISABLED
        // const tvScreen = document.querySelector('.tv-screen');
        // if (tvScreen) {
        //     tvScreen.classList.remove('animating');
        // }
    }
    
    // Check if game is completed (all companies have at least 1 match)
    checkWinCondition() {
        const companiesWithMatches = Object.values(this.matchCounts).filter(count => count > 0).length;
        const isCompleted = companiesWithMatches === this.companies.length;
        
        if (isCompleted) {
            console.log('=== GAME ENGINE: Win condition met! All companies matched! ===');
            this.emit('gameCompleted');
        }
        
        return isCompleted;
    }

    // Set up highlighting event listeners for match counter items
    setupHighlightingListeners() {
        const matchCounterItems = document.querySelectorAll('.match-counter-item');
        console.log(`=== HIGHLIGHTING: Setting up listeners for ${matchCounterItems.length} counter items ===`);
        matchCounterItems.forEach(item => {
            // Remove any existing listeners to prevent duplicates
            item.removeEventListener('click', this.handleCounterItemClick);
            
            // Add new listener
            item.addEventListener('click', this.handleCounterItemClick.bind(this));
        });
        console.log('=== HIGHLIGHTING: Event listeners set up successfully ===');
    }

    // Handle click on match counter item
    handleCounterItemClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const company = e.currentTarget.getAttribute('data-company');
        this.toggleCompanyHighlight(company);
    }

    // Toggle highlighting for a specific company
    toggleCompanyHighlight(company) {
        if (this.highlightedCompany === company) {
            // Remove highlighting
            this.removeCompanyHighlight();
        } else {
            // Add highlighting
            this.addCompanyHighlight(company);
        }
    }

    // Add highlighting for a specific company
    addCompanyHighlight(company) {
        this.removeCompanyHighlight();
        this.highlightedCompany = company;
        const counterItem = document.querySelector(`.match-counter-item[data-company="${company}"]`);
        if (counterItem) {
            counterItem.classList.add('highlighted');
        }
        // Only here:
        this.highlightTilesOnBoard(company);
        console.log(`=== GAME ENGINE: Highlighted company: ${company} ===`);
    }

    // Remove all highlighting
    removeCompanyHighlight() {
        console.log('[DEBUG] removeCompanyHighlight called for', this.highlightedCompany, 'at', new Error().stack);
        if (!this.highlightedCompany) return;
        
        // Remove highlighting from match counter item
        const counterItem = document.querySelector(`.match-counter-item[data-company="${this.highlightedCompany}"]`);
        if (counterItem) {
            counterItem.classList.remove('highlighted');
        }
        
        // Remove highlighting from all tiles
        this.removeTileHighlighting();
        
        // Clear the highlighted company
        this.highlightedCompany = null;
        
        console.log('=== GAME ENGINE: Removed company highlighting ===');
    }

    // Highlight tiles on the board for a specific company
    highlightTilesOnBoard(company) {
        console.log('[DEBUG] highlightTilesOnBoard called for', company, 'at', new Error().stack);
        const tiles = document.querySelectorAll('.tile');
        let highlightedCount = 0;
        tiles.forEach((tile, index) => {
            if (this.board[index] === company) {
                tile.classList.add('highlighted');
                highlightedCount++;
            }
        });
        console.log(`=== HIGHLIGHTING: Highlighted ${highlightedCount} tiles for ${company} ===`);
    }

    // Remove highlighting from all tiles
    removeTileHighlighting() {
        const tiles = document.querySelectorAll('.tile');
        let removedCount = 0;
        tiles.forEach((tile, index) => {
            if (tile.classList.contains('highlighted')) {
                tile.classList.remove('highlighted');
                removedCount++;
            }
        });
        console.log(`=== HIGHLIGHTING: Removed highlighting from ${removedCount} tiles ===`);
    }


} 