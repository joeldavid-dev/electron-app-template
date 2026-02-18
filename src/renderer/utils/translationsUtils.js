/*
 * Este modulo provee funciones de utilidad para manejar traducciones de textos
 * con variables dinámicas.
 */

export function replaceKeysInText(text, vars = {}) {
    Object.keys(vars).forEach(varKey => {
        text = text.replace(`{${varKey}}`, vars[varKey]);
    });
    return text;
}