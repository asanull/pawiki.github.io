if (window.location.hash == '') window.location.hash = '#docs/introduction/welcome'
let lastHash
let overrideWelcome = false
let site = {
    document: {},
    news: {
        load: {
            Game: true,
            Community: true,
            Wiki: true,
        }
    }
}
function missingDependency(dependency) {

    Toastify({
        text: `dependency '${dependency}' is missing`,
        duration: 10000,
        close: true,
        gravity: "bottom", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        style: {
            background: "#212529",
            boxShadow: "none"
        },
        onClick: function () {missingDependency(dependency)} // Callback after click
    }).showToast();
}
try {
    console.log(jQuery)
} catch (error) {
    missingDependency('jQuery.min.js')
}
try {
    console.log(bootstrap)
} catch (error) {
    missingDependency('bootstrap.min.js')
}
try {
    console.log(showdown)
} catch (error) {
    missingDependency('showdown.min.js')
}
site.document.ready = new Promise(resolve => site.document.loaded = resolve)
async function focusFragment() {
    if (window.location.hash !== lastHash) {
        await site.document.ready
        lastHash = window.location.hash
        let fragments = window.location.hash.split('/')
        switch (fragments[0]) {

            case '#news':
                let news = document.getElementById('news-nav')
                news.click()
                overrideWelcome = true
                if (fragments[1] != undefined) {
                    let newsDoc = document.getElementById(`${fragments[1].replace(/\s/g, '-').toLowerCase()}-news`)
                    if (newsDoc != null) {
                        let newsContent = document.getElementById('news-content')
                        let headerOffset = 50
                        if (window.innerWidth < 768) headerOffset = 100
                        newsContent.scrollTo(0, (newsDoc.getBoundingClientRect().top) - headerOffset)
                    }
                }
                break;
            case '#docs':
                let docs = document.getElementById('docs-nav')
                docs.click()
                if (fragments[1] != undefined) {
                    let docsCollapse = document.getElementById(`${fragments[1].toLowerCase()}-collapse`)
                    if (docsCollapse != undefined) {
                        overrideWelcome = true
                        docsCollapse.classList.add('show')
                        if (fragments[2] != undefined) {
                            overrideWelcome = true
                            let docLink = document.getElementById(`${fragments[2].toLowerCase()}-link`)
                            if (docLink != undefined) docLink.click()
                        }
                    }
                }
                break;
            case '#units':
                let units = document.getElementById('units-nav')
                units.click()
                overrideWelcome = true
                if (fragments[1] != undefined) {
                    await new Promise(resolve => setTimeout(resolve, 250))
                    let collapse = document.getElementById(`${fragments[1].toLowerCase()}-collapse`)
                    if (collapse != undefined) {
                        collapse.classList.add('show')
                        if (fragments[2] != undefined) {
                            let collapse = document.getElementById(`${fragments[1].toLowerCase()}-${fragments[2].toLowerCase()}-collapse`)
                            if (collapse != undefined) {
                                collapse.classList.add('show')
                                if (fragments[3] != undefined) {
                                    let docLink = document.getElementById(`${fragments[1].toLowerCase()}-${fragments[2].toLowerCase()}-${fragments[3].toLowerCase()}`)
                                    docLink.click()
                                }
                            }
                        }
                    }
                }
                break;

            case '#game':
                site.news.load.Game = true
                site.news.load.Community = false
                site.news.load.Wiki = false
                let game = document.getElementById('news-nav')
                game.click()
                overrideWelcome = true
                if (fragments[1] != undefined) {
                    let newsDoc = document.getElementById(`${fragments[1].replace(/\s/g, '-').toLowerCase()}-news`)
                    if (newsDoc != null) {
                        let newsContent = document.getElementById('news-content')
                        let headerOffset = 50
                        if (window.innerWidth < 768) headerOffset = 100
                        newsContent.scrollTo(0, (newsDoc.getBoundingClientRect().top) - headerOffset)
                    }
                }
                break;
        }
        if (!overrideWelcome) {
            let introductionCollapse = document.getElementById('introduction-collapse')
            introductionCollapse.classList.add('show')
            let welcomeLink = document.getElementById('welcome-link')
            welcomeLink.click()
        }
    }
}
setInterval(() => {
    focusFragment()
}, 250)

