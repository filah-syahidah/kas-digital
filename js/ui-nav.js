document.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.getElementById("mobileMenuBtn");
    const nav = document.getElementById("mainNav");

    if (!menuButton || !nav) {
        return;
    }

    const syncByViewport = () => {
        if (window.innerWidth >= 768) {
            nav.classList.remove("hidden");
            menuButton.setAttribute("aria-expanded", "true");
            return;
        }

        nav.classList.add("hidden");
        menuButton.setAttribute("aria-expanded", "false");
    };

    menuButton.addEventListener("click", () => {
        const nextExpanded = nav.classList.contains("hidden");
        nav.classList.toggle("hidden", !nextExpanded);
        menuButton.setAttribute("aria-expanded", String(nextExpanded));
    });

    nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            if (window.innerWidth < 768) {
                nav.classList.add("hidden");
                menuButton.setAttribute("aria-expanded", "false");
            }
        });
    });

    window.addEventListener("resize", syncByViewport);
    syncByViewport();

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
        return;
    }

    const revealTargets = Array.from(document.querySelectorAll(
        "main section, main article, #financialAlert, #monthlySummary, #monthlySummaryPublic"
    ));

    revealTargets.forEach((el, index) => {
        el.style.opacity = "0";
        el.style.transform = "translateY(8px)";
        el.style.transition = "opacity 320ms ease, transform 320ms ease";

        const delay = Math.min(index * 35, 260);
        window.setTimeout(() => {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
        }, delay);
    });

    const hoverCards = document.querySelectorAll(
        ".rounded-2xl, .rounded-3xl, .rounded-xl"
    );

    hoverCards.forEach((card) => {
        card.classList.add("transition-transform", "duration-200");
        card.addEventListener("mouseenter", () => {
            if (window.innerWidth >= 768) {
                card.style.transform = "translateY(-2px)";
            }
        });
        card.addEventListener("mouseleave", () => {
            card.style.transform = "translateY(0)";
        });
    });
});
