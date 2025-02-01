const detailsDialogEl = document.getElementById("detailsDialog");
const detailsDialogCloseEl = document.getElementById("detailsDialogClose");

function openDetails(e) {
  const target = e.target;
  const poiType = target.getAttribute("data-poi");
  if (!poiType) {
    return;
  }

  // Find template for POI and set the content of the dialog.
  showDetailsModal(`poi-${poiType}`);
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