newsLoaded = false
async function fetchNews() {

    let fragments = window.location.hash.split('/')
    let hash = window.location.hash
    if (fragments[0] == '#news') {
        window.location.hash = 'loading'
    }

    $('.news-loading')[0].style.display = null
    let count = {
        current: 0,
        total: 0
    }

    async function updateProgress() {
        count.current++
        $('#news-progress')[0].setAttribute('aria-valuenow', count.current)
        $('#news-progress')[0].style.width = `${(count.current / count.total) * 100}%`
        let style = `font-family: var(--font-head); font-size: 14px`
        $('#news-progress')[0].innerHTML = `<span style="${style}">${count.total-count.current} to go</span>`
        if (count.total == count.current) {
            await new Promise(resolve => setTimeout(resolve, 500))
            $('.news-loading')[0].style.display = "none"
            window.location.hash = hash
            newsLoaded = true
        }
    }

    const response = await fetch('./root.json')
    const root = JSON.parse(await response.text())

    root.news.forEach(() => {
        count.total++
        $('#news-progress')[0].setAttribute('aria-valuemax', count.total)
    })
    root.news.forEach(async (entry, i) => {

        let gate = true
        switch (entry.split('/')[0]) {
            case "Game":
                if (site.news.load.Game) gate = false
                break;
            case "Community":
                if (site.news.load.Community) gate = false
                break;
            case "Wiki":
                if (site.news.load.Wiki) gate = false
                break;
        }
        if (!gate) {
            let wait = (-(i - count.total) * 200) - 200
            let news = $('#news-content')[0]
            const response = await fetch(`./dist/${entry}.md`)
            const data = await response.text()
            var converter = new showdown.Converter()
            let doc = document.createElement('div')
            doc.innerHTML = converter.makeHtml(data)
            await new Promise(resolve => setTimeout(resolve, wait))
            doc.id = `${(entry.replace(/\s/g, '-').toLowerCase()).split('/')[1]}-news`
            news.appendChild(doc)

            let copy = document.createElement('div')
            copy.style.position = 'absolute'
            copy.classList.add('noscroll')
            copy.innerHTML =
                `<span class="material-symbols-outlined" id="url">
                link
            </span>`
            doc.appendChild(copy)
            setInterval(() => {
                copy.style.top = `${(doc.getBoundingClientRect().top + document.querySelector('#news-content').scrollTop - 36) - (window.innerWidth/1000)}px`
                copy.style.left = `${doc.firstChild.getBoundingClientRect().width + 32}px`
            }, 250);

            let local = location.protocol + '//' + location.host
            copy.setAttribute('url', `${local}/#news/${(entry.replace(/\s/g, '-').toLowerCase()).split('/')[1]}`)

            copy.addEventListener('click', async function () {

                await new Promise(r => setTimeout(r, 250))
                copy.innerHTML =
                    `<span class="material-symbols-outlined" id="tick">
                    check
                </span>`
                navigator.clipboard.writeText(copy.getAttribute('url'))
            })
            copy.addEventListener('mouseleave', async function () {
                await new Promise(r => setTimeout(r, 5000))
                copy.innerHTML =
                    `<span class="material-symbols-outlined" id="url">
                    link
                </span>`
            })
        }
        updateProgress()
    })
}

