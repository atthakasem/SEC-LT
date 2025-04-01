export class ColorTheme {
    static init(selector) {
        document.querySelectorAll(selector).forEach(element => new this(element))
    }

    constructor(element) {
        this.element = element
        this.applySavedTheme()
        this.registerInteractions()
        this.reactivateTransitions()
    }

    applySavedTheme() {
        const savedTheme = localStorage.getItem("theme")
        if (savedTheme) {
            this.apply(savedTheme)
        }
    }

    registerInteractions() {
        this.element.addEventListener("change", () => this.toggle())
    }

    reactivateTransitions() {
        requestAnimationFrame(() => this.element.closest(".no-transition-until-loaded").classList.remove("no-transition-until-loaded"))
    }

    toggle() {
        this.apply(this.element.checked ? "light" : "dark")
    }

    apply(theme) {
        localStorage.setItem("theme", theme)
        document.documentElement.dataset.bsTheme = theme
        this.element.checked = theme === "light"
    }
}
