export interface Lesson {
    id: string
    title: string
    description: string
    order: number
    path: string
    type: 'threejs' | 'other'
}

export const useLessons = () => {
    const lessons: Lesson[] = [
        {
            id: '12',
            title: '3D Text',
            description: 'Creating 3D text with Three.js and animation',
            order: 12,
            path: '/lessons/12',
            type: 'threejs'
        }
    ]

    const getLessonById = (id: string): Lesson | undefined => {
        return lessons.find(lesson => lesson.id === id)
    }

    const getAllLessons = (): Lesson[] => {
        return lessons.sort((a, b) => a.order - b.order)
    }

    return {
        lessons,
        getLessonById,
        getAllLessons
    }
}
