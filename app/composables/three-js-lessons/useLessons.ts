import type { Localized } from '@/data/types'

export interface Lesson {
    id: string
    title: Localized
    description: Localized
    order: number
    path: string
    type: 'threejs' | 'other'
    /**
     * Short muted loop for the Lab tile, path without extension
     * (`/videos/lab-50` → lab-50.webm + lab-50.mp4). A still frame can't show
     * that a scene moves; the tile image stays as the fallback.
     */
    video?: string
}

export const useLessons = () => {
    const lessons: Lesson[] = [
        {
            id: '11',
            title: { en: 'Materials', ru: 'Материалы' },
            description: { en: 'Physical materials in Three.js: metal, glass and transmission', ru: 'Физические материалы в Three.js: металл, стекло, прозрачность' },
            order: 11,
            path: '/lessons/11-materials',
            type: 'threejs',
            video: '/videos/lab-11'
        },
        {
            id: '12',
            title: { en: '3D Text', ru: '3D-текст' },
            description: { en: 'Extruded 3D type with Three.js', ru: 'Объёмный текст на Three.js' },
            order: 12,
            path: '/lessons/12-text',
            type: 'threejs',
            video: '/videos/lab-12'
        },
        {
            id: '16',
            title: { en: 'Haunted House', ru: 'Дом с привидениями' },
            description: { en: 'A haunted house scene with textures, lights, shadows and fog', ru: 'Сцена с текстурами, светом, тенями и туманом' },
            order: 16,
            path: '/lessons/16-haunted-house',
            type: 'threejs',
            video: '/videos/lab-16'
        },
        {
            id: '24',
            title: { en: 'Environment Map', ru: 'Карта окружения' },
            description: { en: 'Environment maps and HDR lighting in Three.js', ru: 'Карты окружения и HDR-освещение в Three.js' },
            order: 24,
            path: '/lessons/24-environment-map',
            type: 'threejs',
            video: '/videos/lab-24'
        },
        {
            id: '50',
            title: { en: 'Kinetic Text', ru: 'Кинетический текст' },
            description: { en: 'Extruded per-letter type that scatters on hover and springs back into the headline', ru: 'Объёмные буквы разлетаются от курсора и пружиной возвращаются в заголовок' },
            order: 50,
            path: '/lessons/50-kinetic-text',
            type: 'threejs',
            video: '/videos/lab-50'
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
