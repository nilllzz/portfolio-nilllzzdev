// Tap/click support for hotspot tooltips (hover already works via CSS on desktop).
const hotspots = document.querySelectorAll(".hotspot");

// Fade out the top-center header-name image and reveal the hotspots once the
// model has loaded and the user actually interacts with the camera (not the
// initial attribute-driven camera-orbit/camera-target positioning, which
// also fires "camera-change").
const modelViewer = document.querySelector("model-viewer");
const headerName = document.getElementById("header-name");

const defaultCameraOrbit = modelViewer.getAttribute("camera-orbit");
const defaultCameraTarget = modelViewer.getAttribute("camera-target");

function parseVectorAttribute(value) {
  return value
    .trim()
    .split(/\s+/)
    .map((component) => parseFloat(component));
}

function focusCameraOnHotspot(hotspot) {
  const [nx, ny, nz] = parseVectorAttribute(hotspot.dataset.normal);
  const length = Math.hypot(nx, ny, nz) || 1;
  const azimuthDeg = (Math.atan2(nx / length, nz / length) * 180) / Math.PI;
  const polarDeg = (Math.acos(ny / length) * 180) / Math.PI;

  modelViewer.cameraTarget = hotspot.dataset.position;
  modelViewer.cameraOrbit = `${azimuthDeg}deg ${polarDeg}deg 0.1m`;
}

function armFirstInteractionListener() {
  function onCameraChange(event) {
    if (event.detail.source === "user-interaction") {
      headerName.classList.add("hidden");
      hotspots.forEach((h) => h.classList.remove("pre-interaction"));
      modelViewer.removeEventListener("camera-change", onCameraChange);
    }
  }
  modelViewer.addEventListener("camera-change", onCameraChange);
}

modelViewer.addEventListener("load", () => {
  modelViewer.classList.add("loaded");

  const hash = location.hash.slice(1);
  if (hash) {
    const target = document.querySelector(`[slot="hotspot-${hash}"]`);
    if (target) {
      target.classList.add("active");
      target.classList.remove("pre-interaction");
      updateHotspotVisibility();
      focusCameraOnHotspot(target);
    }
  }

  armFirstInteractionListener();
});

function hideHotspots() {
  document.body.classList.add("hotspots-hidden");
}

function revealHotspots() {
  document.body.classList.remove("hotspots-hidden");
  hotspots.forEach((h) => h.classList.remove("pre-interaction"));
}

// Reveal the hotspots if they're hidden and the user moves/orbits/zooms the
// camera, same as pressing Escape again while hidden.
modelViewer.addEventListener("camera-change", (event) => {
  if (
    event.detail.source === "user-interaction" &&
    document.body.classList.contains("hotspots-hidden")
  ) {
    revealHotspots();
  }
});

function updateHotspotVisibility() {
  const anyHighlighted = Array.from(hotspots).some(
    (h) => h.classList.contains("active") || h.classList.contains("hovered"),
  );
  hotspots.forEach((h) => {
    const isHighlighted =
      h.classList.contains("active") || h.classList.contains("hovered");
    h.classList.toggle("dimmed", anyHighlighted && !isHighlighted);
  });
}

hotspots.forEach((hotspot) => {
  hotspot.addEventListener("click", (event) => {
    event.stopPropagation();
    const wasActive = hotspot.classList.contains("active");
    hotspots.forEach((h) => h.classList.remove("active"));
    if (!wasActive) {
      hotspot.classList.add("active");
      const slotName = hotspot.getAttribute("slot").replace(/^hotspot-/, "");
      history.replaceState(null, "", `#${slotName}`);
      focusCameraOnHotspot(hotspot);
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

// Tapping/clicking anywhere else dismisses any open tooltip.
document.addEventListener("click", () => {
  const hadActive = Array.from(hotspots).some((h) =>
    h.classList.contains("active"),
  );
  hotspots.forEach((h) => h.classList.remove("active"));
  if (hadActive) {
    history.replaceState(null, "", location.pathname + location.search);
  }
  updateHotspotVisibility();
});

// Escape key: close an open tooltip first; if none is open, toggle hiding
// all hotspots (and pressing Escape again while hidden reveals them).
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  const activeHotspot = Array.from(hotspots).find((h) =>
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

  modelViewer.cameraOrbit = defaultCameraOrbit;
  modelViewer.cameraTarget = defaultCameraTarget;

  const hadActive = Array.from(hotspots).some((h) =>
    h.classList.contains("active"),
  );
  hotspots.forEach((h) => {
    h.classList.remove("active", "hovered");
    h.classList.add("pre-interaction");
  });
  document.body.classList.remove("hotspots-hidden");
  updateHotspotVisibility();
  headerName.classList.remove("hidden");
  armFirstInteractionListener();

  if (hadActive) {
    history.replaceState(null, "", location.pathname + location.search);
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
