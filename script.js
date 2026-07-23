
gsap.registerPlugin(ScrollTrigger, SplitText);

const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

/* ===================================================================
   PAGE TRANSITION — 0.7s fade on nav link clicks
   =================================================================== */
(function setupPageTransition() {
  var overlay = document.querySelector(".page-transition-overlay");
  if (!overlay) return;

  document.querySelectorAll(".main-nav-link[href]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      var href = link.getAttribute("href");
      if (!href || href === "#" || href.startsWith("http")) return;
      e.preventDefault();
      overlay.classList.add("active");
      setTimeout(function () {
        window.location.href = href;
      }, 350);
    });
  });
})();

/* ===================================================================
   SHARED HELPER — safe SplitText wrapper
   =================================================================== */
function safeSplit(selector, type) {
  try {
    var el = document.querySelector(selector);
    if (!el) return null;
    var config = { type: type, mask: type };
    if (type === "chars") config.charsClass = "char";
    if (type === "lines") config.linesClass = "line";
    return SplitText.create(selector, config);
  } catch (e) {
    console.warn("SplitText failed for:", selector, e);
    return null;
  }
}

/* ===================================================================
   PRELOADER + HERO REVEAL
   =================================================================== */
document.fonts.ready.then(() => {
  var splits = {};
  var splitElements = [
    { key: "logoChars", selector: ".preloader-logo h1", type: "chars" },
    { key: "footerLines", selector: ".preloader-footer p", type: "lines" },
    { key: "headerChars", selector: ".header h1", type: "chars" },
    { key: "heroFooterH3", selector: ".hero-footer h3", type: "lines" },
    { key: "heroFooterP", selector: ".hero-footer p", type: "lines" },
  ];

  splitElements.forEach(function (item) {
    splits[item.key] = safeSplit(item.selector, item.type);
  });

  if (splits.logoChars) gsap.set([splits.logoChars.chars], { x: "100%" });
  gsap.set(
    [
      splits.footerLines && splits.footerLines.lines,
      splits.headerChars && splits.headerChars.chars,
      splits.heroFooterH3 && splits.heroFooterH3.lines,
      splits.heroFooterP && splits.heroFooterP.lines,
    ].filter(Boolean),
    { y: "100%" }
  );

  function animateProgress(duration) {
    duration = duration || 4;
    var tl = gsap.timeline();
    var counterSteps = 5;
    var currentProgress = 0;

    for (var i = 0; i < counterSteps; i++) {
      var finalStep = i === counterSteps - 1;
      var targetProgress = finalStep
        ? 1
        : Math.min(currentProgress + Math.random() * 0.3 + 0.1, 0.9);
      currentProgress = targetProgress;

      tl.to(".preloader-progress-bar", {
        scaleX: targetProgress,
        duration: duration / counterSteps,
        ease: "power2.out",
      });
    }

    return tl;
  }

  var tl = gsap.timeline({ delay: 0.5 });

  if (splits.logoChars) {
    tl.to(splits.logoChars.chars, {
      x: "0%",
      stagger: 0.05,
      duration: 1,
      ease: "power4.inOut",
    });
  }

  if (splits.footerLines) {
    tl.to(
      splits.footerLines.lines,
      {
        y: "0%",
        stagger: 0.1,
        duration: 1,
        ease: "power4.inOut",
      },
      splits.logoChars ? "0.25" : "0"
    );
  }

  tl.add(animateProgress(), "<")
    .set(".preloader-progress", { backgroundColor: "#fff" });

  if (splits.logoChars) {
    tl.to(
      splits.logoChars.chars,
      {
        x: "-100%",
        stagger: 0.05,
        duration: 1,
        ease: "power4.inOut",
      },
      "-=0.5"
    );
  }

  if (splits.footerLines) {
    tl.to(
      splits.footerLines.lines,
      {
        y: "-100%",
        stagger: 0.1,
        duration: 1,
        ease: "power4.inOut",
      },
      "<"
    );
  }

  tl.to(".preloader-progress", {
      opacity: 0,
      duration: 0.5,
      ease: "power3.out",
    }, "-=0.25")
    .to(".preloader-mask", {
      scale: 6,
      duration: 2.5,
      ease: "power3.out",
    }, "<")
    .to(".hero-img", {
      scale: 1,
      duration: 1.5,
      ease: "power3.out",
    }, "<");

  if (splits.headerChars) {
    tl.to(splits.headerChars.chars, {
      y: 0,
      stagger: 0.05,
      duration: 1,
      ease: "power4.out",
      delay: -2,
    });
  }

  var footerTargets = [
    splits.heroFooterH3 && splits.heroFooterH3.lines,
    splits.heroFooterP && splits.heroFooterP.lines,
  ].filter(Boolean);

  if (footerTargets.length) {
    tl.to(
      footerTargets,
      {
        y: 0,
        stagger: 0.1,
        duration: 1,
        ease: "power4.out",
      },
      "-=1.5"
    );
  }
});

