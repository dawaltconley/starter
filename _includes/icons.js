const { URL } = require('url');

function makeIcon(context, type, link, kwargs={}) {
    if (kwargs.__keywords !== true)
        throw new Error('Icon tag only takes a type and a link; found third positional arg.');
    let {
        data = 'icon-types',
        style = '',
        linkText = link,
        list = false,
        showLink = false,
        microdata = false,
        newTab = type === 'phone',
        analytics:analyticsLabel
    } = kwargs;

    if (typeof data === 'string')
        data = context[data]
    const icon = {
        ...data.find(i => i.type === type),
        label: kwargs.label,
    }
    if (!icon.type)
        throw new Error(`No data for icon of type ${type}.`);

    let href;
    try {
        href = new URL(link).href;
    } catch(e) {
        if (e.name !== 'TypeError [ERR_INVALID_URL]')
            throw e;
        if (type === 'email') {
            href = link.match(/^mailto:/) ? link : 'mailto:' + link;
        } else if (type === 'phone') {
            href = 'tel:' + link.replace(/^tel:/, '').replace(/[ -().]/g, '');
        } else if (type === 'twitter') {
            href = 'https://twitter.com/' + href.replace(/^@/, '');
        } else {
            throw e;
        }
    }

    let alt, analyticsCatagory;
    if (['email', 'phone'].includes(type)) {
        alt = icon.label.replace(/^./, l => l.toUpperCase()) + 'link';
        analyticsCatagory = 'Contact Link';
    } else {
        alt = `Visit our ${icon.label} page`;
        analyticsCatagory = 'Social Link';
    }

    let faStyle = 'fas', faClass = icon['fa-default'];
    const iconStyles = style.split(' ');
    for (const style of iconStyles) {
        if (['regular', 'far', 'r'].includes(style)) {
            faStyle = 'far';
        } else if (['light', 'fal', 'l'].includes(style)) {
            faStyle = 'fal';
        } else {
            faClass = icon.['fa-'+style] || faClass;
        }
    }
    if (icon.brand) faStyle = 'fab';

    analyticsLabel = analyticsLabel || `Clicked on ${icon.label} link to ${href}`;

    let html = `<a class="media-icon ${type}-icon"`;
    if (newTab) html += ' target="_blank"';
    if (kwargs.microdata) {
        if (type === 'email')
            html += ' itemprop="email"';
        else if (type === 'phone')
            html += ' itemprop="telephone"';
    }
    if (context.site.google_analytics)
        html += ` data-analytics-catagory="${analyticsCatagory}" data-analytics-action="click" data-analytics-label="${analyticsLabel}"` 
    if (!kwargs.showLink)
        html += ` aria-label="${alt}"`
    html += ` href="${href}"><i class="fa-icon ${faStyle} fa-${faClass} no-select${kwargs.list ? ' fa-li' : ''}" aria-hidden="true"></i>`
    if (kwargs.showLink)
        html += `<span class="media-icon-text">${linkText}</span>`
    html += '</a>'

    return html
}

module.exports.icon = function () {
    this.tags = ['icon'];

    this.parse = function (parser, nodes, lexer) {
        var tok = parser.nextToken();

        var args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);

        return new nodes.CallExtension(this, "run", args);
    };

    this.run = makeIcon;
}

module.exports.icons = function () {
    this.tags = ['icons'];

    this.parse = function (parser, nodes, lexer) {
        var tok = parser.nextToken();

        var args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);

        return new nodes.CallExtension(this, "run", args);
    };

    this.run = function (context, icons, kwargs) {
        if (kwargs.__keywords !== true)
            throw new Error('Icons tag only takes a type and a link; found third positional arg.');

        let set = icons;
        if (typeof icons === 'string')
            icons = context[icons];
        if (icons instanceof Object)
            set = Object.entries(icons);
        if (icons instanceof Array && icons.every(i => i instanceof Array && i.length === 2))
            set = icons.reduce((a, i) => [...a, { type: i[0], link: i[1] }], []);

        let html = '';
        for (const { type, link } of set) {
            if (!link) continue;
            let iconHTML = mediaIcon(type, link, kwargs);
            if (kwargs.list)
                iconHTML = `<li>${iconHTML}</li>`;
            html += iconHTML;
        }

        return html;
    }
}