setInterval(() => {
    $('#docs-sidebar')[0].style.top = $('header')[0].offsetHeight + 'px'
    $('#units-sidebar')[0].style.top = $('header')[0].offsetHeight + 'px'
    $('#docs-main')[0].style.paddingTop = $('header')[0].offsetHeight + 'px'
    $('#units-main')[0].style.paddingTop = $('header')[0].offsetHeight + 'px'
    $('#news-main')[0].style.top = $('header')[0].offsetHeight + 'px'
    $('#btn').each(function (i, btn) {
        let headerOffset = ($('header')[0].offsetHeight / 2) - 12
        let sidebarOffset = $('#docs-sidebar')[0].offsetWidth
        btn.style.top = headerOffset + 'px'
        if (btn.classList.contains('left')) {
            switch (headerOffset) {
                case 36:
                    btn.style.left = '24px';
                    btn.style.color = null;
                    $('#docs-sidebar')[0].style.height = `calc(100% - 79px)`
                    $('#units-sidebar')[0].style.height = `calc(100% - 79px)`
                    break;
                default:
                    btn.style.left = '-24px';
                    btn.style.color = 'transparent';

                    $('#docs-sidebar')[0].classList.remove('hide')
                    $('#docs-sidebar')[0].style.left = `0px`
                    $('#docs-content')[0].style.left = `${sidebarOffset+25}px`

                    $('#units-sidebar')[0].classList.remove('hide')
                    $('#units-sidebar')[0].style.left = `0px`
                    $('#units-content')[0].style.left = `${sidebarOffset+25}px`
                    $('#docs-sidebar')[0].style.height = `calc(100% - 39px)`
                    $('#units-sidebar')[0].style.height = `calc(100% - 39px)`
            }
        } else {
            switch (headerOffset) {
                case 36:
                    btn.style.right = '24px';
                    break;
                default:
                    btn.style.right = '12px'
            }
        }

        $('.doc').each(function (i, doc) {
            let sidebarOffset = 0
            if (!$('#docs-sidebar')[0].classList.contains('hide')) sidebarOffset = $('#docs-sidebar')[0].offsetWidth

            let calc = (window.innerWidth - 10) - sidebarOffset
            $(doc).css('width', `${calc}px`)
        })
        $('#news-main').children().each(function (i, news) {
            let calc = (window.innerWidth - 10)
            $(news).css('width', `${calc}px`)
        })
        $('#news-content').children().each(function (i, doc) {
            let calc = (window.innerWidth - 10)
            $(doc).css('width', `${calc}px`)
        })
    });
}, 100);

let sidebarOffset = $('#docs-sidebar')[0].offsetWidth
$('#docs-content')[0].style.left = `${sidebarOffset+25}px`
$('#units-content')[0].style.left = `${sidebarOffset+25}px`

