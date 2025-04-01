import "bootstrap/dist/css/bootstrap.min.css"
import "./css/style.css"
import { ExtraDeckChoices } from "./ExtraDeckChoices"
import { ColorTheme } from "./ColorTheme"

document.addEventListener("DOMContentLoaded", () => {
    ExtraDeckChoices.init(".ed-choices-container")
    ColorTheme.init(".color-mode-toggle input")
})
