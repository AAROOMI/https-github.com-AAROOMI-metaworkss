
import React, { useState, useEffect, useMemo } from 'react';
import type { TrainingCourse, Lesson, QuizQuestion, InteractiveQuiz, UserTrainingProgress } from '../types';
import { CloseIcon, CheckCircleIcon, InformationCircleIcon } from './Icons';

// --- Challenge Components (defined within this file) ---

const MultipleChoiceQuiz: React.FC<{ question: QuizQuestion; onComplete: (isCorrect: boolean) => void; }> = ({ question, onComplete }) => {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedAnswer === null) return;
        setIsSubmitted(true);
        onComplete(selectedAnswer === question.correctAnswer);
    };

    const getOptionClasses = (index: number) => {
        if (!isSubmitted) return "border-gray-300 dark:border-gray-600";
        if (index === question.correctAnswer) return "border-green-500 bg-green-50 dark:bg-green-900/50";
        if (index === selectedAnswer) return "border-red-500 bg-red-50 dark:bg-red-900/50";
        return "border-gray-300 dark:border-gray-600";
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="font-semibold text-gray-800 dark:text-gray-200">{question.question}</p>
            <div className="space-y-3">
                {question.options.map((option, index) => (
                    <label key={index} className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${getOptionClasses(index)}`}>
                        <input
                            type="radio"
                            name="multiple-choice"
                            checked={selectedAnswer === index}
                            onChange={() => setSelectedAnswer(index)}
                            disabled={isSubmitted}
                            className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                        />
                        <span className="ml-3 text-gray-700 dark:text-gray-300">{option}</span>
                    </label>
                ))}
            </div>
            {!isSubmitted && <button type="submit" className="w-full bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700">Submit</button>}
        </form>
    );
};

// ... other challenge components will go here

// --- Main Lesson Player Component ---

interface LessonPlayerProps {
    course: TrainingCourse;
    lesson: Lesson;
    onClose: () => void;
    onCompleteLesson: (courseId: string, lessonId: string, score?: number) => void;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({ course, lesson, onClose, onCompleteLesson }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizResults, setQuizResults] = useState<boolean[]>([]);
    const [showSummary, setShowSummary] = useState(false);

    const questions = lesson.quiz?.questions || [];
    const currentQuestion = questions[currentQuestionIndex];
    
    const handleQuizComplete = (isCorrect: boolean) => {
        const newResults = [...quizResults, isCorrect];
        setQuizResults(newResults);
        
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                setShowSummary(true);
                const score = (newResults.filter(Boolean).length / questions.length) * 100;
                // Only mark as complete if the user passes (e.g., >= 50% score)
                if (score >= 50) {
                    onCompleteLesson(course.id, lesson.id, score);
                }
            }
        }, 1500); // Wait a bit to show feedback
    };

    const renderQuiz = () => {
        if (!currentQuestion) return null;
        return <MultipleChoiceQuiz question={currentQuestion} onComplete={handleQuizComplete} />;
    };
    
    // Calculate final score once, when summary is shown
    const finalScore = useMemo(() => {
        if (!showSummary) return 0;
        return (quizResults.filter(Boolean).length / questions.length) * 100;
    }, [showSummary, quizResults, questions.length]);


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{course.title}</p>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{lesson.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br/>') }} />

                    {questions.length === 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 text-center">
                            <button onClick={() => onCompleteLesson(course.id, lesson.id)} className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700">
                                Mark as Complete
                            </button>
                        </div>
                    )}

                    {questions.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{lesson.quiz?.title} ({currentQuestionIndex + 1}/{questions.length})</h3>
                            
                            {showSummary ? (
                                <div className={`text-center p-6 rounded-lg ${finalScore >= 50 ? 'bg-green-50 dark:bg-green-900/50' : 'bg-red-50 dark:bg-red-900/50'}`}>
                                    <h4 className="text-2xl font-bold">{finalScore >= 50 ? 'Lesson Complete!' : 'Needs Review'}</h4>
                                    <p className="text-lg mt-2">You scored {quizResults.filter(Boolean).length} out of {questions.length} ({finalScore.toFixed(0)}%).</p>
                                    {finalScore < 50 && <p className="text-sm mt-2">You need a score of 50% or higher to pass. Please review the material and try again.</p>}
                                    <button onClick={onClose} className="mt-6 bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700">
                                        Close Lesson
                                    </button>
                                </div>
                            ) : (
                                renderQuiz()
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