/* ===================================================================
   SCROLL REVEAL — exterior section
   =================================================================== */
var outroHeaderSplit = safeSplit(".sr-outro-header h3", "lines");
if (outroHeaderSplit) gsap.set(outroHeaderSplit.lines, { y: "100%" });

var fgContent = document.querySelector(".sr-fg-content");
var fgOverlayDark = document.querySelector(".sr-fg-overlay-dark");
var fgOverlayAccent = document.querySelector(".sr-fg-overlay");
var bgCopyLeft = document.querySelectorAll(".sr-bg-content-copy")[0];
var bgCopyRight = document.querySelectorAll(".sr-bg-content-copy")[1];
var outroImgTop = document.querySelectorAll(".sr-outro-img")[0];
var outroImgBottom = document.querySelectorAll(".sr-outro-img")[1];

var areOutroLinesRevealed = false;

if (fgContent) {
  ScrollTrigger.create({
    trigger: ".sr-scroll-reveal",
    start: "top top",
    end: "+=" + window.innerHeight * 5 + "px",
    pin: true,
    pinSpacing: true,
    scrub: 1,
    onUpdate: function (self) {
      var scrollProgress = self.progress;

      var phase1Progress = gsap.utils.clamp(0, 1, scrollProgress / 0.25);
      var slitLeftEdge = gsap.utils.interpolate(0, 48, phase1Progress);
      var slitRightEdge = gsap.utils.interpolate(100, 52, phase1Progress);

      gsap.set(fgContent, {
        clipPath: "polygon(" + slitLeftEdge + "% 0%, " + slitRightEdge + "% 0%, " + slitRightEdge + "% 100%, " + slitLeftEdge + "% 100%)",
      });

      var darkOverlayOpacity = gsap.utils.interpolate(0, 1, phase1Progress);
      gsap.set(fgOverlayDark, { opacity: darkOverlayOpacity });

      var phase2Progress = gsap.utils.clamp(0, 1, (scrollProgress - 0.25) / 0.2);
      var fgRotation = gsap.utils.interpolate(0, 65, phase2Progress);
      gsap.set(fgContent, { rotate: fgRotation });

      var phase3Progress = gsap.utils.clamp(0, 1, (scrollProgress - 0.45) / 0.2);
      var fgScale = gsap.utils.interpolate(1, 0, phase3Progress);
      gsap.set(fgContent, { scale: fgScale });

      var bgCopyLeftX = gsap.utils.interpolate(0, 100, phase3Progress);
      var bgCopyRightX = gsap.utils.interpolate(0, -100, phase3Progress);
      gsap.set(bgCopyLeft, { x: bgCopyLeftX + "%" });
      gsap.set(bgCopyRight, { x: bgCopyRightX + "%" });

      var phase3OverlayProgress = gsap.utils.clamp(0, 1, (scrollProgress - 0.45) / 0.05);
      var accentOverlayOpacity = gsap.utils.interpolate(0, 1, phase3OverlayProgress);
      gsap.set(fgOverlayAccent, { opacity: accentOverlayOpacity });

      var phase4Progress = gsap.utils.clamp(0, 1, (scrollProgress - 0.65) / 0.2);

      var topImgBottomEdge = gsap.utils.interpolate(0, 100, phase4Progress);
      gsap.set(outroImgTop, {
        clipPath: "polygon(0% 0%, 100% 0%, 100% " + topImgBottomEdge + "%, 0% " + topImgBottomEdge + "%)",
      });

      var bottomImgTopEdge = gsap.utils.interpolate(100, 0, phase4Progress);
      gsap.set(outroImgBottom, {
        clipPath: "polygon(0% " + bottomImgTopEdge + "%, 100% " + bottomImgTopEdge + "%, 100% 100%, 0% 100%)",
      });

      if (outroHeaderSplit) {
        if (scrollProgress >= 0.9 && !areOutroLinesRevealed) {
          areOutroLinesRevealed = true;
          gsap.to(outroHeaderSplit.lines, {
            y: "0%",
            duration: 0.75,
            stagger: 0.1,
            ease: "power3.out",
          });
        } else if (scrollProgress < 0.9 && areOutroLinesRevealed) {
          areOutroLinesRevealed = false;
          gsap.to(outroHeaderSplit.lines, {
            y: "100%",
            duration: 0.25,
            stagger: -0.05,
            ease: "power3.out",
          });
        }
      }
    },
  });
}

