const path = require('path')
const crypto = require('crypto')
const yaml = require('js-yaml')
const moment = require('moment')
// const dateFilter = require('nunjucks-date-filter')

// const collectionsByDir = (obj, config) => {
//     for (const name in obj) {
//         const dir = obj[name]
//         config.addCollection(name, api => api.getFilteredByGlob(path.join('.', dir, '*')))
//     }
// }
//
// const collections = {
//     posts: '_posts',
//     comments: '_comments',
//     templates: '_templates'
// }

module.exports = eleventyConfig => {
    // shortcodes
    // eleventyConfig.addNunjucksShortcode('icon', )

    // custom filters
    eleventyConfig.addFilter('date', (date, format=undefined) => moment(date).format(format))
    eleventyConfig.addFilter('md5', string => crypto.createHash('md5').update(string).digest('hex'))
    eleventyConfig.addFilter('fileSuffix', (filePath, suffix) => {
        const { dir, name, ext } = path.parse(filePath)
        return path.join(dir, name + suffix + ext)
    })

    // add YAML support
    eleventyConfig.addDataExtension('yml', data => yaml.safeLoad(data))
    eleventyConfig.addDataExtension('yaml', data => yaml.safeLoad(data))

    eleventyConfig.setFrontMatterParsingOptions({
        excerpt: true,
        excerpt_separator: /<!--\s*more\s*-->/
    })

    return {
        dir: {
            input: './',
            output: './_site',
            includes: '_includes',
            layouts: '_layouts',
            data: '_data',
        },
        dataTemplateEngine: 'njk',
        markdownTemplateEngine: 'njk',
        htmlTemplateEngine: 'njk',
        // jsDataFileSuffix: 'data'
    }
}
