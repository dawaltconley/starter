---
---

fetch('/admin/config.yml').then(r => r.text()).then(data => generatePreviews(jsyaml.load(data)))

const templates = [
    {% for template in site.templates %}
        {
            name: `{{ template.template }}`,
            path: `{{ template.inputPath }}`,
            html: `{{ template | strip_newlines | replace: '`', '\\`' }}`
        },
    {% endfor %}
]

class ChildPreview extends React.Component {
    constructor (props) {
        super(props)
        this.update = props.update
        if (props.dateFormat)
            this.update = () => dayjs(props.update()).format(props.dateFormat)
    }
    render () {
        return h(this.props.name, this.props.attribs, this.update())
    }
}

class ImagePreview extends React.Component {
    constructor (props) {
        super(props)
        this.attribs = props.attribs
        this.attribs.srcset = null
    }
    render () {
        let src = this.props.update()
        if (src) {
            return h('img', Object.assign(this.attribs, { src: src }))
        } else {
            return h('Fragment')
        }
    }
}

class DefaultTemplate extends React.Component {
    constructor (props) {
        super(props)
        const collection = props.collection.get('name')
        const file = props.collection.get('files') && props.entry.get('slug')
        const path = props.entry.get('path')
        const template = path && templates.find(t => t.path === path)
            || file && templates.find(t => t.name === file)
            || templates.find(t => t.name === collection)
            || templates.find(t => t.name === 'default')
        const doc = new DOMParser().parseFromString(template.html, 'text/html')
        Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
            .map(s => s.href)
            .forEach(s => CMS.registerPreviewStyle(s))
        this.html = this.parseHTML(doc.querySelector('body').outerHTML)
    }
    parseHTML (html) {
        return HTMLReactParser(html, {
            replace: ({ name, attribs, children }) => {
                if (!attribs) return
                let {
                    'data-preview-field': field,
                    'data-preview-widget': widget,
                    'data-preview-asset': asset,
                    'data-preview-date': date,
                    'data-preview-hide': hide
                } = attribs
                if (field) {
                    const update = () => this.props.entry.getIn(['data', ...field.split('.')])
                    if (update() !== null)
                        return h(ChildPreview, { name: name, attribs: attribs, update: update, dateFormat: date })
                }
                if (widget) {
                    let w = widget.split('.')
                    let update = () => this.props.widgetFor(w[0])
                    if (w.length === 2 && this.props.widgetsFor(w[0]) !== undefined)
                        update = () => this.props.widgetsFor(w[0]).getIn(['widgets', w[1]])
                    if (update() !== undefined)
                        return h(ChildPreview, { name: name, attribs: attribs, update: update })
                }
                if (asset) {
                    const update = () => this.props.entry.getIn(['data', ...asset.split('.')])
                    if (name === 'img' && update() !== undefined)
                        return h(ImagePreview, { attribs: attribs, update: () => this.props.getAsset(update()) })
                }
                if (hide) return h('Fragment')
            }
        })
    }
    render () {
        return this.html
    }
}

const generatePreviews = config => {
    const collections = config.collections.filter(c => c.editor === undefined || c.editor.preview !== false)
    collections.forEach(c => {
        if (c.folder) {
            CMS.registerPreviewTemplate(c.name, DefaultTemplate)
        } else if (c.files) {
            c.files.forEach(file => CMS.registerPreviewTemplate(file.name, DefaultTemplate))
        }
    })
}
