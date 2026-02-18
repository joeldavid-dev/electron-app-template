document.addEventListener("DOMContentLoaded", async () => {
    const close = document.getElementById('close');
    const helloWorld = document.getElementById('hello-world');
    const translations = await window.electronAPI.getTranslations('home-view');

    // Clic en botón cerrar
    close.addEventListener('click', () => {
        window.electron.close();
    });

    // Insertar textos
    const text = translations['hello-world'];
    let i = 0;

    const intervalo = setInterval(() => {
        if (i < text.length) {
            helloWorld.textContent += text[i];
            i++;
        } else {
            clearInterval(intervalo);
        }
    }, 100); // 1000ms = 1 segundo
});