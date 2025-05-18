import React from 'react';
import './ChallengeResults.css';

const ChallengeResults = ({ challenge, success, stats, onRetry, onSelectNew }) => {
    const getResultMessage = () => {
        if (success) {
            return '¡Desafío Completado!';
        }
        return '¡Desafío Fallido!';
    };

    const getStatsText = () => {
        switch (challenge.type) {
            case 'coins':
                return `Monedas recolectadas: ${stats.coins}`;
            case 'avoidance':
                return `Tiempo sin tocar obstáculos: ${stats.timeWithoutCollision}s`;
            case 'speed':
                return `Tiempo de llegada: ${stats.completionTime}s`;
            default:
                return '';
        }
    };

    return (
        <div className="challenge-results">
            <div className="results-content">
                <h2>{getResultMessage()}</h2>
                <div className="challenge-info">
                    <h3>{challenge.title}</h3>
                    <p>{challenge.description}</p>
                </div>
                <div className="stats">
                    <h4>Estadísticas:</h4>
                    <p>{getStatsText()}</p>
                </div>
                <div className="actions">
                    <button onClick={onRetry} className="retry-btn">
                        Reintentar
                    </button>
                    <button onClick={onSelectNew} className="new-challenge-btn">
                        Nuevo Desafío
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChallengeResults; 