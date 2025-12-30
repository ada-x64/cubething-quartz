// ON DOM LOADED
const mobileNavBtn = document.querySelector("#mobile-nav-btn")! as HTMLDivElement
const mobileNavWrapper = document.querySelector("#mobile-nav-wrapper")! as HTMLDivElement

function openMobileNav() {
  const classList = mobileNavWrapper.classList
  classList.add("open")
  classList.remove("closed")
  document.body.style.top = `-${window.scrollY}px`
  document.body.style.position = "fixed"
}
function closeMobileNav() {
  const classList = mobileNavWrapper.classList
  classList.add("closed")
  classList.remove("open")
  const scrollY = document.body.style.top
  document.body.style.position = ""
  document.body.style.top = ""
  window.scrollTo({ top: parseInt(scrollY || "0") * -1, behavior: "instant" })
}

mobileNavBtn.addEventListener("click", () => {
  openMobileNav()
})

mobileNavWrapper.addEventListener("click", (ev) => {
  if (!(ev.target as HTMLElement).className.includes("close-mobile-nav")) {
    return
  }
  closeMobileNav()
})

interface Window {
  mousedown?: boolean
  touchY?: number
  initialTouchY?: number
}

mobileNavWrapper.addEventListener("touchstart", (ev) => {
  const target = ev.target as HTMLElement
  if (!target.classList.contains("move-mobile-nav")) {
    return
  }
  window.mousedown = true
  window.touchY = 0
  window.initialTouchY = 0
  mobileNavWrapper.style.transition = "0s"
})
mobileNavWrapper.addEventListener("touchend", (ev) => {
  const target = ev.target as HTMLElement
  if (!target.classList.contains("move-mobile-nav")) {
    return
  }
  window.mousedown = false
  if (mobileNavWrapper.classList.contains("open") && window.touchY! >= 100) {
    closeMobileNav()
  }
  mobileNavWrapper.style = ""
})
mobileNavWrapper.addEventListener("touchmove", (ev) => {
  const target = ev.target as HTMLElement
  if (!target.classList.contains("move-mobile-nav")) {
    return
  }
  if (mobileNavWrapper.classList.contains("open")) {
    const newY = ev.changedTouches.item(0)?.clientY
    if (newY == undefined) {
      return
    }
    if (window.initialTouchY == 0 || window.initialTouchY == undefined) {
      window.initialTouchY = newY
    }
    window.touchY = Math.max(-10, newY - window.initialTouchY)
    mobileNavWrapper.style.setProperty("transform", `translateY(${window.touchY ?? 0}px)`)
  }
})