document.addEventListener('DOMContentLoaded', async () => {
    fetchDocs(async () => {
        site.document.loaded()
        list.forEach(doc => {

            let element = document.createElement('div')
            element.id = `${doc.file}.md`
            element.classList.add('hidden')
            element.classList.add('doc')
            var converter = new showdown.Converter();
            converter.setOption('literalMidWordAsterisks', true)
            converter.setOption('literalMidWordUnderscores', true)
            html = converter.makeHtml(doc.content);
            element.innerHTML = html
            $('#docs-content')[0].appendChild(element)

            let collapse = doc.collapse.replace('#', '').split('-')
            collapse.pop()

            doc.link.addEventListener('click', async () => {

                $('.collapse-link').each(function () {
                    $(this)[0].style = "color: var(--bs-gray-500)"
                })
                doc.link.children[0].style = "color: #f1662f"

                $('.doc').addClass('hidden');
                element.classList.add('visible');
                element.classList.remove('hidden');
                window.location.hash = `#docs/${collapse.toString().replace(',','-')}/${doc.file}`
            })

            let copy = document.createElement('div')
            copy.style.position = 'absolute'
            copy.innerHTML =
                `<span class="material-symbols-outlined" id="url">
                link
            </span>`
            element.appendChild(copy)
            setInterval(() => {
                copy.style.top = `${24 + (window.innerWidth/1000)}px`
                copy.style.left = `${element.firstChild.getBoundingClientRect().width + 32}px`
            }, 250);

            let local = location.protocol + '//' + location.host
            copy.setAttribute('url', `${local}/#docs/${collapse.toString().replace(',','-')}/${doc.file}`)

            copy.addEventListener('click', async function () {

                await new Promise(r => setTimeout(r, 250))
                copy.innerHTML =
                    `<span class="material-symbols-outlined" id="tick">
                    check
                </span>`
                navigator.clipboard.writeText(copy.getAttribute('url'))
            })
            copy.addEventListener('mouseleave', async function () {
                await new Promise(r => setTimeout(r, 5000))
                copy.innerHTML =
                    `<span class="material-symbols-outlined" id="url">
                    link
                </span>`
            })
        })

        $(document.body).find("pre").each(function () {

            this.style.paddingRight = "48px"
            let code = this.children[0]
            code.style.position = 'relative'
            let copy = document.createElement('div')
            copy.style.position = 'absolute'

            copy.style.top = `-5px`
            copy.style.left = `${this.getBoundingClientRect().width-64}px`

            copy.innerHTML =
                `<span class="material-symbols-outlined" id="copy">
                content_copy
            </span>`
            code.appendChild(copy)

            copy.addEventListener('click', async function () {

                await new Promise(r => setTimeout(r, 250))
                copy.innerHTML =
                    `<span class="material-symbols-outlined" id="tick">
                    check
                </span>`
                navigator.clipboard.writeText(code.innerText.slice(0, -5))
            })
            copy.addEventListener('mouseleave', async function () {
                await new Promise(r => setTimeout(r, 5000))
                copy.innerHTML =
                    `<span class="material-symbols-outlined" id="copy">
                    content_copy
                </span>`
            })
        })

        $(document.body).find("p").each(function () {
            if (this.innerHTML.includes(' | ')) {
                let html = document.createElement('table')
                html.className = 'table table-bordered table-dark'
                html.style.width = 'fit-content'
                let data = {
                    head: true,
                    leftAlign: false,
                    rightAlign: false
                }

                this.innerHTML.split('\n').forEach(line => {
                    switch (data.head) {
                        case true:
                            let head = document.createElement('thead')
                            head.style.textAlign = 'center'

                            let hrow = document.createElement('tr')
                            line.split('|').forEach(cell => {
                                let th = document.createElement('th')
                                th.style.color = 'var(--bs-gray-900)'
                                th.innerHTML = cell
                                hrow.appendChild(th)
                            })
                            head.appendChild(hrow)
                            html.appendChild(head)
                            data.head = false
                            break;
                        default:
                            let body = document.createElement('tbody')
                            body.style.color = 'var(--bs-gray-200)'

                            let brow = document.createElement('tr')
                            let split = line.split('|')

                            split.forEach((cell, index) => {
                                if (cell.includes(':-')) {
                                    switch (index) {
                                        case 0:
                                            data.leftAlign = true;
                                            break;
                                        case 1:
                                            data.rightAlign = true;
                                            break;
                                    }
                                }
                            })

                            if (split.includes('-')) break;
                            split.forEach((cell, index) => {
                                let td = document.createElement('td')
                                td.style.color = 'var(--bs-gray-900)'
                                td.innerHTML = cell
                                brow.appendChild(td)
                                if ((index == 0 && data.leftAlign) ||
                                    (index == 1 && data.rightAlign)) td.style.textAlign = 'center'
                            })
                            body.appendChild(brow)
                            html.appendChild(body)
                            break;
                    }

                })
                this.parentNode.replaceChild(html, this)
            }
        })

        $(document.body).find(".hex").each(async function () {
            await new Promise(r => setTimeout(r, 250))
            this.style = `background: #${this.nextSibling.innerHTML} !important`
        })
        $(document.body).find("v").each(function () {
            this.addEventListener('click', function () {
                navigator.clipboard.writeText(this.innerText)
            })
        })
    })

    let unitsDoc = document.createElement('div')
    unitsDoc.id = "units-intro"
    unitsDoc.className = "doc unit-doc"

    const response = await fetch(`./resources/units/README.md`);
    const data = await response.text();

    var converter = new showdown.Converter();    
    converter.setOption('literalMidWordAsterisks', true)
    converter.setOption('literalMidWordUnderscores', true)
    html = converter.makeHtml(data);
    unitsDoc.innerHTML = html

    $('#units-content')[0].appendChild(unitsDoc)

    $('#units-nav').one('click', function () {
        fetchUnits(async () => {

            $('.btn-unit').each(function () {
                $(this).click(function () {
                    $('.btn-unit').each(function () {
                        $(this)[0].style = "color: var(--bs-gray-500)"
                    })
                    $(this)[0].style = "color: white"
                })
            })
        }).then(async () => {
            await unitList.loaded
            for (var faction of Object.keys(unitList.units)) {
                for (var type of Object.keys(unitList.units[faction])) {
                    unitList.units[faction][type].forEach(unit => unit.element.children[0].dataset.bsOriginalTitle = unit.unitType)
                }
            }
        })
        $('#units-nav').off('click');
        resetUnitsNav()
    })

    $('#news-nav').one('click', function () {
        fetchNews()
        $('#news-nav').off('click');
        resetNewsNav()
    });

    $(document).ready(async function () {
        let update = document.createElement('div')
        document.getElementById('docs-sidebar').appendChild(update)

        update.className = "update"

        fetch('https://api.github.com/repos/asanull/pawiki.github.io/commits?per_page=1')
            .then(res => res.json())
            .then(res => {
                let date = new Date(res[0].commit.author.date)
                update.innerText = `latest commit:\n${date.toString()}`
            })
    })
    await unitList.loaded
    sortBy('File Name')
    sortBy('Unit Type')
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
    $(tooltipTriggerList).on('mouseout', function () {
        $(this).tooltip('hide')
    })
})

