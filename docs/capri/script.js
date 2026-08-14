class CapriModel {
    modelViewer;
    hotspots;
    defaultCameraOrbit;
    defaultCameraTarget;

    /**
     *
     * @param {HTMLElement} modelViewer
     */
    constructor(modelViewer) {
        this.modelViewer = modelViewer;
        this.hotspots = this.modelViewer.querySelectorAll(".hotspot");
        this.defaultCameraOrbit = this.modelViewer.getAttribute("camera-orbit");
        this.defaultCameraTarget = this.modelViewer.getAttribute("camera-target");

        this.modelViewer.addEventListener("load", () => {
            this.modelViewer.classList.add("loaded");

            const hash = location.hash.slice(1);
            if (hash) {
                const target = document.querySelector(`[slot="hotspot-${hash}"]`);
                if (target) {
                    target.classList.add("active");
                    target.classList.remove("pre-interaction");
                    updateHotspotVisibility();
                    this.focusCameraOnHotspot(target);
                }
            }

            this.armFirstInteractionListener();
        });

        // Reveal the hotspots if they're hidden and the user moves/orbits/zooms the
        // camera, same as pressing Escape again while hidden.
        this.modelViewer.addEventListener("camera-change", (event) => {
            if (
                event.detail.source === "user-interaction" &&
                document.body.classList.contains("hotspots-hidden")
            ) {
                revealHotspots();
            }
        });

        this.hotspots.forEach((hotspot) => {
            hotspot.addEventListener("click", (event) => {
                event.stopPropagation();
                const wasActive = hotspot.classList.contains("active");
                this.hotspots.forEach((h) => h.classList.remove("active"));
                if (!wasActive) {
                    hotspot.classList.add("active");
                    const slotName = hotspot.getAttribute("slot").replace(/^hotspot-/, "");
                    history.replaceState(null, "", `#${slotName}`);
                    this.focusCameraOnHotspot(hotspot);
                } else {
                    history.replaceState(null, "", location.pathname + location.search);
                }
                updateHotspotVisibility();
            });

            hotspot.addEventListener("mouseenter", () => {
                hotspot.classList.add("hovered");
                updateHotspotVisibility();
            });

            hotspot.addEventListener("mouseleave", () => {
                hotspot.classList.remove("hovered");
                updateHotspotVisibility();
            });
        });
    }

    armFirstInteractionListener() {
        function onCameraChange(event) {
            if (event.detail.source === "user-interaction") {
                headerNameEl.classList.add("hidden");
                this.hotspots.forEach((h) => h.classList.remove("pre-interaction"));
                this.modelViewer.removeEventListener("camera-change", onCameraChange.bind(this));
            }
        }
        this.modelViewer.addEventListener("camera-change", onCameraChange.bind(this));
    }

    focusCameraOnHotspot(hotspot) {
        const [nx, ny, nz] = parseVectorAttribute(hotspot.dataset.normal);
        const length = Math.hypot(nx, ny, nz) || 1;
        const azimuthDeg = (Math.atan2(nx / length, nz / length) * 180) / Math.PI;
        const polarDeg = (Math.acos(ny / length) * 180) / Math.PI;

        this.modelViewer.cameraTarget = hotspot.dataset.position;
        this.modelViewer.cameraOrbit = `${azimuthDeg}deg ${polarDeg}deg 0.1m`;
    }

    reset() {
        this.modelViewer.cameraOrbit = this.defaultCameraOrbit;
        this.modelViewer.cameraTarget = this.defaultCameraTarget;

        const hadActive = Array.from(this.hotspots).some((h) => h.classList.contains("active"));
        this.hotspots.forEach((h) => {
            h.classList.remove("active", "hovered");
            h.classList.add("pre-interaction");
        });
        document.body.classList.remove("hotspots-hidden");
        updateHotspotVisibility();
        headerNameEl.classList.remove("hidden");
        this.armFirstInteractionListener();

        if (hadActive) {
            history.replaceState(null, "", location.pathname + location.search);
        }
    }
}

const allModelViewerEls = document.querySelectorAll("model-viewer");
const allModelViewers = Array.from(allModelViewerEls).map((el) => new CapriModel(el));

let currentModelViewer = allModelViewers[0];

// Fade out the top-center header-name image and reveal the hotspots once the
// model has loaded and the user actually interacts with the camera (not the
// initial attribute-driven camera-orbit/camera-target positioning, which
// also fires "camera-change").
const headerNameEl = document.getElementById("header-name");

function parseVectorAttribute(value) {
    return value
        .trim()
        .split(/\s+/)
        .map((component) => parseFloat(component));
}

function hideHotspots() {
    document.body.classList.add("hotspots-hidden");
}

function revealHotspots() {
    document.body.classList.remove("hotspots-hidden");
    currentModelViewer.hotspots.forEach((h) => h.classList.remove("pre-interaction"));
}

function updateHotspotVisibility() {
    const anyHighlighted = Array.from(currentModelViewer.hotspots).some(
        (h) => h.classList.contains("active") || h.classList.contains("hovered"),
    );
    currentModelViewer.hotspots.forEach((h) => {
        const isHighlighted = h.classList.contains("active") || h.classList.contains("hovered");
        h.classList.toggle("dimmed", anyHighlighted && !isHighlighted);
    });
}

// Tapping/clicking anywhere else dismisses any open tooltip.
document.addEventListener("click", () => {
    const hadActive = Array.from(currentModelViewer.hotspots).some((h) =>
        h.classList.contains("active"),
    );
    currentModelViewer.hotspots.forEach((h) => h.classList.remove("active"));
    if (hadActive) {
        history.replaceState(null, "", location.pathname + location.search);
    }
    updateHotspotVisibility();
});

// Escape key: close an open tooltip first; if none is open, toggle hiding
// all hotspots (and pressing Escape again while hidden reveals them).
document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    const activeHotspot = Array.from(currentModelViewer.hotspots).find((h) =>
        h.classList.contains("active"),
    );

    if (activeHotspot) {
        activeHotspot.classList.remove("active");
        history.replaceState(null, "", location.pathname + location.search);
        updateHotspotVisibility();
        return;
    }

    if (document.body.classList.contains("hotspots-hidden")) {
        revealHotspots();
    } else {
        hideHotspots();
    }
});

// "R" key: reset the camera to its starting orbit/target, close any open
// tooltip, and put the hotspots back in the same dimmed state as page load.
document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() !== "r" || event.ctrlKey || event.metaKey) return;

    currentModelViewer.reset();
});

document.addEventListener("keydown", (event) => {
    const numberKeyNumber = parseInt(event.key, 10);
    if (numberKeyNumber >= 1 && numberKeyNumber <= allModelViewers.length) {
        currentModelViewer = allModelViewers[numberKeyNumber - 1];
        allModelViewers.forEach((mv) => {
            mv.modelViewer.style.display = "none";
        });
        currentModelViewer.modelViewer.style.display = "block";
        currentModelViewer.reset();
    }
});

// --- Dev helper -------------------------------------------------------
// Uncomment to click anywhere on the model and log the 3D position/normal
// at that point, so you can copy them into a hotspot's data-position and
// data-normal attributes instead of guessing coordinates by trial and error.
//
// modelViewer.addEventListener("click", (event) => {
//   const hit = modelViewer.positionAndNormalFromPoint(
//     event.clientX,
//     event.clientY,
//   );
//   if (hit) {
//     console.log(
//       `data-position="${hit.position.toString()}" data-normal="${hit.normal.toString()}"`,
//     );
//   }
// });
