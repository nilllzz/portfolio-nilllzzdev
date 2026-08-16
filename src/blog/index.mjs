import markdownit from "markdown-it";
import path from "path";
import fs, { read } from "fs";
import he from "he";
import mila from "markdown-it-link-attributes";

const outputPath = path.resolve("docs/blog");
const sourcePath = path.resolve("src/blog");

console.log("Compiling from " + sourcePath + " to " + outputPath);

async function run() {
    await cleanup();
    await prepareOutput();
    await copyGlobalResources();

    const articleFiles = await getAllArticles();

    const layoutTemplate = await readLocalFile("layout.html");
    const articleTemplate = await readLocalFile("article.html");
    const browseTemplate = await readLocalFile("browse.html");

    console.log("Compiling articles...");

    const articleFileSystem = {};

    const articlesData = [];

    for (const articleFile of articleFiles) {
        const articleData = JSON.parse(await readLocalFile(articleFile));
        articlesData.push(articleData);
        let articleHtml = compileArticlePage(layoutTemplate, articleTemplate, articleData);

        const articlePath = getArticlePath(articleData);
        const articleUrl = "https://nilllzz.dev/blog/articles/" + articlePath;
        articleHtml = articleHtml.replaceAll("{{ URL }}", articleUrl);

        articleHtml = await processArticleResources(articleFile, articleHtml, articleData);

        const outputFilePath = path.join(outputPath, "articles", articlePath);
        fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
        fs.writeFileSync(outputFilePath, articleHtml, "utf-8");
        console.log("\t" + articleData.article.title);

        const articleLocation = articleData.article.location.split("/");
        updateArticleFileSystem(articleFileSystem, articleLocation, articleData);
    }

    console.log("Compiling page index...");
    await renderArticleFileSystem(layoutTemplate, browseTemplate, articleFileSystem, []);

    // Sort articlesData by article.published date, newest first:
    articlesData.sort((a, b) => {
        const dateA = new Date(a.article.published);
        const dateB = new Date(b.article.published);
        return dateB - dateA;
    });
    await renderIndexPage(layoutTemplate, articlesData);
}

async function renderIndexPage(layoutTemplate, articlesData) {
    const indexTemplate = await readLocalFile("index.html");
    const articleEntryTemplate = await readLocalFile("indexArticleTemplate.html");

    const pageArticlesData = articlesData.slice(0, 10);

    let indexContent = "";

    for (const articleData of pageArticlesData) {
        let articleHtml = articleEntryTemplate.replace("{{ TITLE }}", articleData.article.title);

        const articlePath = getArticlePath(articleData);
        const articleUrl = "/blog/articles/" + path.dirname(articlePath);

        const articleBody = compileArticleBody(articleData);

        articleHtml = articleHtml.replace("{{ URL }}", articleUrl);
        articleHtml = articleHtml.replace("{{ BODY }}", articleBody);

        const publishedOnDate = new Date(articleData.article.published);
        const publishedOnFormatted = `<span title="${articleData.article.published}">${publishedOnDate.toDateString()}</span>`;
        articleHtml = articleHtml.replace("{{ PUBLISHED }}", publishedOnFormatted);

        articleHtml = await processArticleResources("", articleHtml, articleData, false);

        indexContent += articleHtml + "\n";
    }

    const finalHtml = layoutTemplate
        .replace("{{ PAGE }}", indexTemplate.replace("{{ CONTENT }}", indexContent))
        .replaceAll("{{ TITLE }}", "Blog");

    const outputFilePath = path.join(outputPath, "index.html");
    fs.writeFileSync(outputFilePath, finalHtml, "utf-8");
    console.log("Generated blog index page.");
}

