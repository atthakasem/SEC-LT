import { LookupTable } from "./LookupTable"

export class ExtraDeckChoices {
    static selectors = {
        "xyz": ".ed-choices-xyz",
        "fusion": ".ed-choices-fusion",
        "requiredSlots": ".ed-choices-required-slots",
        "shareButton": ".ed-choices-share",
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
        this.registerDefaults()
        this.registerInteractions()
        this.updateRequiredExtraDeckSlots()

        try {
            const state = this.loadQueryState()
            this.deleteQuery()
            this.renderTable(state)
        } catch {
            this.renderTable(this.loadLocalStorageState())
        }
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

        this.element.querySelector(this.constructor.selectors.shareButton).addEventListener("click", (ev) => {
            const button = ev.currentTarget
            button.disabled = true

            const originalText = button.querySelector("span").textContent

            const url = new URL(window.location.href)
            const state = this.getCurrentState()
            url.searchParams.set("xyz", state.xyz.join(","))
            url.searchParams.set("fusion", state.fusion.join(","))

            navigator.clipboard.writeText(url.toString())
                .then(() => button.querySelector("span").textContent = "URL has been copied to clipboard ✅")
                .catch(() => button.querySelector("span").textContent = "URL could not be copied to clipboard ❌")

            setTimeout(() => {
                button.querySelector("span").textContent = originalText
                button.disabled = false
            }, 4000);
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

    createState(xyz, fusion) {
        return { xyz, fusion }
    }

    getCurrentState() {
        return this.createState(
            this.checkboxes.xyz.filter(x => x.checked).map(x => parseInt(x.value), 10),
            this.checkboxes.fusion.filter(x => x.checked).map(x => parseInt(x.value), 10)
        )
    }

    loadQueryState() {
        const url = new URL(window.location.href)
        if (!url.searchParams.has("xyz") || !url.searchParams.has("fusion")) {
            throw new Error("Query parameters 'xyz' and 'fusion' must exist.");
        }

        const xyzState = url.searchParams.get("xyz").split(",").map(n => parseInt(n, 10))
        const fusionState = url.searchParams.get("fusion").split(",").map(n => parseInt(n, 10))
        if (xyzState.some(n => Number.isNaN(n) || n < 1 || n > 13) || fusionState.some(n => Number.isNaN(n) || n < 1 || n > 13)) {
            throw new Error("Error parsing query parameters.");
        }

        this.#setCheckboxes("xyz", (cb) => xyzState.includes(parseInt(cb.value, 10)), false)
        this.#setCheckboxes("fusion", (cb) => fusionState.includes(parseInt(cb.value, 10)), false)

        return this.createState(xyzState, fusionState)
    }

    deleteQuery() {
        const url = new URL(window.location.href)
        url.searchParams.delete("xyz")
        url.searchParams.delete("fusion")
        window.history.replaceState({}, "", url)
    }

    loadLocalStorageState() {
        const savedState = localStorage.getItem("edChoices")
        if (!savedState) return false

        const state = JSON.parse(savedState)
        this.#setCheckboxes("xyz", (cb) => state.xyz.includes(parseInt(cb.value, 10)), false)
        this.#setCheckboxes("fusion", (cb) => state.fusion.includes(parseInt(cb.value, 10)), false)
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

    #setCheckboxes(edType, func, shouldDispatch = true) {
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

        if (isAnyCheckboxChanged && shouldDispatch) {
            this.element.dispatchEvent(new Event("change", { bubbles: true }))
        }
    }
}
