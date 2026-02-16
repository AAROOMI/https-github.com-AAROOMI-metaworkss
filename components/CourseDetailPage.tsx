
import React from 'react';
import type { TrainingCourse, UserTrainingProgress, Lesson } from '../types';
import { CheckCircleIcon } from './Icons';

interface CourseDetailPageProps {
    course: TrainingCourse;
    userProgress?: UserTrainingProgress[string];
    onBack: () => void;
    onStartLesson: (lesson: Lesson) => void;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({ course, userProgress, onBack, onStartLesson }) => {
    const totalLessons = course.lessons.length;
    const completedLessons = userProgress?.completedLessons.length || 0;
    const completion = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return (
        <div className="space-y-6">
            <div>
                <button onClick={onBack} className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline mb-4">&larr; Back to All Courses</button>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">{course.title}</h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">{course.description}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Course Progress</h2>
                <div className="mt-4">
                    <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                        <span>{completedLessons} / {totalLessons} Lessons Completed</span>
                        <span>{completion.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                        <div className="bg-teal-600 h-2.5 rounded-full transition-width duration-500" style={{ width: `${completion}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                 <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Lessons</h2>
                 <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {course.lessons.map((lesson, index) => {
                        const isCompleted = userProgress?.completedLessons.includes(lesson.id);
                        return (
                            <li key={lesson.id}>
                                <button
                                    onClick={() => onStartLesson(lesson)}
                                    className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex justify-between items-center transition-colors rounded-md"
                                >
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${isCompleted ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                            {isCompleted
                                                ? <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400"/>
                                                : <span className="font-bold text-gray-600 dark:text-gray-300">{index + 1}</span>
                                            }
                                        </div>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{lesson.title}</span>
                                    </div>
                                    <span className="ml-4 px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                                        Start Lesson
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                 </ul>
            </div>
        </div>
    );
};