async function renderArticleFileSystem(
    layoutTemplate,
    browseTemplate,
    articleFileSystem,
    pathParts,
) {
    let articles = [];
    const categories = [];

    for (const key in articleFileSystem) {
        if (!Object.hasOwn(articleFileSystem, key)) continue;

        const element = articleFileSystem[key];

        if (key == "__articles") {
            articles = element;
        } else {
            categories.push(key);
            await renderArticleFileSystem(layoutTemplate, browseTemplate, element, [
                ...pathParts,
                key,
            ]);
        }
    }

    const browsePath = path.join(outputPath, "articles", ...pathParts, "index.html").toLowerCase();

    let browseHtml = browseTemplate;

    // Title:
    const title = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "Articles";
    browseHtml = browseHtml.replace("{{ TITLE }}", title);

    // Nav:
    const navHtml = compileNav(pathParts.slice(0, -1), pathParts.length > 0);
    browseHtml = browseHtml.replace("{{ NAV }}", navHtml);

    // Content:
    let browseContent = "";

    let browseCategoriesHtml = "";
    if (categories.length > 0) {
        browseCategoriesHtml = "<h3>Categories</h3><ul>";
        for (const category of categories) {
            browseCategoriesHtml += `<li><a href="${category.toLowerCase()}">${category}</a></li>`;
        }
        browseCategoriesHtml += "</ul>";

        browseContent += browseCategoriesHtml;
    }

    let browseArticlesHtml = "";
    if (articles.length > 0) {
        browseArticlesHtml = "<h3>Articles</h3><ul>";
        for (const articleData of articles) {
            const articleSlug = getArticleSlug(articleData);
            browseArticlesHtml += `<li><a href="${articleSlug.toLowerCase()}">${articleData.article.title}</a></li>`;
        }
        browseArticlesHtml += "</ul>";

        browseContent += browseArticlesHtml;
    }

    browseHtml = browseHtml.replace("{{ CONTENT }}", browseContent);

    // Assemble final HTML:
    const finalHtml = layoutTemplate
        .replace("{{ PAGE }}", browseHtml)
        .replaceAll("{{ TITLE }}", he.encode(title));

    fs.mkdirSync(path.dirname(browsePath), { recursive: true });
    fs.writeFileSync(browsePath, finalHtml, "utf-8");
    console.log("\t" + (pathParts.length > 0 ? pathParts.join("/") : "Articles"));
}

function updateArticleFileSystem(articleFileSystem, pathParts, articleData) {
    if (articleFileSystem[pathParts[0]] === undefined) {
        articleFileSystem[pathParts[0]] = {
            __articles: [],
        };
    }

    if (pathParts.length > 1) {
        updateArticleFileSystem(articleFileSystem[pathParts[0]], pathParts.slice(1), articleData);
    } else {
        articleFileSystem[pathParts[0]].__articles.push(articleData);
    }
}

function compileNav(pathParts, includeArticles) {
    const paths = includeArticles ? ["Blog", "Articles", ...pathParts] : ["Blog", ...pathParts];

    let html = '<ul><li><a href="/">Home</a></li>';
    let cPath = "";
    for (const pathPart of paths) {
        cPath += "/" + pathPart.toLowerCase();
        html += `<li><a href="${cPath}">${pathPart}</a></li>`;
    }
    html += "</ul>";

    return html;
}

function compileArticleBody(articleData) {
    var md = markdownit();
    md.use(mila, {
        matcher(href, config) {
            return !href.startsWith("/blog");
        },
        attrs: {
            target: "_blank",
            rel: "noopener noreferrer nofollow",
        },
    });

    var articleContent = [];

    for (const bodyBlock of articleData.article.body) {
        var blockType = bodyBlock.type;
        var blockHtml = "";

        switch (blockType) {
            case "markdown":
                var markdownData = bodyBlock.content;
                if (Array.isArray(markdownData)) {
                    var markdownDataStr = "";
                    for (let markdownParagraph of markdownData) {
                        if (Array.isArray(markdownParagraph)) {
                            markdownParagraph = markdownParagraph.join("\n");
                        }

                        markdownDataStr += markdownParagraph + "\n\n";
                    }
                    markdownData = markdownDataStr;
                }
                blockHtml = md.render(markdownData);
                break;

            default:
                console.error(
                    "Unknown block type: " + blockType + " in article " + articleData.article.title,
                );
                break;
        }

        blockHtml = "<div>" + blockHtml + "</div>";
        articleContent.push(blockHtml);
    }

    return articleContent.join("\n");
}

