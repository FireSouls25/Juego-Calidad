// src/App.jsx
import { useEffect, useRef, useState } from 'react';
import Experience from './Experience/Experience';
import ChallengeSelector from './Experience/Challenges/ChallengeSelector';
import ChallengeUI from './Experience/Challenges/ChallengeUI';
import ChallengeResults from './Experience/Challenges/ChallengeResults';

const App = () => {
  const canvasRef = useRef();
  const [experience, setExperience] = useState(null);
  const [challengeState, setChallengeState] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const exp = new Experience(canvasRef.current);
    setExperience(exp);

    // Listen for challenge state updates
    const updateInterval = setInterval(() => {
      if (exp.challengeManager) {
        const state = exp.challengeManager.getChallengeState();
        if (state.isActive) {
          setChallengeState(state);
        }
      }
    }, 100);

    // Listen for challenge completion
    exp.world?.on('challengeComplete', (data) => {
      setResults(data);
      setShowResults(true);
    });

    return () => {
      clearInterval(updateInterval);
    };
  }, []);

  const handleSelectChallenge = (challenge) => {
    experience?.startChallenge(challenge.id);
  };

  const handleRetry = () => {
    setShowResults(false);
    experience?.startChallenge(results.challenge.id);
  };

  const handleNewChallenge = () => {
    setShowResults(false);
    experience?.showChallengeSelector();
  };

  return (
    <>
      <canvas ref={canvasRef} className="webgl" />
      {!challengeState && !showResults && (
        <ChallengeSelector onSelectChallenge={handleSelectChallenge} />
      )}
      {challengeState && !showResults && (
        <ChallengeUI
          challenge={challengeState.challenge}
          timeLeft={challengeState.timeLeft}
          progress={challengeState.progress}
        />
      )}
      {showResults && results && (
        <ChallengeResults
          challenge={results.challenge}
          success={results.success}
          stats={results.stats}
          onRetry={handleRetry}
          onSelectNew={handleNewChallenge}
        />
      )}
    </>
  );
};

export default App;
