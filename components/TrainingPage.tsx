
import React, { useState } from 'react';
import type { TrainingCourse, UserTrainingProgress, Lesson } from '../types';
import { trainingCourses } from '../data/trainingData';
import { CourseDetailPage } from './CourseDetailPage';
import { LessonPlayer } from './LessonPlayer';
import { FundamentalsBadgeIcon, PhishingBadgeIcon, MalwareBadgeIcon, PasswordBadgeIcon, SafeBrowsingBadgeIcon, RemoteWorkBadgeIcon, SecureCodingBadgeIcon, IncidentResponseBadgeIcon, DataPrivacyBadgeIcon } from './Icons';

interface TrainingPageProps {
  userProgress: UserTrainingProgress;
  onUpdateProgress: (courseId: string, lessonId: string, score?: number) => void;
}

const CourseCard: React.FC<{ course: TrainingCourse; progress?: UserTrainingProgress[string] }> = ({ course, progress }) => {
    const totalLessons = course.lessons.length;
    const completedLessons = progress?.completedLessons.length || 0;
    const completion = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{course.title}</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex-grow">{course.description}</p>
            <div className="mt-4">
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <span>Progress ({completedLessons}/{totalLessons})</span>
                    <span>{completion.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                    <div className="bg-teal-600 h-2.5 rounded-full" style={{ width: `${completion}%` }}></div>
                </div>
            </div>
            {progress?.badgeEarned && (
                 <div className="mt-4 text-center py-1 px-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs font-bold rounded-full">
                    Badge Earned!
                </div>
            )}
        </div>
    );
};

const BadgeIcon: React.FC<{ badgeId: string }> = ({ badgeId }) => {
    const props = { className: "w-16 h-16 text-teal-600 dark:text-teal-400 mb-2" };
    switch(badgeId) {
        case 'fundamentals-badge': return <FundamentalsBadgeIcon {...props} />;
        case 'phishing-badge': return <PhishingBadgeIcon {...props} />;
        case 'malware-badge': return <MalwareBadgeIcon {...props} />;
        case 'password-badge': return <PasswordBadgeIcon {...props} />;
        case 'browsing-badge': return <SafeBrowsingBadgeIcon {...props} />;
        case 'remote-work-badge': return <RemoteWorkBadgeIcon {...props} />;
        case 'secure-coding-badge': return <SecureCodingBadgeIcon {...props} />;
        case 'incident-response-badge': return <IncidentResponseBadgeIcon {...props} />;
        case 'data-privacy-badge': return <DataPrivacyBadgeIcon {...props} />;
        default: return <div className="w-16 h-16 bg-gray-200 rounded-full mb-2"></div>;
    }
}

export const TrainingPage: React.FC<TrainingPageProps> = ({ userProgress, onUpdateProgress }) => {
    const [activeCourse, setActiveCourse] = useState<TrainingCourse | null>(null);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

    const handleSelectCourse = (course: TrainingCourse) => {
        setActiveCourse(course);
    };

    const handleStartLesson = (lesson: Lesson) => {
        setActiveLesson(lesson);
    };

    const handleCompleteLesson = (courseId: string, lessonId: string, score?: number) => {
        onUpdateProgress(courseId, lessonId, score);
        setActiveLesson(null); // Close the lesson player
    };

    const earnedBadges = Object.keys(userProgress).filter(courseId => userProgress[courseId].badgeEarned).map(courseId => {
        const course = trainingCourses.find(c => c.id === courseId);
        return course ? { id: course.badgeId, name: course.title } : null;
    }).filter(Boolean);

    if (activeCourse) {
        return (
            <>
                <CourseDetailPage
                    course={activeCourse}
                    userProgress={userProgress[activeCourse.id]}
                    onBack={() => setActiveCourse(null)}
                    onStartLesson={handleStartLesson}
                />
                {activeLesson && (
                    <LessonPlayer
                        course={activeCourse}
                        lesson={activeLesson}
                        onClose={() => setActiveLesson(null)}
                        onCompleteLesson={handleCompleteLesson}
                    />
                )}
            </>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Training & Awareness</h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Enhance your cybersecurity knowledge with these interactive courses.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainingCourses.map(course => (
                    <button key={course.id} onClick={() => handleSelectCourse(course)} className="text-left focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-lg">
                        <CourseCard course={course} progress={userProgress[course.id]} />
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Your Achievements</h2>
                {earnedBadges.length > 0 ? (
                    <div className="flex flex-wrap gap-8 justify-center sm:justify-start">
                        {earnedBadges.map((badge, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center w-32">
                                <BadgeIcon badgeId={badge!.id} />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{badge!.name}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">Complete courses to earn badges!</p>
                )}
            </div>
        </div>
    );
};