function compileArticlePage(layoutTemplate, articleTemplate, articleData) {
    const articleContent = compileArticleBody(articleData);
    const navHtml = compileNav(articleData.article.location.split("/"), true);

    const articleHtml = articleTemplate
        .replace("{{ CONTENT }}", articleContent)
        .replace("{{ NAV }}", navHtml);

    const publishedOnDate = new Date(articleData.article.published);
    const publishedOnFormatted = `<span title="${articleData.article.published}">${publishedOnDate.toDateString()}</span>`;

    const finalHtml = layoutTemplate
        .replace("{{ PAGE }}", articleHtml)
        .replaceAll("{{ TITLE }}", he.encode(articleData.article.title))
        .replace("{{ PUBLISHED }}", publishedOnFormatted);
    return finalHtml;
}

function getArticleSlug(articleData) {
    return (
        articleData.article.slug ||
        articleData.article.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^\-+/, "")
            .replace(/\-+$/, "")
    );
}

function getArticlePath(articleData) {
    const basePath = articleData.article.location.toLowerCase();

    const slug = getArticleSlug(articleData);
    return path.join(basePath, slug, "index.html");
}

async function getAllArticles() {
    const files = fs.readdirSync(sourcePath + "/articles", { recursive: true });
    const articleFiles = [];
    for (const file of files) {
        if (file.endsWith(".json")) {
            articleFiles.push("articles/" + file);
        }
    }

    return articleFiles;
}

async function processArticleResources(articleFile, articleHtml, articleData, copyFiles = true) {
    var resources = articleData.article.resources;
    var articleLocation = articleData.article.location;
    var articleSlug = getArticleSlug(articleData);

    for (const resource of resources) {
        var resourceOutputPath = path.join(
            outputPath,
            "img/articles/",
            articleLocation,
            articleSlug,
            resource,
        );

        if (copyFiles) {
            var articleFolder = path.dirname(articleFile);
            var resourceSourcePath = path.join(sourcePath, articleFolder, resource);

            fs.mkdirSync(path.dirname(resourceOutputPath), { recursive: true });
            fs.copyFileSync(resourceSourcePath, resourceOutputPath);
        }

        var resourceUrl =
            "/blog/img/articles/" + articleLocation + "/" + articleSlug + "/" + resource;
        articleHtml = articleHtml.replaceAll("resource:" + resource, resourceUrl);
    }

    return articleHtml;
}

async function readLocalFile(relativePath) {
    const fullPath = path.resolve(sourcePath, relativePath);
    return fs.readFileSync(fullPath, "utf-8");
}

async function cleanup() {
    if (fs.existsSync(outputPath)) {
        fs.rmSync(outputPath, { recursive: true, force: true });
        console.log("Deleted blog output folder.");
    }
}

async function prepareOutput() {
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }

    var imgPath = path.join(outputPath, "img");
    if (!fs.existsSync(imgPath)) {
        fs.mkdirSync(imgPath, { recursive: true });
    }
}

async function copyGlobalResources() {
    const globalResourcePath = path.join(sourcePath, "resources");
    if (fs.existsSync(globalResourcePath)) {
        const resources = fs.readdirSync(globalResourcePath);
        for (const resource of resources) {
            var resourceSourcePath = path.join(globalResourcePath, resource);
            var resourceOutputPath = path.join(outputPath, resource);
            fs.copyFileSync(resourceSourcePath, resourceOutputPath);
        }
    }
}

run();
