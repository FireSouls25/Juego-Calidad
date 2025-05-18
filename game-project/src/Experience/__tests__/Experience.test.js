import { jest } from '@jest/globals';
import Experience from '../Experience';
import * as THREE from 'three';

// Mock dependencies
jest.mock('three');
jest.mock('../Utils/Debug');
jest.mock('../Utils/Sizes');
jest.mock('../Utils/Time');
jest.mock('../Utils/ModalManager');
jest.mock('../World/World');
jest.mock('../Utils/Resources');
jest.mock('../Utils/Raycaster');
jest.mock('../Utils/KeyboardControls');
jest.mock('../Utils/GameTracker');
jest.mock('../Utils/Physics');
jest.mock('../Challenges/ChallengeManager');

describe('Experience', () => {
    let mockCanvas;
    let experience;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Create mock canvas
        mockCanvas = document.createElement('canvas');
        
        // Mock THREE.Scene
        THREE.Scene.mockImplementation(() => ({
            traverse: jest.fn(),
            background: null
        }));

        // Create instance
        experience = new Experience(mockCanvas);
    });

    afterEach(() => {
        // Clean up
        if (experience) {
            experience.destroy();
        }
    });

    test('should create a singleton instance', () => {
        const instance1 = new Experience(mockCanvas);
        const instance2 = new Experience(mockCanvas);
        expect(instance1).toBe(instance2);
    });

    test('should initialize core components', () => {
        expect(experience.debug).toBeDefined();
        expect(experience.sizes).toBeDefined();
        expect(experience.time).toBeDefined();
        expect(experience.scene).toBeDefined();
        expect(experience.physics).toBeDefined();
        expect(experience.keyboard).toBeDefined();
    });

    test('should initialize challenge system', () => {
        expect(experience.challengeManager).toBeDefined();
    });

    test('should handle challenge selection', () => {
        const challengeId = 'coin_collector';
        experience.startChallenge(challengeId);
        expect(experience.challengeManager.startChallenge).toHaveBeenCalled();
        expect(experience.world.resetForChallenge).toHaveBeenCalled();
    });

    test('should show challenge results', () => {
        const mockData = {
            challenge: { id: 'test', title: 'Test Challenge' },
            success: true,
            stats: { coins: 10 }
        };
        
        experience.showChallengeResults(mockData);
        expect(experience.modal.show).toHaveBeenCalled();
    });

    test('should handle window resize', () => {
        const resizeEvent = new Event('resize');
        window.dispatchEvent(resizeEvent);
        expect(experience.camera.resize).toHaveBeenCalled();
        expect(experience.renderer.resize).toHaveBeenCalled();
    });

    test('should handle audio context', () => {
        experience.resumeAudioContext();
        // Add assertions based on your audio context implementation
    });

    test('should toggle walk mode', () => {
        experience.toggleWalkMode();
        expect(experience.isThirdPerson).toBe(true);
        
        experience.toggleWalkMode();
        expect(experience.isThirdPerson).toBe(false);
    });

    test('should update game state', () => {
        const mockDelta = 0.016;
        experience.update(mockDelta);
        expect(experience.world.update).toHaveBeenCalledWith(mockDelta);
        expect(experience.renderer.update).toHaveBeenCalled();
        expect(experience.physics.update).toHaveBeenCalledWith(mockDelta);
        expect(experience.challengeManager.update).toHaveBeenCalled();
    });
}); 