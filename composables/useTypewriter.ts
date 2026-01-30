export const useTypewriter = () => {
    const typeText = (text: string, textShown: globalThis.Ref<string, string>, interval: number = 20): Promise<void> => {
        return new Promise((resolve) => {
            let index = 0
            let lastTime = 0

            function animate(now: number) {
                if (now - lastTime >= interval) {
                    textShown.value += text[index]
                    index++
                    lastTime = now
                }
                if (index < text.length) {
                    requestAnimationFrame(animate)
                } else {
                    resolve()
                }
            }
            requestAnimationFrame(animate)
        })
    }

    return {
        typeText
    }
}