/* ===================================================================
   VILLA MOKSHA — 3D CIRCULAR IMAGE GALLERY
   =================================================================== */
var gallerySection = document.querySelector(".villa-gallery");
var galleryContainer = document.querySelector(".villa-gallery-sticky");

if (gallerySection && galleryContainer && typeof THREE !== "undefined") {
  var galleryScene = new THREE.Scene();
  var galleryCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  var galleryRenderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });

  galleryRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  galleryRenderer.setSize(window.innerWidth, window.innerHeight);
  galleryRenderer.setClearColor(0x000000, 0);
  galleryRenderer.domElement.classList.add("villa-gallery-canvas");
  galleryContainer.appendChild(galleryRenderer.domElement);
  var galleryCanvasEl = galleryRenderer.domElement;
  galleryCanvasEl.style.position = "fixed";
  galleryCanvasEl.style.top = "0";
  galleryCanvasEl.style.left = "0";

  var galleryGroup = new THREE.Group();
  galleryScene.add(galleryGroup);

  var galleryRadius = 6;
  var galleryHeight = 30;
  var gallerySegments = 30;

  var galleryCylinderGeometry = new THREE.CylinderGeometry(
    galleryRadius,
    galleryRadius,
    galleryHeight,
    gallerySegments,
    1,
    true
  );
  var galleryCylinderMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  });
  var galleryCylinder = new THREE.Mesh(
    galleryCylinderGeometry,
    galleryCylinderMaterial
  );
  galleryGroup.add(galleryCylinder);

  var galleryTextureLoader = new THREE.TextureLoader();

  function getRandomGalleryImageNumber() {
    return Math.floor(Math.random() * 50) + 1;
  }

  function loadGalleryImageTexture(imageNumber) {
    return new Promise(function (resolve) {
      galleryTextureLoader.load(
        "assets1/img" + imageNumber + ".jpg",
        function (loadedTexture) {
          loadedTexture.generateMipmaps = true;
          loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
          loadedTexture.magFilter = THREE.LinearFilter;
          loadedTexture.anisotropy =
            galleryRenderer.capabilities.getMaxAnisotropy();
          resolve(loadedTexture);
        }
      );
    });
  }

  function createGalleryCurvedPlane(width, height, radius, segments) {
    var geometry = new THREE.BufferGeometry();
    var vertices = [];
    var indices = [];
    var uvs = [];

    var segmentsX = segments * 4;
    var segmentsY = Math.floor(height * 12);
    var theta = width / radius;

    for (var y = 0; y <= segmentsY; y++) {
      var yPos = (y / segmentsY - 0.5) * height;
      for (var x = 0; x <= segmentsX; x++) {
        var xAngle = (x / segmentsX - 0.5) * theta;
        var xPos = Math.sin(xAngle) * radius;
        var zPos = Math.cos(xAngle) * radius;
        vertices.push(xPos, yPos, zPos);
        uvs.push((x / segmentsX) * 0.8 + 0.1, y / segmentsY);
      }
    }

    for (var y2 = 0; y2 < segmentsY; y2++) {
      for (var x2 = 0; x2 < segmentsX; x2++) {
        var a = x2 + (segmentsX + 1) * y2;
        var b = x2 + (segmentsX + 1) * (y2 + 1);
        var c = x2 + 1 + (segmentsX + 1) * (y2 + 1);
        var d = x2 + 1 + (segmentsX + 1) * y2;
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  var galleryNumVerticalSections = 12;
  var galleryBlocksPerSection = 4;
  var galleryVerticalSpacing = 3.25;
  var galleryBlocks = [];

  var galleryTotalBlockHeight =
    galleryNumVerticalSections * galleryVerticalSpacing;
  var galleryHeightBuffer = (galleryHeight - galleryTotalBlockHeight) / 2;
  var galleryStartY =
    -galleryHeight / 2 + galleryHeightBuffer + galleryVerticalSpacing;

  var gallerySectionAngle = (Math.PI * 2) / galleryBlocksPerSection;
  var galleryMaxRandomAngle = gallerySectionAngle * 0.3;

  function createGalleryBlock(baseY, yOffset, sectionIndex, blockIndex) {
    var blockGeometry = createGalleryCurvedPlane(5, 3, galleryRadius, 10);
    var imageNumber = getRandomGalleryImageNumber();

    return loadGalleryImageTexture(imageNumber).then(function (texture) {
      var blockMaterial = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide,
        toneMapped: false,
      });

      var block = new THREE.Mesh(blockGeometry, blockMaterial);
      block.position.y = baseY + yOffset;

      var blockContainer = new THREE.Group();
      var baseAngle = gallerySectionAngle * blockIndex;
      var randomAngleOffset = (Math.random() * 2 - 1) * galleryMaxRandomAngle;
      var finalAngle = baseAngle + randomAngleOffset;

      blockContainer.rotation.y = finalAngle;
      blockContainer.add(block);

      return blockContainer;
    });
  }

  function initializeGalleryBlocks() {
    var promises = [];
    for (var section = 0; section < galleryNumVerticalSections; section++) {
      var baseY = galleryStartY + section * galleryVerticalSpacing;
      for (var i = 0; i < galleryBlocksPerSection; i++) {
        var yOffset = Math.random() * 0.2 - 0.1;
        promises.push(
          createGalleryBlock(baseY, yOffset, section, i).then(function (blockContainer) {
            galleryBlocks.push(blockContainer);
            galleryGroup.add(blockContainer);
          })
        );
      }
    }
    return Promise.all(promises);
  }

  initializeGalleryBlocks();

  var galleryAmbientLight = new THREE.AmbientLight(0xffffff, 1);
  galleryScene.add(galleryAmbientLight);

  galleryCamera.position.z = 12;
  galleryCamera.position.y = 0;

  var galleryRotationSpeed = 0;
  var galleryBaseRotationSpeed = 0.0025;

  lenis.on("scroll", function (e) {
    galleryRotationSpeed = e.velocity * 0.005;
  });

  function getGalleryScrollFraction() {
    var rect = gallerySection.getBoundingClientRect();
    var scrollableDistance = gallerySection.offsetHeight - window.innerHeight;
    var scrolled = -rect.top;
    return Math.min(Math.max(scrolled / scrollableDistance, 0), 1);
  }

  function animateGallery() {
    requestAnimationFrame(animateGallery);

    var galleryRect = gallerySection.getBoundingClientRect();
    var viewportHeight = window.innerHeight;

    if (galleryRect.top > 0) {
      galleryCanvasEl.style.position = "absolute";
      galleryCanvasEl.style.top = "0px";
    } else if (galleryRect.bottom < viewportHeight) {
      galleryCanvasEl.style.position = "absolute";
      galleryCanvasEl.style.top =
        gallerySection.offsetHeight - viewportHeight + "px";
    } else {
      galleryCanvasEl.style.position = "fixed";
      galleryCanvasEl.style.top = "0px";
    }

    var scrollFraction = getGalleryScrollFraction();
    var targetY = scrollFraction * galleryHeight - galleryHeight / 2;
    galleryCamera.position.y = -targetY;

    galleryGroup.rotation.y += galleryBaseRotationSpeed + galleryRotationSpeed;
    galleryRotationSpeed *= 2;

    galleryRenderer.render(galleryScene, galleryCamera);
  }

  window.addEventListener("resize", onGalleryWindowResize, false);

  function onGalleryWindowResize() {
    galleryCamera.aspect = window.innerWidth / window.innerHeight;
    galleryCamera.updateProjectionMatrix();
    galleryRenderer.setSize(window.innerWidth, window.innerHeight);
    galleryRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  animateGallery();
}
