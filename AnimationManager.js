class AnimationManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.particlePool = [];
        this.maxParticles = 50;
        this.animationQueue = [];
        this.isProcessingQueue = false;
        
        this.initParticlePool();
    }

    initParticlePool() {
        // Pre-create particles for better performance
        for (let i = 0; i < this.maxParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.display = 'none';
            document.body.appendChild(particle);
            this.particlePool.push(particle);
        }
    }

    // Queue animations to prevent overlapping
    queueAnimation(animation) {
        console.log('=== ANIMATION MANAGER: queueAnimation called ===');
        console.log('Animation:', animation);
        
        // Only queue animations for new companies (not repeat matches)
        if (animation.type === 'sydney') {
            console.log('=== ANIMATION MANAGER: Queuing Sydney animation for company:', animation.company);
        }
        
        this.animationQueue.push(animation);
        if (!this.isProcessingQueue) {
            this.processAnimationQueue();
        }
    }

    async processAnimationQueue() {
        if (this.isProcessingQueue || this.animationQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        console.log('=== ANIMATION MANAGER: Processing animation queue ===');
        
        while (this.animationQueue.length > 0) {
            const animation = this.animationQueue.shift();
            console.log('=== ANIMATION MANAGER: Executing animation:', animation.type);
            
            // Wait for user to click Continue before resolving
            await this.executeAnimation(animation);
        }
        
        this.isProcessingQueue = false;
        console.log('=== ANIMATION MANAGER: Animation queue complete ===');
        
        // Signal that all animations are complete
        this.signalAnimationsComplete();
    }

    signalAnimationsComplete() {
        console.log('=== ANIMATION MANAGER: All animations complete, signaling game engine ===');
        // This will be called when the animation queue is completely empty
        if (this.renderer && this.renderer.gameEngine) {
            // Small delay to ensure everything is settled
            setTimeout(() => {
                if (this.animationQueue.length === 0) {
                    console.log('=== ANIMATION MANAGER: Confirming no pending animations, game ready ===');
                }
            }, 100);
        }
    }

    async executeAnimation(animation) {
        switch (animation.type) {
            case 'particles':
                return this.createParticles(animation.x, animation.y);
            case 'sydney':
                return new Promise((resolve) => {
                    this._currentAnimationResolve = resolve;
                    this.showSydneyAnimation(animation.company);
                });
            case 'match':
                return this.animateMatch(animation.indices);
            case 'gravity':
                return this.animateGravity(animation.board);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Optimized particle system with object pooling
    createParticles(x, y) {
        const colors = ['#ffeb3b', '#ff4444', '#4caf50', '#2196f3'];
        const particleCount = Math.min(8, this.particlePool.length);
        
        requestAnimationFrame(() => {
            for (let i = 0; i < particleCount; i++) {
                const particle = this.particlePool[i];
                if (!particle) continue;
                
                // Reset particle
                particle.style.display = 'block';
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                particle.style.transform = 'scale(1) translate(0, 0)';
                particle.style.opacity = '1';
                
                // Set animation properties
                const dx = (Math.random() - 0.5) * 100;
                const dy = (Math.random() - 0.5) * 100;
                particle.style.setProperty('--dx', dx + 'px');
                particle.style.setProperty('--dy', dy + 'px');
                
                // Animate using CSS transforms for better performance
                requestAnimationFrame(() => {
                    particle.style.transform = `scale(0) translate(${dx}px, ${dy}px)`;
                    particle.style.opacity = '0';
                });
                
                // Hide particle after animation
                setTimeout(() => {
                    particle.style.display = 'none';
                }, 1000);
            }
        });
    }

    // Animate match with optimized rendering
    animateMatch(indices) {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                indices.forEach(index => {
                    const tile = this.renderer.tiles[index];
                    if (tile) {
                        tile.classList.add('matched');
                        
                        // Create particles at tile position
                        const rect = tile.getBoundingClientRect();
                        this.createParticles(
                            rect.left + rect.width / 2,
                            rect.top + rect.height / 2
                        );
                    }
                });
                
                setTimeout(resolve, 800);
            });
        });
    }

    // Animate gravity with smooth transitions
    animateGravity(board) {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                this.renderer.tiles.forEach((tile, index) => {
                    const company = board[index];
                    if (company) {
                        tile.textContent = this.renderer.gameEngine.companyEmojis[company];
                        tile.dataset.company = company;
                    }
                });
                
                setTimeout(resolve, 100);
            });
        });
    }

    // Show Sydney animation with pre-rendered sprites
    showSydneyAnimation(company) {
        console.log('=== ANIMATION MANAGER: showSydneyAnimation called ===');
        console.log('Company:', company);
        
        return new Promise((resolve) => {
            // Use the new inline animation area instead of overlay
            const animationArea = document.getElementById('animationArea');
            const companyGifInline = document.getElementById('companyGifInline');
            const animationTextInline = document.getElementById('animationTextInline');
            const companyWinBannerInline = document.getElementById('companyWinBannerInline');
            
            console.log('showSydneyAnimation called for company:', company);
            console.log('Elements found:', { animationArea, companyGifInline, animationTextInline, companyWinBannerInline });
            
            if (!animationArea || !animationTextInline) {
                console.log('Missing required elements, resolving early');
                resolve();
                return;
            }
            
            // Set the animation text
            animationTextInline.textContent = this.renderer.gameEngine.animations[company].text;
            
            // Show the animation area
            animationArea.style.display = 'block';
            
            // Show the company win banner
            if (companyWinBannerInline) {
                companyWinBannerInline.textContent = `${this.renderer.gameEngine.companyEmojis[company]} ${company.charAt(0).toUpperCase() + company.slice(1)} went viral!`;
                companyWinBannerInline.style.display = 'block';
            }
            
            // Initially hide the GIF
            if (companyGifInline) {
                companyGifInline.style.display = 'none';
                console.log('GIF initially hidden');
            }
            
            // Try to load and show GIF
            if (companyGifInline) {
                console.log('Attempting to load GIF for company:', company);
                
                // Map company names to GIF filenames
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
                
                const gifFilename = gifMap[company];
                if (gifFilename) {
                    // Check if we have a preloaded URL for this company
                    let gifUrl = null;
                    if (window.gameManager && window.gameManager.preloadedGifs && window.gameManager.preloadedGifs[company]) {
                        gifUrl = window.gameManager.preloadedGifs[company];
                        console.log('Using preloaded GIF URL:', gifUrl);
                    } else {
                        // Fallback to trying multiple URL formats
                        const gifUrls = [
                            `https://raw.githubusercontent.com/burnpiles/ct-sydney-match/main/media/${gifFilename}`,
                            `https://github.com/burnpiles/ct-sydney-match/raw/main/media/${gifFilename}`,
                            `https://cdn.jsdelivr.net/gh/burnpiles/ct-sydney-match@main/media/${gifFilename}`,
                            `https://unpkg.com/@burnpiles/ct-sydney-match@main/media/${gifFilename}`,
                            `https://cdn.jsdelivr.net/npm/@burnpiles/ct-sydney-match@main/media/${gifFilename}`
                        ];
                        
                        console.log('Trying GIF URLs:', gifUrls);
                        
                        // Try the first URL initially
                        let currentUrlIndex = 0;
                        const tryNextUrl = () => {
                            if (currentUrlIndex < gifUrls.length) {
                                const url = gifUrls[currentUrlIndex];
                                console.log('Trying URL:', url);
                                companyGifInline.src = url;
                                currentUrlIndex++;
                            } else {
                                console.error('All GIF URLs failed to load');
                                // Create a simple text-based fallback
                                const fallbackDiv = document.createElement('div');
                                fallbackDiv.style.cssText = `
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    width: 200px;
                                    height: 200px;
                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                    border-radius: 15px;
                                    color: white;
                                    font-size: 24px;
                                    font-weight: bold;
                                    text-align: center;
                                    padding: 20px;
                                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                                `;
                                fallbackDiv.textContent = `Sydney + ${company.toUpperCase()}`;
                                
                                // Find the pixel-scene container and add the fallback
                                const pixelScene = document.querySelector('.pixel-scene');
                                if (pixelScene) {
                                    pixelScene.appendChild(fallbackDiv);
                                    console.log('Created fallback display for', company);
                                }
                                
                                // Resolve after fallback
                                if (!hasResolved) {
                                    hasResolved = true;
                                    setTimeout(resolve, 2000);
                                }
                            }
                        };
                        
                        // Set up error handling for fallback URLs
                        companyGifInline.onerror = () => {
                            console.error('Failed to load GIF, trying next URL');
                            tryNextUrl();
                        };
                        
                        // Track if we've resolved to prevent double resolution
                        let hasResolved = false;
                        
                                                                    companyGifInline.onload = () => {
                            console.log(`GIF loaded successfully for ${company}`);
                            // Show the GIF when it loads successfully
                            companyGifInline.style.display = 'block';
                            console.log(`GIF displayed successfully for ${company}`);
                            // Resolve the animation Promise when GIF is displayed
                            if (!hasResolved) {
                                hasResolved = true;
                                resolve();
                            }
                        };
                        
                        // Start trying URLs
                        tryNextUrl();
                        return; // Exit early since we're using the fallback system
                    }
                    
                    // Use the preloaded URL
                    console.log(`Loading preloaded GIF for ${company}:`, gifUrl);
                    companyGifInline.src = gifUrl;
                    
                    // Set up error handling for preloaded URL
                    companyGifInline.onerror = () => {
                        console.error(`Failed to load preloaded GIF for ${company}:`, gifUrl);
                        // Resolve after fallback
                        setTimeout(resolve, 1000);
                    };
                    
                    companyGifInline.onload = () => {
                        console.log(`Preloaded GIF loaded successfully for ${company}`);
                        // Show the GIF when it loads successfully
                        companyGifInline.style.display = 'block';
                        console.log(`GIF displayed successfully for ${company}`);
                        // Resolve the animation Promise when GIF is displayed
                        resolve();
                    };
                    
                    // Add timeout fallback in case GIF takes too long to load
                    setTimeout(() => {
                        if (companyGifInline.style.display === 'none') {
                            console.log('GIF loading timeout, falling back to canvas');
                            // Resolve after timeout fallback
                            setTimeout(resolve, 1000);
                        }
                    }, 3000); // 3 second timeout for preloaded GIFs
                } else {
                    console.log('No GIF filename found for company:', company);
                    // Create fallback display
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.style.cssText = `
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 200px;
                        height: 200px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 15px;
                        color: white;
                        font-size: 24px;
                        font-weight: bold;
                        text-align: center;
                        padding: 20px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    `;
                    fallbackDiv.textContent = `Sydney + ${company.toUpperCase()}`;
                    
                    const pixelScene = document.querySelector('.pixel-scene');
                    if (pixelScene) {
                        pixelScene.appendChild(fallbackDiv);
                        console.log('Created fallback display for', company);
                    }
                    
                    // Resolve after fallback
                    setTimeout(resolve, 2000);
                }
            } else {
                console.log('Company GIF element not found!');
                // Create fallback display
                const fallbackDiv = document.createElement('div');
                fallbackDiv.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 200px;
                    height: 200px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 15px;
                    color: white;
                    font-size: 24px;
                    font-weight: bold;
                    text-align: center;
                    padding: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                `;
                fallbackDiv.textContent = `Sydney + ${company.toUpperCase()}`;
                
                const pixelScene = document.querySelector('.pixel-scene');
                if (pixelScene) {
                    pixelScene.appendChild(fallbackDiv);
                    console.log('Created fallback display for', company);
                }
                
                // Resolve after fallback
                setTimeout(resolve, 2000);
            }
            
            // Trigger flash effect
            if (flash) {
                setTimeout(() => {
                    flash.style.animation = 'flash 0.3s ease-out';
                    setTimeout(() => {
                        flash.style.animation = '';
                    }, 300);
                }, 500);
            }
            
            // Resolve immediately when GIF is displayed, or after a short delay for canvas fallback
            if (companyGifInline && companyGifInline.style.display === 'block') {
                // GIF is showing, resolve immediately
                resolve();
            } else if (canvas && canvas.style.display === 'block') {
                // Canvas is showing, resolve after a short delay
                setTimeout(resolve, 1000);
            } else {
                // Fallback: resolve after 1.5 seconds
                setTimeout(resolve, 1500);
            }

            const winBanner = document.getElementById('companyWinBanner');
            const emoji = this.renderer.gameEngine.companyEmojis[company] || '';
            if (winBanner) {
                winBanner.innerHTML = `<span class='emoji'>${emoji}</span> <span>${company.charAt(0).toUpperCase() + company.slice(1)}</span> <span class='emoji'>${emoji}</span>`;
                winBanner.style.display = 'flex';
            }
        });
    }

    // Close animation overlay
    closeAnimation() {
        console.log('=== ANIMATION MANAGER: closeAnimation called ===');
        
        // Use the new inline animation area elements
        const animationArea = document.getElementById('animationArea');
        const companyGifInline = document.getElementById('companyGifInline');
        const companyWinBannerInline = document.getElementById('companyWinBannerInline');
        
        if (animationArea) {
            animationArea.style.display = 'none';
            console.log('Animation area hidden');
        }
        
        // Reset all animation elements
        if (companyGifInline) {
            companyGifInline.style.display = 'none';
            companyGifInline.src = ''; // Clear the src to prevent caching issues
            console.log('Company GIF inline reset to hidden and src cleared');
        }
        
        if (companyWinBannerInline) {
            companyWinBannerInline.style.display = 'none';
            companyWinBannerInline.textContent = '';
            console.log('Company win banner inline reset to hidden');
        }
        
        // Continue processing the animation queue only after user clicks Continue
        if (this._currentAnimationResolve) {
            this._currentAnimationResolve();
            this._currentAnimationResolve = null;
        }
        
        // Clean up game engine state when user clicks Continue
        if (this.renderer.gameEngine) {
            console.log('=== ANIMATION MANAGER: Cleaning up game engine state ===');
            this.renderer.gameEngine.applyGravityAfterAnimations();
        }
    }

    // Show completion screen with smooth transition
    showCompletion() {
        return new Promise((resolve) => {
            const completionScreen = document.getElementById('completionScreen');
            if (completionScreen) {
                completionScreen.style.display = 'flex';
                completionScreen.style.opacity = '0';
                
                requestAnimationFrame(() => {
                    completionScreen.style.transition = 'opacity 0.5s ease-in-out';
                    completionScreen.style.opacity = '1';
                });
            }
            setTimeout(resolve, 500);
        });
    }

    // Utility function for smooth animations
    smoothTransition(element, properties, duration = 300) {
        return new Promise((resolve) => {
            element.style.transition = `all ${duration}ms ease-in-out`;
            
            requestAnimationFrame(() => {
                Object.assign(element.style, properties);
            });
            
            setTimeout(() => {
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }

    // Clean up resources
    cleanup() {
        // Remove particle pool
        this.particlePool.forEach(particle => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });
        this.particlePool = [];
        
        // Clear animation queue
        this.animationQueue = [];
        this.isProcessingQueue = false;
    }
} 