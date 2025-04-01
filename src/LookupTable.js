export class LookupTable {
    element = null

    constructor(element) {
        this.element = element
    }

    render(xyzFusionLevelRankData) {
        const data = this.convertToTableData(xyzFusionLevelRankData)
        if (data.maxCardsInPlay === 0) {
            this.element.innerHTML = "<tr><td>⚠️ No solution exists for this configuration. Try other XYZ Ranks and Fusion Levels.</td></tr>"
            return false
        }

        const thead = this.createTableHead(data.minCardsInPlay, data.maxCardsInPlay)
        const tbody = this.createTableBody(data.tableData, data.minCardsInPlay, data.maxCardsInPlay, data.minOpponentMonsterLevel, data.maxOpponentMonsterLevel)
        this.element.innerHTML = thead + tbody
    }

    convertToTableData(xyzFusionLevelRankData) {
        const tableData = {}
        let minOpponentMonsterLevel = Number.MAX_SAFE_INTEGER
        let maxOpponentMonsterLevel = 0
        let minCardsInPlay = Number.MAX_SAFE_INTEGER
        let maxCardsInPlay = 0

        for (const level of xyzFusionLevelRankData.fusion) {
            for (const rank of xyzFusionLevelRankData.xyz) {
                const c1 = rank + level
                if (c1 > 13) break // Don't consider cases that exceed maximum possible monster level/rank
                const c2 = 2 * rank + level

                if (!tableData[c1]) tableData[c1] = {}

                tableData[c1][c2] = [rank, level]

                if (c1 < minOpponentMonsterLevel) {
                    minOpponentMonsterLevel = c1
                } else if (c1 > maxOpponentMonsterLevel) {
                    maxOpponentMonsterLevel = c1
                }
                if (c2 < minCardsInPlay) {
                    minCardsInPlay = c2
                } else if (c2 > maxCardsInPlay) {
                    maxCardsInPlay = c2
                }
            }
        }
        return { tableData, minOpponentMonsterLevel, maxOpponentMonsterLevel, minCardsInPlay, maxCardsInPlay }
    }

    createTableHead(minCardsInPlay, maxCardsInPlay) {
        function createTableHeaders(minCardsInPlay, maxCardsInPlay) {
            let output = ""
            for (let i = minCardsInPlay; i <= maxCardsInPlay; i++) {
                output += `<th>${i}</th>\n`
            }
            return output
        }

        return `
            <thead>
                <tr>
                    <th rowspan="2" colspan="2" class="empty-first-cell"></th>
                    <th colspan="${maxCardsInPlay - minCardsInPlay + 2}">
                        Number of cards in the hands and on the field
                    </th>
                </tr>
                <tr>
                    ${createTableHeaders(minCardsInPlay, maxCardsInPlay)}
                </tr>
            </thead>
        `
    }

    createTableBody(tabledata, minCardsInPlay, maxCardsInPlay, minOpponentMonsterLevel, maxOpponentMonsterLevel) {
        let output = "<tbody>\n"

        for (let i = minOpponentMonsterLevel; i <= maxOpponentMonsterLevel; i++) {
            output += `<tr>\n`
            if (i === minOpponentMonsterLevel) {
                output += `
                    <th class="vertical-header" rowspan="${maxOpponentMonsterLevel - minOpponentMonsterLevel + 1}" title="Opponent monster level or rank">
                        Opp. monster level / rank
                    </th>\n`
            }
            output += `<th>${i}</th>\n`

            for (let j = minCardsInPlay; j <= maxCardsInPlay; j++) {
                let title = ""
                let content = ""
                if (tabledata[i] && tabledata[i][j]) {
                    title = `Rank ${tabledata[i][j][0]} XYZ, Level ${tabledata[i][j][1]} Fusion`
                    content = `(${tabledata[i][j][0]},<span style="color: var(--text-fusion);">${tabledata[i][j][1]}</span>)`
                }
                output += `<td class="${content ? "cell-with-solution" : ""}" title="${title}">${content}</td>\n`
            }
            output += `</tr>\n`
        }

        output += "</tbody>\n"
        return output
    }
}
