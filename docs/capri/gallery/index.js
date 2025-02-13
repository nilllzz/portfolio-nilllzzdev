/**
 * @typedef {{name:string,url?:string}} Author
 * @typedef {{imgUrl:string,author:Author,title:string,subtitle?:string}} GalleryEntry
 */

/**
 * @type {GalleryEntry[]} gallery
 */
const gallery = [
  {
    title: "Goober",
    imgUrl: "goober.png",
    author: {
      name: "BlueRhapsodyy",
      url: "https://bsky.app/profile/bluerhapsodyy.bsky.social",
    },
  },
  {
    title: "Harness",
    imgUrl: "harness.png",
    author: {
      name: "BlueRhapsodyy",
      url: "https://bsky.app/profile/bluerhapsodyy.bsky.social",
    },
  },
  {
    title: "Hug",
    imgUrl: "hug.png",
    author: {
      name: "BlueRhapsodyy",
      url: "https://bsky.app/profile/bluerhapsodyy.bsky.social",
    },
  },
  {
    title: "Reference Sheet",
    imgUrl: "ref.png",
    author: {
      name: "BlueRhapsodyy",
      url: "https://bsky.app/profile/bluerhapsodyy.bsky.social",
    },
  },
  {
    title: "Sphere",
    imgUrl: "sphere.gif",
    author: {
      name: "BlueRhapsodyy",
      url: "https://bsky.app/profile/bluerhapsodyy.bsky.social",
    },
  },
  {
    title: "Stare",
    imgUrl: "stare.png",
    author: {
      name: "JulianDough",
      url: "https://juliandoes.art",
    },
  },
  {
    title: "Wave",
    imgUrl: "wave.gif",
    author: {
      name: "Natezacate",
    },
  },
  {
    title: "Angy",
    imgUrl: "angy.png",
    author: {
      name: "BlueRhapsodyy",
      url: "https://bsky.app/profile/bluerhapsodyy.bsky.social",
    },
  },
  {
    title: "Amogus",
    imgUrl: "amogus.png",
    author: {
      name: "JulianDough",
      url: "https://juliandoes.art",
    },
  },

  {
    title: "Nodding",
    imgUrl: "capri_bopbop_2_l_square.gif",
    author: {
      name: "BlueRhapsodyy",
      url: "https://bsky.app/profile/bluerhapsodyy.bsky.social",
    },
  },
  {
    title: "Flooshed",
    imgUrl: "flooshed_square.png",
    author: {
      name: "BlueRhapsodyy",
      url: "https://bsky.app/profile/bluerhapsodyy.bsky.social",
    },
  },
  {
    title: "Hi! Doodle",
    imgUrl: "racc_doodle.png",
    author: {
      name: "ImJustRacc",
    },
  },
  {
    title: "RAHHHH!",
    imgUrl: "rah_square.png",
    author: {
      name: "BlueRhapsodyy",
      url: "https://bsky.app/profile/bluerhapsodyy.bsky.social",
    },
  },
  {
    title: "Stare...",
    imgUrl: "stare2_square.png",
    author: {
      name: "BlueRhapsodyy",
      url: "https://bsky.app/profile/bluerhapsodyy.bsky.social",
    },
  },
  {
    title: "'tism",
    imgUrl: "tism_square.png",
    author: {
      name: "BlueRhapsodyy",
      url: "https://bsky.app/profile/bluerhapsodyy.bsky.social",
    },
  },
  {
    title: "WAAAAAHHH *sniff*",
    imgUrl: "waaaaaahhhh_square.png",
    author: {
      name: "BlueRhapsodyy",
      url: "https://bsky.app/profile/bluerhapsodyy.bsky.social",
    },
  },
  {
    title: "AAAARRRGGHHH",
    imgUrl: "aaaarrrgghhh.png",
    author: {
      name: "BlueRhapsodyy",
      url: "https://bsky.app/profile/bluerhapsodyy.bsky.social",
    },
  },
];

const galleryItemTemplate = document.getElementById("galleryItemTemplate");
const galleryEl = document.getElementById("gallery");

for (const galleryEntry of gallery.toSorted((a, b) =>
  a.title.localeCompare(b.title)
)) {
  const galleryItem = galleryItemTemplate.content.cloneNode(true);

  const imageEl = galleryItem.querySelector('[data-id="image"]');
  imageEl.src = `../img/gallery/${galleryEntry.imgUrl}`;
  imageEl.setAttribute("alt", galleryEntry.title);
  imageEl.setAttribute("title", galleryEntry.title);

  const titleEl = galleryItem.querySelector('[data-id="title"]');
  titleEl.textContent = galleryEntry.title;

  const imageLinkEl = galleryItem.querySelector('[data-id="imageLink"]');
  imageLinkEl.href = `../img/gallery/${galleryEntry.imgUrl}`;

  const authorEl = galleryItem.querySelector('[data-id="author"]');
  authorEl.textContent = galleryEntry.author.name;
  if (galleryEntry.author.url) {
    authorEl.href = galleryEntry.author.url;
  }

  galleryEl.appendChild(galleryItem);
}
