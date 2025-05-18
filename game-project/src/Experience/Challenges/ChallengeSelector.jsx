import React from 'react';
import './ChallengeSelector.css';

const challenges = [
    {
        id: 'coin_collector',
        title: 'Coleccionista de Monedas',
        description: '¡Recolecta 10 monedas en 60 segundos!',
        timeLimit: 60,
        target: 10,
        type: 'coins'
    },
    {
        id: 'obstacle_avoidance',
        title: 'Esquivador Experto',
        description: '¡No toques ningún obstáculo durante 45 segundos!',
        timeLimit: 45,
        type: 'avoidance'
    },
    {
        id: 'speed_runner',
        title: 'Corredor Veloz',
        description: '¡Llega al punto objetivo antes de que se acabe el tiempo!',
        timeLimit: 30,
        type: 'speed'
    }
];

const ChallengeSelector = ({ onSelectChallenge }) => {
    return (
        <div className="challenge-selector">
            <h2>Selecciona un Desafío</h2>
            <div className="challenges-grid">
                {challenges.map((challenge) => (
                    <div 
                        key={challenge.id} 
                        className="challenge-card"
                        onClick={() => onSelectChallenge(challenge)}
                    >
                        <h3>{challenge.title}</h3>
                        <p>{challenge.description}</p>
                        <div className="challenge-info">
                            <span>Tiempo: {challenge.timeLimit}s</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChallengeSelector; 