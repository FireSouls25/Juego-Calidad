import * as THREE from 'three';

export default class ChallengeManager {
    constructor(experience) {
        this.experience = experience;
        this.currentChallenge = null;
        this.timeLeft = 0;
        this.progress = 0;
        this.isActive = false;
        this.startTime = 0;
        this.stats = {
            coins: 0,
            timeWithoutCollision: 0,
            completionTime: 0
        };
    }

    startChallenge(challenge) {
        this.currentChallenge = challenge;
        this.timeLeft = challenge.timeLimit;
        this.progress = 0;
        this.isActive = true;
        this.startTime = Date.now();
        this.stats = {
            coins: 0,
            timeWithoutCollision: 0,
            completionTime: 0
        };

        // Set up challenge-specific logic
        switch (challenge.type) {
            case 'coins':
                this.setupCoinChallenge();
                break;
            case 'avoidance':
                this.setupAvoidanceChallenge();
                break;
            case 'speed':
                this.setupSpeedChallenge();
                break;
        }
    }

    setupCoinChallenge() {
        // Reset coin count
        this.stats.coins = 0;
        // Add event listener for coin collection
        this.experience.world.on('coinCollected', () => {
            this.stats.coins++;
            this.progress = this.stats.coins;
            if (this.stats.coins >= this.currentChallenge.target) {
                this.completeChallenge(true);
            }
        });
    }

    setupAvoidanceChallenge() {
        // Reset collision time
        this.stats.timeWithoutCollision = 0;
        // Add event listener for collisions
        this.experience.world.on('collision', () => {
            this.completeChallenge(false);
        });
    }

    setupSpeedChallenge() {
        // Generate random target position
        const targetPosition = this.generateRandomTarget();
        this.experience.world.setTargetPosition(targetPosition);
        
        // Add event listener for reaching target
        this.experience.world.on('targetReached', () => {
            this.stats.completionTime = (Date.now() - this.startTime) / 1000;
            this.completeChallenge(true);
        });
    }

    generateRandomTarget() {
        // Generate a random position within the game world bounds
        const x = Math.random() * 100 - 50;
        const z = Math.random() * 100 - 50;
        return new THREE.Vector3(x, 0, z);
    }

    update() {
        if (!this.isActive) return;

        // Update time left
        const currentTime = Date.now();
        this.timeLeft = Math.max(0, this.currentChallenge.timeLimit - (currentTime - this.startTime) / 1000);

        // Update challenge-specific stats
        if (this.currentChallenge.type === 'avoidance') {
            this.stats.timeWithoutCollision = (currentTime - this.startTime) / 1000;
        }

        // Check for time out
        if (this.timeLeft <= 0) {
            this.completeChallenge(false);
        }
    }

    completeChallenge(success) {
        this.isActive = false;
        this.experience.world.emit('challengeComplete', {
            challenge: this.currentChallenge,
            success,
            stats: this.stats
        });
    }

    getChallengeState() {
        return {
            challenge: this.currentChallenge,
            timeLeft: Math.ceil(this.timeLeft),
            progress: this.progress,
            isActive: this.isActive
        };
    }
} 