// services/scheduleOptimizer.js

class ScheduleOptimizer {
    /**
     * Detects day/time conflicts in 'courses'
     */
    detectConflicts(courses) {
        const conflicts = [];
        const timeSlots = new Map();
        for (const course of courses) {
            const key = `${course.day}_${course.start_time}`;
            if(timeSlots.has(key)){
                const conflictingCourse = timeSlots.get(key);
                conflicts.push({
                    course1: course,
                    course2: conflictingCourse,
                    type: 'time_conflict',
                    message: `${course.name} conflicts with ${conflictingCourse.name}`
                });
            } else {
                timeSlots.set(key, course);
            }
        }
        return conflicts;
    }

    /**
     * Returns suggestions based on the conflicts
     */
    suggestResolution(conflicts) {
        return conflicts.map(conflict => ({
            ...conflict,
            suggestions: [
                `Move ${conflict.course1.name} to a different time slot`,
                `Move ${conflict.course2.name} to a different time slot`,
                `Choose between ${conflict.course1.name} and ${conflict.course2.name}`
            ]
        }));
    }
}

module.exports = ScheduleOptimizer;