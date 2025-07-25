class TouchHandler {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.lastTouchTime = 0;
        this.touchThreshold = 10; // Minimum distance for swipe
        this.tapThreshold = 300; // Maximum time for tap
        this.isTouchActive = false;
        this.currentTouchTile = null;
        this.swipeStartTile = null;
        this.isDragging = false;
        this.draggedTile = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.originalPosition = null;
        
        this.init();
    }

    init() {
        this.setupTouchListeners();
        this.setupKeyboardListeners();
    }

    setupTouchListeners() {
        const gameBoard = document.getElementById('gameBoard');
        if (!gameBoard) return;

        // Touch start
        gameBoard.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        }, { passive: false });

        // Touch move
        gameBoard.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        }, { passive: false });

        // Touch end
        gameBoard.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });

        // Touch cancel
        gameBoard.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.handleTouchCancel(e);
        }, { passive: false });
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
    }

    handleTouchStart(e) {
        if (e.touches.length !== 1) return; // Only handle single touch
        
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
        this.isTouchActive = true;
        this.isDragging = false;

        console.log('Touch start at:', touch.clientX, touch.clientY);

        // Find the tile under the touch
        const tile = this.getElementFromPoint(touch.clientX, touch.clientY);
        if (tile && tile.classList.contains('tile')) {
            const index = parseInt(tile.dataset.index);
            this.currentTouchTile = index;
            this.swipeStartTile = index;
            this.draggedTile = tile;
            
            console.log('Touched tile index:', index);
            
            // Calculate offset from touch to tile top-left corner
            const rect = tile.getBoundingClientRect();
            this.dragOffsetX = touch.clientX - rect.left;
            this.dragOffsetY = touch.clientY - rect.top;
        } else {
            console.log('No tile found under touch');
        }
    }

    handleTouchMove(e) {
        if (!this.isTouchActive || e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - this.touchStartX);
        const deltaY = Math.abs(touch.clientY - this.touchStartY);
        
        // Start dragging if moved enough
        if (!this.isDragging && (deltaX > this.touchThreshold || deltaY > this.touchThreshold)) {
            console.log('Starting drag, delta:', deltaX, deltaY);
            this.startDragging();
        }
        
        // Update tile position if dragging
        if (this.isDragging && this.draggedTile) {
            this.updateDraggedTilePosition(touch.clientX, touch.clientY);
        }
    }

    startDragging() {
        if (!this.draggedTile) return;
        
        this.isDragging = true;
        
        // Store original position and styles
        const rect = this.draggedTile.getBoundingClientRect();
        this.originalPosition = {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        };
        
        // Create a clone for dragging (keeps original in place)
        this.createDragClone();
        
        // Add haptic feedback
        this.triggerHapticFeedback();
    }

    createDragClone() {
        if (!this.draggedTile) return;
        
        // Create a simple div for dragging (not a clone to avoid CSS inheritance)
        this.dragClone = document.createElement('div');
        this.dragClone.textContent = this.draggedTile.textContent;
        this.dragClone.style.position = 'fixed';
        this.dragClone.style.zIndex = '1000';
        this.dragClone.style.fontSize = '28px';
        this.dragClone.style.display = 'flex';
        this.dragClone.style.alignItems = 'center';
        this.dragClone.style.justifyContent = 'center';
        this.dragClone.style.width = '50px';
        this.dragClone.style.height = '50px';
        this.dragClone.style.borderRadius = '12px';
        this.dragClone.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.dragClone.style.border = '1px solid rgba(0, 255, 65, 0.2)';
        this.draggedTile.style.opacity = '0.3'; // Make original semi-transparent
        
        // Add clone to body
        document.body.appendChild(this.dragClone);
        
        // Set initial position
        this.updateDraggedTilePosition(this.touchStartX, this.touchStartY);
    }

    updateDraggedTilePosition(clientX, clientY) {
        if (!this.dragClone) return;
        
        // Calculate new position with offset
        const newX = clientX - this.dragOffsetX;
        const newY = clientY - this.dragOffsetY;
        
        // Apply position and scaling
        this.dragClone.style.left = newX + 'px';
        this.dragClone.style.top = newY + 'px';
        this.dragClone.style.transform = 'scale(1.1)';
        this.dragClone.style.boxShadow = '0 0 8px rgba(0, 255, 65, 0.6)';
    }

    handleTouchEnd(e) {
        if (!this.isTouchActive) return;
        
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - this.touchStartTime;
        const deltaX = Math.abs(e.changedTouches[0].clientX - this.touchStartX);
        const deltaY = Math.abs(e.changedTouches[0].clientY - this.touchStartY);
        
        console.log('Touch end - duration:', touchDuration, 'delta:', deltaX, deltaY, 'isDragging:', this.isDragging);
        
        if (this.isDragging) {
            // Handle drag end
            console.log('Handling drag end');
            this.handleDragEnd(e);
        } else {
            // Check if it's a valid tap
            if (touchDuration <= this.tapThreshold && deltaX <= this.touchThreshold && deltaY <= this.touchThreshold) {
                console.log('Handling tap');
                this.handleTap(e);
            } else {
                console.log('Touch was not a tap (too long or moved too much)');
            }
            // Reset state immediately for taps
            this.resetTouchState();
        }
    }

    handleDragEnd(e) {
        if (!this.draggedTile) return;
        
        console.log('Drag end - start tile:', this.swipeStartTile);
        
        // Store the swipe indices immediately to preserve them
        const preservedFromIndex = this.swipeStartTile;
        
        // Temporarily hide the clone to detect the target tile properly
        if (this.dragClone) {
            this.dragClone.style.display = 'none';
        }
        
        // Find the tile under the final touch position
        const finalTouch = e.changedTouches[0];
        const targetTile = this.getElementFromPoint(finalTouch.clientX, finalTouch.clientY);
        
        // Show the clone again
        if (this.dragClone) {
            this.dragClone.style.display = 'block';
        }
        
        if (targetTile && targetTile.classList.contains('tile')) {
            const targetIndex = parseInt(targetTile.dataset.index);
            console.log('Target tile index:', targetIndex);
            
            // Check if it's a valid swipe (adjacent tiles and not the same tile)
            if (targetIndex !== preservedFromIndex && this.gameEngine.isAdjacent(preservedFromIndex, targetIndex)) {
                console.log('Valid swipe detected:', preservedFromIndex, '->', targetIndex);
                // Valid swipe - animate to target and process
                this.animateToTarget(targetTile, (fromIndex, toIndex) => {
                    console.log('Animation complete, processing swap with preserved indices:', fromIndex, '->', toIndex);
                    this.gameEngine.handleSwipe(fromIndex, toIndex);
                    // Reset state AFTER the game logic is processed
                    this.resetTouchState();
                });
            } else {
                console.log('Invalid swipe - not adjacent or same tile');
                // Invalid swipe - animate back to original position
                this.animateBackToOriginal();
                // Reset state immediately for invalid swipes
                this.resetTouchState();
            }
        } else {
            console.log('No target tile found under final touch position');
            // No target tile - animate back to original position
            this.animateBackToOriginal();
            // Reset state immediately for no target
            this.resetTouchState();
        }
    }

    animateToTarget(targetTile, callback) {
        if (!this.dragClone || !targetTile) return;
        
        const targetRect = targetTile.getBoundingClientRect();
        
        // Store the indices before animation to ensure they're preserved
        const fromIndex = this.swipeStartTile;
        const toIndex = parseInt(targetTile.dataset.index);
        
        console.log('Starting animation with indices:', fromIndex, '->', toIndex);
        
        // Animate clone to target position
        this.dragClone.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.dragClone.style.left = targetRect.left + 'px';
        this.dragClone.style.top = targetRect.top + 'px';
        this.dragClone.style.transform = 'scale(1)';
        
        setTimeout(() => {
            console.log('Animation complete, removing clone and processing swap');
            console.log('Indices at callback time:', fromIndex, '->', toIndex);
            this.removeDragClone();
            if (callback) {
                // Pass the preserved indices to the callback
                callback(fromIndex, toIndex);
            }
        }, 300);
    }

    animateBackToOriginal() {
        if (!this.dragClone || !this.originalPosition) return;
        
        // Animate clone back to original position
        this.dragClone.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.dragClone.style.left = this.originalPosition.left + 'px';
        this.dragClone.style.top = this.originalPosition.top + 'px';
        this.dragClone.style.transform = 'scale(1)';
        
        setTimeout(() => {
            this.removeDragClone();
        }, 300);
    }

    removeDragClone() {
        if (this.dragClone) {
            console.log('Removing drag clone');
            document.body.removeChild(this.dragClone);
            this.dragClone = null;
        }
        
        if (this.draggedTile) {
            console.log('Restoring original tile opacity');
            this.draggedTile.style.opacity = '1'; // Restore original opacity
        }
    }

    resetTouchState() {
        console.log('resetTouchState called - clearing swipeStartTile from:', this.swipeStartTile);
        this.isTouchActive = false;
        this.isDragging = false;
        this.currentTouchTile = null;
        this.swipeStartTile = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.originalPosition = null;
        
        // Clean up any remaining clone
        this.removeDragClone();
    }

    handleTouchCancel(e) {
        if (this.isDragging) {
            this.animateBackToOriginal();
        }
        this.resetTouchState();
    }

    handleTap(e) {
        const touch = e.changedTouches[0];
        const tile = this.getElementFromPoint(touch.clientX, touch.clientY);
        
        console.log('Tap detected at:', touch.clientX, touch.clientY);
        
        if (tile && tile.classList.contains('tile')) {
            const index = parseInt(tile.dataset.index);
            console.log('Tapped tile index:', index);
            
            // Add haptic feedback
            this.triggerHapticFeedback();
            
            // Process the tile selection (click logic)
            this.gameEngine.selectTile(index);
        } else {
            console.log('No tile found under tap');
        }
    }

    handleSwipe(fromIndex, toIndex) {
        if (fromIndex === null || toIndex === null) return;
        
        console.log('=== TOUCH HANDLER: handleSwipe called:', fromIndex, '->', toIndex, 'isAnimating:', this.gameEngine.isAnimating);
        
        if (this.gameEngine.isAnimating) {
            console.log('=== TOUCH HANDLER: Game is animating, rejecting swipe ===');
            return;
        }
        
        // Add haptic feedback
        this.triggerHapticFeedback();
        
        // Process the swipe
        this.gameEngine.handleSwipe(fromIndex, toIndex);
    }

    handleKeyDown(e) {
        // Keyboard navigation for accessibility
        const currentTile = document.querySelector('.tile.selected');
        if (!currentTile) return;
        
        const currentIndex = parseInt(currentTile.dataset.index);
        let newIndex = currentIndex;
        
        switch (e.key) {
            case 'ArrowUp':
                newIndex = Math.max(0, currentIndex - 8);
                break;
            case 'ArrowDown':
                newIndex = Math.min(63, currentIndex + 8);
                break;
            case 'ArrowLeft':
                newIndex = Math.max(0, currentIndex - 1);
                break;
            case 'ArrowRight':
                newIndex = Math.min(63, currentIndex + 1);
                break;
            case 'Enter':
            case ' ':
                this.gameEngine.selectTile(currentIndex);
                return;
            default:
                return;
        }
        
        if (newIndex !== currentIndex) {
            e.preventDefault();
            this.gameEngine.selectTile(newIndex);
        }
    }

    getElementFromPoint(x, y) {
        // Use document.elementFromPoint for better performance
        return document.elementFromPoint(x, y);
    }

    triggerHapticFeedback() {
        // Haptic feedback for mobile devices
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // iOS haptic feedback
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.hapticFeedback) {
            window.webkit.messageHandlers.hapticFeedback.postMessage('light');
        }
    }

    // Swipe detection for future enhancements
    detectSwipe(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance < this.touchThreshold) return null;
        
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        if (angle >= -45 && angle <= 45) return 'right';
        if (angle >= 45 && angle <= 135) return 'down';
        if (angle >= 135 || angle <= -135) return 'left';
        if (angle >= -135 && angle <= -45) return 'up';
        
        return null;
    }

    // Debounce function to prevent rapid firing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function for performance
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Clean up event listeners
    cleanup() {
        const gameBoard = document.getElementById('gameBoard');
        if (gameBoard) {
            gameBoard.removeEventListener('touchstart', this.handleTouchStart);
            gameBoard.removeEventListener('touchmove', this.handleTouchMove);
            gameBoard.removeEventListener('touchend', this.handleTouchEnd);
            gameBoard.removeEventListener('touchcancel', this.handleTouchCancel);
        }
        
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Clean up any remaining clone
        this.removeDragClone();
    }
} 