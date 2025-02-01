const detailsDialogEl = document.getElementById("detailsDialog");
const detailsDialogCloseEl = document.getElementById("detailsDialogClose");

const allPoiEls = document.querySelectorAll("[data-poi]");
const allPois = Array.from(allPoiEls)
  .map((el) => el.getAttribute("data-poi"))
  .filter((x) => x !== null);
const allPoiTitles = Array.from(allPoiEls)
  .map((el) => el.getAttribute("title"))
  .filter((x) => x !== null);

let currentPoi = "";

function openDetails(e) {
  const target = e.target;
  const poiType = target.getAttribute("data-poi");
  if (!poiType) {
    return;
  }

  showPoi(poiType);
}

function showPoi(poiType) {
  // Find template for POI and set the content of the dialog.
  currentPoi = poiType;
  showDetailsModal(`poi-${poiType}`);

  // Add nav buttons to the dialog.
  const navButtonsTemplate = document.getElementById("detailsNavButtons");
  const navButtonsClone = navButtonsTemplate.content.cloneNode(true);

  const buttons = navButtonsClone.querySelectorAll("button");
  const previousPoiTitle =
    allPoiTitles[
      (allPois.indexOf(currentPoi) - 1 + allPois.length) % allPois.length
    ];
  const nextPoiTitle =
    allPoiTitles[(allPois.indexOf(currentPoi) + 1) % allPois.length];
  buttons[0].innerHTML = `<i class="bi bi-arrow-left"></i> ${previousPoiTitle}`;
  buttons[1].innerHTML = `${nextPoiTitle} <i class="bi bi-arrow-right"></i>`;

  detailsDialogEl.appendChild(navButtonsClone);
}

function showDetailsModal(copyFromId) {
  const template = document.getElementById(copyFromId);
  if (!template) {
    return;
  }

  const clone = template.content.cloneNode(true);
  detailsDialogEl.innerHTML = "";
  detailsDialogEl.appendChild(clone);

  // Add close button:
  const closeBtnClone = detailsDialogCloseEl.content.cloneNode(true);
  detailsDialogEl.appendChild(closeBtnClone);

  detailsDialogEl.showModal();
}

function closeDetailsModal() {
  detailsDialogEl.close();
}

function viewNextPoi() {
  const currentIndex = allPois.indexOf(currentPoi);
  const nextIndex = (currentIndex + 1) % allPois.length;
  showPoi(allPois[nextIndex]);
}
