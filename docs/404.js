let outputText = "";
let inputText = "";
let currentPath = "/home/guest";
let startupCompleted = false;

const inputBoxEl = document.getElementById("input-box");
const outputBoxEl = document.getElementById("output-box");
const inputPathEl = document.getElementById("input-path");

function setInputBoxText() {
    inputBoxEl.innerText = inputText;
}

function setCurrentPath() {
    inputPathEl.innerText = currentPath;
}

setInputBoxText();
setCurrentPath();

document.addEventListener("keydown", onKeyPress);
document.addEventListener("paste", onPaste);

function onKeyPress(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) {
        // let combos like ctrl+v fall through to the native paste event
        return;
    }

    if (event.key === "F1") {
        const touchOverlayEl = document.getElementById("touch-overlay");
        if (touchOverlayEl) {
            touchOverlayEl.remove();

            if (startupCompleted) {
                startupCompleted = false;
                outputBoxEl.innerHTML = "";
                startupSequence();
            }

            event.preventDefault();
            return;
        }
    }

    if (event.key === "Backspace") {
        inputText = inputText.slice(0, -1);
        setInputBoxText();
        event.preventDefault();
        return;
    }

    if (event.key === "Enter") {
        processCommand(inputText);
        event.preventDefault();
        return;
    }

    // single-character keys are printable (letters, digits, symbols, space);
    // named keys like "Enter", "Shift", "ArrowLeft" have longer strings and are skipped
    if (event.key.length === 1) {
        if (inputText.length < 40) {
            inputText += event.key;
            setInputBoxText();
        }
        event.preventDefault();
    }
}

/**
 *
 * @param {string} command
 */
async function processCommand(command) {
    inputText = "";
    setInputBoxText();

    command = command.trim();
    if (command === "") {
        return;
    }

    if (!command.toLowerCase().startsWith("cd")) {
        const failedCommand = command.split(" ")[0];
        printLine(failedCommand + ": command not found");
        return;
    }

    if (!command.toLowerCase().startsWith("cd")) {
        printLine("cd: no path option found");
        return;
    }

    const goOption = command
        .substring(command.indexOf(" ") + 1)
        .trim()
        .toLowerCase();

    const gotoLocation = getGotoLocation(goOption);
    if (gotoLocation === null) {
        printLine("cd: " + goOption + ": no such document");
        return;
    }

    printLine("Navigating to [" + goOption + "]...");
    await sleep(500);
    window.location.href = "https://nilllzz.dev" + gotoLocation;
}

function getGotoLocation(goOption) {
    while (goOption.endsWith("/")) {
        goOption = goOption.substring(0, goOption.length - 2);
    }

    switch (goOption) {
        case "/":
        case "/blog":
        case "/capri":
        case "/misc/breadsticks":
            return goOption;

        default:
            return null;
    }
}

function onPaste(event) {
    const pastedText = event.clipboardData.getData("text");
    inputText += pastedText;
    setInputBoxText();
    event.preventDefault();
}

function printLine(line) {
    const newLineEl = document.createElement("div");
    newLineEl.className = "output-line";
    newLineEl.innerHTML = line;

    outputBoxEl.appendChild(newLineEl);
}

async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), ms);
    });
}

async function startupSequence() {
    await sleep(1000);

    printLine("Hello &lt;guest&gt;, welcome to nilllzz.dev!");
    await sleep(100);
    printLine("CapriCLI Copyright &copy; " + new Date().getFullYear());
    await sleep(1500);
    printLine("&nbsp;");
    await sleep(100);
    printLine("Unfortunately, the document you requested was not found!");
    await sleep(1500);
    printLine("&nbsp;");
    await sleep(100);
    printLine("Here is a list of valid documents to open:");
    await sleep(200);

    const docs = [
        ["/", "Home"],
        ["/blog", "Blog frontpage"],
        ["/capri", "Capri's residence"],
    ];
    for (const doc of docs) {
        const docPath = doc[0];
        const docName = doc[1];

        const spaceNum = 20 - docPath.length;
        let spacing = "";
        for (let i = 0; i < spaceNum; i++) {
            spacing += "&nbsp;";
        }

        printLine(`<span class="color-path">${docPath}</span>${spacing}${docName}`);
        await sleep(100);
    }

    printLine("&nbsp;");
    printLine(
        `Type <span class="color-user">cd</span> <span class="color-path">&lt;path&gt;</span> to navigate.`,
    );
    await sleep(200);
    printLine("&nbsp;");

    startupCompleted = true;
}

startupSequence();

function goHomeTouch() {
    window.location.href = "/";
}
