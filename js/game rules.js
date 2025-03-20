document.addEventListener("DOMContentLoaded", function () {
    const slider = document.querySelector(".slider");

    const menuBtn = document.querySelector(".menu-btn");
    const dropdown = document.querySelector(".dropdown");

    // Toggle dropdown when clicking the button
    menuBtn.addEventListener("click", function (event) {
        event.stopPropagation(); // Prevents immediate closing
        dropdown.classList.toggle("show");
    });

    // Prevent dropdown from closing when clicking inside
    dropdown.addEventListener("click", function (event) {
        event.stopPropagation();
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (event) {
        if (!menuBtn.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.classList.remove("show");
        }
    });

    // Close dropdown on ESC key press
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            dropdown.classList.remove("show");
        }
    });
});
