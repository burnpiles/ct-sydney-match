class Renderer {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.gameBoard = document.getElementById('gameBoard');
        this.scoreElement = document.getElementById('score');
        this.tiles = [];
        this.sydneyCanvas = document.getElementById('sydneyCanvas');
        this.sydneyCtx = null;
        this.sydneySprites = null;
        
        // Audio elements
        this.audioElements = {
            match: document.getElementById('matchSound'),
            special: document.getElementById('specialSound')
        };
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.initCanvas();
        this.preloadSydneySprites();
        this.createTiles();
    }

    initCanvas() {
        if (this.sydneyCanvas) {
            this.sydneyCtx = this.sydneyCanvas.getContext('2d');
            // Enable hardware acceleration
            this.sydneyCanvas.style.transform = 'translate3d(0,0,0)';
        }
    }

    preloadSydneySprites() {
        // Pre-render Sydney sprites to avoid expensive canvas operations
        this.sydneySprites = {
            idle: this.createSydneySprite('idle'),
            pose: this.createSydneySprite('pose')
        };
    }

    createSydneySprite(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 80;
        const ctx = canvas.getContext('2d');
        
        try {
            this.drawSydney(ctx, type);
            return canvas.toDataURL();
        } catch (error) {
            console.error('Failed to create Sydney sprite:', error);
            return null;
        }
    }

    drawSydney(ctx, type = 'idle') {
        // Clear canvas
        ctx.clearRect(0, 0, 80, 80);
        
        // Background hair (darkest layer for depth)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(8, 5, 64, 40);
        ctx.fillRect(4, 35, 72, 20);
        
        // Main hair mass (medium brown/blonde)
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(12, 8, 56, 35);
        ctx.fillRect(6, 38, 68, 15);
        
        // Hair highlights and texture (lightest blonde)
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(16, 12, 48, 30);
        ctx.fillRect(10, 40, 60, 12);
        
        // Hair strands and texture details
        ctx.fillStyle = '#F5DEB3';
        ctx.fillRect(20, 15, 8, 25);
        ctx.fillRect(32, 18, 6, 22);
        ctx.fillRect(42, 16, 8, 24);
        ctx.fillRect(52, 14, 10, 26);
        
        // Face (realistic skin tone)
        ctx.fillStyle = '#FDBCB4';
        ctx.fillRect(22, 20, 36, 28);
        
        // Face contouring and shadows
        ctx.fillStyle = '#F4A460';
        ctx.fillRect(20, 44, 40, 4);
        ctx.fillRect(20, 28, 2, 12);
        ctx.fillStyle = '#FDBCB4';
        ctx.fillRect(56, 28, 2, 12);
        
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(26, 28, 9, 6);
        ctx.fillRect(45, 28, 9, 6);
        
        ctx.fillStyle = '#4682B4';
        ctx.fillRect(28, 29, 5, 4);
        ctx.fillRect(47, 29, 5, 4);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(30, 30, 2, 2);
        ctx.fillRect(49, 30, 2, 2);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(31, 30, 1, 1);
        ctx.fillRect(50, 30, 1, 1);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(26, 27, 9, 1);
        ctx.fillRect(45, 27, 9, 1);
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(27, 25, 8, 2);
        ctx.fillRect(45, 25, 8, 2);
        
        // Nose
        ctx.fillStyle = '#F4A460';
        ctx.fillRect(37, 33, 6, 5);
        ctx.fillRect(36, 37, 8, 2);
        
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(37, 38, 1, 1);
        ctx.fillRect(42, 38, 1, 1);
        
        // Mouth
        ctx.fillStyle = '#CD5C5C';
        ctx.fillRect(32, 42, 16, 3);
        ctx.fillStyle = '#B22222';
        ctx.fillRect(32, 43, 16, 1);
        
        // Neck
        ctx.fillStyle = '#FDBCB4';
        ctx.fillRect(32, 48, 16, 10);
        
        // Denim jacket
        ctx.fillStyle = '#4682B4';
        ctx.fillRect(8, 58, 64, 22);
        ctx.fillRect(0, 68, 20, 12);
        ctx.fillRect(60, 68, 20, 12);
        
        ctx.fillStyle = '#5F9EA0';
        ctx.fillRect(16, 58, 48, 6);
        ctx.fillRect(12, 64, 8, 8);
        ctx.fillRect(60, 64, 8, 8);
        
        ctx.fillStyle = '#36648B';
        ctx.fillRect(8, 72, 64, 1);
        ctx.fillRect(38, 58, 2, 22);
        ctx.fillRect(16, 74, 12, 4);
        ctx.fillRect(52, 74, 12, 4);
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(37, 65, 3, 3);
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(38, 66, 1, 1);
    }

    createTiles() {
        this.gameBoard.innerHTML = '';
        this.tiles = [];
        
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < 64; i++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.index = i;
            
            // Add touch and click event listeners
            this.addTileEventListeners(tile, i);
            
            fragment.appendChild(tile);
            this.tiles.push(tile);
        }
        
        this.gameBoard.appendChild(fragment);
    }

    addTileEventListeners(tile, index) {
        // Touch events for mobile
        tile.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTileTouch(index);
        }, { passive: false });

        tile.addEventListener('touchend', (e) => {
            e.preventDefault();
        }, { passive: false });

        // Click events for desktop
        tile.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleTileClick(index);
        });
    }

    handleTileTouch(index) {
        // Add haptic feedback on mobile
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        this.gameEngine.selectTile(index);
    }

    handleTileClick(index) {
        this.gameEngine.selectTile(index);
    }

    setupEventListeners() {
        // Game engine events
        this.gameEngine.addEventListener('gameInitialized', (board) => {
            this.updateBoard(board);
        });

        this.gameEngine.addEventListener('tileSelected', (index) => {
            this.selectTile(index);
        });

        this.gameEngine.addEventListener('tileDeselected', (index) => {
            this.deselectTile(index);
        });

        this.gameEngine.addEventListener('tilesDeselected', (indices) => {
            indices.forEach(index => this.deselectTile(index));
        });

        this.gameEngine.addEventListener('validSwap', (data) => {
            this.updateBoard(data.board);
        });

        this.gameEngine.addEventListener('invalidMove', (data) => {
            this.showInvalidMove(data.index1, data.index2);
        });

        this.gameEngine.addEventListener('matchAnimation', (data) => {
            this.highlightMatches(data.indices, data.specialTiles);
        });

        this.gameEngine.addEventListener('gravityApplied', (data) => {
            this.updateBoard(data.board);
            // Update checklist for any newly found companies
            this.updateChecklistFromBoard(data.board);
        });

        this.gameEngine.addEventListener('gravityApplied', (data) => {
            this.updateBoard(data.board);
        });

        this.gameEngine.addEventListener('gameCompleted', () => {
            this.showCompletion();
        });

        this.gameEngine.addEventListener('gameRestarted', () => {
            this.resetUI();
        });

        this.gameEngine.addEventListener('forceResetAnimation', () => {
            this.forceResetAnimationState();
        });

        this.gameEngine.addEventListener('matchAnimation', (data) => {
            this.updateScoreBreakdown();
        });

        this.gameEngine.addEventListener('matchCountsUpdated', (data) => {
            // Update all match counts in the UI
            Object.entries(data.matchCounts).forEach(([company, count]) => {
                this.updateMatchCount(company);
            });
        });
    }

    updateBoard(board) {
        // Optimized board update with reduced logging and better performance
        if (!this.gameBoard) return;
        
        // Clear any existing animations and selections first
        this.tiles.forEach(tile => {
            tile.classList.remove('matched', 'falling', 'invalid', 'selected', 'pulsing', 'queued', 'highlighted');
            tile.style.pointerEvents = 'auto';
        });
        
        // Batch updates for better performance
        const updates = [];
        this.tiles.forEach((tile, index) => {
            const company = board[index];
            const currentCompany = tile.dataset.company;
            
            // Handle null/empty tiles
            if (company === null) {
                if (currentCompany !== '') {
                    updates.push({ tile, action: 'clear' });
                }
                return;
            }
            
            // Reset opacity for non-empty tiles
            tile.style.opacity = '1';
            
            // If the tile content is changing, queue update
            if (company !== currentCompany) {
                updates.push({ tile, action: 'update', company });
            } else {
                // No change, just clear any existing animations
                tile.classList.remove('matched', 'falling', 'invalid', 'selected');
                tile.style.transform = '';
                tile.style.transition = '';
                tile.style.background = '';
            }
        });
        
        // Apply updates in batch
        requestAnimationFrame(() => {
            updates.forEach(({ tile, action, company }) => {
                if (action === 'clear') {
                    tile.textContent = '';
                    tile.dataset.company = '';
                    tile.classList.remove('matched', 'falling', 'invalid', 'selected', 'pulsing', 'queued');
                    tile.style.transform = '';
                    tile.style.transition = '';
                    tile.style.background = '';
                    tile.style.opacity = '0.3';
                    tile.style.pointerEvents = 'none';
                } else if (action === 'update') {
                    // Update content immediately
                    tile.textContent = this.gameEngine.companyEmojis[company];
                    tile.dataset.company = company;
                    
                    // Simplified gravity animation
                    tile.style.transition = 'transform 0.3s ease-out';
                    tile.style.transform = 'translateY(-20px)';
                    
                    // Animate to position
                    requestAnimationFrame(() => {
                        tile.style.transform = 'translateY(0)';
                    });
                    
                    // Clear transition after animation
                    setTimeout(() => {
                        tile.style.transition = '';
                        tile.style.transform = '';
                    }, 300);
                }
            });
        });
    }

    selectTile(index) {
        if (this.tiles[index]) {
            this.tiles[index].classList.add('selected');
        }
    }

    deselectTile(index) {
        if (this.tiles[index]) {
            this.tiles[index].classList.remove('selected');
        }
    }

    showInvalidMove(index1, index2) {
        const tile1 = this.tiles[index1];
        const tile2 = this.tiles[index2];
        
        if (tile1 && tile2) {
            // Add invalid class for red background
            tile1.classList.add('invalid');
            tile2.classList.add('invalid');
            
            // Add shake animation
            tile1.style.animation = 'shake 0.5s ease-in-out';
            tile2.style.animation = 'shake 0.5s ease-in-out';
            
            // Remove invalid state after animation
            setTimeout(() => {
                tile1.classList.remove('invalid');
                tile2.classList.remove('invalid');
                tile1.style.animation = '';
                tile2.style.animation = '';
            }, 500);
        }
    }

    highlightMatches(matchedIndices, specialTiles = []) {
        requestAnimationFrame(() => {
            // Clear any existing match classes first
            this.tiles.forEach(tile => {
                tile.classList.remove('matched', 'line-clear', 'color-bomb');
            });
            
            // Apply regular match styling and create particles
            matchedIndices.forEach(index => {
                if (this.tiles[index]) {
                    const tile = this.tiles[index];
                    tile.classList.add('matched');
                    
                    // Create particle effect for regular matches
                    this.createMatchParticles(tile, 'match');
                }
            });
            
            // Play match sound
            this.playMatchSound('match');
            
            // Apply special tile styling and enhanced particles
            specialTiles.forEach(special => {
                special.indices.forEach(index => {
                    if (this.tiles[index]) {
                        const tile = this.tiles[index];
                        
                        // Remove regular match class and add special class
                        tile.classList.remove('matched');
                        tile.classList.add(special.type);
                        
                        // Add extra visual feedback for special tiles
                        if (special.type === 'line-clear') {
                            tile.style.boxShadow = '0 0 50px rgba(108, 92, 231, 0.9)';
                            this.createMatchParticles(tile, 'line-clear');
                            this.playMatchSound('line-clear');
                        } else if (special.type === 'color-bomb') {
                            tile.style.boxShadow = '0 0 60px rgba(253, 203, 110, 0.9)';
                            this.createMatchParticles(tile, 'color-bomb');
                            this.playMatchSound('color-bomb');
                        }
                    }
                });
            });
            
            // Clear special effects after animations complete
            setTimeout(() => {
                this.tiles.forEach(tile => {
                    tile.style.boxShadow = '';
                });
            }, 2000);
        });
    }

    updateScore(score) {
        if (this.scoreElement) {
            this.scoreElement.textContent = score;
        }
    }

    updateChecklist(company) {
        const checklistItem = document.querySelector(`[data-company="${company}"]`);
        if (checklistItem) {
            checklistItem.classList.add('completed');
            const silhouette = checklistItem.querySelector('.company-silhouette');
            if (silhouette) {
                silhouette.classList.add('found');
            }
            
            // Update match count
            this.updateMatchCount(company);
        }
    }

    updateMatchCount(company) {
        // Only target the company counter item, NOT game board tiles
        const counterItem = document.querySelector('.match-counter-item[data-company="' + company + '"]');
        const matchCountElement = document.getElementById(`${company}-count`);
        const totalMatchesElement = document.getElementById('total-matches');
        if (counterItem && matchCountElement) {
            const matchCount = this.gameEngine.getMatchCount(company);
            matchCountElement.textContent = matchCount;
            if (matchCount > 0) {
                counterItem.classList.add('has-matches');
                counterItem.style.border = '2px solid #00ff41';
                counterItem.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.8), 0 0 40px rgba(0, 255, 65, 0.4)';
                counterItem.style.background = 'linear-gradient(135deg, rgba(0, 255, 65, 0.1), rgba(0, 0, 0, 0.8))';
                matchCountElement.style.color = '#00ff41';
                matchCountElement.style.textShadow = '0 0 10px rgba(0, 255, 65, 0.8)';
                if (!this.gameEngine.foundCompanies.has(company)) {
                    counterItem.classList.add('completed');
                }
            } else {
                counterItem.classList.remove('has-matches', 'completed');
                counterItem.style.border = '';
                counterItem.style.boxShadow = '';
                counterItem.style.background = '';
                matchCountElement.style.color = '';
                matchCountElement.style.textShadow = '';
            }
            if (totalMatchesElement) {
                const totalCompleted = Object.values(this.gameEngine.matchCounts).filter(count => count > 0).length;
                totalMatchesElement.textContent = `${totalCompleted}/8`;
            }
        }
    }

    updateChecklistFromBoard(board) {
        // Update score
        if (this.scoreElement) {
            this.scoreElement.textContent = this.gameEngine.score;
        }
        
        // Update checklist for all found companies
        this.gameEngine.foundCompanies.forEach(company => {
            this.updateChecklist(company);
        });
    }



    updateScoreBreakdown() {
        const scoreBreakdown = document.getElementById('scoreBreakdown');
        const breakdownContent = document.getElementById('breakdownContent');
        
        if (scoreBreakdown && breakdownContent) {
            // Show score breakdown when there are matches
            const hasMatches = Object.values(this.gameEngine.matchCounts).some(count => count > 0);
            
            if (hasMatches) {
                scoreBreakdown.style.display = 'block';
                
                // Clear existing content
                breakdownContent.innerHTML = '';
                
                // Add company score items
                Object.entries(this.gameEngine.matchCounts).forEach(([company, count]) => {
                    if (count > 0) {
                        const scoreItem = document.createElement('div');
                        scoreItem.className = 'company-score-item';
                        scoreItem.innerHTML = `
                            <span class="company-score-emoji">${this.gameEngine.companyEmojis[company]}</span>
                            <span class="company-score-name">${company.toUpperCase()}</span>
                            <span class="company-score-count">×${count}</span>
                        `;
                        breakdownContent.appendChild(scoreItem);
                    }
                });
            } else {
                scoreBreakdown.style.display = 'none';
            }
        }
    }



    // Audio management methods
    playSound(soundType) {
        // Use Web Audio API to generate sounds programmatically
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Set different frequencies and durations for different sound types
            let frequency, duration;
            switch (soundType) {
                case 'match':
                    frequency = 800;
                    duration = 0.1;
                    break;
                case 'special':
                    frequency = 600;
                    duration = 0.3;
                    break;
                default:
                    frequency = 800;
                    duration = 0.1;
            }
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
            
        } catch (e) {
            console.log('Web Audio API not supported or failed:', e);
        }
    }

    playMatchSound(matchType) {
        if (matchType === 'line-clear' || matchType === 'color-bomb') {
            this.playSound('special');
        } else {
            this.playSound('match');
        }
    }



    resetUI() {
        // Reset score
        this.updateScore(0);
        
        // Reset checklist and match counts - CLEAR ALL INLINE STYLES
        document.querySelectorAll('.match-counter-item').forEach(item => {
            item.classList.remove('completed', 'has-matches', 'animating');
            // Clear all inline styles
            item.style.border = '';
            item.style.boxShadow = '';
            item.style.background = '';
            
            const silhouette = item.querySelector('.company-silhouette');
            if (silhouette) {
                silhouette.classList.remove('found');
            }
        });
        
        // Reset all match count displays to 0 and clear their styles
        this.gameEngine.companies.forEach(company => {
            const matchCountElement = document.getElementById(`${company}-count`);
            if (matchCountElement) {
                matchCountElement.textContent = '0';
                matchCountElement.style.color = '';
                matchCountElement.style.textShadow = '';
            }
        });
        
        // Reset total matches display
        const totalMatchesElement = document.getElementById('total-matches');
        if (totalMatchesElement) {
            totalMatchesElement.textContent = '0/8';
        }
        
        // Hide completion screen
        const completionScreen = document.getElementById('completionScreen');
        if (completionScreen) {
            completionScreen.style.display = 'none';
        }
        
        // Hide score breakdown
        const scoreBreakdown = document.getElementById('scoreBreakdown');
        if (scoreBreakdown) {
            scoreBreakdown.style.display = 'none';
        }
        
        // Reset GIF to start state
        const sydneyGif = document.getElementById('sydneyGif');
        if (sydneyGif) {
            sydneyGif.src = 'https://raw.githubusercontent.com/burnpiles/ct-sydney-match/main/media/general-sydney-small.gif';
        }
        
        // Reset digital channel display to default state
        this.updateDigitalChannelDisplay(null);
        
        // Clear any active animations - DISABLED
        // const tvScreen = document.querySelector('.tv-screen');
        // if (tvScreen) {
        //     tvScreen.classList.remove('animating');
        // }
        
        // Clear all company glows
        const allCompanies = document.querySelectorAll('.match-counter-item');
        allCompanies.forEach(item => {
            item.classList.remove('animating');
        });
        
        console.log('=== RENDERER: UI completely reset - all inline styles cleared and GIF reset to start state ===');
    }

    showCompletion() {
        const completionScreen = document.getElementById('completionScreen');
        if (completionScreen) {
            completionScreen.style.display = 'flex';
        }
    }

    // Force refresh the board display
    forceRefreshBoard() {
        console.log('=== RENDERER: Force refreshing board ===');
        if (this.gameEngine) {
            // Clear all tiles first
            this.tiles.forEach((tile, index) => {
                tile.textContent = '';
                tile.dataset.company = '';
                tile.classList.remove('matched', 'falling', 'invalid', 'selected', 'highlighted');
                tile.style.transform = '';
                tile.style.transition = '';
                tile.style.background = '';
                tile.style.opacity = '1';
            });
            
            // Then update with current board state
            setTimeout(() => {
                this.updateBoard([...this.gameEngine.board]);
            }, 50);
        }
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
                companyEmojiDisplay.textContent = this.gameEngine.companyEmojis[company];
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
    
    // Force reset animation state and make tiles clickable
    forceResetAnimationState() {
        console.log('=== RENDERER: Force resetting animation state ===');
        
        // Clear all animation states
        this.tiles.forEach(tile => {
            tile.classList.remove('matched', 'falling', 'invalid', 'selected', 'pulsing', 'queued', 'highlighted'); // removed 'animating'
            tile.style.transform = '';
            tile.style.transition = '';
            tile.style.background = '';
            tile.style.opacity = '1';
            tile.style.pointerEvents = 'auto';
        });
        
        // Update board to current state
        this.updateBoard(this.gameEngine.board);
        
        console.log('=== RENDERER: Animation state reset complete ===');
    }

    // Create match-specific particle effects
    createMatchParticles(tile, matchType) {
        const rect = tile.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let colors, count, size;
        
        switch (matchType) {
            case 'match':
                colors = ['#00b894', '#00cec9', '#74b9ff'];
                count = 6;
                size = 4;
                break;
            case 'line-clear':
                colors = ['#6c5ce7', '#a29bfe', '#fd79a8'];
                count = 12;
                size = 5;
                break;
            case 'color-bomb':
                colors = ['#fdcb6e', '#e17055', '#6c5ce7', '#00b894', '#fd79a8'];
                count = 15;
                size = 7;
                break;
            default:
                colors = ['#00b894', '#00cec9'];
                count = 6;
                size = 4;
        }
        
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'match-particle';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';
            particle.style.position = 'absolute';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            
            // Random direction and distance
            const angle = (Math.random() * 360) * (Math.PI / 180);
            const distance = 30 + Math.random() * 50;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            
            // Animate particle
            particle.style.transition = 'all 0.8s ease-out';
            particle.style.transform = `translate(${dx}px, ${dy}px)`;
            particle.style.opacity = '0';
            
            fragment.appendChild(particle);
            
            // Auto-remove particles
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 800);
        }
        
        document.body.appendChild(fragment);
    }

    // Optimized particle system using CSS transforms
    createParticles(x, y) {
        const colors = ['#ffeb3b', '#ff4444', '#4caf50', '#2196f3'];
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            const dx = (Math.random() - 0.5) * 100;
            const dy = (Math.random() - 0.5) * 100;
            particle.style.setProperty('--dx', dx + 'px');
            particle.style.setProperty('--dy', dy + 'px');
            
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
} 