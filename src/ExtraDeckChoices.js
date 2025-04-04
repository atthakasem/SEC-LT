import { LookupTable } from "./LookupTable"

export class ExtraDeckChoices {
    static selectors = {
        "xyz": ".ed-choices-xyz",
        "fusion": ".ed-choices-fusion",
        "requiredSlots": ".ed-choices-required-slots",
    }
    element = null
    table = null
    checkboxes = { "xyz": [], "fusion": [] }
    defaults = { "xyz": [], "fusion": [] }

    static init(selector) {
        document.querySelectorAll(selector).forEach(element => new this(element))
    }

    constructor(element) {
        this.element = element
        this.table = new LookupTable(element.parentElement.querySelector(".lookup-table"))
        this.registerCheckboxes()
        this.updateRequiredExtraDeckSlots()
        this.registerDefaults()
        this.registerInteractions()
        this.renderTable(this.loadSavedState())
    }

    registerCheckboxes() {
        this.checkboxes.xyz = Array.from(this.element.querySelectorAll(this.constructor.selectors.xyz + " input[type=checkbox]"))
        this.checkboxes.fusion = Array.from(this.element.querySelectorAll(this.constructor.selectors.fusion + " input[type=checkbox]"))
    }

    registerDefaults() {
        this.checkboxes.xyz.forEach(cb => {
            if (cb.checked) {
                this.defaults.xyz.push(cb.nextElementSibling.textContent)
            }
        })
        this.checkboxes.fusion.forEach(cb => {
            if (cb.checked) {
                this.defaults.fusion.push(cb.nextElementSibling.textContent)
            }
        })
    }

    updateRequiredExtraDeckSlots() {
        const withinClass = "text-success"
        const exceededClass = "text-danger"
        const target = this.element.querySelector(this.constructor.selectors.requiredSlots)
        const xyzSlots = this.checkboxes.xyz.reduce((acc, cur) => acc + (cur.checked ? 2 : 0), 0)
        const fusionSlots = this.checkboxes.fusion.reduce((acc, cur) => acc + (cur.checked ? 1 : 0), 0)

        if (xyzSlots + fusionSlots > 15) {
            target.classList.add(exceededClass)
            target.classList.remove(withinClass)
        } else {
            target.classList.add(withinClass)
            target.classList.remove(exceededClass)
        }
        target.textContent = xyzSlots + fusionSlots
    }

    registerInteractions() {
        this.element.addEventListener("change", () => {
            this.updateRequiredExtraDeckSlots()
            this.renderTable(this.saveState())
        })

        this.element.querySelectorAll(this.constructor.selectors.xyz + "," + this.constructor.selectors.fusion).forEach(row => {
            row.addEventListener("click", (ev) => {
                if (ev.target.tagName !== "BUTTON") {
                    return false
                }

                const action = ev.target.dataset.action
                const edType = ev.target.dataset.edType
                if (action && edType) {
                    this[action](edType)
                }
            })
        })
    }

    renderTable(state) {
        if (!state) {
            const savedState = localStorage.getItem("edChoices")
            if (savedState) {
                state = savedState
            } else {
                state = this.getCurrentState()
            }
        }
        this.table.render(state)
    }

    getCurrentState() {
        return {
            "xyz": this.checkboxes.xyz.filter(x => x.checked).map(x => parseInt(x.value), 10),
            "fusion": this.checkboxes.fusion.filter(x => x.checked).map(x => parseInt(x.value), 10)
        }
    }

    loadSavedState() {
        const savedState = localStorage.getItem("edChoices")
        if (!savedState) return false

        const state = JSON.parse(savedState)
        this.#setCheckboxes("xyz", (cb) => state.xyz.includes(parseInt(cb.value, 10)))
        this.#setCheckboxes("fusion", (cb) => state.fusion.includes(parseInt(cb.value, 10)))
        return state
    }

    saveState() {
        const state = this.getCurrentState()
        localStorage.setItem("edChoices", JSON.stringify(state))
        return state
    }

    clear(edType) {
        this.#setCheckboxes(edType, () => false)
    }

    reset(edType) {
        this.#setCheckboxes(edType, (checkbox) => this.defaults[edType].includes(checkbox.nextElementSibling.textContent))
    }

    selectAll(edType) {
        this.#setCheckboxes(edType, () => true)
    }

    #setCheckboxes(edType, func) {
        if (typeof func !== "function") {
            throw new Error("Parameter func must be a function that returns a bool")
        }

        let isAnyCheckboxChanged = false
        this.checkboxes[edType].forEach(checkbox => {
            const prevState = checkbox.checked
            const newState = func(checkbox)
            if (prevState !== newState) {
                checkbox.checked = newState
                isAnyCheckboxChanged = true
            }
        })

        if (isAnyCheckboxChanged) {
            this.element.dispatchEvent(new Event("change", { bubbles: true }))
        }
    }
}
