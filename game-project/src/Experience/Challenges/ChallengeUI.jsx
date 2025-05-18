import React from 'react';
import './ChallengeUI.css';

const ChallengeUI = ({ challenge, timeLeft, progress }) => {
    const getProgressText = () => {
        switch (challenge.type) {
            case 'coins':
                return `Monedas: ${progress}/${challenge.target}`;
            case 'avoidance':
                return '¡No toques los obstáculos!';
            case 'speed':
                return '¡Llega al punto objetivo!';
            default:
                return '';
        }
    };

    return (
        <div className="challenge-ui">
            <div className="challenge-header">
                <h3>{challenge.title}</h3>
                <div className="timer">
                    Tiempo: {timeLeft}s
                </div>
            </div>
            <div className="challenge-progress">
                {getProgressText()}
            </div>
        </div>
    );
};

export default ChallengeUI; 