async function sortBy(sort) {
    await unitList.loaded
    switch (sort) {
        case 'Faction':
            document.getElementById('sortby').innerText = 'Faction'
            for (var faction of Object.keys(unitList.units)) {
                for (var type of Object.keys(unitList.units[faction])) {
                    // Sort by faction
                    unitList.units[faction][type]
                        .sort((a, b) => b.faction.localeCompare(a.faction))
                        .forEach(unit => {
                            let parent = unit.element.parentNode
                            unit.element.remove()
                            parent.appendChild(unit.element)
                        })
                }
            }
            break;
        case 'Unit Name':
            document.getElementById('sortby').innerText = 'Name'
            for (var faction of Object.keys(unitList.units)) {
                for (var type of Object.keys(unitList.units[faction])) {
                    // Sort by name                    
                    unitList.units[faction][type]
                        .sort((a, b) => a.unitName.localeCompare(b.unitName))
                        .forEach(unit => {
                            let parent = unit.element.parentNode
                            unit.element.remove()
                            parent.appendChild(unit.element)
                        })
                }
            }
            break;
        case 'Unit Type':
            document.getElementById('sortby').innerText = 'Type'
            for (var faction of Object.keys(unitList.units)) {
                for (var type of Object.keys(unitList.units[faction])) {
                    // Sort by type
                    unitList.units[faction][type]
                        .sort((a, b) => a.unitType.localeCompare(b.unitType))
                        .forEach(async unit => {
                            let parent = unit.element.parentNode
                            unit.element.remove()
                            let wait = 0
                            if (unit.isStructure) wait = 100
                            await new Promise(r => setTimeout(r, wait))
                            parent.appendChild(unit.element)
                        })
                }
            }
            break;
        case 'File Name':
            document.getElementById('sortby').innerText = 'File'
            for (var faction of Object.keys(unitList.units)) {
                for (var type of Object.keys(unitList.units[faction])) {
                    // Sort by file
                    unitList.units[faction][type]
                        .sort((a, b) => a.fileName.localeCompare(b.fileName))
                        .forEach(unit => {
                            let parent = unit.element.parentNode
                            unit.element.remove()
                            parent.appendChild(unit.element)
                        })
                }
            }
            break;
    }
}

// To prevent local copies of the wiki affecting the stats at: https://hits.sh/pawiki.xyz/
if (location.host == 'pawiki.xyz') {
    let img = document.createElement('img')
    img.src = 'https://hits.sh/pawiki.xyz.svg'
    img.style = 'display: none'
    document.body.appendChild(img)
}