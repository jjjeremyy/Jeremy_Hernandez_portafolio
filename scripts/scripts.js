const cards = document.querySelectorAll(".trayectoria .card");

cards.forEach(card => {

    const button = card.querySelector(".card-header");
    const icon = card.querySelector(".icon");

    button.addEventListener("click", () => {

        const isActive = card.classList.contains("active");

        card.classList.toggle("active");

        icon.textContent = isActive ? "+" : "−";

        button.setAttribute("aria-expanded", String(!isActive));

    });

});