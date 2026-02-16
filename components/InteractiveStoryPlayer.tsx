
import React, { useState } from 'react';
import type { StoryScenario, StoryScene } from '../types';
import { SparklesIcon, CloseIcon } from './Icons';

interface InteractiveStoryPlayerProps {
    scenario: StoryScenario;
    onClose: () => void;
}

export const InteractiveStoryPlayer: React.FC<InteractiveStoryPlayerProps> = ({ scenario, onClose }) => {
    const [currentSceneId, setCurrentSceneId] = useState(scenario.initialSceneId);
    const [history, setHistory] = useState<string[]>([scenario.initialSceneId]);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const currentScene = scenario.scenes.find(s => s.id === currentSceneId);

    const handleChoice = (nextSceneId: string, feedbackText: string | undefined) => {
        if (feedbackText) {
            setFeedback(feedbackText);
            // Wait for user to read feedback before moving
            return; 
        }
        moveToScene(nextSceneId);
    };

    const continueAfterFeedback = (nextSceneId: string) => {
        setFeedback(null);
        moveToScene(nextSceneId);
    };

    const moveToScene = (nextSceneId: string) => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentSceneId(nextSceneId);
            setHistory(prev => [...prev, nextSceneId]);
            setIsTransitioning(false);
        }, 300); // Short fade out/in
    };

    const handleRestart = () => {
        setFeedback(null);
        setCurrentSceneId(scenario.initialSceneId);
        setHistory([scenario.initialSceneId]);
    };

    if (!currentScene) return <div>Error: Scene not found</div>;

    // Determine pending move from feedback
    const pendingChoice = currentScene.choices.find(c => c.feedback === feedback);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-gray-700 relative">
                
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-600 rounded-lg">
                            <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-bold text-lg drop-shadow-md">{scenario.title}</span>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Visual Area */}
                <div className="flex-1 relative bg-black">
                    <div className={`absolute inset-0 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                        {currentScene.imageUrl ? (
                            <img 
                                src={currentScene.imageUrl} 
                                alt={currentScene.title} 
                                className="w-full h-full object-cover opacity-80"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                <span className="text-gray-600">No Image Available</span>
                            </div>
                        )}
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                    </div>

                    {/* Feedback Overlay */}
                    {feedback && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-8 backdrop-blur-sm animate-fade-in">
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl max-w-lg text-center shadow-2xl border-2 border-purple-500">
                                <h3 className="text-2xl font-bold mb-4 text-purple-600 dark:text-purple-400">
                                    {pendingChoice?.isCorrect === true ? "Good Choice!" : pendingChoice?.isCorrect === false ? "Ouch!" : "Result"}
                                </h3>
                                <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">{feedback}</p>
                                <button 
                                    onClick={() => pendingChoice && continueAfterFeedback(pendingChoice.nextSceneId)}
                                    className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-lg transition-transform hover:scale-105"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Narrative & Controls Area */}
                <div className="h-1/3 bg-gray-900 border-t border-gray-700 p-6 flex flex-col md:flex-row gap-6">
                    {/* Story Text */}
                    <div className="flex-1 overflow-y-auto pr-2">
                        <h2 className="text-2xl font-bold text-white mb-2 text-teal-400">{currentScene.title}</h2>
                        <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                            {currentScene.narrative}
                        </p>
                    </div>

                    {/* Choices */}
                    <div className="w-full md:w-1/3 flex flex-col gap-3 justify-center min-w-[300px]">
                        {currentScene.choices.length > 0 ? (
                            currentScene.choices.map((choice, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleChoice(choice.nextSceneId, choice.feedback)}
                                    disabled={!!feedback}
                                    className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-teal-500 text-left text-gray-200 rounded-lg transition-all duration-200 hover:shadow-lg hover:translate-x-1 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="font-bold text-teal-500 mr-2">{String.fromCharCode(65 + idx)}.</span>
                                    {choice.text}
                                </button>
                            ))
                        ) : (
                            <div className="flex flex-col gap-3">
                                <div className="text-center text-gray-400 italic mb-2">End of Scenario</div>
                                <button
                                    onClick={onClose}
                                    className="p-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition-colors text-center"
                                >
                                    Finish Training
                                </button>
                                <button
                                    onClick={handleRestart}
                                    className="p-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-bold transition-colors text-center"
                                >
                                    Replay Scenario
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
